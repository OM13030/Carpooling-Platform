const { z } = require('zod');

const registerOrgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  address: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  industry: z.string().optional(),
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  adminEmail: z.string().email('Invalid admin email'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters')
});

const registerEmployeeSchema = z.object({
  organizationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid organization ID'),
  employeeCode: z.string().min(2, 'Employee code must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  department: z.string().optional(),
  officeLocation: z.string().optional(),
  designation: z.string().optional(),
  emergencyContact: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const publishRideSchema = z.object({
  pickupPoint: z.object({
    address: z.string().min(1, 'Pickup address is required'),
    coordinates: z.array(z.number()).length(2, 'Coordinates must be [lng, lat]')
  }),
  destination: z.object({
    address: z.string().min(1, 'Destination address is required'),
    coordinates: z.array(z.number()).length(2, 'Coordinates must be [lng, lat]')
  }),
  stops: z.array(z.object({
    address: z.string(),
    coordinates: z.array(z.number()).length(2)
  })).optional(),
  departureDate: z.string(),
  departureTime: z.string(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.object({
    daysOfWeek: z.array(z.number().min(0).max(6)),
    endDate: z.string()
  }).optional(),
  availableSeats: z.number().int().min(1, 'Must offer at least 1 seat'),
  farePerSeat: z.number().min(0, 'Fare cannot be negative'),
  estimatedDistanceKm: z.number().optional(),
  estimatedDurationMin: z.number().optional()
});

const createRequestSchema = z.object({
  rideId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ride ID'),
  seatsRequested: z.number().int().min(1, 'Must request at least 1 seat'),
  pickupPoint: z.object({
    address: z.string().min(1, 'Pickup address is required'),
    coordinates: z.array(z.number()).length(2, 'Coordinates must be [lng, lat]')
  })
});

const addVehicleSchema = z.object({
  registrationNumber: z.string().min(4, 'Invalid registration number'),
  model: z.string().min(1, 'Model is required'),
  manufacturer: z.string().optional(),
  fuelType: z.enum(['petrol', 'diesel', 'cng', 'electric', 'hybrid']),
  color: z.string().optional(),
  seatingCapacity: z.number().int().min(1, 'Seating capacity must be at least 1'),
  insuranceNumber: z.string().optional(),
  insuranceExpiry: z.string().optional()
});

const updateVehicleSchema = addVehicleSchema.partial();

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  mobile: z.string().min(10).optional(),
  department: z.string().optional(),
  officeLocation: z.string().optional(),
  designation: z.string().optional(),
  emergencyContact: z.string().optional()
});

const addVehicleExpenseSchema = z.object({
  vehicleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid vehicle ID'),
  type: z.enum(['maintenance', 'insurance', 'fuel', 'other']),
  amount: z.number().min(0, 'Amount must be at least 0'),
  incurredOn: z.string().optional().transform((val) => (val ? new Date(val) : new Date())),
  notes: z.string().optional()
});

const rideSearchSchema = z.object({
  pickup: z.object({
    lat: z.number().min(6).max(38, 'Latitude must be within India bounding box'),
    lng: z.number().min(68).max(98, 'Longitude must be within India bounding box'),
    address: z.string().min(1, 'Pickup address is required')
  }),
  destination: z.object({
    lat: z.number().min(6).max(38, 'Latitude must be within India bounding box'),
    lng: z.number().min(68).max(98, 'Longitude must be within India bounding box'),
    address: z.string().min(1, 'Destination address is required')
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  seats: z.number().int().min(1).max(6)
});


module.exports = {
  registerOrgSchema,
  registerEmployeeSchema,
  loginSchema,
  publishRideSchema,
  createRequestSchema,
  addVehicleSchema,
  updateVehicleSchema,
  updateProfileSchema,
  addVehicleExpenseSchema,
  rideSearchSchema
};

