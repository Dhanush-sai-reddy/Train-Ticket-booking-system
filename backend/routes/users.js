/**
 * User Routes — /api/users
 *
 * User profile management and booking statistics.
 * All routes require authentication.
 */

const express = require('express');
const { prisma } = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// ─── GET /profile ────────────────────────────────────────────────────────────
// Get the current user's profile with stats.
router.get('/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching profile.',
    });
  }
});

// ─── PATCH /profile ──────────────────────────────────────────────────────────
// Update user profile fields.
router.patch('/profile', async (req, res) => {
  try {
    const { firstName, lastName, phone, preferences } = req.body;

    // Build user update data (only include fields that were provided)
    const userUpdate = {};
    if (firstName !== undefined) userUpdate.firstName = firstName;
    if (lastName !== undefined) userUpdate.lastName = lastName;
    if (phone !== undefined) userUpdate.phone = phone;

    // Update user fields if any were provided
    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: userUpdate,
      });
    }

    // Update profile preferences if provided
    if (preferences !== undefined) {
      await prisma.userProfile.update({
        where: { userId: req.user.id },
        data: { preferences },
      });
    }

    // Fetch the updated user with profile
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully.',
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating profile.',
    });
  }
});

// ─── GET /bookings/stats ─────────────────────────────────────────────────────
// Get booking statistics for the current user.
router.get('/bookings/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Run all stat queries concurrently
    const [totalBookings, totalSpentResult, bookingsByStatus] = await Promise.all([
      // Total booking count
      prisma.booking.count({ where: { userId } }),

      // Total amount spent (sum of totalPrice)
      prisma.booking.aggregate({
        where: { userId },
        _sum: { totalPrice: true },
      }),

      // Bookings grouped by status
      prisma.booking.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      }),
    ]);

    const statusBreakdown = {};
    for (const entry of bookingsByStatus) {
      statusBreakdown[entry.status] = entry._count.status;
    }

    return res.status(200).json({
      success: true,
      data: {
        totalBookings,
        totalSpent: totalSpentResult._sum.totalPrice || 0,
        bookingsByStatus: statusBreakdown,
      },
    });
  } catch (err) {
    console.error('Get booking stats error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching booking statistics.',
    });
  }
});

module.exports = router;
