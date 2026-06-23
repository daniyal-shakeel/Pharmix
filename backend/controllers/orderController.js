const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Manufacturer = require('../models/Manufacturer');
const Pharmacy = require('../models/Pharmacy');
const DeliveryPartner = require('../models/DeliveryPartner');
const Shipment = require('../models/Shipment');
const Medicine = require('../models/Medicine');
const PharmacyInventory = require('../models/PharmacyInventory');
const Payment = require('../models/Payment');
const { generateId } = require('../utils/cryptoId');
const { createNotification } = require('../utils/notification');
const { logDemoAction } = require('../middleware/demoMode');

const createPaymentIntent = async (req, res) => {
  try {
    const { cartId } = req.body;
    const { entityId } = req.user;

    const cart = await Cart.findOne({ _id: cartId, pharmacyId: entityId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const subtotal = cart.items.reduce((a, b) => a + (b.price * b.qty), 0);
    const mfr = await Manufacturer.findOne({ id: cart.manufacturerId }).select('shippingFee');
    const shipping = mfr ? (mfr.shippingFee || 0) : 0;
    const total = subtotal + shipping;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'pkr',
      metadata: { cartId: cart._id.toString(), pharmacyId: entityId }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      total
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
};

const createOrder = async (req, res) => {
  try {
    const { cartId, stripePaymentIntentId } = req.body;
    const { entityId } = req.user;

    const cart = await Cart.findOne({ _id: cartId, pharmacyId: entityId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const subtotal = cart.items.reduce((a, b) => a + (b.price * b.qty), 0);
    const mfr = await Manufacturer.findOne({ id: cart.manufacturerId });
    const shipping = mfr ? (mfr.shippingFee || 0) : 0;
    const total = subtotal + shipping;

    const config = mfr?.deliveryConfig || { smallOrderTime: 4320, mediumOrderTime: 7200, largeOrderTime: 10080, smallThreshold: 50, mediumThreshold: 200 };
    const totalItems = cart.items.reduce((a, b) => a + b.qty, 0);
    let minutes = config.largeOrderTime;
    if (totalItems <= config.smallThreshold) minutes = config.smallOrderTime;
    else if (totalItems <= config.mediumThreshold) minutes = config.mediumOrderTime;

    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setMinutes(expectedDeliveryDate.getMinutes() + minutes);

    const newOrder = await Order.create({
      id: generateId('ORD'),
      pharmacyId: entityId,
      manufacturerId: cart.manufacturerId,
      items: cart.items,
      subtotal,
      shippingFee: shipping,
      total,
      paymentStatus: 'paid',
      stripePaymentIntentId,
      status: 'processing',
      expectedDeliveryDate
    });

    await Payment.create({
      id: generateId('PYM'),
      stripePaymentIntentId,
      orderId: newOrder.id,
      amount: total,
      status: 'succeeded',
      manufacturerId: cart.manufacturerId,
      pharmacyId: entityId,
      paymentMethod: 'card'
    });

    await Cart.deleteOne({ _id: cartId });

    await createNotification({
      recipientRole: 'manufacturer',
      recipientId: cart.manufacturerId,
      title: 'New Order Received',
      message: `New order ${newOrder.id} has been placed.`,
      type: 'order',
      metadata: { orderId: newOrder.id }
    });

    await createNotification({
      recipientRole: 'admin',
      recipientId: 'SYSTEM_ADMIN',
      title: 'Global Order Placed',
      message: `Order ${newOrder.id} placed by ${entityId}.`,
      type: 'order',
      metadata: { orderId: newOrder.id }
    });

    res.status(201).json({ message: 'Order created successfully', order: newOrder });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

const getOrders = async (req, res) => {
  try {
    const { role, entityId } = req.user;
    let query = {};
    if (role === 'manufacturer') query.manufacturerId = entityId;
    else if (role === 'pharmacy') query.pharmacyId = entityId;
    else if (role === 'admin') {}
    else return res.status(403).json({ error: 'Access denied' });
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, entityId } = req.user;
    let query = { id };
    if (role === 'manufacturer') query.manufacturerId = entityId;
    else if (role === 'pharmacy') query.pharmacyId = entityId;
    else if (role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    const order = await Order.findOne(query).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const mfr = await Manufacturer.findOne({ id: order.manufacturerId }).select('email');
    if (mfr) order.manufacturerEmail = mfr.email;
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role, entityId } = req.user;

    if (role !== 'manufacturer' && role !== 'admin') {
      return res.status(403).json({ error: 'Only manufacturers or admins can update status' });
    }

    const order = await Order.findOne({ id, ...(role === 'manufacturer' ? { manufacturerId: entityId } : {}) });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const oldStatus = order.status;

    if (status !== 'cancelled' && status !== 'pending' && oldStatus === 'processing') {
      for (const item of order.items) {
        const medicine = await Medicine.findOne({ id: item.medicineId });
        if (!medicine) return res.status(404).json({ error: `Medicine not found: ${item.name}` });
        if (medicine.stock < item.qty) return res.status(400).json({ error: `Insufficient stock for ${item.name}.` });
      }
    }

    if (status === 'shipped') {
      const { riderId } = req.body;
      if (!riderId) return res.status(400).json({ error: 'Rider selection is required' });
      const mfr = await Manufacturer.findOne({ id: order.manufacturerId });
      if (!mfr || !mfr.linkedDeliveryPartners.includes(riderId)) return res.status(400).json({ error: 'Invalid rider' });
      const rider = await DeliveryPartner.findOne({ id: riderId, status: 'active' });
      if (!rider) return res.status(400).json({ error: 'Rider inactive' });
      const pharmacy = await Pharmacy.findOne({ id: order.pharmacyId });

      if (process.env.NODE_ENV === 'production' && !(req.user && req.user.isSuperAdmin)) {
        const count = await Shipment.countDocuments();
        if (count > 0) {
          await logDemoAction({
            ip: req.ip || req.connection.remoteAddress,
            userId: req.user ? (req.user.id || req.user.entityId) : 'guest',
            route: `${req.method} ${req.originalUrl || req.url}`,
            action: 'CREATE',
            result: 'BLOCKED (Demo Limit Reached)'
          });
          return res.status(403).json({
            success: false,
            demoMode: true,
            error: 'Only one shipment can be created in the demo environment. Please contact the developer for full access.',
            message: 'Only one shipment can be created in the demo environment. Please contact the developer for full access.'
          });
        }
      }

      const newShipment = await Shipment.create({
        id: generateId('SHP'),
        orderId: order.id,
        manufacturerId: order.manufacturerId,
        pharmacyId: order.pharmacyId,
        riderId,
        origin: mfr.address || mfr.region || 'Manufacturer Warehouse',
        destination: pharmacy?.address || pharmacy?.region || 'Pharmacy Location',
        status: 'pickup'
      });

      await createNotification({
        recipientRole: 'delivery',
        recipientId: riderId,
        title: 'New Shipment Assigned',
        message: `You have been assigned a new shipment ${newShipment.id}.`,
        type: 'shipment',
        metadata: { shipmentId: newShipment.id }
      });
    }

    if (status === 'delivered' && oldStatus !== 'delivered') {
      order.deliveredAt = new Date();
      order.deliveryStatus = order.expectedDeliveryDate ? (order.deliveredAt <= order.expectedDeliveryDate ? 'on-time' : 'late') : 'on-time';
      for (const item of order.items) {
        await Medicine.updateOne({ id: item.medicineId }, { $inc: { stock: -item.qty } });
        await require('../models/StockHistory').create({
          id: generateId('STK'),
          medicineId: item.medicineId,
          type: 'out',
          qty: item.qty,
          reason: `Order ${order.id} delivered`,
          entityId: order.pharmacyId,
          entityType: 'pharmacy',
          previousStock: 0, // Simplified
          newStock: 0
        });
      }
    }

    order.status = status;
    await order.save();

    await createNotification({
      recipientRole: 'pharmacy',
      recipientId: order.pharmacyId,
      title: 'Order Update',
      message: `Your order ${order.id} status is now ${status}.`,
      type: 'order',
      metadata: { orderId: order.id, status }
    });

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

module.exports = { createPaymentIntent, createOrder, getOrders, getOrderById, updateOrderStatus };
