# PulseBoard Backend API Documentation

## Overview

PulseBoard is a team mood tracking application built with Node.js, Express, MongoDB, and JWT authentication. This backend provides RESTful APIs for user registration/authentication, daily pulse posting, team feed, user history, and admin summary.

## Tech Stack

- **Runtime**: Node.js >= 20
- **Framework**: Express 4.21.2
- **Database**: MongoDB 7.0 with Mongoose 8.9.3
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **Language**: JavaScript (CommonJS)

## Project Structure

```
backend/
├── src/
│   ├── config.js          # Environment configuration with Zod validation
│   ├── db.js              # MongoDB connection helpers
│   ├── server.js          # Server entry point with graceful shutdown
│   ├── app.js             # Express app configuration
│   ├── seed.js            # Idempotent seed script for demo data
│   ├── models/
│   │   ├── User.js        # User schema and methods
│   │   └── Pulse.js       # Pulse schema with unique index
│   ├── middleware/
│   │   ├── auth.js        # JWT authentication & authorization
│   │   ├── error.js       # Central error handling
│   │   └── validate.js    # Zod validation wrapper
│   ├── routes/
│   │   ├── health.js      # Health check endpoint
│   │   ├── auth.js        # Registration, login, profile
│   │   ├── pulses.js      # Pulse CRUD operations
│   │   └── admin.js       # Admin summary endpoint
│   └── tests/
│       └── api.test.js    # Comprehensive API test suite
├── package.json
└── .gitkeep
```

## Environment Variables

Required environment variables (see `.env.example`):

```bash
NODE_ENV=development                    # development | production | test
API_PORT=4000                           # API server port
MONGO_HOST=127.0.0.1                    # MongoDB host
MONGO_PORT=27018                        # MongoDB port
MONGO_APP_DB=pulseboard                 # Database name
MONGO_APP_USER=pulseboard_app           # Application user
MONGO_APP_PASSWORD=change_me_app        # Application user password
JWT_SECRET=<32+ chars>                  # JWT signing secret
JWT_EXPIRES_IN=2h                       # JWT token expiration
ADMIN_EMAIL=admin@pulseboard.local       # Admin user email
ADMIN_PASSWORD=<secure password>         # Admin user password
SEED_DEMO_PASSWORD=demo123456           # Demo users password
```

## Database Setup

### Development (Docker Compose)

```bash
# Start MongoDB
docker-compose -f docker-compose.dev.yml up -d

# Stop MongoDB
docker-compose -f docker-compose.dev.yml down
```

The MongoDB container includes:
- MongoDB 7.0 image
- Healthcheck on port 27018
- Init script to create application user with readWrite role
- Volume persistence

### Seed Demo Data

```bash
cd backend
npm run seed
```

The seed script creates:
- 1 admin user (ADMIN_EMAIL from env)
- 4 demo users (alice@example.com, bob@example.com, charlie@example.com, diana@example.com)
- Pulses for today and last 5 days for demo users

The seed is idempotent - it can be run multiple times safely.

## API Endpoints

### Base URL
```
http://127.0.0.1:4000/api
```

### Authentication

All endpoints except `/api/health` and `/api/auth/register` and `/api/auth/login` require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Health Check

**GET /api/health**

Returns server and database health status.

**Response (200 OK)**
```json
{
  "status": "ok",
  "db": "up",
  "uptime": 123
}
```

**Response (503 Service Unavailable)**
```json
{
  "status": "degraded",
  "db": "down",
  "uptime": 123
}
```

### Authentication Endpoints

#### Register User

**POST /api/auth/register**

Registers a new user account.

**Request Body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation Rules**
- name: minimum 2 characters
- email: valid email format, unique (case-insensitive)
- password: minimum 8 characters

**Response (201 Created)**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**
- 400: Validation error
- 409: Email already exists

#### Login

**POST /api/auth/login**

Authenticates a user and returns a JWT token.

**Request Body**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK)**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**
- 401: Invalid credentials

#### Get Current User

**GET /api/auth/me**

Returns the authenticated user's profile.

