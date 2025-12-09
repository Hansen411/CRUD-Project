// TIME OFF REQUEST MODEL
// Employees request time off, admins approve/deny

const mongoose = require('mongoose');

const timeOffRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Admin who approved/denied
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  adminNotes: String // Admin can add notes when reviewing
}, {
  timestamps: true
});

module.exports = mongoose.model('TimeOffRequest', timeOffRequestSchema);