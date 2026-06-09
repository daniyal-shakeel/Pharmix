const Manufacturer = require('../models/Manufacturer');

const getProfile = async (req, res) => {
  try {
    const { entityId } = req.user;
    if (!entityId) {
      return res.status(400).json({ error: 'No manufacturer entity linked to this user' });
    }

    const manufacturer = await Manufacturer.findOne({ id: entityId });
    if (!manufacturer) {
      return res.status(404).json({ error: 'Manufacturer profile not found' });
    }

    res.json(manufacturer);
  } catch (error) {
    console.error('Error fetching manufacturer profile:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { entityId } = req.user;
    const { name, region, phone, address, description, shippingFee, deliveryConfig } = req.body;

    if (!entityId) {
      return res.status(400).json({ error: 'No manufacturer entity linked to this user' });
    }

    // Backend Validation
    if (!name || !region || !phone || !address) {
      return res.status(400).json({ error: 'Name, Region, Phone, and Address are required' });
    }

    const updatedManufacturer = await Manufacturer.findOneAndUpdate(
      { id: entityId },
      { name, region, phone, address, description, shippingFee, deliveryConfig },
      { new: true, runValidators: true }
    );

    if (!updatedManufacturer) {
      return res.status(404).json({ error: 'Manufacturer profile not found' });
    }

    res.json({ message: 'Profile updated successfully', profile: updatedManufacturer });
  } catch (error) {
    console.error('Error updating manufacturer profile:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
};

module.exports = { getProfile, updateProfile };
