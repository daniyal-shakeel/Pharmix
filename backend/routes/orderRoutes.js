const express = require('express');
const { createPaymentIntent, createOrder, getOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { checkCreateLimit } = require('../middleware/demoMode');
const router = express.Router();

router.use(protect);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.post('/payment-intent', createPaymentIntent);
router.post('/confirm', checkCreateLimit('Order'), createOrder);

module.exports = router;
