const employeeRepository = require('../repositories/employee.repository');
const ApiError = require('../utils/ApiError');

class EmployeeService {
  async getProfile(employeeId) {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) throw new ApiError(404, 'Employee profile not found');
    return employee;
  }

  async updateProfile(employeeId, updateData) {
    delete updateData.email;
    delete updateData.employeeCode;
    delete updateData.organizationId;
    delete updateData.passwordHash;
    delete updateData.refreshTokenHash;
    delete updateData.status;

    const employee = await employeeRepository.update(employeeId, updateData);
    if (!employee) throw new ApiError(404, 'Employee profile not found');
    return employee;
  }
}

module.exports = new EmployeeService();
