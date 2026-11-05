const express = require('express');
const router = express.Router();
const Pulse = require('../models/Pulse');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

function getTodayDateString() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

router.get('/summary', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const today = getTodayDateString();

    const result = await Pulse.aggregate([
      { $match: { day: today } },
      {
        $group: {
          _id: null,
          postsToday: { $sum: 1 },
          averageMoodToday: { $avg: '$mood' }
        }
      }
    ]);

    const stats = result[0] || { postsToday: 0, averageMoodToday: null };

    const totalUsers = await User.countDocuments();

    res.json({
      day: today,
      postsToday: stats.postsToday,
      averageMoodToday: stats.averageMoodToday 
        ? Math.round(stats.averageMoodToday * 10) / 10 
        : null,
      totalUsers
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
