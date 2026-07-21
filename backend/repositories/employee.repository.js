const Employee = require('../models/Employee');

class EmployeeRepository {
  async findById(id) {
    return Employee.findById(id).populate('managerId', 'name email');
  }

  async findByEmail(email) {
    return Employee.findOne({ email }).select('+passwordHash');
  }

  async findByCode(organizationId, employeeCode) {
    return Employee.findOne({ organizationId, employeeCode });
  }

  async create(data) {
    return Employee.create(data);
  }

  async update(id, data) {
    return Employee.findByIdAndUpdate(id, data, { new: true });
  }

  async addRating(id, score, session = null) {
    const employee = await Employee.findById(id).session(session);
    if (!employee) return null;
    const oldAvg = employee.ratingAvg || 0;
    const oldCount = employee.ratingCount || 0;
    const newCount = oldCount + 1;
    const newAvg = parseFloat(((oldAvg * oldCount + score) / newCount).toFixed(2));
    employee.ratingAvg = newAvg;
    employee.ratingCount = newCount;
    return employee.save({ session });
  }

  async findByOrg(organizationId, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    return Employee.find({ organizationId })
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });
  }

  async countByOrg(organizationId) {
    return Employee.countDocuments({ organizationId });
  }
}

module.exports = new EmployeeRepository();
