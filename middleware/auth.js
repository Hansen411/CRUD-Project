// Check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); // User is logged in, continue
  }
  res.redirect('/auth/login'); // redirect to login if not logged in
}

// Check if user is an admin
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next(); // User is admin, continue
  }
  res.status(403).send('Access denied. Admins only.'); // Not admin
}

// Check if user is an employee
function isEmployee(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'employee') {
    return next(); // User is employee, continue
  }
  res.status(403).send('Access denied. Employees only.'); // Not employee
}

module.exports = {
  isAuthenticated,
  isAdmin,
  isEmployee
};