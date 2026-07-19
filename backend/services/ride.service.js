const mongoose = require('mongoose');
const nodeCron = require('node-cron');
const rideRepository = require('../repositories/ride.repository');
const vehicleRepository = require('../repositories/vehicle.repository');
const organizationRepository = require('../repositories/organization.repository');
const tripRepository = require('../repositories/trip.repository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class RideService {
  async publishRide(driverId, organizationId, rideData) {
    const ongoingTrip = await tripRepository.findOngoingTripForEmployee(driverId);
    if (ongoingTrip) {
      throw new ApiError(400, 'You cannot offer a ride while you have an ongoing trip.');
    }

    const activeVehicle = await vehicleRepository.findActiveByEmployeeId(driverId);
    if (!activeVehicle) {
      throw new ApiError(400, 'You must register at least one active vehicle to offer a ride');
    }

    const org = await organizationRepository.findById(organizationId);
    if (!org) {
      throw new ApiError(404, 'Organization not found');
    }

    if (rideData.estimatedDistanceKm && org.carpoolConfig && rideData.estimatedDistanceKm > org.carpoolConfig.maxRideDistanceKm) {
      throw new ApiError(400, `Ride distance exceeds the maximum limit of ${org.carpoolConfig.maxRideDistanceKm} km configured by your organization`);
    }

    const vehicleId = rideData.vehicleId || activeVehicle._id;

    const newRideData = {
      organizationId,
      driverId,
      vehicleId,
      pickupPoint: rideData.pickupPoint,
      destination: rideData.destination,
      stops: rideData.stops || [],
      departureDate: new Date(rideData.departureDate),
      departureTime: rideData.departureTime,
      isRecurring: rideData.isRecurring || false,
      recurrenceRule: rideData.recurrenceRule || undefined,
      availableSeats: rideData.availableSeats,
      occupiedSeats: 0,
      farePerSeat: rideData.farePerSeat,
      estimatedDistanceKm: rideData.estimatedDistanceKm,
      estimatedDurationMin: rideData.estimatedDurationMin,
      status: 'scheduled'
    };

    const ride = await rideRepository.create(newRideData);
    try {
      const socketManager = require('../sockets/socketManager');
      socketManager.emitToOrg(organizationId.toString(), 'ride:published', ride);
    } catch (err) {
      logger.error(`Failed to emit ride:published: ${err.message}`);
    }
    return ride;
  }

  async searchRides(organizationId, searchParams) {
    const { pickupLng, pickupLat, destLng, destLat, departureDate, page = 1, limit = 10 } = searchParams;
    if (!pickupLng || !pickupLat || !destLng || !destLat || !departureDate) {
      throw new ApiError(400, 'Search parameters (pickup, destination, date) are required');
    }

    const targetDate = new Date(departureDate);
    const rides = await rideRepository.searchRides(organizationId, pickupLng, pickupLat, destLng, destLat, targetDate, { page, limit });

    return rides.map(ride => {
      const pickupDistKm = (ride.pickupDistance / 1000).toFixed(1);
      const destDistKm = (ride.destDistance / 1000).toFixed(1);
      const timeDiffMin = Math.round(ride.timeDifferenceMin);

      let explanation = '';
      if (pickupDistKm <= 0.5 && timeDiffMin <= 10) {
        explanation = `Matched commute: Pickup is within walking distance (${pickupDistKm} km) and departs within ${timeDiffMin} mins of your window.`;
      } else {
        explanation = `Pickup point is ${pickupDistKm} km away; departs ${timeDiffMin} mins from requested time.`;
      }

      return {
        ...ride,
        explanation
      };
    });
  }

  async getMyOfferedRides(driverId) {
    return rideRepository.findByDriverId(driverId);
  }

  async getRideDetails(rideId) {
    const ride = await rideRepository.findById(rideId);
    if (!ride) throw new ApiError(404, 'Ride not found');
    return ride;
  }

  async expandRecurringRides() {
    logger.info('Running recurring rides expansion job...');
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayOfWeek = tomorrow.getDay(); // 0=Sun..6=Sat

    const templates = await rideRepository.findActiveRecurringTemplates();
    
    let createdCount = 0;
    for (const temp of templates) {
      if (!temp.recurrenceRule.daysOfWeek.includes(dayOfWeek)) continue;
      if (temp.recurrenceRule.endDate && tomorrow > temp.recurrenceRule.endDate) continue;

      const startOfDay = new Date(tomorrow);
      const endOfDay = new Date(tomorrow);
      endOfDay.setHours(23, 59, 59, 999);

      const alreadyExists = await mongoose.model('Ride').findOne({
        driverId: temp.driverId,
        departureDate: { $gte: startOfDay, $lte: endOfDay },
        departureTime: temp.departureTime,
        status: 'scheduled'
      });

      if (alreadyExists) continue;

      const newRideData = temp.toObject();
      delete newRideData._id;
      delete newRideData.createdAt;
      delete newRideData.updatedAt;
      newRideData.departureDate = tomorrow;
      newRideData.isRecurring = false;
      newRideData.recurrenceRule = undefined;
      newRideData.occupiedSeats = 0;
      newRideData.status = 'scheduled';

      await rideRepository.create(newRideData);
      createdCount++;
    }
    logger.info(`Materialized ${createdCount} recurring commute rides for tomorrow.`);
    return createdCount;
  }

  setupRecurringJob() {
    // Run daily at midnight
    nodeCron.schedule('0 0 * * *', () => {
      this.expandRecurringRides().catch(err => logger.error(`Recurring rides job failed: ${err.message}`));
    });
  }
}

module.exports = new RideService();
