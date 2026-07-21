const mongoose = require('mongoose');
const tripRepository = require('../repositories/trip.repository');
const rideRepository = require('../repositories/ride.repository');
const walletRepository = require('../repositories/wallet.repository');
const transactionRepository = require('../repositories/transaction.repository');
const miscRepository = require('../repositories/misc.repository');
const organizationRepository = require('../repositories/organization.repository');
const mapService = require('./map.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const transactionHelper = require('../utils/transactionHelper');

class TripService {
  async getTrip(tripId) {
    const trip = await tripRepository.findTripById(tripId);
    if (!trip) throw new ApiError(404, 'Trip not found');
    const participants = await tripRepository.findTripParticipants(tripId);
    return { trip, participants };
  }

  async startTrip(driverId, tripId) {
    const trip = await tripRepository.findTripById(tripId);
    if (!trip) throw new ApiError(404, 'Trip not found');

    const driverIdStr = trip.driverId._id ? trip.driverId._id.toString() : trip.driverId.toString();
    if (driverIdStr !== driverId.toString()) {
      throw new ApiError(403, 'Only the driver can start the trip');
    }

    if (trip.status !== 'booked') {
      throw new ApiError(400, 'Trip is already started or cancelled');
    }

    trip.status = 'started';
    trip.startTime = new Date();
    await trip.save();

    // Update Ride status
    await rideRepository.update(trip.rideId, { status: 'started' });

    await miscRepository.createAuditLog({
      actorId: driverId,
      actorType: 'Employee',
      action: 'TRIP_STARTED',
      metadata: { tripId }
    });

    // Notify passengers
    const participants = await tripRepository.findTripParticipants(tripId);
    for (const p of participants) {
      if (p.role === 'passenger') {
        await miscRepository.createNotification({
          employeeId: p.employeeId,
          type: 'ride_started',
          title: 'Your Trip Has Started!',
          message: 'The driver has started the journey. You can track live progress now.',
          link: `/trip/${tripId}`
        });
      }
    }

    return trip;
  }

  async updateTripLocation(driverId, tripId, lat, lng) {
    const trip = await tripRepository.findTripById(tripId);
    if (!trip) throw new ApiError(404, 'Trip not found');

    const driverIdStr = trip.driverId._id ? trip.driverId._id.toString() : trip.driverId.toString();
    if (driverIdStr !== driverId.toString()) {
      throw new ApiError(403, 'Unauthorized to update location');
    }

    trip.currentLocation = {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };
    trip.locationUpdatedAt = new Date();

    let routeUpdate = null;
    try {
      // Fetch destination coordinates from Ride
      const ride = trip.rideId;
      if (ride && ride.destination && ride.destination.coordinates) {
        const destLng = ride.destination.coordinates[0];
        const destLat = ride.destination.coordinates[1];
        
        // Dynamic remaining ETA calculations via GraphHopper
        const route = await mapService.getRoute(lat, lng, destLat, destLng);
        trip.distanceKm = parseFloat((route.distance / 1000).toFixed(2));
        trip.durationMin = Math.round(route.time / 60000);
        routeUpdate = {
          distanceKm: trip.distanceKm,
          durationMin: trip.durationMin,
          points: route.points
        };
      }
    } catch (err) {
      logger.error(`Failed to update dynamic route during location broadcast: ${err.message}`);
    }

    await trip.save();
    return { trip, routeUpdate };
  }

  async completeTrip(driverId, tripId) {
    const trip = await tripRepository.findTripById(tripId);
    if (!trip) throw new ApiError(404, 'Trip not found');

    const driverIdStr = trip.driverId._id ? trip.driverId._id.toString() : trip.driverId.toString();
    if (driverIdStr !== driverId.toString()) {
      throw new ApiError(403, 'Only the driver can complete the trip');
    }

    if (!['started', 'in_progress'].includes(trip.status)) {
      throw new ApiError(400, 'Trip is not active');
    }

    trip.status = 'completed';
    trip.endTime = new Date();
    await trip.save();

    await rideRepository.update(trip.rideId, { status: 'completed' });

    await miscRepository.createAuditLog({
      actorId: driverId,
      actorType: 'Employee',
      action: 'TRIP_COMPLETED',
      metadata: { tripId }
    });

    // Try processing wallet deductions immediately
    const reconciliation = await this.settleTripPayments(tripId);
    return { trip, reconciliation };
  }

  async settleTripPayments(tripId) {
    const session = await transactionHelper.startSession();
    try {
      const trip = await mongoose.model('Trip').findById(tripId).session(session);
      if (!trip) throw new ApiError(404, 'Trip not found');

      const org = await organizationRepository.findById(trip.organizationId, session);
      const commissionPercent = org?.carpoolConfig?.rideCommissionPercent || 0;

      const participants = await mongoose.model('TripParticipant').find({ tripId }).session(session);
      const passengers = participants.filter(p => p.role === 'passenger');

      let allSucceeded = true;
      const results = [];

      for (const p of passengers) {
        if (p.paymentStatus === 'completed') {
          results.push({ employeeId: p.employeeId, status: 'already_completed' });
          continue;
        }

        const wallet = await walletRepository.findByEmployeeId(p.employeeId, session);
        if (wallet && wallet.balance >= p.fareShare) {
          // Debit passenger
          await walletRepository.updateBalance(p.employeeId, -p.fareShare, session);
          
          await transactionRepository.create({
            walletId: wallet._id,
            tripId: trip._id,
            amount: p.fareShare,
            type: 'debit',
            method: 'wallet',
            status: 'success',
            description: `Payment for commute ride trip ${trip._id}`
          }, session);

          // Credit driver
          const driverWallet = await walletRepository.findByEmployeeId(trip.driverId, session);
          if (driverWallet) {
            const netAmount = parseFloat((p.fareShare * (1 - commissionPercent / 100)).toFixed(2));
            await walletRepository.updateBalance(trip.driverId, netAmount, session);
            
            await transactionRepository.create({
              walletId: driverWallet._id,
              tripId: trip._id,
              amount: netAmount,
              type: 'credit',
              method: 'wallet',
              status: 'success',
              description: `Earnings from passenger payout for trip ${trip._id}`
            }, session);
          }

          p.paymentStatus = 'completed';
          p.paymentMethod = 'wallet';
          await p.save({ session });

          // Notification to Passenger
          await miscRepository.createNotification({
            employeeId: p.employeeId,
            type: 'payment_successful',
            title: 'Payment Successful',
            message: `₹${p.fareShare} has been paid from your wallet for trip.`,
            link: `/ride-history`
          }, { session });

          results.push({ employeeId: p.employeeId, status: 'charged' });
        } else {
          allSucceeded = false;
          results.push({ employeeId: p.employeeId, status: 'insufficient_balance' });
          
          // Send notification of low balance
          await miscRepository.createNotification({
            employeeId: p.employeeId,
            type: 'wallet_updated',
            title: 'Action Needed: Low Balance',
            message: `Insufficient funds to pay ₹${p.fareShare} for your last trip. Please recharge your wallet.`,
            link: `/wallet`
          }, { session });
        }
      }

      trip.status = allSucceeded ? 'payment_completed' : 'payment_pending';
      await trip.save({ session });

      await transactionHelper.commitTransaction(session);

      return { allSucceeded, results, finalStatus: trip.status };
    } catch (error) {
      await transactionHelper.abortTransaction(session);
      logger.error(`Settle trip payments failed: ${error.message}`);
      throw error;
    }
  }

  async payPendingFare(passengerId, tripId) {
    const participant = await tripRepository.findParticipant(tripId, passengerId);
    if (!participant || participant.role !== 'passenger') {
      throw new ApiError(404, 'Participant record not found');
    }
    if (participant.paymentStatus === 'completed') {
      return { success: true, message: 'Already paid' };
    }

    const reconciliation = await this.settleTripPayments(tripId);
    if (!reconciliation.allSucceeded) {
      const passengerResult = reconciliation.results.find(r => r.employeeId.toString() === passengerId.toString());
      if (passengerResult && passengerResult.status === 'insufficient_balance') {
        throw new ApiError(400, `Insufficient wallet balance to cover ₹${participant.fareShare}. Please recharge first.`);
      }
    }
    return reconciliation;
  }

  async getActiveTrip(employeeId) {
    return tripRepository.findActiveTripForEmployee(employeeId);
  }

  async getTripHistory(employeeId) {
    return tripRepository.findTripsByEmployee(employeeId);
  }
}

module.exports = new TripService();
