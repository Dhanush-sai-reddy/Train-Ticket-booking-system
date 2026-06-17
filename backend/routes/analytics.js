/**
 * Analytics Routes — /api/analytics
 *
 * Revenue, occupancy, popular routes, and train performance metrics.
 * All routes require authentication.
 */

const express = require('express');
const { prisma } = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

// ─── GET /revenue ────────────────────────────────────────────────────────────
// Revenue analytics grouped by day, week, or month.
router.get('/revenue', async (req, res) => {
  try {
    const { period = 'daily' } = req.query;

    let truncUnit;
    switch (period) {
      case 'weekly':
        truncUnit = 'week';
        break;
      case 'monthly':
        truncUnit = 'month';
        break;
      case 'daily':
      default:
        truncUnit = 'day';
        break;
    }

    // Use raw SQL for date_trunc grouping (Prisma doesn't support this natively)
    const revenueData = await prisma.$queryRawUnsafe(`
      SELECT
        date_trunc('${truncUnit}', created_at) AS period,
        COUNT(*)::int AS booking_count,
        SUM(total_price)::float AS total_revenue
      FROM bookings
      WHERE status != 'cancelled'
      GROUP BY period
      ORDER BY period DESC
      LIMIT 30
    `);

    return res.status(200).json({
      success: true,
      data: revenueData,
      message: `Revenue analytics grouped by ${period}.`,
    });
  } catch (err) {
    console.error('Revenue analytics error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching revenue analytics.',
    });
  }
});

// ─── GET /occupancy ──────────────────────────────────────────────────────────
// Average occupancy rates by train.
router.get('/occupancy', async (req, res) => {
  try {
    const occupancyData = await prisma.$queryRaw`
      SELECT
        so.train_number,
        t.name AS train_name,
        t.type AS train_type,
        AVG(so.occupancy_rate)::float AS avg_occupancy_rate,
        COUNT(*)::int AS data_points
      FROM seat_occupancy so
      JOIN trains t ON t.number = so.train_number
      GROUP BY so.train_number, t.name, t.type
      ORDER BY avg_occupancy_rate DESC
      LIMIT 50
    `;

    return res.status(200).json({
      success: true,
      data: occupancyData,
    });
  } catch (err) {
    console.error('Occupancy analytics error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching occupancy analytics.',
    });
  }
});

// ─── GET /popular-routes ─────────────────────────────────────────────────────
// Most popular routes by booking count (top 10).
router.get('/popular-routes', async (req, res) => {
  try {
    const popularRoutes = await prisma.$queryRaw`
      SELECT
        b.train_number,
        t.name AS train_name,
        s_origin.name AS origin_name,
        s_origin.code AS origin_code,
        s_dest.name AS destination_name,
        s_dest.code AS destination_code,
        COUNT(*)::int AS booking_count,
        SUM(b.total_price)::float AS total_revenue,
        SUM(b.passengers)::int AS total_passengers
      FROM bookings b
      JOIN trains t ON t.number = b.train_number
      JOIN stations s_origin ON s_origin.code = b.from_station_code
      JOIN stations s_dest ON s_dest.code = b.to_station_code
      WHERE b.status != 'cancelled'
      GROUP BY b.train_number, t.name, s_origin.name, s_origin.code, s_dest.name, s_dest.code
      ORDER BY booking_count DESC
      LIMIT 10
    `;

    return res.status(200).json({
      success: true,
      data: popularRoutes,
    });
  } catch (err) {
    console.error('Popular routes error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching popular routes.',
    });
  }
});

// ─── GET /train-performance ──────────────────────────────────────────────────
// Train performance metrics.
// Since delay_minutes isn't actively tracked in the simplified schema,
// we'll return a placeholder or calculate based on pricing demand factor for now.
router.get('/train-performance', async (req, res) => {
  try {
    // In a real scenario, you'd calculate this from actual tracked delays.
    // We'll approximate using pricing history demand factors or just return top trains.
    const performanceData = await prisma.$queryRaw`
      SELECT
        p.train_number,
        t.name AS train_name,
        AVG(p.demand_factor)::float AS avg_demand_factor,
        COUNT(*)::int AS total_price_updates
      FROM pricing_history p
      JOIN trains t ON t.number = p.train_number
      GROUP BY p.train_number, t.name
      ORDER BY avg_demand_factor DESC
      LIMIT 20
    `;

    return res.status(200).json({
      success: true,
      data: performanceData,
    });
  } catch (err) {
    console.error('Train performance error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching train performance metrics.',
    });
  }
});

module.exports = router;
