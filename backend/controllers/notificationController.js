const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const { role, entityId } = req.user;
    const notifications = await Notification.find({
      $or: [
        { recipientId: entityId },
        { recipientRole: role }
      ]
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markAsOpened = async (req, res) => {
  try {
    const { id } = req.params;
    const { entityId, role } = req.user;

    const notification = await Notification.findOne({ id });
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.recipientId !== entityId && notification.recipientRole !== role) {
      return res.status(403).json({ error: 'Access denied' });
    }

    notification.isOpened = true;
    await notification.save();

    res.json({ message: 'Notification marked as opened', notification });
  } catch (error) {
    console.error('Error marking notification as opened:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

const markAllAsOpened = async (req, res) => {
  try {
    const { entityId, role } = req.user;
    await Notification.updateMany(
      {
        $or: [
          { recipientId: entityId },
          { recipientRole: role }
        ],
        isOpened: false
      },
      { isOpened: true }
    );
    res.json({ message: 'All notifications marked as opened' });
  } catch (error) {
    console.error('Error marking all as opened:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

module.exports = { getNotifications, markAsOpened, markAllAsOpened };
