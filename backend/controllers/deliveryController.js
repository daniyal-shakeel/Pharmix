const DeliveryPartner = require('../models/DeliveryPartner');

const getProfile = async (req, res) => {
  try {
    const { entityId } = req.user;
    if (!entityId) {
      return res.status(400).json({ error: 'No delivery entity linked to this user' });
    }

    const delivery = await DeliveryPartner.findOne({ id: entityId });
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery profile not found' });
    }

    res.json(delivery);
  } catch (error) {
    console.error('Error fetching delivery profile:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { entityId } = req.user;
    const { name, phone, vehicle, zone } = req.body;

    if (!entityId) {
      return res.status(400).json({ error: 'No delivery entity linked to this user' });
    }

    // Backend Validation
    if (!name || !phone || !vehicle || !zone) {
      return res.status(400).json({ error: 'Name, Phone, Vehicle, and Zone are required' });
    }

    const updatedDelivery = await DeliveryPartner.findOneAndUpdate(
      { id: entityId },
      { name, phone, vehicle, zone },
      { new: true, runValidators: true }
    );

    if (!updatedDelivery) {
      return res.status(404).json({ error: 'Delivery profile not found' });
    }

    res.json({ message: 'Profile updated successfully', profile: updatedDelivery });
  } catch (error) {
    console.error('Error updating delivery profile:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
};

module.exports = { getProfile, updateProfile };
