const Notification = require('../models/Notification');
const { generateId } = require('./cryptoId');

let io;

const setIo = (socketIo) => {
  io = socketIo;
};

const createNotification = async ({ recipientRole, recipientId, title, message, type, metadata = {} }) => {
  try {
    const notification = new Notification({
      id: generateId('NTF'),
      recipientRole,
      recipientId,
      title,
      message,
      type,
      metadata
    });

    await notification.save();

    if (io) {
      // Emit to a room specific to the entity (e.g., MFR-001)
      io.to(`entity:${recipientId}`).emit('notification', notification);
      // Also emit to a role-based room (e.g., role:admin)
      io.to(`role:${recipientRole}`).emit('notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

module.exports = { setIo, createNotification };
