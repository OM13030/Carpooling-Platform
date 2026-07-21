const VehicleExpense = require('../models/VehicleExpense');

class VehicleExpenseRepository {
  async create(data) {
    return VehicleExpense.create(data);
  }

  async findByEmployeeId(employeeId) {
    return VehicleExpense.find({ employeeId }).sort({ incurredOn: -1 });
  }

  async findByVehicleId(vehicleId) {
    return VehicleExpense.find({ vehicleId }).sort({ incurredOn: -1 });
  }
}

module.exports = new VehicleExpenseRepository();
