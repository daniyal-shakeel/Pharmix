const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', cartController.getCarts);
router.post('/add', cartController.addToCart);
router.post('/update', cartController.updateCartItem);
router.post('/clear', cartController.clearCart);

module.exports = router;
