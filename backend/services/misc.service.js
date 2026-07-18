const miscRepository = require('../repositories/misc.repository');
const employeeRepository = require('../repositories/employee.repository');
const tripRepository = require('../repositories/trip.repository');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

class MiscService {
  async getSavedPlaces(employeeId) {
    return miscRepository.findSavedPlaces(employeeId);
  }

  async createSavedPlace(employeeId, data) {
    return miscRepository.createSavedPlace({
      employeeId,
      label: data.label,
      location: data.location
    });
  }

  async deleteSavedPlace(employeeId, placeId) {
    const deleted = await miscRepository.deleteSavedPlace(placeId, employeeId);
    if (!deleted) throw new ApiError(404, 'Saved place not found or unauthorized');
    return deleted;
  }

  async getNotifications(employeeId, page, limit) {
    const notifications = await miscRepository.findNotifications(employeeId, { page, limit });
    const unreadCount = await miscRepository.countUnreadNotifications(employeeId);
    return { notifications, unreadCount };
  }

  async markNotificationsRead(employeeId) {
    return miscRepository.markNotificationsAsRead(employeeId);
  }

  async rateDriverOrPassenger(fromEmployeeId, data) {
    const { tripId, toEmployeeId, score, comment } = data;
    if (!tripId || !toEmployeeId || !score) {
      throw new ApiError(400, 'tripId, toEmployeeId, and score are required');
    }

    const trip = await tripRepository.findTripById(tripId);
    if (!trip) throw new ApiError(404, 'Trip not found');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const rating = await miscRepository.createRating({
        tripId,
        fromEmployeeId,
        toEmployeeId,
        score,
        comment
      }, session);

      await employeeRepository.addRating(toEmployeeId, score, session);

      await miscRepository.createAuditLog({
        actorId: fromEmployeeId,
        actorType: 'Employee',
        action: 'TRIP_RATED',
        metadata: { tripId, toEmployeeId, score }
      }, { session });

      await session.commitTransaction();
      session.endSession();
      return rating;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      if (error.code === 11000) {
        throw new ApiError(400, 'You have already rated this participant for this trip');
      }
      throw error;
    }
  }

  async getTripMessages(tripId, employeeId) {
    const p = await tripRepository.findParticipant(tripId, employeeId);
    if (!p) throw new ApiError(403, 'You are not a participant in this trip');
    return miscRepository.findMessages(tripId);
  }

  async createTripMessage(tripId, senderId, content) {
    const p = await tripRepository.findParticipant(tripId, senderId);
    if (!p) throw new ApiError(403, 'You are not a participant in this trip');

    return miscRepository.createMessage({
      tripId,
      senderId,
      content
    });
  }
}

module.exports = new MiscService();
