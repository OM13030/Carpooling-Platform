const Vehicle = require('../models/Vehicle');

class VehicleRepository {
  async findById(id) {
    return Vehicle.findById(id);
  }

  async findByEmployeeId(employeeId) {
    return Vehicle.find({ employeeId });
  }

  async findActiveByEmployeeId(employeeId) {
    return Vehicle.findOne({ employeeId, status: 'active' });
  }

  async create(data) {
    return Vehicle.create(data);
  }

  async update(id, data) {
    return Vehicle.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return Vehicle.findByIdAndDelete(id);
  }
}

module.exports = new VehicleRepository();
