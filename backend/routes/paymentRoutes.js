const express = require('express');
const { getPayments, getPaymentById, handleStripeWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Public webhook route (Stripe will call this)
router.post('/webhook', express.json({ type: 'application/json' }), handleStripeWebhook);

// Protected routes
router.get('/', protect, getPayments);
router.get('/:id', protect, getPaymentById);

module.exports = router;
