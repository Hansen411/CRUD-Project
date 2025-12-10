// EMPLOYEE ROUTES
// Employees can view their data and make requests


const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const Shift = require('../models/Shift');
const TimeOffRequest = require('../models/TimeOffRequest');
const Payroll = require('../models/Payroll');
const Todo = require('../models/Todo');

// All employee routes require authentication
router.use(isAuthenticated);

// DASHBOARD

// GET /employee/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Get pending shift requests count
    const pendingShifts = await Shift.countDocuments({
      requestedBy: req.user._id,
      status: 'pending'
    });

    // Get pending time-off requests count
    const pendingTimeOff = await TimeOffRequest.countDocuments({
      employeeId: req.user._id,
      status: 'pending'
    });

    // Get upcoming shifts
    const upcomingShifts = await Shift.find({
      assignedTo: req.user._id,
      status: { $in: ['approved', 'taken'] },
      date: { $gte: new Date() }
    }).sort({ date: 1 }).limit(5);

    // Get next payroll
    const upcomingPayroll = await Payroll.findOne({
      employeeId: req.user._id,
      status: { $in: ['approved', 'paid'] },
      periodEnd: { $gte: new Date() }
    }).sort({ periodEnd: 1 });

    // Get user's todos
    const todos = await Todo.find({ 
      userId: req.user._id,
      completed: false  // Only incomplete tasks
    }).sort({ createdAt: -1 }).limit(5);  // Latest 5

    res.render('employee-dashboard', {
      user: req.user,
      pendingShifts,
      pendingTimeOff,
      upcomingShifts,
      upcomingPayroll,
      todos: todos  // ADD THIS
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Error loading dashboard');
  }
});

// PROFILE

// TO DO

// GET /employee/profile - Update to include todos
router.get('/profile', async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.render('profile', { 
      user: req.user,
      todos: todos
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).send('Error loading profile');
  }
});

// POST /employee/todos/create - Create new task
router.post('/todos/create', async (req, res) => {
  try {
    const { task } = req.body;
    
    await Todo.create({
      userId: req.user._id,
      task: task
    });
    
    res.redirect('/employee/profile');
  } catch (err) {
    console.error('Create todo error:', err);
    res.status(500).send('Error creating task');
  }
});

// POST /employee/todos/:id/update - UPDATE task
router.post('/todos/:id/update', async (req, res) => {
  try {
    const { task } = req.body;
    
    await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { task: task }
    );
    
    res.redirect('/employee/profile');
  } catch (err) {
    console.error('Update todo error:', err);
    res.status(500).send('Error updating task');
  }
});

// POST /employee/todos/:id/toggle - Mark complete/incomplete
router.post('/todos/:id/toggle', async (req, res) => {
  try {
    const todo = await Todo.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (todo) {
      todo.completed = !todo.completed;
      await todo.save();
    }
    
    res.redirect('/employee/profile');
  } catch (err) {
    console.error('Toggle todo error:', err);
    res.status(500).send('Error toggling task');
  }
});

// POST /employee/todos/:id/delete - Delete task
router.post('/todos/:id/delete', async (req, res) => {
  try {
    await Todo.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    res.redirect('/employee/profile');
  } catch (err) {
    console.error('Delete todo error:', err);
    res.status(500).send('Error deleting task');
  }
});

// SHIFTS


// GET /employee/shifts - View all shift information
router.get('/shifts', async (req, res) => {
  try {
    // Employee's shift requests (they created)
    const myRequests = await Shift.find({ 
      requestedBy: req.user._id,
      isEmployeeRequest: true
    }).sort({ date: 1 });

    // Count by status
    const approvedCount = myRequests.filter(s => s.status === 'approved').length;
    const deniedCount = myRequests.filter(s => s.status === 'denied').length;
    const pendingCount = myRequests.filter(s => s.status === 'pending').length;

    // Admin-posted shifts
    const adminPostedShifts = await Shift.find({ 
      isEmployeeRequest: false,
      date: { $gte: new Date() }
    }).sort({ date: 1 });

    // Count open vs taken admin shifts
    const openShiftsCount = adminPostedShifts.filter(s => s.status === 'open').length;
    const takenShiftsCount = adminPostedShifts.filter(s => s.status === 'taken' && s.assignedTo && s.assignedTo.toString() === req.user._id.toString()).length;

    // Upcoming schedule (approved requests + taken shifts)
    const upcomingSchedule = await Shift.find({
      $or: [
        { requestedBy: req.user._id, status: 'approved' },
        { assignedTo: req.user._id, status: 'taken' }
      ],
      date: { $gte: new Date() }
    }).sort({ date: 1 });

    res.render('employee-shifts', {
      user: req.user,
      myRequests,
      approvedCount,
      deniedCount,
      pendingCount,
      adminPostedShifts,
      openShiftsCount,
      takenShiftsCount,
      upcomingSchedule
    });
  } catch (err) {
    console.error('Shifts error:', err);
    res.status(500).send('Error loading shifts');
  }
});

