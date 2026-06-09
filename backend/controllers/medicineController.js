const Medicine = require('../models/Medicine');
const Manufacturer = require('../models/Manufacturer');
const Pharmacy = require('../models/Pharmacy');
const PharmacyInventory = require('../models/PharmacyInventory');
const StockHistory = require('../models/StockHistory');
const { generateId } = require('../utils/cryptoId');

const getMedicines = async (req, res) => {
  try {
    const { role, entityId } = req.user;
    const { category, manufacturerId } = req.query;

    let filter = {};

    if (role === 'manufacturer') {
      filter.manufacturerId = entityId;
    } else if (role === 'pharmacy' || role === 'customer') {
      const pharmacy = await Pharmacy.findOne({ id: entityId });
      if (!pharmacy) return res.status(404).json({ error: 'Pharmacy not found' });
      filter.manufacturerId = { $in: pharmacy.linkedManufacturers || [] };
    }

    if (category) {
      filter.category = category;
    }

    if (manufacturerId && role === 'admin') {
      filter.manufacturerId = manufacturerId;
    }

    const medicines = await Medicine.find(filter).sort({ createdAt: -1 });
    res.json(medicines);
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ error: 'Server error fetching medicines' });
  }
};

const getMedicineDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, entityId } = req.user;

    const medicine = await Medicine.findOne({ id });
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    if (role === 'admin') {
      return res.json(medicine);
    }

    if (role === 'manufacturer') {
      if (medicine.manufacturerId !== entityId) {
        return res.status(403).json({ error: 'Access denied. Medicine belongs to another manufacturer.' });
      }
      return res.json(medicine);
    }

    if (role === 'pharmacy' || role === 'customer') {
      const pharmacy = await Pharmacy.findOne({ id: entityId });
      if (!pharmacy || !pharmacy.linkedManufacturers.includes(medicine.manufacturerId)) {
        return res.status(403).json({ error: 'Access denied. Manufacturer is not linked.' });
      }
      
      // Return limited details for pharmacy/customer
      return res.json({
        id: medicine.id,
        name: medicine.name,
        category: medicine.category,
        manufacturer: medicine.manufacturer,
        manufacturerId: medicine.manufacturerId,
        price: medicine.price,
        stock: medicine.stock,
        expiry: medicine.expiry,
        rx: medicine.rx,
        description: medicine.description,
        // intentionally omitting 'batch' for limited view
      });
    }

    return res.status(403).json({ error: 'Access denied' });
  } catch (error) {
    console.error('Error fetching medicine details:', error);
    res.status(500).json({ error: 'Server error fetching medicine details' });
  }
};

const createMedicine = async (req, res) => {
  try {
    const { role, entityId } = req.user;

    if (role !== 'admin' && role !== 'manufacturer') {
      return res.status(403).json({ error: 'Only Admin and Manufacturer can create medicines' });
    }

    const { name, category, batch, price, stock, expiry, rx, description, manufacturerId } = req.body;

    if (!name || !category || !batch || price === undefined || stock === undefined || !expiry) {
      return res.status(400).json({ error: 'Missing required fields: name, category, batch, price, stock, expiry' });
    }

    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number' });
    }

    if (typeof stock !== 'number' || stock < 0 || !Number.isInteger(stock)) {
      return res.status(400).json({ error: 'Stock must be a non-negative integer' });
    }

    let resolvedManufacturerId = entityId;
    let resolvedManufacturerName = '';

    if (role === 'admin') {
      if (!manufacturerId) {
        return res.status(400).json({ error: 'Admin must specify a manufacturerId' });
      }
      resolvedManufacturerId = manufacturerId;
    }

    const mfr = await Manufacturer.findOne({ id: resolvedManufacturerId });
    if (!mfr) {
      return res.status(400).json({ error: 'Linked manufacturer not found' });
    }
    resolvedManufacturerName = mfr.name;

    const medicine = await Medicine.create({
      id: generateId('MED'),
      name: name.trim(),
      category: category.trim(),
      manufacturer: resolvedManufacturerName,
      manufacturerId: resolvedManufacturerId,
      batch: batch.trim(),
      price,
      stock,
      expiry,
      rx: rx || false,
      description: (description || '').trim(),
    });

    res.status(201).json(medicine);
  } catch (error) {
    console.error('Error creating medicine:', error);
    res.status(500).json({ error: 'Server error creating medicine' });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Medicine.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Server error fetching categories' });
  }
};

