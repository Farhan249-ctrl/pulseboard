const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');
const Pulse = require('./models/Pulse');

function getDateString(offsetDays = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - offsetDays);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function seed() {
  console.log('Starting seed script...');
  console.log(`Database: ${config.mongoDbName}`);

  try {
    await mongoose.connect(config.mongoUri, {
      dbName: config.mongoDbName
    });
    console.log('Connected to MongoDB');

    let createdUsers = 0;
    let skippedUsers = 0;
    let createdPulses = 0;
    let skippedPulses = 0;

    const adminPasswordHash = await User.hashPassword(config.adminPassword);
    const demoPasswordHash = await User.hashPassword(config.seedDemoPassword);

    const existingAdmin = await User.findOne({ email: config.adminEmail });
    const admin = await User.findOneAndUpdate(
      { email: config.adminEmail },
      {
        name: 'Admin',
        email: config.adminEmail,
        passwordHash: adminPasswordHash,
        role: 'ADMIN'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!existingAdmin) {
      createdUsers++;
      console.log(`Created admin user: ${config.adminEmail}`);
    } else {
      skippedUsers++;
      console.log(`Admin user already exists: ${config.adminEmail}`);
    }

    const demoUsers = [
      { name: 'Alice Johnson', email: 'alice@example.com' },
      { name: 'Bob Smith', email: 'bob@example.com' },
      { name: 'Charlie Brown', email: 'charlie@example.com' },
      { name: 'Diana Prince', email: 'diana@example.com' }
    ];

    const userDocs = [];

    for (const userData of demoUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      const user = await User.findOneAndUpdate(
        { email: userData.email },
        {
          name: userData.name,
          email: userData.email,
          passwordHash: demoPasswordHash,
          role: 'USER'
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (!existingUser) {
        createdUsers++;
        console.log(`Created demo user: ${userData.email}`);
      } else {
        skippedUsers++;
        console.log(`Demo user already exists: ${userData.email}`);
      }

      userDocs.push(user);
    }

    const today = getDateString(0);

    for (let i = 0; i < 3; i++) {
      const user = userDocs[i];
      const mood = Math.floor(Math.random() * 5) + 1;
      const notes = [
        'Feeling great today!',
        'Productive morning.',
        'A bit tired but okay.',
        'Excited about the project.',
        'Challenging day but learning a lot.'
      ];
      const note = notes[Math.floor(Math.random() * notes.length)];

      const existingPulse = await Pulse.findOne({ user: user._id, day: today });
      const pulse = await Pulse.findOneAndUpdate(
        { user: user._id, day: today },
        {
          user: user._id,
          day: today,
          mood,
          note
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (!existingPulse) {
        createdPulses++;
        console.log(`Created today's pulse for ${user.email} (mood: ${mood})`);
      } else {
        skippedPulses++;
        console.log(`Today's pulse already exists for ${user.email}`);
      }
    }

    for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
      const day = getDateString(dayOffset);

      for (let i = 0; i < 2; i++) {
        const user = userDocs[i];
        const mood = Math.floor(Math.random() * 5) + 1;
        const notes = [
          'Good progress.',
          'Team meeting went well.',
          'Focused work session.',
          'Planning ahead.',
          'Reflecting on goals.'
        ];
        const note = notes[Math.floor(Math.random() * notes.length)];

        const existingPulse = await Pulse.findOne({ user: user._id, day });
        const pulse = await Pulse.findOneAndUpdate(
          { user: user._id, day },
          {
            user: user._id,
            day,
            mood,
            note
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (!existingPulse) {
          createdPulses++;
          console.log(`Created pulse for ${user.email} on ${day} (mood: ${mood})`);
        } else {
          skippedPulses++;
          console.log(`Pulse already exists for ${user.email} on ${day}`);
        }
      }
    }

    console.log('\n=== Seed Summary ===');
    console.log(`Users created: ${createdUsers}`);
    console.log(`Users skipped: ${skippedUsers}`);
    console.log(`Pulses created: ${createdPulses}`);
    console.log(`Pulses skipped: ${skippedPulses}`);
    console.log('Seed completed successfully!');

  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
