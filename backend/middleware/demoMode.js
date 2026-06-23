const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const DemoLog = require('../models/DemoLog');

const isProductionDemo = () => {
  return process.env.NODE_ENV === 'production';
};

const isSuperAdmin = (req) => {
  return req.user && req.user.isSuperAdmin === true;
};

const logDemoAction = async ({ ip, userId, route, action, result }) => {
  try {
    await DemoLog.create({ ip, userId, route, action, result });
  } catch (err) {}

  try {
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logPath = path.join(logDir, 'demo-actions.log');

    const formatDate = (date) => {
      const pad = (num) => String(num).padStart(2, '0');
      const yyyy = date.getFullYear();
      const mm = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const min = pad(date.getMinutes());
      const ss = pad(date.getSeconds());
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    };

    const timestamp = formatDate(new Date());
    const entry = `${timestamp}\nIP: ${ip}\nUser: ${userId}\nRoute: ${route}\nAction: ${action}\nResult: ${result}\n\n`;

    fs.appendFileSync(logPath, entry, 'utf8');
  } catch (err) {}
};

const checkCreateLimit = (modelName) => {
  return async (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && !isSuperAdmin(req)) {
      try {
        let targetModel = modelName;
        if (modelName === 'User') {
          const role = req.body.role;
          if (role === 'manufacturer') targetModel = 'Manufacturer';
          else if (role === 'pharmacy') targetModel = 'Pharmacy';
          else if (role === 'delivery') targetModel = 'DeliveryPartner';
        }

        const Model = mongoose.model(targetModel);
        const count = await Model.countDocuments();
        if (count > 0) {
          await logDemoAction({
            ip: req.ip || req.connection.remoteAddress,
            userId: req.user ? (req.user.id || req.user.entityId) : 'guest',
            route: `${req.method} ${req.originalUrl || req.url}`,
            action: 'CREATE',
            result: 'BLOCKED (Demo Limit Reached)'
          });
          const displayName = targetModel === 'DeliveryPartner' ? 'delivery partner' : targetModel.toLowerCase();
          return res.status(403).json({
            success: false,
            demoMode: true,
            error: `Only one create operation is allowed for ${displayName}s in the demo environment. Please contact the developer for full access.`,
            message: `Only one create operation is allowed for ${displayName}s in the demo environment. Please contact the developer for full access.`
          });
        }
      } catch (err) {}
    }
    next();
  };
};

const blockDeleteOperations = async (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.method === 'DELETE' && !isSuperAdmin(req)) {
    await logDemoAction({
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user ? (req.user.id || req.user.entityId) : 'guest',
      route: `${req.method} ${req.originalUrl || req.url}`,
      action: 'DELETE',
      result: 'BLOCKED (Delete Disabled)'
    });
    return res.status(403).json({
      success: false,
      demoMode: true,
      error: "Delete operations are disabled in the demo environment. Please contact the developer for full access.",
      message: "Delete operations are disabled in the demo environment. Please contact the developer for full access."
    });
  }
  next();
};

const restrictUpdates = async (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !isSuperAdmin(req)) {
    const isResetPassword = req.method === 'POST' && (req.originalUrl || req.url).includes('/reset-password');
    if (req.method === 'PUT' || req.method === 'PATCH' || isResetPassword) {
      await logDemoAction({
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user ? (req.user.id || req.user.entityId) : 'guest',
        route: `${req.method} ${req.originalUrl || req.url}`,
        action: 'UPDATE',
        result: isResetPassword ? 'BLOCKED (Reset Password Disabled)' : 'BLOCKED (Update Disabled)'
      });
      const errorMsg = isResetPassword
        ? "Resetting passwords is disabled in the demo environment. Please contact the developer for full access."
        : "Editing records is disabled in the demo environment. Please contact the developer for full access.";
      return res.status(403).json({
        success: false,
        demoMode: true,
        error: errorMsg,
        message: errorMsg
      });
    }
  }
  next();
};

const checkDevicePostLimit = async (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.method === 'POST' && !isSuperAdmin(req)) {
    const path = req.originalUrl || req.url;
    const isExcluded = path.includes('/api/auth/login') ||
                       path.includes('/api/auth/logout') ||
                       path.includes('/api/auth/demo-credentials') ||
                       path.includes('/api/cart/') ||
                       path.includes('/api/orders/payment-intent') ||
                       path.includes('/api/payments/webhook');

    if (!isExcluded) {
      const deviceId = req.headers['x-device-id'] || req.ip || 'unknown';
      try {
        const UsedDevice = require('../models/UsedDevice');
        const exists = await UsedDevice.findOne({ deviceId });
        if (exists) {
          await logDemoAction({
            ip: req.ip || req.connection.remoteAddress,
            userId: req.user ? (req.user.id || req.user.entityId) : 'guest',
            route: `${req.method} ${path}`,
            action: 'CREATE',
            result: 'BLOCKED (Device limit exceeded)'
          });
          return res.status(403).json({
            success: false,
            demoMode: true,
            error: "Only one create operation is allowed per device in the demo environment. Please contact the developer for full access.",
            message: "Only one create operation is allowed per device in the demo environment. Please contact the developer for full access."
          });
        }

        res.on('finish', async () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              await UsedDevice.create({ deviceId, ip: req.ip || req.connection.remoteAddress });
              await logDemoAction({
                ip: req.ip || req.connection.remoteAddress,
                userId: req.user ? (req.user.id || req.user.entityId) : 'guest',
                route: `${req.method} ${path}`,
                action: 'CREATE',
                result: 'ALLOWED'
              });
            } catch (err) {}
          }
        });
      } catch (err) {}
    }
  }
  next();
};

module.exports = {
  isProductionDemo,
  isSuperAdmin,
  logDemoAction,
  checkCreateLimit,
  blockDeleteOperations,
  restrictUpdates,
  checkDevicePostLimit
};
