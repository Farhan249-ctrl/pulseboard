// MongoDB init script for PulseBoard app user creation
// This script runs on first container start via docker-entrypoint-initdb.d
// It creates the application database user with readWrite role on the app DB only

// Switch to the application database
db = db.getSiblingDB(process.env.MONGO_APP_DB);

// Create the application user with readWrite role on the app database
// This user is used by the backend application to connect to MongoDB
db.createUser({
  user: process.env.MONGO_APP_USER,
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [
    {
      role: "readWrite",
      db: process.env.MONGO_APP_DB
    }
  ]
});

print("Created app user: " + process.env.MONGO_APP_USER + " on database: " + process.env.MONGO_APP_DB);
