const express = require('express');
const { createUser, getUsers, getEntitiesByRole, getLinkedManufacturers, getLinkedDelivery, getLinkedPharmacies, resetPassword } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const { checkCreateLimit } = require('../middleware/demoMode');
const router = express.Router();

router.get('/', protect, admin, getUsers);
router.get('/entities/:role', protect, admin, getEntitiesByRole);
router.post('/', protect, admin, checkCreateLimit('User'), createUser);
router.post('/reset-password', protect, admin, resetPassword);

// Linked entities endpoints for settings page (role-based)
router.get('/linked-manufacturers', protect, getLinkedManufacturers);
router.get('/linked-delivery', protect, getLinkedDelivery);
router.get('/linked-pharmacies', protect, getLinkedPharmacies);

module.exports = router;
