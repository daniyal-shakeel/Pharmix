const express = require('express');
const { getPartners, getPartnerDetails } = require('../controllers/partnerController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getPartners);
router.get('/:type/:id', protect, getPartnerDetails);

module.exports = router;