**Headers**
```
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**
- 401: Missing or invalid token

### Pulse Endpoints

#### Post Pulse

**POST /api/pulses**

Creates a daily pulse entry for the authenticated user. One pulse per user per day is allowed.

**Headers**
```
Authorization: Bearer <token>
```

**Request Body**
```json
{
  "mood": 4,
  "note": "Feeling productive today"
}
```

**Validation Rules**
- mood: integer between 1 and 5 (inclusive)
- note: string, maximum 280 characters, optional

**Response (201 Created)**
```json
{
  "pulse": {
    "_id": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439011",
    "day": "2024-01-01",
    "mood": 4,
    "note": "Feeling productive today",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses**
- 400: Validation error
- 401: Unauthorized
- 409: Already posted today

#### Get Today's Feed

**GET /api/pulses/today**

Returns all pulses posted by all users for the current day (UTC).

**Headers**
```
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "pulses": [
    {
      "id": "507f1f77bcf86cd799439012",
      "user": {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe"
      },
      "mood": 4,
      "note": "Feeling productive today",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses**
- 401: Unauthorized

#### Get My History

**GET /api/pulses/mine**

Returns the authenticated user's pulse history.

**Headers**
```
Authorization: Bearer <token>
```

**Query Parameters**
- limit: number of pulses to return (default: 30, max: 90)

**Response (200 OK)**
```json
{
  "pulses": [
    {
      "id": "507f1f77bcf86cd799439012",
      "day": "2024-01-01",
      "mood": 4,
      "note": "Feeling productive today",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses**
- 401: Unauthorized

### Admin Endpoints

#### Get Summary

**GET /api/admin/summary**

Returns a summary of today's activity. Requires ADMIN role.

**Headers**
```
Authorization: Bearer <token>
```

**Response (200 OK)**
```json
{
  "day": "2024-01-01",
  "postsToday": 10,
  "averageMoodToday": 3.8,
  "totalUsers": 5
}
```

**Error Responses**
- 401: Unauthorized
- 403: Forbidden (non-admin user)

## Data Models

### User

```javascript
{
  _id: ObjectId,
  name: String (required, min 2 chars),
  email: String (required, unique, lowercase),
  passwordHash: String (required),
  role: String (enum: ['USER', 'ADMIN'], default: 'USER'),
  createdAt: Date (default: now)
}
```

### Pulse

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User, required),
  day: String (YYYY-MM-DD UTC, required),
  mood: Number (1-5, required),
  note: String (max 280 chars, optional),
  createdAt: Date (default: now)
}
```

**Unique Index**: `{ user: 1, day: 1 }` - ensures one pulse per user per day

## Error Handling

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

**Error Codes**
- `VALIDATION_ERROR`: Request validation failed
- `EMAIL_EXISTS`: Email already registered
- `INVALID_CREDENTIALS`: Wrong email or password
- `ALREADY_POSTED`: User already posted today
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found

## Rate Limiting

Rate limiting is applied to `/api/auth/*` endpoints:
- 100 requests per 15 minutes per IP
- Disabled in test environment (NODE_ENV=test)

## Security

- Passwords are hashed using bcrypt with 10 salt rounds
- JWT tokens expire after 2 hours (configurable)
- JWT_SECRET must be at least 32 characters
- MongoDB app user has only readWrite role (no admin privileges)
- Input validation using Zod schemas
- Helmet middleware for security headers
- CORS not configured (add as needed)

## Running the Application

### Development

```bash
cd backend
npm install
npm start
```

Server runs on http://127.0.0.1:4000

### Testing

```bash
cd backend
npm test
```

Tests use Jest and Supertest against a real MongoDB instance. The test suite covers:
- Health endpoint
- Authentication (register, login, profile)
- Pulse operations (create, feed, history)
- Admin operations
- Validation errors
- Authorization errors
- 404 handler

### Production

```bash
NODE_ENV=production npm start
```

## E2E Testing

A PowerShell script `e2e-test.ps1` is provided for manual API testing:

```powershell
powershell -ExecutionPolicy Bypass -File e2e-test.ps1
```

The script tests:
- Health check
- User registration
- User login
- Pulse posting
- Duplicate pulse prevention
- Today's feed
- User history

## Dependencies

See `backend/package.json` for full list. Key dependencies:

```json
{
  "express": "4.21.2",
  "mongoose": "8.9.3",
  "jsonwebtoken": "9.0.2",
  "bcryptjs": "2.4.3",
  "zod": "3.23.8",
  "dotenv": "16.4.5",
  "helmet": "8.0.0",
  "morgan": "1.10.0",
  "express-rate-limit": "7.4.1",
  "jest": "29.7.0",
  "supertest": "6.3.4"
}
```

## License

Proprietary
