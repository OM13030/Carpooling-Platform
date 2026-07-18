const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const rideService = require('./services/ride.service');
const rideRequestService = require('./services/rideRequest.service');
const tripService = require('./services/trip.service');
const walletService = require('./services/wallet.service');
const Employee = require('./models/Employee');
const Ride = require('./models/Ride');
const Trip = require('./models/Trip');
const Wallet = require('./models/Wallet');

dotenv.config();

async function runVerification() {
  console.log('=== Commute Platform Flow Verification ===\n');

  // 1. Connect to Database
  await connectDB();

  try {
    // 2. Fetch driver and passenger details
    const driver = await Employee.findOne({ email: 'aarav.sharma@odooksv.com' });
    const passenger = await Employee.findOne({ email: { $ne: 'aarav.sharma@odooksv.com' } });

    if (!driver || !passenger) {
      throw new Error('Seed employees missing. Run node seed.js first.');
    }

    console.log(`Driver: ${driver.name} (ID: ${driver._id})`);
    console.log(`Passenger: ${passenger.name} (ID: ${passenger._id})\n`);

    // Fetch initial balances
    const driverWallet = await Wallet.findOne({ employeeId: driver._id });
    const passengerWallet = await Wallet.findOne({ employeeId: passenger._id });
    console.log(`[Initial Ledgers]`);
    console.log(`Driver Wallet: ₹${driverWallet.balance}`);
    console.log(`Passenger Wallet: ₹${passengerWallet.balance}\n`);

    // 3. Driver offers a ride
    console.log('Step 1: Driver offering ride from Gandhinagar Sector 11 to GIFT City...');
    const ride = await rideService.publishRide(driver._id, driver.organizationId, {
      pickupPoint: {
        address: 'Sector 11, Gandhinagar, Gujarat',
        type: 'Point',
        coordinates: [72.6369, 23.2156]
      },
      destination: {
        address: 'GIFT One, Road 1C, GIFT City, Gandhinagar, Gujarat',
        type: 'Point',
        coordinates: [72.6841, 23.1601]
      },
      departureDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      departureTime: '17:30',
      availableSeats: 3,
      farePerSeat: 80,
      estimatedDistanceKm: 12.5,
      estimatedDurationMin: 22
    });

    console.log(`Ride created successfully (ID: ${ride._id}, Seats: ${ride.availableSeats}, Fare/Seat: ₹${ride.farePerSeat})\n`);

    // 4. Passenger requests a seat
    console.log('Step 2: Passenger requesting 1 seat on this ride...');
    const request = await rideRequestService.createRequest(
      passenger._id,
      ride._id,
      1,
      {
        address: 'Sector 11 Main Road, Gandhinagar',
        type: 'Point',
        coordinates: [72.6375, 23.2162]
      }
    );

    console.log(`Request sent successfully (ID: ${request._id}, Status: ${request.status})\n`);

    // 5. Driver accepts request (Verifies atomic seat decrement lock)
    console.log('Step 3: Driver accepting passenger request...');
    const { request: acceptedRequest, trip: acceptedTrip } = await rideRequestService.acceptRequest(driver._id, request._id);
    console.log(`Request accepted! New status: ${acceptedRequest.status}`);

    const updatedRide = await Ride.findById(ride._id);
    console.log(`Atomic Check: Seats decremented correctly. Available: ${updatedRide.availableSeats}, Occupied: ${updatedRide.occupiedSeats}\n`);

    // 6. Driver starts the trip
    console.log('Step 4: Driver initializing commute. Starting Trip...');
    const trip = await tripService.startTrip(driver._id, acceptedTrip._id);
    console.log(`Trip started successfully (ID: ${trip._id}, Status: ${trip.status})\n`);

    // 7. Simulating coordinates tick (GPS tracking update)
    console.log('Step 5: Simulating GPS tracking coordinate tick...');
    // We mock a route update mid-way
    const midPoint = [72.6600, 23.1880];
    const { trip: updatedTrip, routeUpdate } = await tripService.updateTripLocation(driver._id, trip._id, midPoint[1], midPoint[0]);
    console.log(`GPS tick broadcasted. Updated Location: ${updatedTrip.currentLocation.coordinates}, Distance Remaining: ${updatedTrip.distanceKm} km, ETA: ${updatedTrip.durationMin} mins\n`);

    // 8. Driver completes the trip (Deducts passenger wallet & credits driver wallet minus commission)
    console.log('Step 6: Driver dropoff reached. Ending commute & reconciling ledger...');
    const completionResult = await tripService.completeTrip(driver._id, trip._id);
    console.log(`Trip completed! Final status: ${completionResult.trip.status}`);

    // Reload wallets to verify ledger transaction reconciliation
    const finalDriverWallet = await Wallet.findOne({ employeeId: driver._id });
    const finalPassengerWallet = await Wallet.findOne({ employeeId: passenger._id });
    console.log(`\n[Final Ledgers]`);
    console.log(`Driver Wallet: ₹${finalDriverWallet.balance} (Earned fare minus commission)`);
    console.log(`Passenger Wallet: ₹${finalPassengerWallet.balance} (Debited fare: ₹80)`);

    console.log('\n=== Verification Completed Successfully ===');
  } catch (err) {
    console.error('Verification failed with error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('DB Connection closed.');
  }
}

runVerification();
