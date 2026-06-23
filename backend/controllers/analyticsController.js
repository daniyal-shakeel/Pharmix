const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const AnalyticsCache = require('../models/AnalyticsCache');
const Shipment = require('../models/Shipment');
const DeliveryPartner = require('../models/DeliveryPartner');
const DemoLog = require('../models/DemoLog');

const getManufacturerAnalytics = async (req, res) => {
  try {
    const { entityId } = req.user;
    if (!entityId) {
      return res.status(400).json({ error: 'No manufacturer entity linked' });
    }

    let cache = await AnalyticsCache.findOne({ manufacturerId: entityId });
    const now = new Date();
    const cacheDuration = 5 * 60 * 1000;
    const fiveMinutesAgo = new Date(now.getTime() - cacheDuration);

    if (cache && cache.lastUpdated > fiveMinutesAgo) {
      return res.json(cache);
    }

    // Recalculate Analytics
    const orders = await Order.find({ manufacturerId: entityId });

    // 1. Revenue & Orders Trend (Last 6 months)
    const monthlyData = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = monthNames[d.getMonth()];
      monthlyData[mName] = { month: mName, revenue: 0, orders: 0 };
    }

    orders.forEach(o => {
      const date = new Date(o.createdAt || o.date);
      const mName = monthNames[date.getMonth()];
      if (monthlyData[mName]) {
        monthlyData[mName].revenue += o.total;
        monthlyData[mName].orders += 1;
      }
    });

    const revenueData = Object.values(monthlyData);

    // 2. Category Demand
    const categoryCounts = {};
    for (const order of orders) {
      for (const item of order.items) {
        const med = await Medicine.findOne({ id: item.medicineId }).select('category');
        const cat = med ? med.category : 'Unknown';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + item.qty;
      }
    }
    const categoryData = Object.entries(categoryCounts).map(([category, demand]) => ({
      category,
      demand
    })).slice(0, 5); // Top 5

    // 3. Delivery SLA (Last 7 days)
    const deliveryCounts = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dName = dayNames[d.getDay()];
      deliveryCounts[dName] = { day: dName, onTime: 0, delayed: 0 };
    }

    orders.forEach(o => {
      if ((o.status === 'delivered' || o.status === 'shipped') && o.deliveryStatus) {
        const date = new Date(o.deliveredAt || o.updatedAt);
        const dName = dayNames[date.getDay()];
        if (deliveryCounts[dName]) {
          if (o.deliveryStatus === 'on-time') deliveryCounts[dName].onTime += 1;
          else if (o.deliveryStatus === 'late') deliveryCounts[dName].delayed += 1;
        }
      }
    });

    const deliveryData = Object.values(deliveryCounts);

    // Update Cache
    if (!cache) {
      cache = new AnalyticsCache({ manufacturerId: entityId });
    }
    cache.revenueData = revenueData;
    cache.categoryData = categoryData;
    cache.deliveryData = deliveryData;
    cache.lastUpdated = now;
    await cache.save();

    res.json(cache);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
};

