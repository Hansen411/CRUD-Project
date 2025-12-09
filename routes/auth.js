// POST /auth/signup - Handle signup form
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).send('Email already registered');
    }

    // AUTO-DETECT ADMIN: If email ends with @admin.com, make them admin
    let role = 'employee'; // Default
    if (email.toLowerCase().endsWith('@admin.com')) {
      role = 'admin';
    }

    // Create new user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password, // Will be hashed automatically by User model
      role: role // Automatically set based on email
    });

    await newUser.save();

    // Log them in automatically after signup
    req.login(newUser, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error logging in after signup');
      }
      
      // Redirect based on role
      if (newUser.role === 'admin') {
        return res.redirect('/admin/dashboard');
      } else {
        return res.redirect('/employee/dashboard');
      }
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).send('Error creating account');
  }
});