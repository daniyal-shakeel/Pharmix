const User = require('../models/User');
const { generateToken } = require('../utils/token');

const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  if (role === 'admin') {
    if (process.env.SUPER_ADMIN_EMAIL && email === process.env.SUPER_ADMIN_EMAIL) {
      const superSanitized = process.env.SUPER_ADMIN_PASSWORD
        ? process.env.SUPER_ADMIN_PASSWORD
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
        : '';
      if (process.env.SUPER_ADMIN_PASSWORD &&
          (password === process.env.SUPER_ADMIN_PASSWORD || password === superSanitized)) {
        const payload = {
          id: 'super_admin',
          name: 'Super Admin',
          email: process.env.SUPER_ADMIN_EMAIL,
          role: 'admin',
          isSuperAdmin: true,
          linkedEntities: []
        };
        const token = generateToken(payload);
        return res.json({ message: 'Admin login successful', token, user: payload });
      } else {
        return res.status(401).json({ error: 'Invalid Super Admin Credentials' });
      }
    }

    const adminSanitized = process.env.ADMIN_PASSWORD
      ? process.env.ADMIN_PASSWORD
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;')
      : '';
    if (email === process.env.ADMIN_EMAIL &&
        (password === process.env.ADMIN_PASSWORD || password === adminSanitized)) {
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
  res.json({ message: 'Authenticated', user: req.user });
};

const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

const getDemoCredentials = (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.json({
      demoMode: true,
      credentials: {
        admin: { email: process.env.ADMIN_EMAIL || 'admin@pharmix.com', password: process.env.ADMIN_PASSWORD || '12345678' },
        manufacturer: { email: 'Manufacturer1@pharmix.com', password: 'd9NFiocBC5!' },
        pharmacy: { email: 'Pharmacy1@pharmix.com', password: 'lcT6XC4hPG!' },
        delivery: { email: 'Rider1@pharmix.com', password: '5KyDrE4Gx0!' }
      }
    });
  }
  res.json({ demoMode: false });
};

module.exports = { login, checkAuth, logout, getDemoCredentials };