const getAdminAnalytics = async (req, res) => {
  try {
    const cacheId = 'SYSTEM_ADMIN';
    let cache = await AnalyticsCache.findOne({ manufacturerId: cacheId });
    const now = new Date();
    const cacheDuration = 5 * 60 * 1000;
    const fiveMinutesAgo = new Date(now.getTime() - cacheDuration);

    if (cache && cache.lastUpdated > fiveMinutesAgo) {
      return res.json(cache);
    }

    // Recalculate Global Analytics
    const orders = await Order.find({});

    // 1. Revenue & Orders Trend (Last 6 months)
    const monthlyData = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = monthNames[d.getMonth()];
      monthlyData[mName] = { month: mName, revenue: 0, orders: 0 };
    }

    orders.forEach(o => {
      const date = new Date(o.createdAt || o.date);
      const mName = monthNames[date.getMonth()];
      if (monthlyData[mName]) {
        monthlyData[mName].revenue += o.total;
        monthlyData[mName].orders += 1;
      }
    });
    const revenueData = Object.values(monthlyData);

    // 2. Category Demand
    const categoryCounts = {};
    for (const order of orders) {
      for (const item of order.items) {
        const med = await Medicine.findOne({ id: item.medicineId }).select('category');
        const cat = med ? med.category : 'Unknown';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + item.qty;
      }
    }
    const categoryData = Object.entries(categoryCounts).map(([category, demand]) => ({
      category,
      demand
    })).sort((a, b) => b.demand - a.demand).slice(0, 5);

    // 3. Delivery SLA (Last 7 days)
    const deliveryCounts = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dName = dayNames[d.getDay()];
      deliveryCounts[dName] = { day: dName, onTime: 0, delayed: 0 };
    }

    orders.forEach(o => {
      if ((o.status === 'delivered' || o.status === 'shipped') && o.deliveryStatus) {
        const date = new Date(o.deliveredAt || o.updatedAt);
        const dName = dayNames[date.getDay()];
        if (deliveryCounts[dName]) {
          if (o.deliveryStatus === 'on-time') deliveryCounts[dName].onTime += 1;
          else if (o.deliveryStatus === 'late') deliveryCounts[dName].delayed += 1;
        }
      }
    });
    const deliveryData = Object.values(deliveryCounts);

    // Update Cache
    if (!cache) {
      cache = new AnalyticsCache({ manufacturerId: cacheId });
    }
    cache.revenueData = revenueData;
    cache.categoryData = categoryData;
    cache.deliveryData = deliveryData;
    cache.lastUpdated = now;
    await cache.save();

    res.json(cache);
  } catch (error) {
    console.error('Admin Analytics error:', error);
    res.status(500).json({ error: 'Failed to generate admin analytics' });
  }
};

const getPharmacyAnalytics = async (req, res) => {
  try {
    const { entityId } = req.user;
    if (!entityId) {
      return res.status(400).json({ error: 'No pharmacy entity linked' });
    }

    let cache = await AnalyticsCache.findOne({ manufacturerId: entityId });
    const now = new Date();
    const cacheDuration = 5 * 60 * 1000;
    const fiveMinutesAgo = new Date(now.getTime() - cacheDuration);

    if (cache && cache.lastUpdated > fiveMinutesAgo) {
      return res.json(cache);
    }

    // Recalculate Pharmacy Analytics
    const orders = await Order.find({ pharmacyId: entityId });

    // 1. Spending & Orders Trend (Last 6 months)
    const monthlyData = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = monthNames[d.getMonth()];
      monthlyData[mName] = { month: mName, revenue: 0, orders: 0 };
    }

    orders.forEach(o => {
      const date = new Date(o.createdAt || o.date);
      const mName = monthNames[date.getMonth()];
      if (monthlyData[mName]) {
        monthlyData[mName].revenue += o.total;
        monthlyData[mName].orders += 1;
      }
    });
    const revenueData = Object.values(monthlyData);

    // 2. Category Spending
    const categoryCounts = {};
    for (const order of orders) {
      for (const item of order.items) {
        const med = await Medicine.findOne({ id: item.medicineId }).select('category');
        const cat = med ? med.category : 'Unknown';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + (item.price * item.qty);
      }
    }
    const categoryData = Object.entries(categoryCounts).map(([category, demand]) => ({
      category,
      demand
    })).sort((a, b) => b.demand - a.demand).slice(0, 5);

    // 3. Delivery Performance (Last 7 days)
    const deliveryCounts = {};
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dName = dayNames[d.getDay()];
      deliveryCounts[dName] = { day: dName, onTime: 0, delayed: 0 };
    }

    orders.forEach(o => {
      if ((o.status === 'delivered' || o.status === 'shipped') && o.deliveryStatus) {
        const date = new Date(o.deliveredAt || o.updatedAt);
        const dName = dayNames[date.getDay()];
        if (deliveryCounts[dName]) {
          if (o.deliveryStatus === 'on-time') deliveryCounts[dName].onTime += 1;
          else if (o.deliveryStatus === 'late') deliveryCounts[dName].delayed += 1;
        }
      }
    });
    const deliveryData = Object.values(deliveryCounts);

    // Update Cache
    if (!cache) {
      cache = new AnalyticsCache({ manufacturerId: entityId });
    }
    cache.revenueData = revenueData;
    cache.categoryData = categoryData;
    cache.deliveryData = deliveryData;
    cache.lastUpdated = now;
    await cache.save();

    res.json(cache);
  } catch (error) {
    console.error('Pharmacy Analytics error:', error);
    res.status(500).json({ error: 'Failed to generate pharmacy analytics' });
  }
};

