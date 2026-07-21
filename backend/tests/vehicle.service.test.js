const assert = require('assert');
const vehicleRepository = require('../repositories/vehicle.repository');
const ApiError = require('../utils/ApiError');
const vehicleService = require('../services/vehicle.service');

(async () => {
  const originalCreate = vehicleRepository.create;
  vehicleRepository.create = async () => {
    const error = new Error('duplicate key');
    error.code = 11000;
    error.name = 'MongoServerError';
    throw error;
  };

  try {
    await vehicleService.addVehicle('employee123', { registrationNumber: 'GJ1010' });
    throw new Error('Expected duplicate vehicle registration to fail');
  } catch (error) {
    assert(error instanceof ApiError, 'Expected ApiError');
    assert.strictEqual(error.statusCode, 409);
    assert.match(error.message, /registration number/i);
    console.log('vehicle service duplicate handling test passed');
  } finally {
    vehicleRepository.create = originalCreate;
  }
})();
