/**
 * Route Routes — /api/routes
 *
 * List, retrieve, and check availability for train routes.
 * Named routeRoutes.js to avoid naming conflict with express.Router().
 */

const express = require('express');
const { prisma } = require('../lib/prisma');

const router = express.Router();

// ─── GET / ───────────────────────────────────────────────────────────────────
// List routes with pagination. Filter by trainId, originId, destinationId.
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { trainId, originId, destinationId } = req.query;

    const where = {};
    if (trainId) where.trainId = trainId;
    if (originId) where.originId = originId;
    if (destinationId) where.destinationId = destinationId;

    const [routes, total] = await Promise.all([
      prisma.route.findMany({
        where,
        skip,
        take: limit,
        include: {
          train: true,
          origin: true,
          destination: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.route.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: routes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('List routes error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while listing routes.',
    });
  }
});

// ─── GET /:id ────────────────────────────────────────────────────────────────
// Get route by ID with full details.
router.get('/:id', async (req, res) => {
  try {
    const route = await prisma.route.findUnique({
      where: { id: req.params.id },
      include: {
        train: true,
        origin: true,
        destination: true,
        schedules: {
          orderBy: { departureTime: 'asc' },
          take: 20,
        },
        pricing: {
          orderBy: { time: 'desc' },
          take: 20,
        },
      },
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: route,
    });
  } catch (err) {
    console.error('Get route error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching route.',
    });
  }
});

// ─── GET /:id/availability ──────────────────────────────────────────────────
// Get seat availability for a route on a given date.
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "date" is required (YYYY-MM-DD).',
      });
    }

    // Verify route exists
    const route = await prisma.route.findUnique({
      where: { id },
      include: { train: true, origin: true, destination: true },
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found.',
      });
    }

    // Get occupancy data for the date
    const targetDate = new Date(`${date}T00:00:00.000Z`);
    const occupancy = await prisma.seatOccupancy.findMany({
      where: {
        routeId: id,
        date: targetDate,
      },
      orderBy: { time: 'desc' },
      take: 1,
    });

    const latestOccupancy = occupancy[0] || null;

    return res.status(200).json({
      success: true,
      data: {
        route: {
          id: route.id,
          train: route.train,
          origin: route.origin,
          destination: route.destination,
          basePrice: route.basePrice,
        },
        date,
        availability: latestOccupancy
          ? {
              totalBooked: latestOccupancy.totalBooked,
              totalAvailable: latestOccupancy.totalAvailable,
              occupancyRate: latestOccupancy.occupancyRate,
            }
          : {
              totalBooked: 0,
              totalAvailable: route.train.totalSeats,
              occupancyRate: 0,
            },
      },
    });
  } catch (err) {
    console.error('Get route availability error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while checking availability.',
    });
  }
});

module.exports = router;
