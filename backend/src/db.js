const mongoose = require('mongoose');
const config = require('./config');

let isConnected = false;

async function connect() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(config.mongoUri, {
      dbName: config.mongoDbName
    });
    isConnected = true;
    console.log(`Connected to MongoDB: ${config.mongoDbName}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

async function disconnect() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('MongoDB disconnect error:', error);
    throw error;
  }
}

function getConnectionState() {
  return mongoose.connection.readyState;
}

module.exports = {
  connect,
  disconnect,
  getConnectionState
};
