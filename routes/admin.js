// ADMIN ROUTES
// Admins can manage all employees and data


const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const Shift = require('../models/Shift');
const TimeOffRequest = require('../models/TimeOffRequest');
const Payroll = require('../models/Payroll');
const User = require('../models/User');

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

    res.render('admin-dashboard', {
      user: req.user,
      pendingShifts,
      pendingTimeOff,
      totalEmployees
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).send('Error loading dashboard');
  }
});


// PROFILE

// GET /admin/profile
router.get('/profile', (req, res) => {
  res.render('profile', { user: req.user });
});


// SHIFTS

// GET /admin/shifts - View all shifts
router.get('/shifts', async (req, res) => {
  try {
    // Employee shift requests (they created)
    const employeeRequests = await Shift.find({ 
      isEmployeeRequest: true
    }).populate('requestedBy', '_id name email').sort({ date: 1 });

    // Count by status
    const approvedCount = employeeRequests.filter(s => s.status === 'approved').length;
    const deniedCount = employeeRequests.filter(s => s.status === 'denied').length;
    const pendingCount = employeeRequests.filter(s => s.status === 'pending').length;

    // Admin-created shifts
    const adminCreatedShifts = await Shift.find({ 
      isEmployeeRequest: false
    }).populate('assignedTo', '_id name email').sort({ date: 1 });

    // Count open vs taken
    const openCount = adminCreatedShifts.filter(s => s.status === 'open').length;
    const takenCount = adminCreatedShifts.filter(s => s.status === 'taken').length;

    // All employee shifts (approved + taken)
    const allEmployeeShifts = await Shift.find({
      $or: [
        { status: 'approved' },
        { status: 'taken' }
      ]
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

    const newShift = new Shift({
      shiftType,
      date,
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

    // Delete denied requests per your requirement
    await TimeOffRequest.findByIdAndDelete(req.params.id);

    res.redirect('/admin/timeoff');
  } catch (err) {
    console.error('Deny time-off error:', err);
    res.status(500).send('Error denying request');
  }
});

module.exports = router;