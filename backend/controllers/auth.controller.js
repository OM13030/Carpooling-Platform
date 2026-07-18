const authService = require('../services/auth.service');
const organizationRepository = require('../repositories/organization.repository');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const registerOrganization = asyncHandler(async (req, res, next) => {
  const { name, address, email, phone, industry, adminName, adminEmail, adminPassword } = req.body;
  if (!name || !email || !adminName || !adminEmail || !adminPassword) {
    throw new ApiError(400, 'Required organization or admin registration fields are missing');
  }

  const { org, admin } = await authService.registerOrganization(
    { name, address, email, phone, industry },
    { name: adminName, email: adminEmail, password: adminPassword }
  );

  res.status(201).json(new ApiResponse(201, { org, admin }, 'Organization and Admin registered successfully'));
});

const registerEmployee = asyncHandler(async (req, res, next) => {
  const { organizationId, employeeCode, name, email, mobile, password, department, officeLocation, designation, emergencyContact } = req.body;
  if (!organizationId || !employeeCode || !name || !email || !mobile || !password) {
    throw new ApiError(400, 'Required employee fields are missing');
  }

  const employee = await authService.registerEmployee({
    organizationId,
    employeeCode,
    name,
    email,
    mobile,
    password,
    department,
    officeLocation,
    designation,
    emergencyContact
  });

  res.status(201).json(new ApiResponse(201, employee, 'Employee registered successfully'));
});

const loginEmployee = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const { employee, accessToken, refreshToken } = await authService.loginEmployee(email, password);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json(new ApiResponse(200, { employee, accessToken }, 'Employee logged in successfully'));
});

const loginAdmin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const { admin, accessToken, refreshToken } = await authService.loginAdmin(email, password);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.status(200).json(new ApiResponse(200, { admin, accessToken }, 'Admin logged in successfully'));
});

const refreshTokens = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  const { accessToken, refreshToken: newRefreshToken } = await authService.refreshTokens(refreshToken);

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.status(200).json(new ApiResponse(200, { accessToken }, 'Tokens refreshed successfully'));
});

const logout = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const role = req.user.role;

  await authService.logout(userId, role);

  res.clearCookie('refreshToken');
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

const getOrganizations = asyncHandler(async (req, res, next) => {
  const orgs = await organizationRepository.listAllOrganizations();
  res.status(200).json(new ApiResponse(200, orgs, 'Organizations retrieved successfully'));
});

module.exports = {
  registerOrganization,
  registerEmployee,
  loginEmployee,
  loginAdmin,
  refreshTokens,
  logout,
  getOrganizations
};
