const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const Manufacturer = require('../models/Manufacturer');
const Pharmacy = require('../models/Pharmacy');
const DeliveryPartner = require('../models/DeliveryPartner');
const { createNotification } = require('../utils/notification');

const getShipments = async (req, res) => {
  try {
    const { role, entityId } = req.user;
    let query = {};
    if (role === 'manufacturer') query.manufacturerId = entityId;
    else if (role === 'pharmacy') query.pharmacyId = entityId;
    else if (role === 'delivery') query.riderId = entityId;
    else if (role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    const shipments = await Shipment.find(query).sort({ createdAt: -1 }).lean();
    const enriched = [];
    for (const s of shipments) {
      const rider = await DeliveryPartner.findOne({ id: s.riderId }).select('name').lean();
      const mfr = await Manufacturer.findOne({ id: s.manufacturerId }).select('name').lean();
      const phr = await Pharmacy.findOne({ id: s.pharmacyId }).select('name').lean();
      enriched.push({
        ...s,
        riderName: rider?.name || s.riderId,
        manufacturerName: mfr?.name || s.manufacturerId,
        pharmacyName: phr?.name || s.pharmacyId
      });
    }
    res.json(enriched);
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
};

const getShipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, entityId } = req.user;
    let query = { id };
    if (role === 'manufacturer') query.manufacturerId = entityId;
    else if (role === 'pharmacy') query.pharmacyId = entityId;
    else if (role === 'delivery') query.riderId = entityId;
    else if (role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    const shipment = await Shipment.findOne(query).lean();
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    const rider = await DeliveryPartner.findOne({ id: shipment.riderId }).lean();
    const mfr = await Manufacturer.findOne({ id: shipment.manufacturerId }).lean();
    const phr = await Pharmacy.findOne({ id: shipment.pharmacyId }).lean();
    const order = await Order.findOne({ id: shipment.orderId }).lean();
    res.json({
      ...shipment,
      riderName: rider?.name || shipment.riderId,
      riderEmail: rider?.email,
      riderPhone: rider?.phone,
      riderVehicle: rider?.vehicle,
      riderZone: rider?.zone,
      manufacturerName: mfr?.name || shipment.manufacturerId,
      manufacturerEmail: mfr?.email,
      pharmacyName: phr?.name || shipment.pharmacyId,
      pharmacyEmail: phr?.email,
      orderTotal: order?.total,
      orderStatus: order?.status,
      orderItems: order?.items?.length || 0
    });
  } catch (error) {
    console.error('Get shipment error:', error);
    res.status(500).json({ error: 'Failed to fetch shipment' });
  }
};

const updateShipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role, entityId } = req.user;

    if (role !== 'delivery' && role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    const shipment = await Shipment.findOne({ id, ...(role === 'delivery' ? { riderId: entityId } : {}) });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    let finalStatus = status;
    if (role === 'delivery' && status === 'delivered') finalStatus = 'delivered_pending';

    shipment.status = finalStatus;
    await shipment.save();

    if (finalStatus === 'delivered_pending') {
      await createNotification({
        recipientRole: 'manufacturer',
        recipientId: shipment.manufacturerId,
        title: 'Delivery Approval Required',
        message: `Rider has marked shipment ${shipment.id} as delivered. Please verify and approve.`,
        type: 'approval',
        metadata: { shipmentId: shipment.id }
      });
    }

    if (finalStatus === 'in_transit') {
      await createNotification({
        recipientRole: 'pharmacy',
        recipientId: shipment.pharmacyId,
        title: 'Shipment In Transit',
        message: `Your shipment ${shipment.id} is now in transit.`,
        type: 'shipment',
        metadata: { shipmentId: shipment.id }
      });
    }

    res.json({ message: 'Shipment status updated', shipment });
  } catch (error) {
    console.error('Update shipment status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

const approveShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, entityId } = req.user;

    if (role !== 'manufacturer' && role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    const shipment = await Shipment.findOne({ id, ...(role === 'manufacturer' ? { manufacturerId: entityId } : {}) });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    if (shipment.status !== 'delivered_pending') return res.status(400).json({ error: 'Not pending approval' });

    shipment.status = 'delivered';
    await shipment.save();

    await markOrderDelivered(shipment.orderId);

    await createNotification({
      recipientRole: 'pharmacy',
      recipientId: shipment.pharmacyId,
      title: 'Delivery Confirmed',
      message: `Your shipment ${shipment.id} has been successfully delivered and confirmed.`,
      type: 'shipment',
      metadata: { shipmentId: shipment.id }
    });

    await createNotification({
      recipientRole: 'delivery',
      recipientId: shipment.riderId,
      title: 'Delivery Approved',
      message: `Your delivery for shipment ${shipment.id} has been approved.`,
      type: 'approval',
      metadata: { shipmentId: shipment.id }
    });

    res.json({ message: 'Delivery approved', shipment });
  } catch (error) {
    console.error('Approve shipment error:', error);
    res.status(500).json({ error: 'Failed to approve shipment' });
  }
};

const markOrderDelivered = async (orderId) => {
  const order = await Order.findOne({ id: orderId });
  if (order && order.status !== 'delivered') {
    order.status = 'delivered';
    order.deliveredAt = new Date();
    order.deliveryStatus = order.expectedDeliveryDate ? (order.deliveredAt <= order.expectedDeliveryDate ? 'on-time' : 'late') : 'on-time';
    await order.save();
  }
};

const getLinkedRiders = async (req, res) => {
  try {
    const { manufacturerId } = req.params;
    const mfr = await Manufacturer.findOne({ id: manufacturerId }).lean();
    if (!mfr) return res.status(404).json({ error: 'Manufacturer not found' });
    const riders = await DeliveryPartner.find({ id: { $in: mfr.linkedDeliveryPartners || [] }, status: 'active' }).select('id name email phone vehicle zone').lean();
    res.json(riders);
  } catch (error) {
    console.error('Get linked riders error:', error);
    res.status(500).json({ error: 'Failed to fetch linked riders' });
  }
};

const addTrackingEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const { role, entityId } = req.user;
    const shipment = await Shipment.findOne({ id, ...(role === 'delivery' ? { riderId: entityId } : {}) });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    shipment.trackingEvents.push({ type, timestamp: new Date() });
    await shipment.save();
    res.json({ message: 'Event logged', events: shipment.trackingEvents });
  } catch (error) {
    console.error('Log event error:', error);
    res.status(500).json({ error: 'Failed to log event' });
  }
};

module.exports = { getShipments, getShipmentById, updateShipmentStatus, approveShipment, getLinkedRiders, addTrackingEvent };
