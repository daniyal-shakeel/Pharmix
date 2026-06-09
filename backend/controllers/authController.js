const User = require('../models/User');
const { generateToken } = require('../utils/token');

const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  // Admin login from .env credentials
  if (role === 'admin') {
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const payload = {
        id: 'admin_sys',
        name: 'System Admin',
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
        linkedEntities: []
      };
      const token = generateToken(payload);
      return res.json({ message: 'Admin login successful', token, user: payload });
    } else {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
  }

  // Real users from database
  try {
    const user = await User.findOne({ email, role });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials or role mismatch' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      entityId: user.entityId,
      linkedEntities: user.linkedEntities || []
    };

    const token = generateToken(payload);
    res.json({ message: 'Login successful', token, user: payload });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

const checkAuth = (req, res) => {
  // If protect middleware passes, token is valid
  res.json({ message: 'Authenticated', user: req.user });
};

const logout = (req, res) => {
  // Since JWT is stateless, we just tell the client it's successful
  // The client will remove the token from localStorage
  res.json({ message: 'Logged out successfully' });
};

module.exports = { login, checkAuth, logout };
