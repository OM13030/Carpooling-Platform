const { z } = require('zod');

const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notificationPreferences: z.object({
    tripAlerts: z.boolean().optional(),
    paymentReceipts: z.boolean().optional(),
    supportResponses: z.boolean().optional(),
    adminBroadcasts: z.boolean().optional(),
  }).optional(),
  quickAccess: z.array(z.string()).optional(),
});

const savedPlaceSchema = z.object({
  label: z.string().min(1, 'Location name is required'),
  location: z.object({
    address: z.string().min(1, 'Address is required'),
    coordinates: z.array(z.number()).length(2, 'Coordinates must contain latitude and longitude'),
  }),
});

const paymentMethodSchema = z.object({
  type: z.enum(['upi', 'credit_card', 'debit_card', 'net_banking', 'wallet']),
  provider: z.string().min(1, 'Provider is required'),
  token: z.string().min(1, 'Token is required'),
  maskedCard: z.string().optional(),
  lastFourDigits: z.string().optional(),
  expiryMonth: z.string().optional(),
  expiryYear: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const helpTicketSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  subject: z.string().min(2, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

module.exports = {
  settingsSchema,
  savedPlaceSchema,
  paymentMethodSchema,
  helpTicketSchema,
};