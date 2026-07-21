const vehicleExpenseRepository = require('../repositories/vehicleExpense.repository');
const vehicleRepository = require('../repositories/vehicle.repository');
const ApiError = require('../utils/ApiError');

class VehicleExpenseService {
  async addExpense(employeeId, expenseData) {
    const { vehicleId } = expenseData;

    // Verify employee owns the vehicle
    const vehicle = await vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found');
    }

    if (vehicle.employeeId.toString() !== employeeId.toString()) {
      throw new ApiError(403, 'Unauthorized: You do not own this vehicle');
    }

    const data = {
      ...expenseData,
      employeeId
    };

    return vehicleExpenseRepository.create(data);
  }
}

module.exports = new VehicleExpenseService();
