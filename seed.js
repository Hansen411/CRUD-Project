// Populates database with fake test data
// Run with: node seed.js


require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Shift = require('./models/Shift');
const TimeOffRequest = require('./models/TimeOffRequest');
const Payroll = require('./models/Payroll');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB Error:', err));

async function seed() {
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Shift.deleteMany({});
    await TimeOffRequest.deleteMany({});
    await Payroll.deleteMany({});


    // CREATE USERS

    console.log('Creating users...');

    // 1 Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@admin.com',
      password: 'admin123',
      role: 'admin',
      phone: '555-0001'
    });

    // 3 Employees
    const employee1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'employee',
      phone: '555-0002',
      hireDate: new Date('2024-01-15')
    });

    const employee2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      role: 'employee',
      phone: '555-0003',
      hireDate: new Date('2024-03-20')
    });

    const employee3 = await User.create({
      name: 'Ally Hansen',
      email: 'ally@example.com',
      password: 'password123',
      role: 'employee',
      phone: '555-0004',
      hireDate: new Date('2024-02-10')
    });

    console.log('Created 1 admin and 3 employees');

   
    // CREATE employee initiated SHIFT REQUESTS
    
    console.log('Creating shift requests...');

    // John's pending shift request
    await Shift.create({
      shiftType: 'Morning',
      date: new Date('2025-12-15'),
      requestedBy: employee1._id,
      postedBy: employee1._id,
      assignedTo: employee1._id,
      status: 'pending',
      isEmployeeRequest: true
    });

    // Jane's approved shift request
    await Shift.create({
      shiftType: 'Afternoon',
      date: new Date('2025-12-20'),
      requestedBy: employee2._id,
      postedBy: employee2._id,
      assignedTo: employee2._id,
      status: 'approved',
      isEmployeeRequest: true
    });

    console.log('Created employee shift requests');

 
    // CREATE OPEN SHIFTS via admin 

    console.log('Creating open shifts...');

    // Open shift 1
    await Shift.create({
      shiftType: 'Evening',
      date: new Date('2025-12-18'),
      startTime: '5:00 PM',
      endTime: '11:00 PM',
      postedBy: admin._id,
      status: 'open',
      isEmployeeRequest: false,
      location: 'Main Office'
    });

    // Open shift 2
    await Shift.create({
      shiftType: 'Weekend',
      date: new Date('2025-12-21'),
      startTime: '9:00 AM',
      endTime: '5:00 PM',
      postedBy: admin._id,
      status: 'open',
      isEmployeeRequest: false,
      location: 'Warehouse'
    });

    // Taken shift (Mike took it)
    await Shift.create({
      shiftType: 'Morning',
      date: new Date('2025-12-22'),
      startTime: '8:00 AM',
      endTime: '4:00 PM',
      postedBy: admin._id,
      assignedTo: employee3._id,
      status: 'taken',
      isEmployeeRequest: false,
      location: 'Main Office'
    });

    console.log('Created admin-posted shifts');

    // CREATE TIME-OFF REQUESTS

    console.log('Creating time-off requests...');

    // John's pending vacation request
    await TimeOffRequest.create({
      employeeId: employee1._id,
      startDate: new Date('2025-12-25'),
      endDate: new Date('2025-12-28'),
      reason: 'Vacation',
      status: 'pending',
      adminNotes: 'Holiday vacation'
    });

    // Jane's approved time off
    await TimeOffRequest.create({
      employeeId: employee2._id,
      startDate: new Date('2025-01-05'),
      endDate: new Date('2025-01-07'),
      reason: 'Personal Leave',
      status: 'approved',
      reviewedBy: admin._id,
      reviewedAt: new Date(),
      adminNotes: 'Approved - enjoy!'
    });

    // Mike's pending sick leave
    await TimeOffRequest.create({
      employeeId: employee3._id,
      startDate: new Date('2025-12-12'),
      endDate: new Date('2025-12-13'),
      reason: 'Sick Leave',
      status: 'pending'
    });

    console.log('Created time-off requests');

    // CREATE PAYROLL RECORDS
  
    console.log('Creating payroll records...');

    // John's payroll
    await Payroll.create({
      employeeId: employee1._id,
      periodStart: new Date('2025-11-01'),
      periodEnd: new Date('2025-11-15'),
      hoursWorked: 80,
      hourlyRate: 25.00,
      grossPay: 2000.00,
      deductions: 300.00,
      netPay: 1700.00,
      status: 'paid',
      approvedBy: admin._id,
      paidDate: new Date('2025-11-16')
    });

    await Payroll.create({
      employeeId: employee1._id,
      periodStart: new Date('2025-11-16'),
      periodEnd: new Date('2025-11-30'),
      hoursWorked: 75,
      hourlyRate: 25.00,
      grossPay: 1875.00,
      deductions: 280.00,
      netPay: 1595.00,
      status: 'approved',
      approvedBy: admin._id
    });

    // Jane's payroll
    await Payroll.create({
      employeeId: employee2._id,
      periodStart: new Date('2025-11-01'),
      periodEnd: new Date('2025-11-15'),
      hoursWorked: 85,
      hourlyRate: 22.00,
      grossPay: 1870.00,
      deductions: 275.00,
      netPay: 1595.00,
      status: 'paid',
      approvedBy: admin._id,
      paidDate: new Date('2025-11-16')
    });

    // Mike's pending payroll
    await Payroll.create({
      employeeId: employee3._id,
      periodStart: new Date('2025-11-16'),
      periodEnd: new Date('2025-11-30'),
      hoursWorked: 78,
      hourlyRate: 23.50,
      grossPay: 1833.00,
      deductions: 270.00,
      netPay: 1563.00,
      status: 'pending'
    });

    // Upcoming payroll for all
    await Payroll.create({
      employeeId: employee1._id,
      periodStart: new Date('2025-12-01'),
      periodEnd: new Date('2025-12-15'),
      hoursWorked: 87,
      hourlyRate: 25.00,
      grossPay: 2175.00,
      deductions: 130.5,
      netPay: 2044.50,
      status: 'pending'
    });

    console.log('Created payroll records');

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\nSEED COMPLETE! \n');
    console.log('Summary:');
    console.log('   • 1 Admin: admin@admin.com (password: admin123)');
    console.log('   • 3 Employees:');
    console.log('      - john@example.com (password: password123)');
    console.log('      - jane@example.com (password: password123)');
    console.log('      - ally@example.com (password: password123)');
    console.log('   • Multiple shifts, time-off requests, and payroll records');
    console.log('\nYou can now test our app\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();