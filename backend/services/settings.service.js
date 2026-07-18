const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const miscRepository = require('../repositories/misc.repository');
const UserSetting = require('../models/UserSetting');
const PaymentMethod = require('../models/PaymentMethod');
const HelpTicket = require('../models/HelpTicket');

class SettingsService {
  async getSettings(ownerId, ownerRole) {
    const settings = await UserSetting.findOneAndUpdate(
      { ownerId, ownerRole },
      { $setOnInsert: { ownerId, ownerRole } },
      { new: true, upsert: true }
    );

    return settings;
  }

  async updateSettings(ownerId, ownerRole, data) {
    return UserSetting.findOneAndUpdate(
      { ownerId, ownerRole },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    );
  }

  async listSavedPlaces(ownerId, ownerRole) {
    if (ownerRole !== 'employee') return [];
    return miscRepository.findSavedPlaces(ownerId);
  }

  async createSavedPlace(ownerId, ownerRole, data) {
    if (ownerRole !== 'employee') {
      throw new ApiError(403, 'Saved places are available to employee accounts only');
    }

    return miscRepository.createSavedPlace({
      employeeId: ownerId,
      label: data.label,
      location: data.location,
    });
  }

  async deleteSavedPlace(ownerId, ownerRole, placeId) {
    if (ownerRole !== 'employee') {
      throw new ApiError(403, 'Saved places are available to employee accounts only');
    }

    const deleted = await miscRepository.deleteSavedPlace(placeId, ownerId);
    if (!deleted) throw new ApiError(404, 'Saved place not found or unauthorized');
    return deleted;
  }

  async listPaymentMethods(ownerId, ownerRole) {
    return PaymentMethod.find({ ownerId, ownerRole }).sort({ isDefault: -1, createdAt: -1 });
  }

  async addPaymentMethod(ownerId, ownerRole, data) {
    const payload = { ...data, ownerId, ownerRole };

    if (payload.isDefault) {
      await PaymentMethod.updateMany({ ownerId, ownerRole }, { $set: { isDefault: false } });
    }

    return PaymentMethod.create(payload);
  }

  async deletePaymentMethod(ownerId, ownerRole, methodId) {
    const method = await PaymentMethod.findOneAndDelete({ _id: methodId, ownerId, ownerRole });
    if (!method) throw new ApiError(404, 'Payment method not found or unauthorized');
    return method;
  }

  async setDefaultPaymentMethod(ownerId, ownerRole, methodId) {
    const method = await PaymentMethod.findOne({ _id: methodId, ownerId, ownerRole });
    if (!method) throw new ApiError(404, 'Payment method not found or unauthorized');

    await PaymentMethod.updateMany({ ownerId, ownerRole }, { $set: { isDefault: false } });
    method.isDefault = true;
    await method.save();
    return method;
  }

  async getFaqs() {
    return [
      { id: 'payments', question: 'How do I add a payment method?', answer: 'Store a tokenized Razorpay payment instrument from the payment methods module.' },
      { id: 'saved-places', question: 'How do saved places work?', answer: 'Saved places keep your pickup and destination coordinates ready for faster booking.' },
      { id: 'support', question: 'How do I reach support?', answer: 'Open chat support or raise a ticket from the Help Center.' },
    ];
  }

  async createTicket(ownerId, ownerRole, data) {
    return HelpTicket.create({
      ownerId,
      ownerRole,
      category: data.category,
      subject: data.subject,
      message: data.message,
    });
  }
}

module.exports = new SettingsService();