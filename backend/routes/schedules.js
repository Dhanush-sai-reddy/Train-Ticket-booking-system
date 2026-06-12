/**
 * Schedule Routes — /api/schedules
 *
 * Query the train schedule table — the massive table (~417k rows)
 * that maps every train to every station it stops at, with arrival/
 * departure times and day number.
 *
 * Schema reference (rebasing branch):
 *   TrainSchedule PK = id (Int)
 *   Fields: trainNumber, stationCode, day, arrival, departure
 *   Relations: train → Train, station → Station
 *
 * CONCEPT — What is the schedule table?
 *   Think of it as the Indian Railways timetable. Each row says:
 *   "Train 12301 stops at station NDLS on day 1, arrives at 10:00, departs at 10:15"
 *   A single train can have 30-50+ rows (one per station it stops at).
 */

const express = require('express');
const { prisma } = require('../lib/prisma');

const router = express.Router();

// ─── GET / ───────────────────────────────────────────────────────────────────
// List schedules with filters and pagination.
//
// Query params:
//   trainNumber  — filter by train number
//   stationCode  — filter by station code
//   day          — filter by day number (1, 2, 3...)
//   page, limit  — pagination
//
// Example: GET /api/schedules?trainNumber=12301
// Example: GET /api/schedules?stationCode=NDLS&day=1
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { trainNumber, stationCode, day } = req.query;

    const where = {};
    if (trainNumber) where.trainNumber = trainNumber;
    if (stationCode) where.stationCode = stationCode.toUpperCase();
    if (day) where.day = parseInt(day, 10);

    const [schedules, total] = await Promise.all([
      prisma.trainSchedule.findMany({
        where,
        skip,
        take: limit,
        include: {
          train: {
            select: {
              number: true,
              name: true,
              type: true,
            },
          },
          station: {
            select: {
              code: true,
              name: true,
              state: true,
            },
          },
        },
        orderBy: [{ trainNumber: 'asc' }, { day: 'asc' }, { id: 'asc' }],
      }),
      prisma.trainSchedule.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: schedules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('List schedules error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while listing schedules.',
    });
  }
});

// ─── GET /train/:number ─────────────────────────────────────────────────────
// Get the full schedule for a specific train — every station it stops at,
// in order. This is the "route map" of a train.
//
// Example: GET /api/schedules/train/12301
// Returns: [{station: "NDLS", day: 1, dep: "16:55"}, {station: "CNB", day: 1, arr: "22:35"}, ...]
router.get('/train/:number', async (req, res) => {
  try {
    const { number } = req.params;

    // Check train exists
    const train = await prisma.train.findUnique({ where: { number } });
    if (!train) {
      return res.status(404).json({
        success: false,
        message: `Train "${number}" not found.`,
      });
    }

    const stops = await prisma.trainSchedule.findMany({
      where: { trainNumber: number },
      include: {
        station: true,
      },
      // Order by day first, then by id (stop sequence)
      orderBy: [{ day: 'asc' }, { id: 'asc' }],
    });

    return res.status(200).json({
      success: true,
      data: {
        train: {
          number: train.number,
          name: train.name,
          type: train.type,
          departure: train.departure,
          arrival: train.arrival,
        },
        stops,
        totalStops: stops.length,
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

// ─── GET /station/:code ─────────────────────────────────────────────────────
// Get all schedule entries for a station — every train that stops there.
//
// Example: GET /api/schedules/station/NDLS?page=1&limit=50
// Returns all trains that stop at New Delhi, with their arrival/departure times.
router.get('/station/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    // Check station exists
    const station = await prisma.station.findUnique({ where: { code } });
    if (!station) {
      return res.status(404).json({
        success: false,
        message: `Station "${req.params.code}" not found.`,
      });
    }

    const where = { stationCode: code };

    const [schedules, total] = await Promise.all([
      prisma.trainSchedule.findMany({
        where,
        skip,
        take: limit,
        include: {
          train: {
            select: {
              number: true,
              name: true,
              type: true,
              fromStationCode: true,
              toStationCode: true,
            },
          },
        },
        orderBy: [{ day: 'asc' }, { id: 'asc' }],
      }),
      prisma.trainSchedule.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        station,
        schedules,
        totalSchedules: total,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get station schedule error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching station schedule.',
    });
  }
});

module.exports = router;
