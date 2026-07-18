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

  async getOrgVehicles(orgId, page = 1, limit = 10) {
    const Employee = require('../models/Employee');
    const Vehicle = require('../models/Vehicle');

    const employees = await Employee.find({ organizationId: orgId });
    const employeeIds = employees.map(emp => emp._id);

    const skip = (page - 1) * limit;
    const vehicles = await Vehicle.find({ employeeId: { $in: employeeIds } })
      .populate('employeeId')
      .skip(skip)
      .limit(limit);

    const total = await Vehicle.countDocuments({ employeeId: { $in: employeeIds } });
    return { vehicles, total, page, limit };
  }

  async createEmployee(orgId, data) {
    const Employee = require('../models/Employee');
    const Wallet = require('../models/Wallet');
    const bcrypt = require('bcrypt');

    const passwordHash = await bcrypt.hash(data.password || 'password123', 10);
    const employee = await Employee.create({
      organizationId: orgId,
      employeeCode: data.employeeCode || `EMP${Math.floor(1000 + Math.random() * 9000)}`,
      name: data.name,
      email: data.email,
      mobile: data.mobile || `+91 98765 ${Math.floor(10000 + Math.random() * 90000)}`,
      passwordHash,
      department: data.department || 'Engineering',
      officeLocation: data.officeLocation || 'KSV Infocity Campus',
      designation: data.designation || 'Software Engineer',
      status: 'active'
    });

    await Wallet.create({
      employeeId: employee._id,
      balance: 1000
    });

    return employee;
  }

  async createVehicle(orgId, data) {
    const Vehicle = require('../models/Vehicle');
    const Employee = require('../models/Employee');

    // Confirm driver exists in org
    const employee = await Employee.findOne({ _id: data.employeeId, organizationId: orgId });
    if (!employee) {
      throw new ApiError(404, 'Selected driver employee not found in your organization');
    }

    const vehicle = await Vehicle.create({
      employeeId: data.employeeId,
      registrationNumber: data.registrationNumber.toUpperCase(),
      model: data.model,
      manufacturer: data.manufacturer || 'Suzuki',
      fuelType: data.fuelType || 'petrol',
      seatingCapacity: parseInt(data.seatingCapacity) || 4,
      status: 'active'
    });

    return vehicle;
  }
}

module.exports = new OrganizationService();
