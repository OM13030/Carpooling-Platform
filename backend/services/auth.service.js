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

  async loginGoogle(idToken) {
    let payload = null;
    try {
      if (idToken.startsWith('mock_')) {
        const namePart = idToken.split('_')[1];
        payload = {
          email: `${namePart.toLowerCase()}@odooksv.com`,
          name: namePart,
          sub: `google_${namePart}`
        };
      } else {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
          payload = JSON.parse(jsonPayload);
        }
      }
    } catch (err) {
      throw new ApiError(400, 'Invalid Firebase Token');
    }

    if (!payload || !payload.email) {
      throw new ApiError(400, 'Token does not contain valid email claim');
    }

    const email = payload.email.toLowerCase();
    let employee = await employeeRepository.findByEmail(email);
    let onboardingRequired = false;

    if (!employee) {
      const orgs = await organizationRepository.listAllOrganizations();
      const orgId = orgs[0]?._id;
      if (!orgId) throw new ApiError(500, 'Organization must exist to proceed');

      employee = await mongoose.model('Employee').create({
        organizationId: orgId,
        employeeCode: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
        name: payload.name || 'Google User',
        email,
        authProvider: 'google',
        googleId: payload.sub,
        isEmailVerified: true,
        status: 'active'
      });

      await walletRepository.create({
        employeeId: employee._id,
        balance: 1000
      });

      onboardingRequired = true;
    }

    if (employee.status === 'disabled') {
      throw new ApiError(401, 'This account is disabled');
    }

    const tokenPayload = { _id: employee._id, role: 'employee', organizationId: employee.organizationId };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await employeeRepository.update(employee._id, { refreshTokenHash });

    return { employee, accessToken, refreshToken, onboardingRequired };
  }

  async verifyEmail(token) {
    const employee = await mongoose.model('Employee').findOne({
      emailVerificationTokenHash: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!employee) {
      throw new ApiError(400, 'Verification token is invalid or has expired');
    }

    employee.isEmailVerified = true;
    employee.emailVerificationTokenHash = undefined;
    employee.emailVerificationExpires = undefined;
    await employee.save();
  }

  async resendVerification(email) {
    const employee = await employeeRepository.findByEmail(email.toLowerCase());
    if (!employee) throw new ApiError(404, 'Employee not found');
    if (employee.isEmailVerified) return;

    const token = Math.random().toString(36).substr(2, 9);
    employee.emailVerificationTokenHash = token;
    employee.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await employee.save();

    console.log(`[Email Mock Service] Verification link: http://localhost:5173/verify-email/${token}`);
  }

  async forgotPassword(email) {
    const employee = await employeeRepository.findByEmail(email.toLowerCase());
    if (!employee) throw new ApiError(404, 'Employee not found');

    const token = Math.random().toString(36).substr(2, 9);
    employee.passwordResetTokenHash = token;
    employee.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    await employee.save();

    console.log(`[Email Mock Service] Password reset link: http://localhost:5173/reset-password/${token}`);
  }

  async resetPassword(token, password) {
    const employee = await mongoose.model('Employee').findOne({
      passwordResetTokenHash: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!employee) {
      throw new ApiError(400, 'Password reset token is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    employee.passwordHash = passwordHash;
    employee.passwordResetTokenHash = undefined;
    employee.passwordResetExpires = undefined;
    employee.refreshTokenHash = undefined; // Invalidate current session logs
    await employee.save();
  }

  async getMe(userId, role) {
    if (role === 'admin') {
      return organizationRepository.findAdminById(userId);
    }
    return employeeRepository.findById(userId);
  }

  async completeProfile(userId, role, data) {
    if (role === 'admin') {
      throw new ApiError(400, 'Onboarding is not available to admins');
    }

    const updates = {};
    if (data.role) updates.role = data.role;
    if (data.mobile) updates.mobile = data.mobile;
    if (data.department) updates.department = data.department;
    if (data.officeLocation) updates.officeLocation = data.officeLocation;

    return employeeRepository.update(userId, updates);
  }
}

module.exports = new AuthService();
