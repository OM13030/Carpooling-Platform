const RideRequest = require('../models/RideRequest');

class RideRequestRepository {
  async findById(id, session = null) {
    let query = RideRequest.findById(id)
      .populate('rideId')
      .populate('passengerId', 'name email mobile ratingAvg ratingCount profilePhotoUrl');
    if (session) {
      query = query.session(session);
    }
    return query;
  }

  async findByRideId(rideId) {
    return RideRequest.find({ rideId })
      .populate('passengerId', 'name email mobile ratingAvg ratingCount profilePhotoUrl');
  }

  async findByPassengerId(passengerId) {
    return RideRequest.find({ passengerId })
      .populate({
        path: 'rideId',
        populate: { path: 'driverId', select: 'name email profilePhotoUrl ratingAvg' }
      });
  }

  async create(data) {
    return RideRequest.create(data);
  }

  async update(id, data, session = null) {
    return RideRequest.findByIdAndUpdate(id, data, { new: true, session });
  }

  async findDuplicate(rideId, passengerId) {
    return RideRequest.findOne({ rideId, passengerId });
  }
}

module.exports = new RideRequestRepository();
