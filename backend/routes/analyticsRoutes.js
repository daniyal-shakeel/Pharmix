const express = require('express');
const { getManufacturerAnalytics, getAdminAnalytics, getPharmacyAnalytics, getSidebarSummary, getDemoLogs, getDemoLogsStats } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/manufacturer', protect, getManufacturerAnalytics);
router.get('/admin', protect, getAdminAnalytics);
router.get('/pharmacy', protect, getPharmacyAnalytics);
router.get('/sidebar-summary', protect, getSidebarSummary);
router.get('/logs', protect, admin, getDemoLogs);
router.get('/logs/stats', protect, admin, getDemoLogsStats);

module.exports = router;
