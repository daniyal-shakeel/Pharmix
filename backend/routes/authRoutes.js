const express = require('express');
const { login, checkAuth, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/check', protect, checkAuth);

module.exports = router;
