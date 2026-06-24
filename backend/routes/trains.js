/**
 * Train Routes — /api/trains
 *
 * List, search, and retrieve train information.
 *
 * Schema reference (rebasing branch):
 *   Train PK = number (String)
 *   Relations: fromStation, toStation, trainSchedules
 *   No "Route" model exists — trains link directly to stations via fromStationCode/toStationCode
 */

const express = require('express');
const { prisma } = require('../lib/prisma');

const router = express.Router();

// ─── GET /search ─────────────────────────────────────────────────────────────
// Search trains between two stations.
//
// HOW IT WORKS:
//   The Train model has fromStationCode and toStationCode fields.
//   This gives us the direct origin→destination pair.
//   For indirect routes (Train stops at both stations mid-journey),
//   we also search the TrainSchedule table.
//
// Example: GET /api/trains/search?from=NDLS&to=MAS
router.get('/search', async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Both "from" and "to" station codes are required.',
      });
    }

    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();

    // Strategy 1: Direct trains (fromStationCode → toStationCode match)
    const directTrains = await prisma.train.findMany({
      where: {
        fromStationCode: fromCode,
        toStationCode: toCode,
      },
      include: {
        fromStation: true,
        toStation: true,
      },
    });

    // Strategy 2: Trains that stop at BOTH stations (via schedule table)
    // This catches trains where from/to aren't the terminal stations
    // but are intermediate stops.
    //
    // The raw SQL finds train numbers that appear in schedules
    // for BOTH station codes. We exclude trains already found above.
    const directNumbers = directTrains.map(t => t.number);

    const indirectTrains = await prisma.$queryRaw`
      SELECT DISTINCT s1.train_number
      FROM train_schedules s1
      JOIN train_schedules s2 ON s1.train_number = s2.train_number
      WHERE s1.station_code = ${fromCode}
        AND s2.station_code = ${toCode}
        AND s1.id < s2.id
        AND s1.train_number != ALL(${directNumbers})
    `;

    // Fetch full train details for indirect matches
    let indirectTrainDetails = [];
    if (indirectTrains.length > 0) {
      const indirectNumbers = indirectTrains.map(t => t.train_number);
      indirectTrainDetails = await prisma.train.findMany({
        where: { number: { in: indirectNumbers } },
        include: {
          fromStation: true,
          toStation: true,
        },
      });
    }

    const allTrains = [...directTrains, ...indirectTrainDetails];

    // Enrich each train with the specific schedule stop times for the
    // searched from/to station codes (not the overall train departure/arrival).
    // This is what lets the UI show "departs Pune at 08:20, arrives Talegaon at 09:05"
    // instead of the train's full journey times.
    const allNumbers = allTrains.map(t => t.number);
    let fromStops = [];
    let toStops = [];
    if (allNumbers.length > 0) {
      [fromStops, toStops] = await Promise.all([
        prisma.trainSchedule.findMany({
          where: { trainNumber: { in: allNumbers }, stationCode: fromCode },
        }),
        prisma.trainSchedule.findMany({
          where: { trainNumber: { in: allNumbers }, stationCode: toCode },
        }),
      ]);
    }

    // Index stops by train number for O(1) lookup
    const fromStopByTrain = Object.fromEntries(fromStops.map(s => [s.trainNumber, s]));
    const toStopByTrain   = Object.fromEntries(toStops.map(s => [s.trainNumber, s]));

    // Attach fromStop / toStop to each train result
    const enrichedTrains = allTrains.map(train => ({
      ...train,
      fromStop: fromStopByTrain[train.number] || null,
      toStop:   toStopByTrain[train.number]   || null,
    }));

    return res.status(200).json({
      success: true,
      data: enrichedTrains,
      meta: {
        direct: directTrains.length,
        indirect: indirectTrainDetails.length,
      },
      message: `Found ${enrichedTrains.length} train(s) from ${fromCode} to ${toCode}.`,
    });
  } catch (err) {
    console.error('Search trains error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while searching trains.',
    });
  }
});

// ─── GET / ───────────────────────────────────────────────────────────────────
// List all trains with pagination and filters.
//
// Query params:
//   page, limit  — pagination (defaults: page=1, limit=20)
//   type         — filter by train type (e.g. "SUF", "EXP")
//   search       — search by name or number (case-insensitive)
//
// Example: GET /api/trains?search=rajdhani&limit=10
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { type, search } = req.query;

    // Build the where clause dynamically.
    // Only add conditions for params that were actually provided.
    const where = {};
    if (type) where.type = type;
    if (search) {
      // OR = match against multiple fields. Prisma runs this as:
      //   WHERE (name ILIKE '%search%' OR number ILIKE '%search%')
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { number: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Run both queries in parallel — count doesn't depend on findMany
    const [trains, total] = await Promise.all([
      prisma.train.findMany({
        where,
        skip,
        take: limit,
        include: {
          fromStation: true,  // Join Station table for origin
          toStation: true,    // Join Station table for destination
        },
        orderBy: { name: 'asc' },
      }),
      prisma.train.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: trains,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('List trains error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while listing trains.',
    });
  }
});

// ─── GET /:number ────────────────────────────────────────────────────────────
// Get a single train by its number. Includes origin/destination stations
// and the full schedule (all stops this train makes).
//
// Example: GET /api/trains/12301
router.get('/:number', async (req, res) => {
  try {
    const train = await prisma.train.findUnique({
      where: { number: req.params.number },
      include: {
        fromStation: true,
        toStation: true,
        // Get all schedule stops, ordered by day then by id
        // (id correlates with stop sequence in the seed data)
        trainSchedules: {
          orderBy: [{ day: 'asc' }, { id: 'asc' }],
          include: {
            station: true,  // Include station details for each stop
          },
        },
      },
    });

    if (!train) {
      return res.status(404).json({
        success: false,
        message: `Train "${req.params.number}" not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: train,
    });
  } catch (err) {
    console.error('Get train error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching train.',
    });
  }
});

// ─── GET /:number/schedule ──────────────────────────────────────────────────
// Get just the schedule for a train — all stops in order.
// Lighter than GET /:number if you only need the stops.
//
// Example: GET /api/trains/12301/schedule
router.get('/:number/schedule', async (req, res) => {
  try {
    const { number } = req.params;

    // Verify train exists first
    const train = await prisma.train.findUnique({ where: { number } });
    if (!train) {
      return res.status(404).json({
        success: false,
        message: `Train "${number}" not found.`,
      });
    }

    const schedules = await prisma.trainSchedule.findMany({
      where: { trainNumber: number },
      include: {
        station: true,
      },
      orderBy: [{ day: 'asc' }, { id: 'asc' }],
    });

    return res.status(200).json({
      success: true,
      data: {
        train: { number: train.number, name: train.name, type: train.type },
        stops: schedules,
        totalStops: schedules.length,
      },
    });
  } catch (err) {
    console.error('Get train schedule error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching train schedule.',
    });
  }
});

module.exports = router;
