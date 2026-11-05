const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const mongoose = require('mongoose');
const request = require('supertest');
const config = require('../config');
const { connect, disconnect, getConnectionState } = require('../db');
const createApp = require('../app');
const User = require('../models/User');
const Pulse = require('../models/Pulse');

let app;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  
  const testConfig = require('../config');
  
  await connect();
  
  try {
    await User.deleteMany({});
    await Pulse.deleteMany({});
  } catch (err) {
    console.log('Could not clear database, will proceed with existing data');
  }
  
  app = createApp();
});

afterAll(async () => {
  await disconnect();
});

describe('Health endpoint', () => {
  test('GET /api/health returns 200 when DB is up', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('db', 'up');
    expect(response.body).toHaveProperty('uptime');
  });

  test('GET /api/health returns 503 when DB is down (unit check)', async () => {
    const originalState = getConnectionState();
    await disconnect();
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty('status', 'degraded');
    expect(response.body).toHaveProperty('db', 'down');
    await connect();
  });
});

describe('Auth endpoints', () => {
  describe('POST /api/auth/register', () => {
    test('registers a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test-reg1@pulseboard.test',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test-reg1@pulseboard.test');
      expect(response.body.user).toHaveProperty('name', 'Test User');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    test('returns 409 for duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test-reg2@pulseboard.test',
          password: 'password123'
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'test-reg2@pulseboard.test',
          password: 'password456'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toHaveProperty('code', 'EMAIL_EXISTS');
    });

    test('returns 400 for invalid input - name too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'A',
          email: 'test-reg3@pulseboard.test',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('returns 400 for invalid input - password too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test-reg4@pulseboard.test',
          password: 'short'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('returns 400 for invalid input - invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'notanemail',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'login1@pulseboard.test',
          password: 'password123'
        });
    });

    test('logs in with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login1@pulseboard.test',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'login1@pulseboard.test');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    test('returns 401 for wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login1@pulseboard.test',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    test('returns 401 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@pulseboard.test',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'me1@pulseboard.test',
          password: 'password123'
        });
      token = registerResponse.body.token;
    });

    test('returns user data with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'me1@pulseboard.test');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    test('returns 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    test('returns 401 with tampered token', async () => {
      const tamperedToken = token + 'tampered';
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });
});

describe('Pulse endpoints', () => {
  describe('POST /api/pulses', () => {
    test('creates a pulse successfully', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'pulse-post1@pulseboard.test',
          password: 'password123'
        });
      const userToken = registerResponse.body.token;

      const response = await request(app)
        .post('/api/pulses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          mood: 4,
          note: 'Feeling good'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('pulse');
      expect(response.body.pulse).toHaveProperty('mood', 4);
      expect(response.body.pulse).toHaveProperty('note', 'Feeling good');
      expect(response.body.pulse).toHaveProperty('user');
    });

    test('returns 409 when posting second pulse same day', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'pulse-post2@pulseboard.test',
          password: 'password123'
        });
      const userToken = registerResponse.body.token;

      await request(app)
        .post('/api/pulses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          mood: 4,
          note: 'First pulse'
        });

      const response = await request(app)
        .post('/api/pulses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          mood: 5,
          note: 'Second pulse'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toHaveProperty('code', 'ALREADY_POSTED');
    });

    test('returns 400 for mood 0 (below minimum)', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'pulse-post3@pulseboard.test',
          password: 'password123'
        });
      const userToken = registerResponse.body.token;

      const response = await request(app)
        .post('/api/pulses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          mood: 0,
          note: 'Invalid mood'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('returns 400 for mood 6 (above maximum)', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'pulse-post4@pulseboard.test',
          password: 'password123'
        });
      const userToken = registerResponse.body.token;

      const response = await request(app)
        .post('/api/pulses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          mood: 6,
          note: 'Invalid mood'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('returns 400 for note over 280 characters', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'pulse-post5@pulseboard.test',
          password: 'password123'
        });
      const userToken = registerResponse.body.token;

      const longNote = 'a'.repeat(281);
      const response = await request(app)
        .post('/api/pulses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          mood: 4,
          note: longNote
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    test('returns 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/pulses')
        .send({
          mood: 4,
          note: 'No auth'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('GET /api/pulses/today', () => {
    test('returns today pulses for team', async () => {
      const user1Response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User 1',
          email: 'pulse-today1@pulseboard.test',
          password: 'password123'
        });
      const user1Token = user1Response.body.token;

      await request(app)
        .post('/api/pulses')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          mood: 4,
          note: 'My pulse'
        });

      const user2Response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User 2',
          email: 'pulse-today2@pulseboard.test',
          password: 'password123'
        });
      const user2Token = user2Response.body.token;

      await request(app)
        .post('/api/pulses')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          mood: 5,
          note: 'Other pulse'
        });

      const response = await request(app)
        .get('/api/pulses/today')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pulses');
      expect(response.body.pulses.length).toBeGreaterThanOrEqual(2);
      expect(response.body.pulses[0]).toHaveProperty('user');
      expect(response.body.pulses[0]).toHaveProperty('mood');
      expect(response.body.pulses[0]).toHaveProperty('note');
    });

    test('returns 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/pulses/today');

      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });

  describe('GET /api/pulses/mine', () => {
    test('returns only my pulses', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'pulse-mine1@pulseboard.test',
          password: 'password123'
        });
      const userToken = registerResponse.body.token;

      await request(app)
        .post('/api/pulses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          mood: 4,
          note: 'Today pulse'
        });

      const response = await request(app)
        .get('/api/pulses/mine')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pulses');
      expect(response.body.pulses.length).toBeGreaterThan(0);
      response.body.pulses.forEach(pulse => {
        expect(pulse).toHaveProperty('mood');
        expect(pulse).toHaveProperty('note');
        expect(pulse).toHaveProperty('day');
      });
    });

    test('respects limit parameter', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'pulse-mine2@pulseboard.test',
          password: 'password123'
        });
      const userToken = registerResponse.body.token;

      await request(app)
        .post('/api/pulses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          mood: 4,
          note: 'Today pulse'
        });

      const response = await request(app)
        .get('/api/pulses/mine?limit=1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pulses.length).toBeLessThanOrEqual(1);
    });

    test('caps limit at 90', async () => {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'pulse-mine3@pulseboard.test',
          password: 'password123'
        });
      const userToken = registerResponse.body.token;

      await request(app)
        .post('/api/pulses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          mood: 4,
          note: 'Today pulse'
        });

      const response = await request(app)
        .get('/api/pulses/mine?limit=200')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pulses.length).toBeLessThanOrEqual(90);
    });

    test('returns 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/pulses/mine');

      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });
});

