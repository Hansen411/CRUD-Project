// SHIFT MODEL
// Handles both employee requests AND admin-posted shifts

const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  shiftType: {
    type: String,
    enum: ['Morning', 'Afternoon', 'Evening', 'Weekend'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: function() {
      return !this.isEmployeeRequest; // Only required for admin-posted shifts
    }
  },
  endTime: {
    type: String,
    required: function() {
      return !this.isEmployeeRequest; // Only required for admin-posted shifts
    }
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means shift is open/available
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Who requested this shift (if employee-initiated)
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Admin who created/posted this
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied', 'open', 'taken'],
    default: 'pending'
    // pending: Employee requested, waiting for admin approval
    // approved: Admin approved employee request
    // denied: Admin denied employee request
    // open: Admin posted, available for employees to take
    // taken: Employee took an admin-posted shift
  },
  isEmployeeRequest: {
    type: Boolean,
    default: false
    // true: Employee requested this shift
    // false: Admin posted this as an open shift
  },
  location: String,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Shift', shiftSchema);