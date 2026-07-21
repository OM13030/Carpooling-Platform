const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Ride = require('../models/Ride');
const Vehicle = require('../models/Vehicle');
const VehicleExpense = require('../models/VehicleExpense');

const cache = new Map();

// Helper to clean old cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of cache.entries()) {
    if (now - val.timestamp > 60000) {
      cache.delete(key);
    }
  }
}, 30000);

class ReportsService {
  async getEmployeeSummary(employeeId, from, to, vehicleId) {
    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const toDate = to ? new Date(to) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);

    const cacheKey = `${employeeId}_${fromDate.getTime()}_${toDate.getTime()}_${vehicleId || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 60000)) {
      return cached.data;
    }

    // 1. Get employee's vehicles
    const vehicles = await Vehicle.find({ employeeId });
    const vehicleIds = vehicles.map(v => v._id);
    const vehicleMap = {};
    vehicles.forEach(v => {
      vehicleMap[v._id.toString()] = `${v.manufacturer || ''} ${v.model} (${v.registrationNumber})`;
    });

    // If specific vehicleId filter is active, make sure user owns it
    let targetVehicleIds = vehicleIds;
    if (vehicleId) {
      if (!vehicleIds.some(id => id.toString() === vehicleId.toString())) {
        throw new Error('Unauthorized: You do not own this vehicle');
      }
      targetVehicleIds = [new mongoose.Types.ObjectId(vehicleId)];
    }

    // 2. Fetch completed trips & published rides in range
    const tripFilter = {
      driverId: new mongoose.Types.ObjectId(employeeId),
      status: { $in: ['completed', 'payment_completed'] },
      createdAt: { $gte: fromDate, $lte: toDate },
      vehicleId: { $in: targetVehicleIds }
    };

    const rideFilter = {
      driverId: new mongoose.Types.ObjectId(employeeId),
      departureDate: { $gte: fromDate, $lte: toDate },
      vehicleId: { $in: targetVehicleIds }
    };

    const expenseFilter = {
      employeeId: new mongoose.Types.ObjectId(employeeId),
      incurredOn: { $gte: fromDate, $lte: toDate },
      vehicleId: { $in: targetVehicleIds }
    };

    // Run basic queries
    const completedTrips = await Trip.find(tripFilter);
    const publishedRidesCount = await Ride.countDocuments(rideFilter);
    const vehicleExpenses = await VehicleExpense.find(expenseFilter);

    // 3. Compute KPI: Total Fuel Cost
    const totalFuelCost = completedTrips.reduce((sum, t) => sum + (t.fuelCost || 0), 0);

    // 4. Compute KPI: Fleet ROI
    const totalFare = completedTrips.reduce((sum, t) => sum + (t.fare || 0), 0);
    const totalExpenses = vehicleExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalCosts = totalFuelCost + totalExpenses;
    const fleetROI = totalCosts > 0 ? ((totalFare - totalCosts) / totalCosts) * 100 : 0;

    // 5. Compute KPI: Utilization Rate
    const completedTripsCount = completedTrips.length;
    const utilizationRate = publishedRidesCount > 0 ? (completedTripsCount / publishedRidesCount) * 100 : 0;

    // 6. Fuel Efficiency Trend (Line chart)
    const dateDiffDays = (toDate - fromDate) / (1000 * 60 * 60 * 24);
    const trendGroupBy = dateDiffDays <= 31 ? 'week' : 'month';

    // Fetch fuel price for employee's organization
    const employee = await mongoose.model('Employee').findById(employeeId).populate('organizationId');
    const fuelPrice = employee?.organizationId?.carpoolConfig?.fuelPrice || 96.50;

    const trendBuckets = {};
    completedTrips.forEach(t => {
      const date = t.createdAt;
      let bucketKey = '';
      if (trendGroupBy === 'week') {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(d.setDate(diff));
        bucketKey = `W/C ${startOfWeek.getDate()} ${startOfWeek.toLocaleString('default', { month: 'short' })}`;
      } else {
        bucketKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      }

      if (!trendBuckets[bucketKey]) {
        trendBuckets[bucketKey] = { sumEfficiency: 0, count: 0 };
      }

      const fuel = t.fuelCost || 0;
      const liters = fuel / fuelPrice;
      const distance = t.estimatedDistanceKm || t.distanceKm || 0;
      const efficiency = liters > 0 ? distance / liters : 0;

      if (efficiency > 0) {
        trendBuckets[bucketKey].sumEfficiency += efficiency;
        trendBuckets[bucketKey].count += 1;
      }
    });

    const fuelEfficiencyTrend = Object.entries(trendBuckets).map(([period, data]) => ({
      period,
      efficiency: data.count > 0 ? parseFloat((data.sumEfficiency / data.count).toFixed(2)) : 0
    }));

    // 7. Top 5 Costliest Vehicles
    const vehicleCostMap = {};
    targetVehicleIds.forEach(vid => {
      const vidStr = vid.toString();
      vehicleCostMap[vidStr] = {
        name: vehicleMap[vidStr] || 'Unknown Vehicle',
        fuelCost: 0,
        otherCost: 0
      };
    });

    completedTrips.forEach(t => {
      const vidStr = t.vehicleId.toString();
      if (vehicleCostMap[vidStr]) {
        vehicleCostMap[vidStr].fuelCost += (t.fuelCost || 0);
      }
    });

    vehicleExpenses.forEach(e => {
      const vidStr = e.vehicleId.toString();
      if (vehicleCostMap[vidStr]) {
        vehicleCostMap[vidStr].otherCost += e.amount;
      }
    });

    const topCostliestVehicles = Object.values(vehicleCostMap)
      .map(item => ({
        name: item.name,
        cost: item.fuelCost + item.otherCost
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    // 8. Weekly Profit & Monthly Financial Summary
    const financialAggregation = async (groupByMode) => {
      const groupFormat = groupByMode === 'week' ? '%G-W%V' : '%Y-%m';
      
      const unionPipeline = [
        {
          $match: {
            driverId: new mongoose.Types.ObjectId(employeeId),
            status: { $in: ['completed', 'payment_completed'] },
            createdAt: { $gte: fromDate, $lte: toDate },
            vehicleId: { $in: targetVehicleIds }
          }
        },
        {
          $project: {
            type: { $literal: 'trip' },
            fare: 1,
            fuelCost: { $ifNull: ['$fuelCost', 0] },
            amount: { $literal: 0 },
            expenseType: { $literal: null },
            date: '$createdAt'
          }
        },
        {
          $unionWith: {
            coll: 'vehicleexpenses',
            pipeline: [
              {
                $match: {
                  employeeId: new mongoose.Types.ObjectId(employeeId),
                  incurredOn: { $gte: fromDate, $lte: toDate },
                  vehicleId: { $in: targetVehicleIds }
                }
              },
              {
                $project: {
                  type: { $literal: 'expense' },
                  fare: { $literal: 0 },
                  fuelCost: { $literal: 0 },
                  amount: 1,
                  expenseType: '$type',
                  date: '$incurredOn'
                }
              }
            ]
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: '$date' } },
            revenue: { $sum: '$fare' },
            fuelCost: { $sum: '$fuelCost' },
            maintenance: {
              $sum: {
                $cond: [{ $eq: ['$expenseType', 'maintenance'] }, '$amount', 0]
              }
            },
            otherExpense: {
              $sum: {
                $cond: [{ $ne: ['$expenseType', 'maintenance'] }, '$amount', 0]
              }
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ];

      return Trip.aggregate(unionPipeline);
    };

    const rawWeekly = await financialAggregation('week');
    const rawMonthly = await financialAggregation('month');

    // Sort rawWeekly chronologically
    rawWeekly.sort((a, b) => a._id.localeCompare(b._id));
    const weeklyProfit = rawWeekly.map((w, idx) => ({
      week: `Week ${idx + 1}`,
      profit: w.revenue - w.fuelCost - (w.maintenance + w.otherExpense)
    }));

    // Format monthly financials
    const monthlyFinancials = rawMonthly.map(m => {
      const [year, monthNum] = m._id.split('-');
      const dateObj = new Date(year, parseInt(monthNum) - 1, 1);
      const label = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
      return {
        month: label,
        revenue: m.revenue,
        fuelCost: m.fuelCost,
        maintenance: m.maintenance,
        netProfit: m.revenue - m.fuelCost - m.maintenance
      };
    });

    // 9. Vehicle Usage (pie chart)
    const usageMap = {};
    completedTrips.forEach(t => {
      const vidStr = t.vehicleId.toString();
      if (!usageMap[vidStr]) {
        usageMap[vidStr] = {
          name: vehicleMap[vidStr] || 'Unknown Vehicle',
          count: 0
        };
      }
      usageMap[vidStr].count += 1;
    });
    const vehicleUsage = Object.values(usageMap);

    const result = {
      kpis: {
        totalFuelCost,
        fleetROI: parseFloat(fleetROI.toFixed(1)),
        utilizationRate: parseFloat(utilizationRate.toFixed(1))
      },
      fuelEfficiencyTrend,
      topCostliestVehicles,
      weeklyProfit,
      vehicleUsage,
      monthlyFinancials
    };

    cache.set(cacheKey, {
      timestamp: Date.now(),
      data: result
    });

    return result;
  }
}

module.exports = new ReportsService();
