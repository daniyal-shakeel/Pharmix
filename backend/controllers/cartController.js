const Cart = require('../models/Cart');
const Medicine = require('../models/Medicine');
const Manufacturer = require('../models/Manufacturer');

const getCarts = async (req, res) => {
  try {
    const { entityId, role } = req.user;
    if (role !== 'pharmacy') {
      return res.status(403).json({ error: 'Only pharmacies can have carts' });
    }

    const carts = await Cart.find({ pharmacyId: entityId }).lean();
    
    // Attach shipping fee per manufacturer
    for (let cart of carts) {
      const mfr = await Manufacturer.findOne({ id: cart.manufacturerId }).select('shippingFee');
      cart.shippingFee = mfr ? (mfr.shippingFee || 0) : 0;
    }

    res.json(carts);
  } catch (error) {
    console.error('Error fetching carts:', error);
    res.status(500).json({ error: 'Server error fetching carts' });
  }
};

const addToCart = async (req, res) => {
  try {
    const { entityId, role } = req.user;
    if (role !== 'pharmacy') {
      return res.status(403).json({ error: 'Only pharmacies can add to cart' });
    }

    const { medicineId, qty } = req.body;
    if (!medicineId || qty < 1) {
      return res.status(400).json({ error: 'Invalid medicine or quantity' });
    }

    const medicine = await Medicine.findOne({ id: medicineId });
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const manufacturerId = medicine.manufacturerId;

    let cart = await Cart.findOne({ pharmacyId: entityId, manufacturerId });
    if (!cart) {
      cart = new Cart({
        pharmacyId: entityId,
        manufacturerId,
        items: [],
        tax: 0
      });
    }

    const itemIndex = cart.items.findIndex(i => i.medicineId === medicineId);
    if (itemIndex > -1) {
      cart.items[itemIndex].qty += qty;
    } else {
      cart.items.push({
        medicineId: medicine.id,
        name: medicine.name,
        price: medicine.price,
        qty
      });
    }

    await cart.save();
    
    const mfr = await Manufacturer.findOne({ id: manufacturerId }).select('shippingFee');
    const cartObj = cart.toObject();
    cartObj.shippingFee = mfr ? (mfr.shippingFee || 0) : 0;

    res.json(cartObj);
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Server error adding to cart' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { entityId, role } = req.user;
    if (role !== 'pharmacy') {
      return res.status(403).json({ error: 'Only pharmacies can update cart' });
    }

    const { medicineId, qty } = req.body;
    if (!medicineId || qty < 0) {
      return res.status(400).json({ error: 'Invalid medicine or quantity' });
    }

    const medicine = await Medicine.findOne({ id: medicineId });
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

    const manufacturerId = medicine.manufacturerId;

    const cart = await Cart.findOne({ pharmacyId: entityId, manufacturerId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    if (qty === 0) {
      cart.items = cart.items.filter(i => i.medicineId !== medicineId);
    } else {
      const itemIndex = cart.items.findIndex(i => i.medicineId === medicineId);
      if (itemIndex > -1) {
        cart.items[itemIndex].qty = qty;
      } else {
        return res.status(404).json({ error: 'Item not in cart' });
      }
    }

    // If empty, we can remove the cart
    if (cart.items.length === 0) {
      await Cart.deleteOne({ _id: cart._id });
      return res.json({ message: 'Cart deleted', deleted: true, manufacturerId });
    }

    await cart.save();
    
    const mfr = await Manufacturer.findOne({ id: manufacturerId }).select('shippingFee');
    const cartObj = cart.toObject();
    cartObj.shippingFee = mfr ? (mfr.shippingFee || 0) : 0;

    res.json(cartObj);
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Server error updating cart' });
  }
};

const clearCart = async (req, res) => {
  try {
    const { entityId, role } = req.user;
    if (role !== 'pharmacy') {
      return res.status(403).json({ error: 'Only pharmacies can clear cart' });
    }

    const { manufacturerId } = req.body;
    if (manufacturerId) {
      await Cart.deleteOne({ pharmacyId: entityId, manufacturerId });
    } else {
      await Cart.deleteMany({ pharmacyId: entityId });
    }

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Server error clearing cart' });
  }
};

module.exports = {
  getCarts,
  addToCart,
  updateCartItem,
  clearCart
};
