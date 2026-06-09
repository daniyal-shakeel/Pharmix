const express = require('express');
const { getNotifications, markAsOpened, markAllAsOpened } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getNotifications);
router.patch('/:id/open', protect, markAsOpened);
router.patch('/open-all', protect, markAllAsOpened);

module.exports = router;
