const express = require('express');
const { getShipments, getShipmentById, updateShipmentStatus, approveShipment, getLinkedRiders, addTrackingEvent } = require('../controllers/shipmentController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect);

router.get('/', getShipments);
router.get('/riders/:manufacturerId', getLinkedRiders);
router.get('/:id', getShipmentById);
router.patch('/:id/status', updateShipmentStatus);
router.post('/:id/approve', approveShipment);
router.post('/:id/events', addTrackingEvent);

module.exports = router;
