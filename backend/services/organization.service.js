const organizationRepository = require('../repositories/organization.repository');
const employeeRepository = require('../repositories/employee.repository');
const ApiError = require('../utils/ApiError');

class OrganizationService {
  async updateCarpoolConfig(orgId, config) {
    const org = await organizationRepository.findById(orgId);
    if (!org) {
      throw new ApiError(404, 'Organization not found');
    }
    org.carpoolConfig = { ...org.carpoolConfig, ...config };
    return org.save();
  }

  async setEmployeeStatus(orgId, employeeId, status) {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee || employee.organizationId.toString() !== orgId.toString()) {
      throw new ApiError(404, 'Employee not found in your organization');
    }
    employee.status = status;
    return employee.save();
  }

  async getOrgEmployees(orgId, page, limit) {
    const employees = await employeeRepository.findByOrg(orgId, { page, limit });
    const total = await employeeRepository.countByOrg(orgId);
    return { employees, total, page, limit };
  }
}

module.exports = new OrganizationService();
