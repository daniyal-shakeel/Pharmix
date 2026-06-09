const Manufacturer = require('../models/Manufacturer');
const Pharmacy = require('../models/Pharmacy');
const DeliveryPartner = require('../models/DeliveryPartner');
const Medicine = require('../models/Medicine');

const TYPE_MAP = {
  manufacturer: { display: 'Manufacturer', slug: 'manufacturer' },
  pharmacy: { display: 'Pharmacy', slug: 'pharmacy' },
  delivery: { display: 'Delivery Partner', slug: 'delivery' }
};

const mapManufacturer = (m) => ({
  id: m.id,
  name: m.name || 'N/A',
  type: TYPE_MAP.manufacturer.display,
  slug: TYPE_MAP.manufacturer.slug,
  region: m.region || 'N/A',
  skus: 0, // Will be hydrated
  status: m.status || 'active'
});

const mapPharmacy = (p) => ({
  id: p.id,
  name: p.name || 'N/A',
  type: TYPE_MAP.pharmacy.display,
  slug: TYPE_MAP.pharmacy.slug,
  region: p.region || 'N/A',
  skus: 0, // Will be hydrated
  status: p.status || 'active'
});

const mapDelivery = (d) => ({
  id: d.id,
  name: d.name || 'N/A',
  type: TYPE_MAP.delivery.display,
  slug: TYPE_MAP.delivery.slug,
  region: d.zone || 'N/A',
  skus: d.totalDeliveries || 0,
  status: d.status || 'active'
});

const getPartners = async (req, res) => {
  try {
    const { role } = req.user;
    let partners = [];

    // Fetch all medicines to dynamically calculate SKUs
    const medicines = await Medicine.find({}, 'manufacturerId');
    const mfrSkuCounts = {};
    medicines.forEach(med => {
      if (med.manufacturerId) {
        mfrSkuCounts[med.manufacturerId] = (mfrSkuCounts[med.manufacturerId] || 0) + 1;
      }
    });

    const hydrateMfr = (m) => {
      const obj = mapManufacturer(m);
      obj.skus = mfrSkuCounts[m.id] || 0;
      return obj;
    };

    const hydratePharmacy = (p) => {
      const obj = mapPharmacy(p);
      let pSkus = 0;
      if (p.linkedManufacturers && p.linkedManufacturers.length > 0) {
        p.linkedManufacturers.forEach(mId => {
          pSkus += (mfrSkuCounts[mId] || 0);
        });
      }
      obj.skus = pSkus;
      return obj;
    };

    if (role === 'admin') {
      const [manufacturers, pharmacies, deliveryPartners] = await Promise.all([
        Manufacturer.find(), Pharmacy.find(), DeliveryPartner.find()
      ]);
      partners = [
        ...manufacturers.map(hydrateMfr),
        ...pharmacies.map(hydratePharmacy),
        ...deliveryPartners.map(mapDelivery)
      ];
    } else if (role === 'manufacturer') {
      const [pharmacies, deliveryPartners] = await Promise.all([
        Pharmacy.find(), DeliveryPartner.find()
      ]);
      partners = [
        ...pharmacies.map(hydratePharmacy),
        ...deliveryPartners.map(mapDelivery)
      ];
    } else if (role === 'pharmacy') {
      const [manufacturers, deliveryPartners] = await Promise.all([
        Manufacturer.find(), DeliveryPartner.find()
      ]);
      partners = [
        ...manufacturers.map(hydrateMfr),
        ...deliveryPartners.map(mapDelivery)
      ];
    } else if (role === 'delivery') {
      const [manufacturers, pharmacies] = await Promise.all([
        Manufacturer.find(), Pharmacy.find()
      ]);
      partners = [
        ...manufacturers.map(hydrateMfr),
        ...pharmacies.map(hydratePharmacy)
      ];
    }

    res.json(partners);
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ error: 'Server error fetching partners' });
  }
};

const getPartnerDetails = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { role } = req.user;

    const validTypes = ['manufacturer', 'pharmacy', 'delivery'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid partner type' });
    }

    if (role !== 'admin') {
      if (role === 'manufacturer' && type === 'manufacturer') {
        return res.status(403).json({ error: 'Access denied to partner details' });
      }
      if (role === 'pharmacy' && type === 'pharmacy') {
        return res.status(403).json({ error: 'Access denied to partner details' });
      }
      if (role === 'delivery' && type === 'delivery') {
        return res.status(403).json({ error: 'Access denied to partner details' });
      }
    }

    let partnerDetails = null;
    let skus = 0;

    if (type === 'manufacturer') {
      partnerDetails = await Manufacturer.findOne({ id });
      if (partnerDetails) {
        skus = await Medicine.countDocuments({ manufacturerId: id });
      }
    } else if (type === 'pharmacy') {
      partnerDetails = await Pharmacy.findOne({ id });
      if (partnerDetails) {
        if (partnerDetails.linkedManufacturers && partnerDetails.linkedManufacturers.length > 0) {
          skus = await Medicine.countDocuments({ manufacturerId: { $in: partnerDetails.linkedManufacturers } });
        }
      }
    } else if (type === 'delivery') {
      partnerDetails = await DeliveryPartner.findOne({ id });
      if (partnerDetails) {
        skus = partnerDetails.totalDeliveries || 0;
      }
    }

    if (!partnerDetails) {
      return res.status(404).json({ error: 'Partner details not found' });
    }

    const details = {
      id: partnerDetails.id,
      name: partnerDetails.name || 'N/A',
      email: partnerDetails.email || 'N/A',
      phone: partnerDetails.phone || 'N/A',
      address: partnerDetails.address || 'N/A',
      region: partnerDetails.region || partnerDetails.zone || 'N/A',
      type: TYPE_MAP[type].display,
      slug: TYPE_MAP[type].slug,
      status: partnerDetails.status || 'active',
      joinedDate: partnerDetails.joinedDate || 'N/A',
      skus: skus,
      description: partnerDetails.description || 'No description available.',
      vehicle: partnerDetails.vehicle || null,
      rating: partnerDetails.rating || null
    };

    res.json(details);
  } catch (error) {
    console.error('Error fetching partner details:', error);
    res.status(500).json({ error: 'Server error fetching partner details' });
  }
};

module.exports = { getPartners, getPartnerDetails };
