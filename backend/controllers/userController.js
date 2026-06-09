const User = require('../models/User');
const Manufacturer = require('../models/Manufacturer');
const Pharmacy = require('../models/Pharmacy');
const DeliveryPartner = require('../models/DeliveryPartner');
const { generateId } = require('../utils/cryptoId');
const { generatePassword } = require('../utils/credentials');

const createUser = async (req, res) => {
  try {
    const { email, role, name, linkedEntities } = req.body;

    // Strict Backend Validation
    if (!email || !role || !name) {
      return res.status(400).json({ error: 'Missing required fields: email, role, and name are mandatory' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const validRoles = ['admin', 'manufacturer', 'pharmacy', 'delivery'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role provided' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const userId = generateId('usr');
    const generatedPass = generatePassword(); // Generate password at backend
    const joinedDate = new Date().toISOString().split('T')[0];
    let entityId = null;

    // Create corresponding entity based on role
    if (role === 'manufacturer') {
      entityId = generateId('MFR');
      const newManufacturer = new Manufacturer({
        id: entityId,
        name,
        email,
        joinedDate,
        linkedDeliveryPartners: linkedEntities || []
      });
      await newManufacturer.save();
    } else if (role === 'pharmacy') {
      entityId = generateId('PHR');
      const newPharmacy = new Pharmacy({
        id: entityId,
        name,
        email,
        joinedDate,
        linkedManufacturers: linkedEntities || []
      });
      await newPharmacy.save();
    } else if (role === 'delivery') {
      entityId = generateId('DLV');
      const newDelivery = new DeliveryPartner({
        id: entityId,
        name,
        email,
        joinedDate,
        linkedManufacturers: linkedEntities || []
      });
      await newDelivery.save();
    }

    const newUser = new User({
      id: userId,
      email,
      password: generatedPass,
      role,
      name,
      entityId,
      linkedEntities: linkedEntities || []
    });

    await newUser.save();

    // Return the generated plain password to show it once in the UI
    res.status(201).json({ 
      message: 'User created successfully', 
      user: {
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        id: newUser.id
      },
      credentials: {
        email: newUser.email,
        password: generatedPass
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error while creating user' });
  }
};

const Medicine = require('../models/Medicine');

const getUsers = async (req, res) => {
  try {
    const rawManufacturers = await Manufacturer.find({}).lean();
    const rawPharmacies = await Pharmacy.find({}).lean();
    const deliveryPartners = await DeliveryPartner.find({}).lean();

    const medicines = await Medicine.find({}, 'manufacturerId');
    const mfrSkuCounts = {};
    medicines.forEach(med => {
      if (med.manufacturerId) {
        mfrSkuCounts[med.manufacturerId] = (mfrSkuCounts[med.manufacturerId] || 0) + 1;
      }
    });

    const manufacturers = rawManufacturers.map(m => ({
      ...m,
      totalSkus: mfrSkuCounts[m.id] || 0
    }));

    const pharmacies = rawPharmacies.map(p => {
      let pSkus = 0;
      if (p.linkedManufacturers && p.linkedManufacturers.length > 0) {
        p.linkedManufacturers.forEach(mId => {
          pSkus += (mfrSkuCounts[mId] || 0);
        });
      }
      return {
        ...p,
        totalSkus: pSkus
      };
    });

    res.json({
      manufacturers,
      pharmacies,
      deliveryPartners
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
};

const getEntitiesByRole = async (req, res) => {
  try {
    const { role } = req.params;
    let entities = [];

    switch (role) {
      case 'manufacturer':
        // Manufacturers need to link to Delivery Partners
        entities = await DeliveryPartner.find({ status: 'active' });
        break;
      case 'pharmacy':
      case 'delivery':
        // Pharmacies and Delivery Partners need to link to Manufacturers
        entities = await Manufacturer.find({ status: 'active' });
        break;
      default:
        return res.status(400).json({ error: 'Invalid role for entity fetching' });
    }

    res.json(entities);
  } catch (error) {
    console.error('Error fetching entities by role:', error);
    res.status(500).json({ error: 'Server error fetching entities' });
  }
};

const getLinkedManufacturers = async (req, res) => {
  try {
    const { role, entityId } = req.user;
    if (role === 'pharmacy' || role === 'customer') {
      const pharmacy = await Pharmacy.findOne({ id: entityId });
      if (!pharmacy) return res.status(404).json({ error: 'Pharmacy not found' });
      const mfrs = await Manufacturer.find({ id: { $in: pharmacy.linkedManufacturers || [] } }, 'id name shippingFee');
      return res.json(mfrs);
    } else if (role === 'delivery') {
      const delivery = await DeliveryPartner.findOne({ id: entityId });
      if (!delivery) return res.status(404).json({ error: 'Delivery partner not found' });
      const mfrs = await Manufacturer.find({ id: { $in: delivery.linkedManufacturers || [] } }, 'id name shippingFee');
      return res.json(mfrs);
    }
    return res.status(403).json({ error: 'Access denied' });
  } catch (error) {
    console.error('Error fetching linked manufacturers:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getLinkedDelivery = async (req, res) => {
  try {
    const { role, entityId } = req.user;
    if (role === 'manufacturer') {
      const manufacturer = await Manufacturer.findOne({ id: entityId });
      if (!manufacturer) return res.status(404).json({ error: 'Manufacturer not found' });
      const deliveries = await DeliveryPartner.find({ id: { $in: manufacturer.linkedDeliveryPartners || [] } }, 'id name');
      return res.json(deliveries);
    }
    return res.status(403).json({ error: 'Access denied' });
  } catch (error) {
    console.error('Error fetching linked delivery:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getLinkedPharmacies = async (req, res) => {
  try {
    const { role, entityId } = req.user;
    if (role === 'manufacturer') {
      const pharmacies = await Pharmacy.find({ linkedManufacturers: entityId }, 'id name');
      return res.json(pharmacies);
    }
    return res.status(403).json({ error: 'Access denied' });
  } catch (error) {
    console.error('Error fetching linked pharmacies:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findOne({ 
      $or: [{ id: userId }, { entityId: userId }]
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newPassword = generatePassword();
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password reset successfully',
      newPassword
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Server error while resetting password' });
  }
};

module.exports = { createUser, getUsers, getEntitiesByRole, getLinkedManufacturers, getLinkedDelivery, getLinkedPharmacies, resetPassword };
