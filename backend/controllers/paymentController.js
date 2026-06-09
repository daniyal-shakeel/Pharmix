const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { generateId } = require('../utils/cryptoId');

const getPayments = async (req, res) => {
  try {
    const { role, entityId } = req.user;
    let query = {};

    if (role === 'manufacturer') {
      query.manufacturerId = entityId;
    } else if (role === 'pharmacy') {
      query.pharmacyId = entityId;
    } else if (role === 'admin') {
      // Admin sees all
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    const payments = await Payment.find(query).sort({ createdAt: -1 }).lean();
    
    // Enrich with stakeholder and order info
    const enrichedPayments = await Promise.all(payments.map(async (p) => {
      const [mfr, phx, order] = await Promise.all([
        require('../models/Manufacturer').findOne({ id: p.manufacturerId }).select('name email'),
        require('../models/Pharmacy').findOne({ id: p.pharmacyId }).select('name email'),
        Order.findOne({ id: p.orderId }).lean()
      ]);
      return { ...p, manufacturer: mfr, pharmacy: phx, order };
    }));

    res.json(enrichedPayments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, entityId } = req.user;
    
    let query = { id };
    if (role === 'manufacturer') {
      query.manufacturerId = entityId;
    } else if (role === 'pharmacy') {
      query.pharmacyId = entityId;
    } else if (role === 'admin') {
      // Admin sees all
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    const payment = await Payment.findOne(query).lean();
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    // Attach related info
    const [mfr, phx, order] = await Promise.all([
      require('../models/Manufacturer').findOne({ id: payment.manufacturerId }).select('name email phone region address'),
      require('../models/Pharmacy').findOne({ id: payment.pharmacyId }).select('name email phone region address'),
      Order.findOne({ id: payment.orderId }).lean()
    ]);

    payment.manufacturer = mfr;
    payment.pharmacy = phx;
    payment.order = order;

    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
};

// Webhook handler (simulated or real)
const handleStripeWebhook = async (req, res) => {
  // In a real production app, we would verify the signature here.
  // For this implementation, we will trust the event for demonstration.
  const event = req.body;

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { cartId, pharmacyId } = paymentIntent.metadata;

    // Find order associated with this payment intent
    const order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id });
    
    if (order) {
      // Create payment record
      await Payment.create({
        id: generateId('PYM'),
        stripePaymentIntentId: paymentIntent.id,
        orderId: order.id,
        amount: paymentIntent.amount / 100,
        status: 'succeeded',
        manufacturerId: order.manufacturerId,
        pharmacyId: order.pharmacyId,
        paymentMethod: paymentIntent.payment_method_types[0]
      });
    }
  }

  res.json({ received: true });
};

module.exports = { getPayments, getPaymentById, handleStripeWebhook };
