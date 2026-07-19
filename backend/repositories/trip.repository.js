const Trip = require('../models/Trip');
const TripParticipant = require('../models/TripParticipant');

class TripRepository {
  async findTripById(id) {
    return Trip.findById(id)
      .populate('driverId', 'name email mobile profilePhotoUrl ratingAvg')
      .populate('vehicleId')
      .populate('rideId');
  }

  async findTripParticipants(tripId) {
    return TripParticipant.find({ tripId })
      .populate('employeeId', 'name email mobile profilePhotoUrl ratingAvg');
  }

  async findParticipant(tripId, employeeId) {
    return TripParticipant.findOne({ tripId, employeeId });
  }

  async createTrip(data, session = null) {
    const [trip] = await Trip.create([data], { session });
    return trip;
  }

  async createTripParticipant(data, session = null) {
    const [participant] = await TripParticipant.create([data], { session });
    return participant;
  }

  async updateTrip(id, data, session = null) {
    return Trip.findByIdAndUpdate(id, data, { new: true, session });
  }

  async updateTripParticipant(tripId, employeeId, data, session = null) {
    return TripParticipant.findOneAndUpdate({ tripId, employeeId }, data, { new: true, session });
  }

  async findTripsByEmployee(employeeId) {
    const participation = await TripParticipant.find({ employeeId });
    const tripIds = participation.map(p => p.tripId);
    return Trip.find({ _id: { $in: tripIds } })
      .populate('driverId', 'name email profilePhotoUrl')
      .populate('vehicleId')
      .sort({ createdAt: -1 });
  }

  async findActiveTripForEmployee(employeeId) {
    const participation = await TripParticipant.find({ employeeId });
    const tripIds = participation.map(p => p.tripId);
    return Trip.findOne({
      _id: { $in: tripIds },
      status: { $in: ['booked', 'started', 'in_progress', 'payment_pending'] }
    })
      .populate('driverId', 'name email mobile profilePhotoUrl')
      .populate('vehicleId');
  }

  async findOngoingTripForEmployee(employeeId) {
    const participation = await TripParticipant.find({ employeeId });
    const tripIds = participation.map(p => p.tripId);
    return Trip.findOne({
      _id: { $in: tripIds },
      status: { $in: ['started', 'in_progress'] }
    });
  }

  async countTrips(filter) {
    return Trip.countDocuments(filter);
  }

  async aggregateTrips(pipeline) {
    return Trip.aggregate(pipeline);
  }
}

module.exports = new TripRepository();
