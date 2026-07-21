const tripRepository = require('../repositories/trip.repository');
const mongoose = require('mongoose');

class MemoryCache {
  constructor(ttlMs = 60000) { 
    this.cache = new Map();
    this.ttl = ttlMs;
  }
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl
    });
  }
}

const statsCache = new MemoryCache(60000);

class AdminService {
  async getDashboardStats(organizationId) {
    const cacheKey = `stats_${organizationId}`;
    const cached = statsCache.get(cacheKey);
    if (cached) return cached;

    const pipeline = [
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          status: { $in: ['completed', 'payment_pending', 'payment_completed'] }
        }
      },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalTrips: { $sum: 1 },
                totalDistance: { $sum: '$distanceKm' },
                totalFuelCost: { $sum: '$fuelCost' },
                totalCarbonSaved: { $sum: '$carbonSavedKg' },
                totalFare: { $sum: '$fare' }
              }
            }
          ],
          byDriver: [
            {
              $group: {
                _id: '$driverId',
                tripsCount: { $sum: 1 },
                distanceCount: { $sum: '$distanceKm' }
              }
            },
            {
              $sort: { tripsCount: -1 }
            },
            {
              $limit: 5
            },
            {
              $lookup: {
                from: 'employees',
                localField: '_id',
                foreignField: '_id',
                as: 'driver'
              }
            },
            {
              $unwind: '$driver'
            },
            {
              $project: {
                driverName: '$driver.name',
                tripsCount: 1,
                distanceCount: 1
              }
            }
          ]
        }
      }
    ];

    const [rawStats] = await tripRepository.aggregateTrips(pipeline);

    const summary = (rawStats && rawStats.summary && rawStats.summary[0]) || {
      totalTrips: 0,
      totalDistance: 0,
      totalFuelCost: 0,
      totalCarbonSaved: 0,
      totalFare: 0
    };

    const avgCostPerKm = summary.totalDistance > 0 
      ? parseFloat((summary.totalFare / summary.totalDistance).toFixed(2))
      : 0;

    const stats = {
      totalTrips: summary.totalTrips,
      totalDistance: parseFloat((summary.totalDistance || 0).toFixed(1)),
      totalFuelCost: parseFloat((summary.totalFuelCost || 0).toFixed(1)),
      totalCarbonSaved: parseFloat((summary.totalCarbonSaved || 0).toFixed(1)),
      avgCostPerKm,
      topDrivers: (rawStats && rawStats.byDriver) || []
    };

    statsCache.set(cacheKey, stats);
    return stats;
  }
}

module.exports = new AdminService();