const getInventoryStats = async (req, res) => {
  try {
    const { role, entityId } = req.user;
    let filter = {};

    if (role === 'manufacturer') {
      filter.manufacturerId = entityId;
    } else if (role === 'pharmacy' || role === 'customer') {
      const pharmacy = await Pharmacy.findOne({ id: entityId });
      if (!pharmacy) return res.status(404).json({ error: 'Pharmacy not found' });
      filter.manufacturerId = { $in: pharmacy.linkedManufacturers || [] };
    }

    const medicines = await Medicine.find(filter);

    let totalSkus = medicines.length;
    let totalUnits = 0;
    let lowStock = 0;
    let expiringSoon = 0;

    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);

    let recentUnits = 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    medicines.forEach(m => {
      totalUnits += m.stock;
      if (m.stock < 50) lowStock++;
      
      if (m.expiry) {
        const expDate = new Date(m.expiry);
        if (expDate <= ninetyDaysFromNow) {
          expiringSoon++;
        }
      }

      if (m.createdAt && new Date(m.createdAt) >= sevenDaysAgo) {
        recentUnits += m.stock;
      }
    });

    const recentSkus = medicines.filter(m => m.createdAt && new Date(m.createdAt) >= sevenDaysAgo).length;

    res.json({
      totalSkus,
      skusDelta: `+${recentSkus}`,
      totalUnits,
      unitsDelta: `+${recentUnits}`,
      lowStock,
      lowStockDelta: 'N/A',
      expiringSoon
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({ error: 'Server error fetching inventory stats' });
  }
};

const getPharmacyInventory = async (req, res) => {
  try {
    const { role, entityId } = req.user;
    if (role !== 'pharmacy') {
      return res.status(403).json({ error: 'Only pharmacies can access local inventory' });
    }

    const inventory = await PharmacyInventory.find({ pharmacyId: entityId }).sort({ updatedAt: -1 });
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching pharmacy inventory:', error);
    res.status(500).json({ error: 'Server error fetching local inventory' });
  }
};

const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, entityId } = req.user;

    if (role !== 'admin' && role !== 'manufacturer') {
      return res.status(403).json({ error: 'Only Admin and Manufacturer can update medicines' });
    }

    const medicine = await Medicine.findOne({ id });
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    if (role === 'manufacturer' && medicine.manufacturerId !== entityId) {
      return res.status(403).json({ error: 'Access denied. You can only edit your own medicines.' });
    }

    const oldStock = medicine.stock;
    const updates = req.body;
    const allowedUpdates = ['name', 'category', 'batch', 'price', 'stock', 'expiry', 'rx', 'description'];
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'price') {
          if (typeof updates[field] !== 'number' || updates[field] < 0) return;
          medicine[field] = updates[field];
        } else if (field === 'stock') {
          if (typeof updates[field] !== 'number' || updates[field] < 0) return;
          medicine[field] += updates[field];
        } else {
          medicine[field] = updates[field];
        }
      }
    });

    await medicine.save();

    if (updates.stock !== undefined && updates.stock !== oldStock) {
      await StockHistory.create({
        id: generateId('STK'),
        medicineId: medicine.id,
        medicineName: medicine.name,
        manufacturerId: medicine.manufacturerId,
        oldQty: oldStock,
        newQty: medicine.stock,
        type: 'manual',
        changedBy: req.user.email || req.user.id,
        role: req.user.role
      });
    }

    res.json(medicine);
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({ error: 'Server error updating medicine' });
  }
};

module.exports = { getMedicines, getMedicineDetails, createMedicine, getCategories, getInventoryStats, getPharmacyInventory, updateMedicine };
