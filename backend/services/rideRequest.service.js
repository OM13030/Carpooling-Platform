const mongoose = require('mongoose');
const rideRequestRepository = require('../repositories/rideRequest.repository');
const rideRepository = require('../repositories/ride.repository');
const tripRepository = require('../repositories/trip.repository');
const miscRepository = require('../repositories/misc.repository');
const ApiError = require('../utils/ApiError');
const transactionHelper = require('../utils/transactionHelper');

class RideRequestService {
  async createRequest(passengerId, rideId, seatsRequested, pickupPoint) {
    const ride = await rideRepository.findById(rideId);
    if (!ride) throw new ApiError(404, 'Ride not found');

    const driverIdStr = ride.driverId._id ? ride.driverId._id.toString() : ride.driverId.toString();
    if (driverIdStr === passengerId.toString()) {
      throw new ApiError(400, 'Drivers cannot request seats on their own rides');
    }
    if (ride.availableSeats < seatsRequested) {
      throw new ApiError(400, `Not enough seats available. Requested: ${seatsRequested}, Available: ${ride.availableSeats}`);
    }

    const duplicate = await rideRequestRepository.findDuplicate(rideId, passengerId);
    if (duplicate) {
      throw new ApiError(400, 'You have already requested a seat on this ride');
    }

    const request = await rideRequestRepository.create({
      rideId,
      passengerId,
      seatsRequested,
      pickupPoint,
      status: 'pending'
    });

    try {
      const socketManager = require('../sockets/socketManager');
      const driverIdStr = ride.driverId._id ? ride.driverId._id.toString() : ride.driverId.toString();
      socketManager.emitToUser(driverIdStr, 'request:received', request);
    } catch (err) {
      // Ignore socket errors in request flow
    }

    return request;
  }

  async acceptRequest(driverId, requestId) {
    const session = await transactionHelper.startSession();
    try {
      const request = await rideRequestRepository.findById(requestId, session);
      if (!request || request.status !== 'pending') {
        throw new ApiError(404, 'Request not found or already processed');
      }

      const ride = await rideRepository.findById(request.rideId, session);
      const driverIdStr = ride.driverId._id ? ride.driverId._id.toString() : ride.driverId.toString();
      if (!ride || driverIdStr !== driverId.toString()) {
        throw new ApiError(403, 'Unauthorized to accept this request');
      }

      const updatedRide = await mongoose.model('Ride').findOneAndUpdate(
        { _id: ride._id, availableSeats: { $gte: request.seatsRequested }, status: 'scheduled' },
        { $inc: { availableSeats: -request.seatsRequested, occupiedSeats: request.seatsRequested } },
        { new: true, session }
      );

      if (!updatedRide) {
        throw new ApiError(400, 'Cannot accept request: Seats are no longer available');
      }

      request.status = 'accepted';
      await request.save({ session });

      let trip = await mongoose.model('Trip').findOne({ rideId: ride._id }).session(session);
      if (!trip) {
        const estimatedDistance = ride.estimatedDistanceKm || 10;
        const fuelCost = Math.round(estimatedDistance * 5); 
        const carbonSaved = Math.round(estimatedDistance * 0.12 * request.seatsRequested); 
        
        trip = await tripRepository.createTrip({
          organizationId: ride.organizationId,
          rideId: ride._id,
          driverId: driverIdStr,
          vehicleId: ride.vehicleId,
          fare: ride.farePerSeat, 
          fuelCost,
          carbonSavedKg: carbonSaved,
          status: 'booked',
          currentLocation: ride.pickupPoint
        }, session);

        await tripRepository.createTripParticipant({
          tripId: trip._id,
          employeeId: driverIdStr,
          role: 'driver',
          pickupPoint: ride.pickupPoint,
          fareShare: 0,
          paymentStatus: 'completed', 
          paymentMethod: 'cash'
        }, session);
      } else {
        const newCarbonSaved = (trip.carbonSavedKg || 0) + Math.round((ride.estimatedDistanceKm || 10) * 0.12 * request.seatsRequested);
        trip.carbonSavedKg = newCarbonSaved;
        await trip.save({ session });
      }

      const fareShare = request.seatsRequested * ride.farePerSeat;
      await tripRepository.createTripParticipant({
        tripId: trip._id,
        employeeId: request.passengerId._id,
        rideRequestId: request._id,
        role: 'passenger',
        pickupPoint: request.pickupPoint,
        fareShare,
        paymentStatus: 'pending',
        paymentMethod: 'wallet'
      }, session);

      await miscRepository.createNotification({
        employeeId: request.passengerId._id,
        type: 'ride_accepted',
        title: 'Ride Request Accepted!',
        message: `Your request for ${request.seatsRequested} seat(s) has been accepted.`
      }, { session });

      await miscRepository.createAuditLog({
        actorId: driverId,
        actorType: 'Employee',
        action: 'RIDE_REQUEST_ACCEPTED',
        metadata: { requestId, rideId: ride._id, tripId: trip._id }
      }, { session });

      await transactionHelper.commitTransaction(session);

      try {
        const socketManager = require('../sockets/socketManager');
        socketManager.emitToUser(request.passengerId._id.toString(), 'request:status_updated', {
          requestId: request._id,
          status: 'accepted',
          tripId: trip._id
        });
        socketManager.emitToOrg(ride.organizationId.toString(), 'ride:seats_updated', {
          rideId: ride._id,
          availableSeats: updatedRide.availableSeats,
          occupiedSeats: updatedRide.occupiedSeats
        });
      } catch (err) {
        // Ignore socket errors
      }

      return { request, trip };
    } catch (error) {
      await transactionHelper.abortTransaction(session);
      throw error;
    }
  }

  async rejectRequest(driverId, requestId) {
    const session = await transactionHelper.startSession();
    try {
      const request = await rideRequestRepository.findById(requestId, session);
      if (!request || request.status !== 'pending') {
        throw new ApiError(404, 'Request not found or already processed');
      }

      const ride = await rideRepository.findById(request.rideId, session);
      const driverIdStr = ride.driverId._id ? ride.driverId._id.toString() : ride.driverId.toString();
      if (!ride || driverIdStr !== driverId.toString()) {
        throw new ApiError(403, 'Unauthorized to process this request');
      }

      request.status = 'rejected';
      await request.save({ session });

      await miscRepository.createNotification({
        employeeId: request.passengerId._id,
        type: 'ride_cancelled',
        title: 'Ride Request Declined',
        message: `Your request for a ride has been declined.`
      }, { session });

      await transactionHelper.commitTransaction(session);

      try {
        const socketManager = require('../sockets/socketManager');
        socketManager.emitToUser(request.passengerId._id.toString(), 'request:status_updated', {
          requestId: request._id,
          status: 'rejected'
        });
      } catch (err) {
        // Ignore socket errors
      }

      return request;
    } catch (error) {
      await transactionHelper.abortTransaction(session);
      throw error;
    }
  }

  async getRideRequestsForRide(driverId, rideId) {
    const ride = await rideRepository.findById(rideId);
    if (!ride) throw new ApiError(404, 'Ride not found');
    const driverIdStr = ride.driverId._id ? ride.driverId._id.toString() : ride.driverId.toString();
    if (driverIdStr !== driverId.toString()) {
      throw new ApiError(403, 'Unauthorized to view requests for this ride');
    }
    return rideRequestRepository.findByRideId(rideId);
  }

  async getMySentRequests(passengerId) {
    return rideRequestRepository.findByPassengerId(passengerId);
  }
}

module.exports = new RideRequestService();