// POST /employee/shifts/create-request - Employee creates shift request
router.post('/shifts/create-request', async (req, res) => {
  try {
    const { shiftType, date } = req.body;

    // Validate date is not in the past
    if (new Date(date) < new Date()) {
      return res.status(400).send('Cannot request shifts in the past');
    }

    const newShiftRequest = new Shift({
      shiftType,
      date,
      requestedBy: req.user._id,
      postedBy: req.user._id,
      assignedTo: req.user._id,
      status: 'pending',
      isEmployeeRequest: true
    });

    await newShiftRequest.save();
    res.redirect('/employee/shifts');
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).send('Error creating shift request');
  }
});

// POST /employee/shifts/:id/delete - Delete pending request
router.post('/shifts/:id/delete', async (req, res) => {
  try {
    const shift = await Shift.findOne({
      _id: req.params.id,
      requestedBy: req.user._id,
      status: 'pending'
    });

    if (!shift) {
      return res.status(404).send('Request not found or cannot be deleted');
    }

    await Shift.findByIdAndDelete(req.params.id);
    res.redirect('/employee/shifts');
  } catch (err) {
    console.error('Delete request error:', err);
    res.status(500).send('Error deleting request');
  }
});

// POST /employee/shifts/:id/take - Take an open shift
router.post('/shifts/:id/take', async (req, res) => {
  try {
    const shift = await Shift.findOne({
      _id: req.params.id,
      isEmployeeRequest: false,
      status: 'open'
    });

    if (!shift) {
      return res.status(404).send('Shift not found or no longer available');
    }

    shift.assignedTo = req.user._id;
    shift.status = 'taken';
    await shift.save();

    res.redirect('/employee/shifts');
  } catch (err) {
    console.error('Take shift error:', err);
    res.status(500).send('Error taking shift');
  }
});


// TIME OFF

// GET /employee/timeoff - View time-off requests
router.get('/timeoff', async (req, res) => {
  try {
    // Get all time-off requests for this employee
    const requests = await TimeOffRequest.find({ 
      employeeId: req.user._id 
    }).sort({ createdAt: -1 });

    // Get only approved requests for upcoming section
    const approvedTimeOff = await TimeOffRequest.find({ 
      employeeId: req.user._id,
      status: 'approved',
      endDate: { $gte: new Date() }
    }).sort({ startDate: 1 });

    res.render('employee-timeoff', {
      user: req.user,
      requests,
      approvedTimeOff
    });
  } catch (err) {
    console.error('Time-off error:', err);
    res.status(500).send('Error loading time-off requests');
  }
});

// POST /employee/timeoff/request - Submit time-off request
router.post('/timeoff/request', async (req, res) => {
  try {
    const { reason, startDate, endDate, notes } = req.body;

    const newRequest = new TimeOffRequest({
      employeeId: req.user._id,
      startDate,
      endDate,
      reason,
      status: 'pending',
      adminNotes: notes || ''
    });

    await newRequest.save();
    res.redirect('/employee/timeoff');
  } catch (err) {
    console.error('Time-off request error:', err);
    res.status(500).send('Error submitting request');
  }
});

// POST /employee/timeoff/:id/cancel - Cancel pending request
router.post('/timeoff/:id/cancel', async (req, res) => {
  try {
    const request = await TimeOffRequest.findOne({
      _id: req.params.id,
      employeeId: req.user._id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).send('Request not found or cannot be canceled');
    }

    await TimeOffRequest.findByIdAndDelete(req.params.id);
    res.redirect('/employee/timeoff');
  } catch (err) {
    console.error('Cancel request error:', err);
    res.status(500).send('Error canceling request');
  }
});


// PAYROLL

// GET /employee/payroll - View payroll
router.get('/payroll', async (req, res) => {
  try {
    // Get upcoming payroll period (ONLY approved or paid)
    const upcomingPayroll = await Payroll.findOne({ 
      employeeId: req.user._id,
      status: { $in: ['approved', 'paid'] }, //Only approved/paid
      periodEnd: { $gte: new Date() }
    }).sort({ periodEnd: 1 });

    // Get payment history (ONLY approved or paid, NOT pending)
    const payrollHistory = await Payroll.find({ 
      employeeId: req.user._id,
      status: { $in: ['approved', 'paid'] } // Only approved/paid 
    }).sort({ periodEnd: -1 }).limit(10);

    res.render('employee-payroll', {
      user: req.user,
      upcomingPayroll,
      payrollHistory
    });
  } catch (err) {
    console.error('Payroll error:', err);
    res.status(500).send('Error loading payroll');
  }
});

module.exports = router;