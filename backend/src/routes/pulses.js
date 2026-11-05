const express = require('express');
const router = express.Router();
const zod = require('zod');
const Pulse = require('../models/Pulse');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const createPulseSchema = zod.object({
  mood: zod.number().int().min(1).max(5),
  note: zod.string().max(280).optional()
});

function getTodayDateString() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

router.post('/', requireAuth, validate(createPulseSchema), async (req, res, next) => {
  try {
    const { mood, note } = req.validatedBody;
    const today = getTodayDateString();

    const pulse = new Pulse({
      user: req.user._id,
      day: today,
      mood,
      note: note || ''
    });

    await pulse.save();

    res.status(201).json({ pulse });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: {
          code: 'ALREADY_POSTED',
          message: 'You have already posted a pulse today'
        }
      });
    }
    next(error);
  }
});

router.get('/today', requireAuth, async (req, res, next) => {
  try {
    const today = getTodayDateString();

    const pulses = await Pulse.find({ day: today })
      .populate('user', 'id name')
      .sort({ createdAt: -1 });

    res.json({
      pulses: pulses.map((p) => ({
        id: p._id,
        user: {
          id: p.user._id,
          name: p.user.name
        },
        mood: p.mood,
        note: p.note,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 90, 90);

    const pulses = await Pulse.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      pulses: pulses.map((p) => ({
        id: p._id,
        day: p.day,
        mood: p.mood,
        note: p.note,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
