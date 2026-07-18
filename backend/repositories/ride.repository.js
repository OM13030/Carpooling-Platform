const mongoose = require('mongoose');
const Ride = require('../models/Ride');

class RideRepository {
  async findById(id, session = null) {
    let query = Ride.findById(id)
      .populate('driverId', 'name email ratingAvg ratingCount profilePhotoUrl')
      .populate('vehicleId');
    if (session) {
      query = query.session(session);
    }
    return query;
  }

  async create(data) {
    return Ride.create(data);
  }

  async update(id, data) {
    return Ride.findByIdAndUpdate(id, data, { new: true });
  }

  async searchRides(organizationId, pickupLng, pickupLat, destLng, destLat, targetDate, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;

    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(pickupLng), parseFloat(pickupLat)] },
          distanceField: 'pickupDistance',
          spherical: true,
          query: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: 'scheduled',
            availableSeats: { $gt: 0 }
          }
        }
      },
      {
        $addFields: {
          destDistance: {
            $multiply: [
              {
                $sqrt: {
                  $add: [
                    { $pow: [ { $subtract: [ { $arrayElemAt: ["$destination.coordinates", 0] }, parseFloat(destLng) ] }, 2 ] },
                    { $pow: [ { $subtract: [ { $arrayElemAt: ["$destination.coordinates", 1] }, parseFloat(destLat) ] }, 2 ] }
                  ]
                }
              },
              111320
            ]
          },
          timeDifferenceMin: {
            $abs: {
              $divide: [
                { $subtract: ["$departureDate", targetDate] },
                60000
              ]
            }
          }
        }
      },
      {
        $addFields: {
          matchScore: {
            $add: [
              { $multiply: ["$pickupDistance", 0.4] },
              { $multiply: ["$destDistance", 0.4] },
              { $multiply: ["$timeDifferenceMin", 50, 0.2] }
            ]
          }
        }
      },
      {
        $sort: { matchScore: 1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'driverId',
          foreignField: '_id',
          as: 'driver'
        }
      },
      {
        $unwind: '$driver'
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicle'
        }
      },
      {
        $unwind: '$vehicle'
      },
      {
        $project: {
          organizationId: 1,
          driverId: 1,
          vehicleId: 1,
          pickupPoint: 1,
          destination: 1,
          stops: 1,
          departureDate: 1,
          departureTime: 1,
          isRecurring: 1,
          recurrenceRule: 1,
          availableSeats: 1,
          occupiedSeats: 1,
          farePerSeat: 1,
          estimatedDistanceKm: 1,
          estimatedDurationMin: 1,
          status: 1,
          pickupDistance: 1,
          destDistance: 1,
          timeDifferenceMin: 1,
          matchScore: 1,
          'driver._id': '$driver._id',
          'driver.name': 1,
          'driver.email': 1,
          'driver.ratingAvg': 1,
          'driver.ratingCount': 1,
          'driver.profilePhotoUrl': 1,
          'vehicle.model': 1,
          'vehicle.registrationNumber': 1,
          'vehicle.color': 1
        }
      }
    ];

    return Ride.aggregate(pipeline);
  }

  async findActiveRecurringTemplates() {
    return Ride.find({ isRecurring: true, 'recurrenceRule.endDate': { $gte: new Date() } });
  }

  async countAll(filter) {
    return Ride.countDocuments(filter);
  }

  async findByDriverId(driverId) {
    return Ride.find({ driverId }).sort({ departureDate: -1 });
  }
}

module.exports = new RideRepository();
