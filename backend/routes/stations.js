/**
 * Station Routes — /api/stations
 *
 * List, search, and retrieve station information.
 *
 * Schema reference (rebasing branch):
 *   Station PK = code (String, e.g. "NDLS")
 *   Fields: name, state, zone, address, longitude, latitude
 *   Relations:
 *     trainsFrom      — Train[] where this station is the origin
 *     trainsTo        — Train[] where this station is the destination
 *     trainSchedules  — TrainSchedule[] for all trains stopping here
 */

const express = require('express');
const { prisma } = require('../lib/prisma');

const router = express.Router();

// ─── GET / ───────────────────────────────────────────────────────────────────
// List stations with pagination and search.
//
// Query params:
//   search  — matches name, code, or state (case-insensitive)
//   state   — filter by state
//   zone    — filter by railway zone (e.g. "NR", "SR")
//   page, limit — pagination
//
// Example: GET /api/stations?search=delhi&limit=10
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, state, zone } = req.query;

    const where = {};
    if (search) {
      // Search across name, code, and state simultaneously.
      // Prisma translates this to: WHERE (name ILIKE ... OR code ILIKE ... OR state ILIKE ...)
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (state) {
      where.state = { contains: state, mode: 'insensitive' };
    }
    if (zone) {
      where.zone = zone.toUpperCase();
    }

    const [stations, total] = await Promise.all([
      prisma.station.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.station.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: stations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('List stations error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while listing stations.',
    });
  }
});

// ─── GET /:code ──────────────────────────────────────────────────────────────
// Get a station by its code. Includes trains originating from and
// terminating at this station.
//
// Example: GET /api/stations/NDLS
router.get('/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();

    const station = await prisma.station.findUnique({
      where: { code },
      include: {
        // Trains where this station is the starting point
        trainsFrom: {
          select: {
            number: true,
            name: true,
            type: true,
            toStationCode: true,
            departure: true,
            arrival: true,
            durationH: true,
            durationM: true,
          },
        },
        // Trains where this station is the ending point
        trainsTo: {
          select: {
            number: true,
            name: true,
            type: true,
            fromStationCode: true,
            departure: true,
            arrival: true,
            durationH: true,
            durationM: true,
          },
        },
      },
    });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: `Station with code "${req.params.code}" not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: station,
    });
  } catch (err) {
    console.error('Get station error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching station.',
    });
  }
});

// ─── GET /:code/trains ───────────────────────────────────────────────────────
// Get ALL trains that pass through a station — not just ones that
// start/end here, but any train whose schedule includes this station.
//
// This queries the TrainSchedule table (which has ~417k rows linking
// trains to every station they stop at), then fetches full train details.
//
// Example: GET /api/stations/NDLS/trains
router.get('/:code/trains', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();

    // Verify station exists
    const station = await prisma.station.findUnique({ where: { code } });
    if (!station) {
      return res.status(404).json({
        success: false,
        message: `Station with code "${req.params.code}" not found.`,
      });
    }

    // Find all schedule entries for this station, grouped by train
    const schedules = await prisma.trainSchedule.findMany({
      where: { stationCode: code },
      include: {
        train: {
          include: {
            fromStation: true,
            toStation: true,
          },
        },
      },
      orderBy: { trainNumber: 'asc' },
    });

    // Deduplicate — a train may have multiple schedule entries for the
    // same station (e.g. different days). We want unique trains.
    const seen = new Set();
    const uniqueTrains = [];
    for (const sched of schedules) {
      if (!seen.has(sched.trainNumber)) {
        seen.add(sched.trainNumber);
        uniqueTrains.push({
          ...sched.train,
          // Include when this train arrives/departs at this station
          stopsHere: {
            arrival: sched.arrival,
            departure: sched.departure,
            day: sched.day,
          },
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: uniqueTrains,
      total: uniqueTrains.length,
      message: `Found ${uniqueTrains.length} train(s) stopping at ${station.name} (${code}).`,
    });
  } catch (err) {
    console.error('Get station trains error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching station trains.',
    });
  }
});

module.exports = router;
