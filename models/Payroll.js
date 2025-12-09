// Tracks employee pay periods
/* 
Which employee
Pay period (start/end dates)
Hours worked and hourly rate
Gross pay, deductions, net pay
Status (pending/approved/paid)
Auto-calculates pay before saving
*/
const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  hoursWorked: {
    type: Number,
    required: true,
    default: 0
  },
  hourlyRate: {
    type: Number,
    required: true
  },
  grossPay: {
    type: Number,
    required: false
  },
  deductions: {
    type: Number,
    default: 0
  },
  netPay: {
    type: Number,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  paidDate: {
    type: Date,
    default: null
  },
  notes: String
}, {
  timestamps: true
});

// Calculate gross and net pay before saving
payrollSchema.pre('save', function() {
  this.grossPay = this.hoursWorked * this.hourlyRate;
  this.netPay = this.grossPay - this.deductions;
});

module.exports = mongoose.model('Payroll', payrollSchema);