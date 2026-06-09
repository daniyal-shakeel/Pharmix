const StockHistory = require('../models/StockHistory');

const getStockHistory = async (req, res) => {
  try {
    const { role, entityId } = req.user;
    const { medicineId, manufacturerId, type } = req.query;

    let query = {};

    if (role === 'manufacturer') {
      query.manufacturerId = entityId;
    } else if (role === 'admin') {
      if (manufacturerId) {
        query.manufacturerId = manufacturerId;
      }
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (medicineId) query.medicineId = medicineId;
    if (type) query.type = type;

    const history = await StockHistory.find(query).sort({ createdAt: -1 }).limit(100);
    res.json(history);
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({ error: 'Failed to fetch stock history' });
  }
};

module.exports = { getStockHistory };
