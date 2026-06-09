const express = require('express');
const { getMedicines, getMedicineDetails, createMedicine, getCategories, getInventoryStats, getPharmacyInventory, updateMedicine } = require('../controllers/medicineController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/inventory-stats', protect, getInventoryStats);
router.get('/pharmacy-inventory', protect, getPharmacyInventory);
router.get('/', protect, getMedicines);
router.get('/categories', protect, getCategories);
router.get('/:id', protect, getMedicineDetails);
router.post('/', protect, createMedicine);
router.put('/:id', protect, updateMedicine);

module.exports = router;
