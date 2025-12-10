// ADMIN ROUTES
// Admins can manage all employees and data


const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const Shift = require('../models/Shift');
const TimeOffRequest = require('../models/TimeOffRequest');
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Todo = require('../models/Todo');

// All admin routes require authentication AND admin role
router.use(isAuthenticated);
router.use(isAdmin);


// DASHBOARD
// GET /admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Get pending counts
    const pendingShifts = await Shift.countDocuments({ 
      isEmployeeRequest: true,
      status: 'pending'
    });

    const pendingTimeOff = await TimeOffRequest.countDocuments({ 
      status: 'pending'
    });

    const totalEmployees = await User.countDocuments({ role: 'employee' });

    // Get user's todos
    const todos = await Todo.find({ 
      userId: req.user._id,
      completed: false  // Only incomplete tasks
    }).sort({ createdAt: -1 }).limit(5);  // Latest 5

    res.render('admin-dashboard', {
      user: req.user,
      pendingShifts,
      pendingTimeOff,
      totalEmployees,
      todos: todos 
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).send('Error loading dashboard');
  }
});

// PROFILE

// TO DO

// GET /admin/profile 
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

// POST /admin/todos/create
router.post('/todos/create', async (req, res) => {
  try {
    const { task } = req.body;
    await Todo.create({ userId: req.user._id, task: task });
    res.redirect('/admin/profile');
  } catch (err) {
    console.error('Create todo error:', err);
    res.status(500).send('Error creating task');
  }
});

// POST /admin/todos/:id/update - UPDATE
router.post('/todos/:id/update', async (req, res) => {
  try {
    const { task } = req.body;
    await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { task: task }
    );
    res.redirect('/admin/profile');
  } catch (err) {
    console.error('Update todo error:', err);
    res.status(500).send('Error updating task');
  }
});

// POST /admin/todos/:id/toggle
router.post('/todos/:id/toggle', async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.user._id });
    if (todo) {
      todo.completed = !todo.completed;
      await todo.save();
    }
    res.redirect('/admin/profile');
  } catch (err) {
    console.error('Toggle todo error:', err);
    res.status(500).send('Error toggling task');
  }
});

// POST /admin/todos/:id/delete
router.post('/todos/:id/delete', async (req, res) => {
  try {
    await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.redirect('/admin/profile');
  } catch (err) {
    console.error('Delete todo error:', err);
    res.status(500).send('Error deleting task');
  }
});


// SHIFTS

// GET /admin/shifts - View all shifts
router.get('/shifts', async (req, res) => {
  try {
    // Employee shift requests (they created)
    const employeeRequests = await Shift.find({ 
      isEmployeeRequest: true
    }).populate('requestedBy', '_id name email').sort({ date: 1 }); // Sort by date ascending

    // Count by status
    const approvedCount = employeeRequests.filter(s => s.status === 'approved').length;
    const deniedCount = employeeRequests.filter(s => s.status === 'denied').length;
    const pendingCount = employeeRequests.filter(s => s.status === 'pending').length;

    // Admin-created shifts - ONLY FUTURE SHIFTS
    const adminCreatedShifts = await Shift.find({ 
      isEmployeeRequest: false,
      date: { $gte: new Date() } // Only show future/today shifts
    }).populate('assignedTo', '_id name email').sort({ date: 1 }); // Sort by date ascending

    // Count open vs taken
    const openCount = adminCreatedShifts.filter(s => s.status === 'open').length;
    const takenCount = adminCreatedShifts.filter(s => s.status === 'taken').length;

    // All employee shifts (approved + taken) - ONLY FUTURE
    const allEmployeeShifts = await Shift.find({
      $or: [
        { status: 'approved' },
        { status: 'taken' }
      ],
      date: { $gte: new Date() } // Only future shifts
    }).populate('assignedTo', '_id name email').sort({ date: 1 });

    res.render('admin-shifts', {
      user: req.user,
      employeeRequests,
      approvedCount,
      deniedCount,
      pendingCount,
      adminCreatedShifts,
      openCount,
      takenCount,
      allEmployeeShifts
    });
  } catch (err) {
    console.error('Admin shifts error:', err);
    res.status(500).send('Error loading shifts');
  }
});

// POST /admin/shifts/:id/approve - Approve employee shift request
router.post('/shifts/:id/approve', async (req, res) => {
  try {
    const shift = await Shift.findOne({
      _id: req.params.id,
      isEmployeeRequest: true,
      status: 'pending'
    });

    if (!shift) {
      return res.status(404).send('Shift request not found');
    }

    shift.status = 'approved';
    await shift.save();

    res.redirect('/admin/shifts');
  } catch (err) {
    console.error('Approve shift error:', err);
    res.status(500).send('Error approving shift');
  }
});

