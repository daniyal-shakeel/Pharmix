const Pharmacy = require('../models/Pharmacy');

const getProfile = async (req, res) => {
  try {
    const { entityId } = req.user;
    if (!entityId) {
      return res.status(400).json({ error: 'No pharmacy entity linked to this user' });
    }

    const pharmacy = await Pharmacy.findOne({ id: entityId });
    if (!pharmacy) {
      return res.status(404).json({ error: 'Pharmacy profile not found' });
    }

    res.json(pharmacy);
  } catch (error) {
    console.error('Error fetching pharmacy profile:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { entityId } = req.user;
    const { name, region, phone, address, description } = req.body;

    if (!entityId) {
      return res.status(400).json({ error: 'No pharmacy entity linked to this user' });
    }

    // Backend Validation
    if (!name || !region || !phone || !address) {
      return res.status(400).json({ error: 'Store Name, Region, Phone, and Address are required' });
    }

    const updatedPharmacy = await Pharmacy.findOneAndUpdate(
      { id: entityId },
      { name, region, phone, address, description },
      { new: true, runValidators: true }
    );

    if (!updatedPharmacy) {
      return res.status(404).json({ error: 'Pharmacy profile not found' });
    }

    res.json({ message: 'Profile updated successfully', profile: updatedPharmacy });
  } catch (error) {
    console.error('Error updating pharmacy profile:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
};

module.exports = { getProfile, updateProfile };
