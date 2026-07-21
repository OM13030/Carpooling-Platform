const organizationService = require('../services/organization.service');
const organizationRepository = require('../repositories/organization.repository');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const getCarpoolConfig = asyncHandler(async (req, res) => {
  const orgId = req.user.organizationId;
  const org = await organizationRepository.findById(orgId);
  if (!org) {
    throw new ApiError(404, 'Organization not found');
  }
  res.status(200).json(new ApiResponse(200, org.carpoolConfig, 'Carpool configuration retrieved successfully'));
});

const updateCarpoolConfig = asyncHandler(async (req, res) => {
  const orgId = req.user.organizationId;
  const config = req.body;
  const updatedOrg = await organizationService.updateCarpoolConfig(orgId, config);
  res.status(200).json(new ApiResponse(200, updatedOrg.carpoolConfig, 'Carpool configuration updated successfully'));
});

const getEmployees = asyncHandler(async (req, res) => {
  const orgId = req.user.organizationId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const result = await organizationService.getOrgEmployees(orgId, page, limit);
  res.status(200).json(new ApiResponse(200, result, 'Employees list retrieved successfully'));
});

const toggleEmployeeStatus = asyncHandler(async (req, res) => {
  const orgId = req.user.organizationId;
  const { employeeId } = req.params;
  const { status } = req.body; // 'active' or 'disabled'
  if (!['active', 'disabled'].includes(status)) {
    throw new ApiError(400, 'Invalid status value');
  }
  const employee = await organizationService.setEmployeeStatus(orgId, employeeId, status);
  res.status(200).json(new ApiResponse(200, employee, `Employee status changed to ${status} successfully`));
});

const getVehicles = asyncHandler(async (req, res) => {
  const orgId = req.user.organizationId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const result = await organizationService.getOrgVehicles(orgId, page, limit);
  res.status(200).json(new ApiResponse(200, result, 'Vehicles list retrieved successfully'));
});

const addEmployee = asyncHandler(async (req, res) => {
  const orgId = req.user.organizationId;
  const employee = await organizationService.createEmployee(orgId, req.body);
  res.status(201).json(new ApiResponse(201, employee, 'Employee created successfully'));
});

const addVehicle = asyncHandler(async (req, res) => {
  const orgId = req.user.organizationId;
  const vehicle = await organizationService.createVehicle(orgId, req.body);
  res.status(201).json(new ApiResponse(201, vehicle, 'Vehicle registered successfully'));
});

module.exports = {
  getCarpoolConfig,
  updateCarpoolConfig,
  getEmployees,
  toggleEmployeeStatus,
  getVehicles,
  addEmployee,
  addVehicle
};