// POST /admin/shifts/:id/deny - Deny employee shift request
router.post('/shifts/:id/deny', async (req, res) => {
  try {
    const shift = await Shift.findOne({
      _id: req.params.id,
      isEmployeeRequest: true,
      status: 'pending'
    });

    if (!shift) {
      return res.status(404).send('Shift request not found');
    }

    shift.status = 'denied';
    await shift.save();

    res.redirect('/admin/shifts');
  } catch (err) {
    console.error('Deny shift error:', err);
    res.status(500).send('Error denying shift');
  }
});

// POST /admin/shifts/create - Create open shift
router.post('/shifts/create', async (req, res) => {
  try {
    const { shiftType, date } = req.body;

    // Set default times based on shift type
    let startTime, endTime;
    switch(shiftType) {
      case 'Morning':
        startTime = '8:00 AM';
        endTime = '4:00 PM';
        break;
      case 'Afternoon':
        startTime = '12:00 PM';
        endTime = '8:00 PM';
        break;
      case 'Evening':
        startTime = '4:00 PM';
        endTime = '12:00 AM';
        break;
      case 'Weekend':
        startTime = '9:00 AM';
        endTime = '5:00 PM';
        break;
      default:
        startTime = '9:00 AM';
        endTime = '5:00 PM';
    }

    // Fix timezone issue: add time to the date string
    const shiftDate = new Date(date + 'T12:00:00'); // Set to noon to avoid timezone issues

    const newShift = new Shift({
      shiftType,
      date: shiftDate,
      startTime,
      endTime,
      postedBy: req.user._id,
      status: 'open',
      isEmployeeRequest: false
    });

    await newShift.save();
    res.redirect('/admin/shifts');
  } catch (err) {
    console.error('Create shift error:', err);
    res.status(500).send('Error creating shift');
  }
});

// POST /admin/shifts/:id/delete - Delete shift
router.post('/shifts/:id/delete', async (req, res) => {
  try {
    await Shift.findByIdAndDelete(req.params.id);
    res.redirect('/admin/shifts');
  } catch (err) {
    console.error('Delete shift error:', err);
    res.status(500).send('Error deleting shift');
  }
});

// GET /admin/timeoff - View all time-off requests
router.get('/timeoff', async (req, res) => {
  try {
    // Get all pending requests
    const pendingRequests = await TimeOffRequest.find({ 
      status: 'pending' 
    }).populate('employeeId', '_id name email').sort({ createdAt: -1 });

    // Get all approved requests
    const approvedRequests = await TimeOffRequest.find({ 
      status: 'approved' 
    }).populate('employeeId', '_id name email').sort({ startDate: 1 });

    res.render('admin-timeoff', {
      user: req.user,
      pendingRequests,
      approvedRequests
    });
  } catch (err) {
    console.error('Admin time-off error:', err);
    res.status(500).send('Error loading time-off requests');
  }
});

// POST /admin/timeoff/:id/approve - Approve time-off request
router.post('/timeoff/:id/approve', async (req, res) => {
  try {
    const request = await TimeOffRequest.findOne({
      _id: req.params.id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).send('Request not found');
    }

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    res.redirect('/admin/timeoff');
  } catch (err) {
    console.error('Approve time-off error:', err);
    res.status(500).send('Error approving request');
  }
});

// POST /admin/timeoff/:id/deny - Deny time-off request (deletes it)
router.post('/timeoff/:id/deny', async (req, res) => {
  try {
    const request = await TimeOffRequest.findOne({
      _id: req.params.id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).send('Request not found');
    }

    // Delete denied requests 
    await TimeOffRequest.findByIdAndDelete(req.params.id);

    res.redirect('/admin/timeoff');
  } catch (err) {
    console.error('Deny time-off error:', err);
    res.status(500).send('Error denying request');
  }
});
// GET /admin/payroll - View all payroll
router.get('/payroll', async (req, res) => {
  try {
    // Pending payroll needing approval
    const pendingPayroll = await Payroll.find({ 
      status: 'pending' 
    }).populate('employeeId', '_id name email').sort({ periodEnd: -1 });

    // All payroll records
    const allPayroll = await Payroll.find({})
      .populate('employeeId', '_id name email')
      .sort({ periodEnd: -1 });

    res.render('admin-payroll', {
      user: req.user,
      pendingPayroll,
      allPayroll
    });
  } catch (err) {
    console.error('Admin payroll error:', err);
    res.status(500).send('Error loading payroll');
  }
});


// POST /admin/payroll/:id/approve - Approve payroll
router.post('/payroll/:id/approve', async (req, res) => {
  try {
    const payroll = await Payroll.findOne({
      _id: req.params.id,
      status: 'pending'
    });

    if (!payroll) {
      return res.status(404).send('Payroll not found');
    }

    payroll.status = 'approved';
    payroll.approvedBy = req.user._id;
    await payroll.save();

    res.redirect('/admin/payroll');
  } catch (err) {
    console.error('Approve payroll error:', err);
    res.status(500).send('Error approving payroll');
  }
});

module.exports = router;