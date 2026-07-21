const vehicleRepository = require('../repositories/vehicle.repository');
const ApiError = require('../utils/ApiError');

class VehicleService {
  async addVehicle(employeeId, vehicleData) {
    const data = { ...vehicleData, employeeId };

    try {
      return await vehicleRepository.create(data);
    } catch (error) {
      if (error?.code === 11000 || error?.name === 'MongoServerError') {
        throw new ApiError(409, 'A vehicle with this registration number already exists');
      }
      throw error;
    }
  }

  async getEmployeeVehicles(employeeId) {
    return vehicleRepository.findByEmployeeId(employeeId);
  }

  async updateVehicle(employeeId, vehicleId, updateData) {
    const vehicle = await vehicleRepository.findById(vehicleId);
    if (!vehicle || vehicle.employeeId.toString() !== employeeId.toString()) {
      throw new ApiError(404, 'Vehicle not found or unauthorized');
    }
    return vehicleRepository.update(vehicleId, updateData);
  }

  async deleteVehicle(employeeId, vehicleId) {
    const vehicle = await vehicleRepository.findById(vehicleId);
    if (!vehicle || vehicle.employeeId.toString() !== employeeId.toString()) {
      throw new ApiError(404, 'Vehicle not found or unauthorized');
    }
    return vehicleRepository.delete(vehicleId);
  }
}

module.exports = new VehicleService();
