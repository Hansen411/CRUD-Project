// SHIFT tracks: date + start/end time), who's assigned, who posted it, status (completed/open)

const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to User model
    default: null // null means shift is open/available
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'completed'],
    default: 'open'
  },
  location: String,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Shift', shiftSchema);