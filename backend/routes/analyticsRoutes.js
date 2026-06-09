const express = require('express');
const { getManufacturerAnalytics, getAdminAnalytics, getPharmacyAnalytics, getSidebarSummary } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/manufacturer', protect, getManufacturerAnalytics);
router.get('/admin', protect, getAdminAnalytics);
router.get('/pharmacy', protect, getPharmacyAnalytics);
router.get('/sidebar-summary', protect, getSidebarSummary);

module.exports = router;
