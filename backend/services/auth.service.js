const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const employeeRepository = require('../repositories/employee.repository');
const organizationRepository = require('../repositories/organization.repository');
const walletRepository = require('../repositories/wallet.repository');
const miscRepository = require('../repositories/misc.repository');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokens');
const ApiError = require('../utils/ApiError');
const transactionHelper = require('../utils/transactionHelper');

class AuthService {
  async registerOrganization(orgData, adminData) {
    const session = await transactionHelper.startSession();
    try {
      // 1. Create Organization
      const org = await organizationRepository.create(orgData, { session: session || undefined });
      
      // 2. Hash Password & Create Admin
      const passwordHash = await bcrypt.hash(adminData.password, 10);
      const admin = await organizationRepository.createAdmin({
        organizationId: org._id,
        name: adminData.name,
        email: adminData.email.toLowerCase(),
        passwordHash,
      }, { session: session || undefined });

      await miscRepository.createAuditLog({
        actorId: admin._id,
        actorType: 'Admin',
        action: 'ORG_REGISTERED',
        metadata: { organizationId: org._id }
      }, { session: session || undefined });

      await transactionHelper.commitTransaction(session);

      return { org, admin };
    } catch (error) {
      await transactionHelper.abortTransaction(session);
      throw error;
    }
  }

  async registerEmployee(data) {
    const existingEmail = await employeeRepository.findByEmail(data.email.toLowerCase());
    if (existingEmail) {
      throw new ApiError(400, 'Email is already registered');
    }

    const existingCode = await employeeRepository.findByCode(data.organizationId, data.employeeCode);
    if (existingCode) {
      throw new ApiError(400, 'Employee code is already registered in this organization');
    }

    const session = await transactionHelper.startSession();

    try {
      const passwordHash = await bcrypt.hash(data.password, 10);
      
      const [employee] = await mongoose.model('Employee').create([{
        organizationId: data.organizationId,
        employeeCode: data.employeeCode,
        name: data.name,
        email: data.email.toLowerCase(),
        mobile: data.mobile,
        passwordHash,
        department: data.department,
        officeLocation: data.officeLocation,
        designation: data.designation,
        emergencyContact: data.emergencyContact,
        status: 'active'
      }], { session: session || undefined });

      await walletRepository.create({
        employeeId: employee._id,
        balance: 0
      }, { session: session || undefined });

      await miscRepository.createAuditLog({
        actorId: employee._id,
        actorType: 'Employee',
        action: 'EMPLOYEE_REGISTERED',
        metadata: { organizationId: data.organizationId }
      }, { session: session || undefined });

      await transactionHelper.commitTransaction(session);

      return employee;
    } catch (error) {
      await transactionHelper.abortTransaction(session);
      throw error;
    }
  }

  async loginEmployee(email, password) {
    const employee = await employeeRepository.findByEmail(email.toLowerCase());
    if (!employee || employee.status === 'disabled') {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, employee.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const payload = { _id: employee._id, role: 'employee', organizationId: employee.organizationId };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await employeeRepository.update(employee._id, { refreshTokenHash });

    return { employee, accessToken, refreshToken };
  }

  async loginAdmin(email, password) {
    const admin = await organizationRepository.findAdminByEmail(email.toLowerCase());
    if (!admin || admin.status === 'disabled') {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const payload = { _id: admin._id, role: 'admin', organizationId: admin.organizationId };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await organizationRepository.updateAdmin(admin._id, { refreshTokenHash });

    return { admin, accessToken, refreshToken };
  }

  async refreshTokens(refreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    let user;
    if (decoded.role === 'employee') {
      user = await employeeRepository.findById(decoded._id);
    } else {
      user = await organizationRepository.findAdminById(decoded._id);
    }

    if (!user || user.status === 'disabled') {
      throw new ApiError(401, 'User account is disabled or does not exist');
    }

    let fullUser;
    if (decoded.role === 'employee') {
      fullUser = await mongoose.model('Employee').findById(decoded._id).select('+refreshTokenHash');
    } else {
      fullUser = await mongoose.model('Admin').findById(decoded._id).select('+refreshTokenHash');
    }

    if (!fullUser.refreshTokenHash) {
      throw new ApiError(401, 'Session expired. Please login again.');
    }

    const isMatch = await bcrypt.compare(refreshToken, fullUser.refreshTokenHash);
    if (!isMatch) {
      throw new ApiError(401, 'Session hijacked or invalid refresh token');
    }

    const payload = { _id: user._id, role: decoded.role, organizationId: user.organizationId };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    fullUser.refreshTokenHash = newRefreshTokenHash;
    await fullUser.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId, role) {
    if (role === 'employee') {
      await employeeRepository.update(userId, { refreshTokenHash: null });
    } else {
      await organizationRepository.updateAdmin(userId, { refreshTokenHash: null });
    }
  }
}

module.exports = new AuthService();
