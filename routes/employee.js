// GET /employee/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Get pending time-off requests count
    const pendingTimeOffCount = await TimeOffRequest.countDocuments({ 
      employeeId: req.user._id,
      status: 'pending'
    });

    // GET /employee/profile - View profile
router.get('/profile', isAuthenticated, (req, res) => {
  res.render('profile', { user: req.user });
});

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
      postedBy: req.user._id, // Employee is creating it
      assignedTo: req.user._id, // Pre-assign to themselves
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
      endDate: { $gte: new Date() } // Future time off only
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

    // Get next upcoming payroll
    const nextPayroll = await Payroll.findOne({ 
      employeeId: req.user._id,
      periodEnd: { $gte: new Date() } // Future payroll periods
    }).sort({ periodEnd: 1 }); // Get the closest one

    res.render('employee-dashboard', {
      user: req.user,
      pendingTimeOffCount,
      pendingShiftCount,
      nextPayroll
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Error loading dashboard');
  }
});