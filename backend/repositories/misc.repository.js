const { SavedPlace, Notification, Rating, Message, AuditLog } = require('../models/Misc');

class MiscRepository {
  // Saved Places
  async findSavedPlaces(employeeId) {
    return SavedPlace.find({ employeeId });
  }

  async createSavedPlace(data) {
    return SavedPlace.create(data);
  }

  async deleteSavedPlace(id, employeeId) {
    return SavedPlace.findOneAndDelete({ _id: id, employeeId });
  }

  // Notifications
  async findNotifications(employeeId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    return Notification.find({ employeeId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async countUnreadNotifications(employeeId) {
    return Notification.countDocuments({ employeeId, read: false });
  }

  async createNotification(data) {
    return Notification.create(data);
  }

  async markNotificationsAsRead(employeeId) {
    return Notification.updateMany({ employeeId, read: false }, { $set: { read: true } });
  }

  // Ratings
  async findRatingsForEmployee(toEmployeeId) {
    return Rating.find({ toEmployeeId }).populate('fromEmployeeId', 'name profilePhotoUrl');
  }

  async createRating(data, session = null) {
    const [rating] = await Rating.create([data], { session });
    return rating;
  }

  // Chat Messages
  async findMessages(tripId) {
    return Message.find({ tripId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name profilePhotoUrl');
  }

  async createMessage(data) {
    return Message.create(data);
  }

  // Audit Logs
  async createAuditLog(data) {
    return AuditLog.create(data);
  }
}

module.exports = new MiscRepository();
