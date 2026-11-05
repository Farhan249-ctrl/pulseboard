const express = require('express');
const router = express.Router();
const zod = require('zod');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const registerSchema = zod.object({
  name: zod.string().min(2).max(60),
  email: zod.string().email(),
  password: zod.string().min(8)
});

const loginSchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(1)
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.validatedBody;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered'
        }
      });
    }

    const passwordHash = await User.hashPassword(password);

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'USER'
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id.toString() },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.status(201).json({
      token,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({
      token,
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user.toJSON() });
});

module.exports = router;
