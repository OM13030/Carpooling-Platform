const Organization = require('../models/Organization');
const Admin = require('../models/Admin');

class OrganizationRepository {
  async findById(id, session = null) {
    let query = Organization.findById(id);
    if (session) {
      query = query.session(session);
    }
    return query;
  }

  async findByEmail(email) {
    return Organization.findOne({ email });
  }

  async create(data, options = {}) {
    if (options.session) {
      const [doc] = await Organization.create([data], options);
      return doc;
    }
    return Organization.create(data);
  }

  async update(id, data, options = {}) {
    return Organization.findByIdAndUpdate(id, data, { new: true, ...options });
  }

  async findAdminByEmail(email) {
    return Admin.findOne({ email }).select('+passwordHash');
  }

  async findAdminById(id) {
    return Admin.findById(id);
  }

  async createAdmin(data, options = {}) {
    if (options.session) {
      const [doc] = await Admin.create([data], options);
      return doc;
    }
    return Admin.create(data);
  }

  async updateAdmin(id, data, options = {}) {
    return Admin.findByIdAndUpdate(id, data, { new: true, ...options });
  }

  async listAllOrganizations() {
    return Organization.find({});
  }
}

module.exports = new OrganizationRepository();
