/**
 * Booking Routes — /api/bookings
 *
 * Create, list, retrieve, and cancel bookings.
 * All routes require authentication.
 */

const express = require('express');
const crypto = require('crypto');
const { prisma } = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All booking routes require authentication
router.use(authenticate);

// ─── POST / ──────────────────────────────────────────────────────────────────
// Create a new booking.
router.post('/', async (req, res) => {
  try {
    const { fromStationCode, toStationCode, trainNumber, travelDate, ticketClass, passengers } = req.body;

    // Validate required fields
    if (!fromStationCode || !toStationCode || !trainNumber || !travelDate || !ticketClass || !passengers) {
      return res.status(400).json({
        success: false,
        message: 'fromStationCode, toStationCode, trainNumber, travelDate, ticketClass, and passengers are required.',
      });
    }

    if (!Number.isInteger(passengers) || passengers < 1) {
      return res.status(400).json({
        success: false,
        message: 'passengers must be a positive integer.',
      });
    }

    // Verify train exists
    const train = await prisma.train.findUnique({
      where: { number: trainNumber },
    });

    if (!train) {
      return res.status(404).json({
        success: false,
        message: 'Train not found.',
      });
    }

    // In a real app we'd fetch actual base price for this train/class from pricing tables.
    // For now we'll just hardcode a base price of 500 for the sake of the demo.
    const basePrice = 500.00;
    const totalPrice = basePrice * passengers;
    const bookingId = crypto.randomUUID();
    const now = new Date();

    // Create booking and update user profile in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          time: now,
          id: bookingId,
          userId: req.user.id,
          trainNumber,
          fromStationCode,
          toStationCode,
          travelDate: new Date(`${travelDate}T00:00:00.000Z`),
          ticketClass,
          passengers,
          totalPrice,
          status: 'confirmed',
        },
        include: {
          train: true,
          fromStation: true,
          toStation: true,
        },
      });

      // Update user profile: increment totalBookings and award loyalty points
      await tx.userProfile.update({
        where: { userId: req.user.id },
        data: {
          totalBookings: { increment: 1 },
          loyaltyPoints: { increment: Math.floor(totalPrice) },
        },
      });

      return newBooking;
    });

    return res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully.',
    });
  } catch (err) {
    console.error('Create booking error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating booking.',
    });
  }
});

// ─── GET / ───────────────────────────────────────────────────────────────────
// List current user's bookings with pagination.
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { status } = req.query;

    const where = { userId: req.user.id };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          train: true,
          fromStation: true,
          toStation: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('List bookings error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while listing bookings.',
    });
  }
});

// ─── GET /:id ────────────────────────────────────────────────────────────────
// Get a single booking by ID (must belong to current user).
router.get('/:id', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        train: true,
        fromStation: true,
        toStation: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.userId !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'You are not authorized to view this booking.',
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    console.error('Get booking error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching booking.',
    });
  }
});

// ─── PATCH /:id/cancel ───────────────────────────────────────────────────────
// Cancel a booking. Must belong to current user and be 'confirmed'.
router.patch('/:id/cancel', async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.userId !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'You are not authorized to cancel this booking.',
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking with status "${booking.status}". Only confirmed bookings can be cancelled.`,
      });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
      include: {
        train: true,
        fromStation: true,
        toStation: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Booking cancelled successfully.',
    });
  } catch (err) {
    console.error('Cancel booking error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while cancelling booking.',
    });
  }
});

module.exports = router;