const getSidebarSummary = async (req, res) => {
  try {
    const { role, entityId } = req.user;
    let summary = {
      title: 'System Status',
      value: 'Operational',
      description: 'All services are running normally.'
    };

    if (role === 'manufacturer') {
      const activeShipments = await Shipment.countDocuments({ 
        manufacturerId: entityId, 
        status: { $ne: 'delivered' } 
      });
      const pendingApprovals = await Shipment.countDocuments({ 
        manufacturerId: entityId, 
        status: 'delivered_pending' 
      });
      summary = {
        title: 'Network Activity',
        value: `${activeShipments} Active Shipments`,
        description: `${pendingApprovals} awaiting your approval.`
      };
    } else if (role === 'pharmacy' || role === 'customer') {
      const inTransit = await Shipment.countDocuments({ 
        pharmacyId: entityId, 
        status: 'in_transit' 
      });
      const orders = await Order.countDocuments({ 
        pharmacyId: entityId, 
        status: 'processing' 
      });
      summary = {
        title: 'Delivery Status',
        value: `${inTransit} In Transit`,
        description: `${orders} orders being processed.`
      };
    } else if (role === 'delivery') {
      const active = await Shipment.countDocuments({ 
        riderId: entityId, 
        status: { $in: ['pickup', 'in_transit'] } 
      });
      const partner = await DeliveryPartner.findOne({ id: entityId });
      summary = {
        title: 'Current Mission',
        value: `${active} Active Deliveries`,
        description: `Total trips completed: ${partner?.totalDeliveries || 0}`
      };
    } else if (role === 'admin') {
      const activeTotal = await Shipment.countDocuments({ 
        status: { $ne: 'delivered' } 
      });
      summary = {
        title: 'Platform Overview',
        value: `${activeTotal} Shipments Live`,
        description: 'System-wide active logistics.'
      };
    }

    res.json(summary);
  } catch (error) {
    console.error('Sidebar summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
};

const getDemoLogs = async (req, res) => {
  try {
    const { page, limit, result, action, search } = req.query;
    const query = {};
    if (result) {
      query.result = result;
    }
    if (action) {
      query.action = action;
    }
    if (search) {
      query.$or = [
        { ip: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
        { route: { $regex: search, $options: 'i' } }
      ];
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;
    const logs = await DemoLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limitNum);
    const total = await DemoLog.countDocuments(query);
    res.json({
      logs,
      total,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Server error fetching logs' });
  }
};

const getDemoLogsStats = async (req, res) => {
  try {
    const total = await DemoLog.countDocuments();
    const blocked = await DemoLog.countDocuments({ result: { $regex: 'BLOCKED', $options: 'i' } });
    const allowed = await DemoLog.countDocuments({ result: 'ALLOWED' });
    const stats = await DemoLog.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          allowed: { $sum: { $cond: [{ $eq: ['$result', 'ALLOWED'] }, 1, 0] } },
          blocked: { $sum: { $cond: [{ $ne: ['$result', 'ALLOWED'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 10 }
    ]);
    const chartData = stats.map(s => ({
      date: s._id,
      allowed: s.allowed,
      blocked: s.blocked
    }));
    res.json({
      total,
      blocked,
      allowed,
      chartData
    });
  } catch (error) {
    console.error('Error fetching log stats:', error);
    res.status(500).json({ error: 'Server error fetching log stats' });
  }
};

module.exports = {
  getManufacturerAnalytics,
  getAdminAnalytics,
  getPharmacyAnalytics,
  getSidebarSummary,
  getDemoLogs,
  getDemoLogsStats
};
