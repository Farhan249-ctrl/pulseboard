const mongoose = require('mongoose');

const pulseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  day: {
    type: String,
    required: [true, 'Day is required'],
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: 'Day must be in YYYY-MM-DD format'
    }
  },
  mood: {
    type: Number,
    required: [true, 'Mood is required'],
    min: [1, 'Mood must be at least 1'],
    max: [5, 'Mood cannot exceed 5']
  },
  note: {
    type: String,
    maxlength: [280, 'Note cannot exceed 280 characters'],
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

pulseSchema.index({ user: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('Pulse', pulseSchema);