describe('Admin endpoints', () => {
  describe('GET /api/admin/summary', () => {
    test('returns summary for admin', async () => {
      const adminPasswordHash = await User.hashPassword('password123');
      const admin = new User({
        name: 'Admin User',
        email: 'admin-summary1@pulseboard.test',
        passwordHash: adminPasswordHash,
        role: 'ADMIN'
      });
      await admin.save();
      
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin-summary1@pulseboard.test',
          password: 'password123'
        });
      const adminToken = adminLogin.body.token;

      const userRegister = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Regular User',
          email: 'user-summary1@pulseboard.test',
          password: 'password123'
        });
      const userToken = userRegister.body.token;

      await request(app)
        .post('/api/pulses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ mood: 4, note: 'User pulse' });

      await request(app)
        .post('/api/pulses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mood: 5, note: 'Admin pulse' });

      const response = await request(app)
        .get('/api/admin/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('day');
      expect(response.body).toHaveProperty('postsToday');
      expect(response.body).toHaveProperty('averageMoodToday');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body.postsToday).toBeGreaterThanOrEqual(2);
      expect(response.body.totalUsers).toBeGreaterThanOrEqual(2);
    });

    test('returns 403 for regular user', async () => {
      const adminPasswordHash = await User.hashPassword('password123');
      const admin = new User({
        name: 'Admin User',
        email: 'admin-summary2@pulseboard.test',
        passwordHash: adminPasswordHash,
        role: 'ADMIN'
      });
      await admin.save();
      
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin-summary2@pulseboard.test',
          password: 'password123'
        });
      const adminToken = adminLogin.body.token;

      const userRegister = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Regular User',
          email: 'user-summary2@pulseboard.test',
          password: 'password123'
        });
      const userToken = userRegister.body.token;

      await request(app)
        .post('/api/pulses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ mood: 4, note: 'User pulse' });

      await request(app)
        .post('/api/pulses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mood: 5, note: 'Admin pulse' });

      const response = await request(app)
        .get('/api/admin/summary')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
    });

    test('returns 401 without token', async () => {
      const response = await request(app)
        .get('/api/admin/summary');

      expect(response.status).toBe(401);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });
  });
});

describe('404 handler', () => {
  test('returns 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/unknown');

    expect(response.status).toBe(404);
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});
