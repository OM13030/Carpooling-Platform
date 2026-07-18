require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const logger = require('./utils/logger');

// Import Models
const Organization = require('./models/Organization');
const Admin = require('./models/Admin');
const Employee = require('./models/Employee');
const Vehicle = require('./models/Vehicle');
const Ride = require('./models/Ride');
const RideRequest = require('./models/RideRequest');
const Trip = require('./models/Trip');
const TripParticipant = require('./models/TripParticipant');
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');
const { SavedPlace, Rating, Notification, Message, AuditLog } = require('./models/Misc');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carpool_db';

const seedData = async () => {
  try {
    logger.info('Connecting to database...');
    await mongoose.connect(MONGODB_URI, {
      dbName: 'carpool_db'
    });
    logger.info('Connected! Clearing existing collections...');

    // Clear everything
    await Organization.deleteMany({});
    await Admin.deleteMany({});
    await Employee.deleteMany({});
    await Vehicle.deleteMany({});
    await Ride.deleteMany({});
    await Trip.deleteMany({});
    await TripParticipant.deleteMany({});
    await Wallet.deleteMany({});
    await Transaction.deleteMany({});
    await SavedPlace.deleteMany({});
    await Rating.deleteMany({});
    await Notification.deleteMany({});
    await Message.deleteMany({});
    await AuditLog.deleteMany({});

    logger.info('Creating Organization...');
    const org = await Organization.create({
      name: 'Odoo x KSV Corporate',
      address: 'KSV Corporate Tower, Gandhinagar, Gujarat',
      email: 'contact@odooksv.com',
      phone: '+91 79 1234 5678',
      industry: 'Technology',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
      carpoolConfig: {
        fuelPrice: 96.50,
        operationalCostPerKm: 6.00,
        rideCommissionPercent: 5.0,
        walletMinimumBalance: 100.0,
        maxRideDistanceKm: 100.0,
        cancellationPolicy: 'Free cancellation up to 30 minutes before departure.'
      }
    });

    logger.info('Creating Org Admin...');
    const passwordHash = await bcrypt.hash('password123', 10);
    const admin = await Admin.create({
      organizationId: org._id,
      name: 'Admin Supervisor',
      email: 'admin@odooksv.com',
      passwordHash,
      status: 'active'
    });

    logger.info('Creating 15 Employees...');
    const names = [
      'Aarav Sharma', 'Aditya Patel', 'Vihaan Shah', 'Reyansh Gupta', 'Sai Krishna',
      'Kabir Mehta', 'Ishaan Vyas', 'Ananya Joshi', 'Diya Trivedi', 'Kiara Sen',
      'Myra Rao', 'Aadhya Nair', 'Rohan Deshmukh', 'Arjun Saxena', 'Karan Verma'
    ];
    const depts = ['Engineering', 'Product', 'Sales', 'HR', 'Marketing', 'QA', 'Design'];
    const designations = ['Software Engineer', 'Product Manager', 'Account Executive', 'HR Specialist', 'QA Engineer', 'Lead Designer'];
    
    const employees = [];
    for (let i = 0; i < names.length; i++) {
      const code = `EMP${1000 + i}`;
      const email = `${names[i].toLowerCase().replace(' ', '.')}@odooksv.com`;
      const emp = await Employee.create({
        organizationId: org._id,
        employeeCode: code,
        name: names[i],
        email,
        mobile: `+91 98765 4321${i}`,
        passwordHash,
        department: depts[i % depts.length],
        officeLocation: 'KSV Infocity Campus',
        designation: designations[i % designations.length],
        emergencyContact: `+91 99999 8888${i}`,
        status: 'active',
        ratingAvg: i % 2 === 0 ? 4.5 : 0,
        ratingCount: i % 2 === 0 ? 4 : 0
      });
      employees.push(emp);

      // Create Wallet
      await Wallet.create({
        employeeId: emp._id,
        balance: 1000 + (i * 100), // Pre-seeded wallet funds
        upiId: `${code}@okaxis`
      });
    }

    logger.info('Creating 8 Vehicles...');
    const manufacturers = ['Maruti Suzuki', 'Hyundai', 'Tata Motors', 'Mahindra', 'Honda'];
    const models = ['Swift', 'i20', 'Nexon', 'XUV300', 'City'];
    const colors = ['White', 'Silver', 'Grey', 'Red', 'Blue'];
    const fuels = ['petrol', 'diesel', 'cng', 'electric', 'hybrid'];

    const vehicles = [];
    for (let i = 0; i < 8; i++) {
      const driver = employees[i];
      const vehicle = await Vehicle.create({
        employeeId: driver._id,
        registrationNumber: `GJ01AB123${i}`,
        model: models[i % models.length],
        manufacturer: manufacturers[i % manufacturers.length],
        fuelType: fuels[i % fuels.length],
        color: colors[i % colors.length],
        seatingCapacity: 4,
        insuranceNumber: `INS-${2000 + i}`,
        insuranceExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'active'
      });
      vehicles.push(vehicle);
    }

    logger.info('Creating Saved Places...');
    for (let i = 0; i < employees.length; i++) {
      await SavedPlace.create({
        employeeId: employees[i]._id,
        label: 'Home',
        location: {
          address: `Residential Complex Block ${i+1}, Gandhinagar`,
          type: 'Point',
          coordinates: [72.6300 + (i * 0.005), 23.2200 + (i * 0.005)]
        }
      });
      await SavedPlace.create({
        employeeId: employees[i]._id,
        label: 'Office',
        location: {
          address: 'KSV Corporate Tower, Gandhinagar',
          type: 'Point',
          coordinates: [72.6369, 23.2156]
        }
      });
    }

    logger.info('Creating Sample Rides & Trips...');
    // Create an upcoming ride offered by employee[0] (driver)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const upcomingRide = await Ride.create({
      organizationId: org._id,
      driverId: employees[0]._id,
      vehicleId: vehicles[0]._id,
      pickupPoint: {
        address: 'Adalaj Stepwell Park, Gandhinagar',
        type: 'Point',
        coordinates: [72.5801, 23.1670]
      },
      destination: {
        address: 'KSV Corporate Tower, Gandhinagar',
        type: 'Point',
        coordinates: [72.6369, 23.2156]
      },
      stops: [],
      departureDate: tomorrow,
      departureTime: '09:00 AM',
      isRecurring: true,
      recurrenceRule: {
        daysOfWeek: [1, 2, 3, 4, 5],
        endDate: new Date(tomorrow.getTime() + 30 * 24 * 60 * 60 * 1000)
      },
      availableSeats: 3,
      occupiedSeats: 1,
      farePerSeat: 60,
      estimatedDistanceKm: 12.5,
      estimatedDurationMin: 22,
      status: 'scheduled'
    });

    // Create a request for the upcoming ride (from employee 8)
    const request = await RideRequest.create({
      rideId: upcomingRide._id,
      passengerId: employees[8]._id,
      seatsRequested: 1,
      pickupPoint: {
        address: 'Adalaj Crossroads, Gandhinagar',
        type: 'Point',
        coordinates: [72.5830, 23.1690]
      },
      status: 'accepted'
    });

    // Create the Trip for upcomingRide since a request is accepted
    const upcomingTrip = await Trip.create({
      organizationId: org._id,
      rideId: upcomingRide._id,
      driverId: employees[0]._id,
      vehicleId: vehicles[0]._id,
      fare: upcomingRide.farePerSeat,
      fuelCost: 65,
      carbonSavedKg: 1.5,
      status: 'booked',
      currentLocation: upcomingRide.pickupPoint
    });

    // Add participants
    await TripParticipant.create({
      tripId: upcomingTrip._id,
      employeeId: employees[0]._id,
      role: 'driver',
      pickupPoint: upcomingRide.pickupPoint,
      fareShare: 0,
      paymentStatus: 'completed',
      paymentMethod: 'cash'
    });

    await TripParticipant.create({
      tripId: upcomingTrip._id,
      employeeId: employees[8]._id,
      rideRequestId: request._id,
      role: 'passenger',
      pickupPoint: request.pickupPoint,
      fareShare: 60,
      paymentStatus: 'pending',
      paymentMethod: 'wallet'
    });

    // Create a Past Completed Trip
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(18, 0, 0, 0);

    const pastRide = await Ride.create({
      organizationId: org._id,
      driverId: employees[1]._id,
      vehicleId: vehicles[1]._id,
      pickupPoint: {
        address: 'KSV Corporate Tower, Gandhinagar',
        type: 'Point',
        coordinates: [72.6369, 23.2156]
      },
      destination: {
        address: 'GIFT City Tower A, Gandhinagar',
        type: 'Point',
        coordinates: [72.6841, 23.1601]
      },
      departureDate: yesterday,
      departureTime: '06:00 PM',
      availableSeats: 3,
      occupiedSeats: 2,
      farePerSeat: 85,
      estimatedDistanceKm: 15.2,
      estimatedDurationMin: 25,
      status: 'completed'
    });

    const pastTrip = await Trip.create({
      organizationId: org._id,
      rideId: pastRide._id,
      driverId: employees[1]._id,
      vehicleId: vehicles[1]._id,
      startTime: yesterday,
      endTime: new Date(yesterday.getTime() + 25 * 60 * 1000),
      distanceKm: 15.2,
      durationMin: 25,
      fare: pastRide.farePerSeat,
      fuelCost: 91.20,
      carbonSavedKg: 3.6,
      currentLocation: {
        type: 'Point',
        coordinates: [72.6841, 23.1601]
      },
      status: 'payment_completed'
    });

    // Participants for past trip
    await TripParticipant.create({
      tripId: pastTrip._id,
      employeeId: employees[1]._id,
      role: 'driver',
      pickupPoint: pastRide.pickupPoint,
      fareShare: 0,
      paymentStatus: 'completed'
    });

    // Passenger 1
    const p1 = employees[10];
    await TripParticipant.create({
      tripId: pastTrip._id,
      employeeId: p1._id,
      role: 'passenger',
      pickupPoint: pastRide.pickupPoint,
      fareShare: 85,
      paymentStatus: 'completed',
      paymentMethod: 'wallet'
    });
    const wallet1 = await Wallet.findOne({ employeeId: p1._id });
    wallet1.balance -= 85;
    await wallet1.save();
    await Transaction.create({
      walletId: wallet1._id,
      tripId: pastTrip._id,
      amount: 85,
      type: 'debit',
      method: 'wallet',
      status: 'success',
      description: 'Payment for commute to GIFT City'
    });

    // Passenger 2
    const p2 = employees[11];
    await TripParticipant.create({
      tripId: pastTrip._id,
      employeeId: p2._id,
      role: 'passenger',
      pickupPoint: pastRide.pickupPoint,
      fareShare: 85,
      paymentStatus: 'completed',
      paymentMethod: 'wallet'
    });
    const wallet2 = await Wallet.findOne({ employeeId: p2._id });
    wallet2.balance -= 85;
    await wallet2.save();
    await Transaction.create({
      walletId: wallet2._id,
      tripId: pastTrip._id,
      amount: 85,
      type: 'debit',
      method: 'wallet',
      status: 'success',
      description: 'Payment for commute to GIFT City'
    });

    // Credit Driver wallet
    const driverWallet = await Wallet.findOne({ employeeId: employees[1]._id });
    const driverEarnings = 85 * 2 * 0.95; // 5% commission
    driverWallet.balance += driverEarnings;
    await driverWallet.save();
    await Transaction.create({
      walletId: driverWallet._id,
      tripId: pastTrip._id,
      amount: driverEarnings,
      type: 'credit',
      method: 'wallet',
      status: 'success',
      description: 'Ride earnings (net of commission)'
    });

    // Add Audit Log
    await AuditLog.create({
      actorId: employees[0]._id,
      actorType: 'Employee',
      action: 'RIDE_OFFERED',
      metadata: { rideId: upcomingRide._id }
    });

    logger.info('Database seeded successfully!');
    logger.info('Demo Admin Credentials:');
    logger.info(`Email: ${admin.email}`);
    logger.info('Password: password123');
    logger.info('Demo Employee Credentials:');
    logger.info(`Email: ${employees[0].email}`);
    logger.info('Password: password123');

    await mongoose.disconnect();
    logger.info('Disconnected from database.');
  } catch (error) {
    logger.error('Seeding failed: ' + error.message, error);
    process.exit(1);
  }
};

seedData();
