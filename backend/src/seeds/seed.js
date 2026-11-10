require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Operator = require('../models/Operator');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bus_booking';

const generateSeats = (totalSeats = 40, type = 'seater') => {
  const seats = [];
  const rows = Math.ceil(totalSeats / 4);
  const cols = ['A', 'B', 'C', 'D'];
  let count = 0;

  for (let r = 1; r <= rows; r++) {
    for (let c = 0; c < 4; c++) {
      if (count < totalSeats) {
        seats.push({
          seatNumber: `${r}${cols[c]}`,
          row: r,
          col: c + 1,
          tier: 'lower',
          type,
          basePriceMultiplier: 1.0
        });
        count++;
      }
    }
  }
  return seats;
};

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`[Seed Script] Connected to: ${conn.connection.host} (Database: ${conn.connection.name})`);
    console.log('Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Operator.deleteMany({}),
      Bus.deleteMany({}),
      Route.deleteMany({}),
      Trip.deleteMany({}),
      Booking.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('Creating Operators...');
    const srs = await Operator.create({
      name: 'SRS Travels',
      contactEmail: 'contact@srstravels.in',
      contactPhone: '+91 9845012345',
      licenseNumber: 'KA-OPT-4501',
      rating: 4.7
    });

    const kallada = await Operator.create({
      name: 'Kallada Travels',
      contactEmail: 'support@kalladatravels.com',
      contactPhone: '+91 9447012345',
      licenseNumber: 'KL-OPT-8812',
      rating: 4.8
    });

    const greenline = await Operator.create({
      name: 'GreenLine Express',
      contactEmail: 'info@greenlinebus.com',
      contactPhone: '+91 9884012345',
      licenseNumber: 'TN-OPT-9934',
      rating: 4.6
    });

    console.log('Creating Users with Roles (Admin, Operator, Customer)...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@busbooking.com',
      password: 'AdminPassword@123',
      phone: '+91 9999900001',
      role: 'admin'
    });

    const operatorUser = await User.create({
      name: 'Kallada Fleet Manager',
      email: 'operator@kallada.com',
      password: 'OperatorPassword@123',
      phone: '+91 9999900002',
      role: 'operator',
      operator: kallada._id
    });

    const customer1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'CustomerPassword@123',
      phone: '+91 9876543210',
      role: 'customer'
    });

    const customer2 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'CustomerPassword@123',
      phone: '+91 9876543211',
      role: 'customer'
    });

    console.log('Creating Buses with seat layouts...');
    const bus1 = await Bus.create({
      busNumber: 'KA-01-FA-1234',
      operator: srs._id,
      busType: 'Volvo Multi-Axle AC',
      totalSeats: 36,
      layoutType: '2x2',
      seats: generateSeats(36, 'seater'),
      amenities: ['WiFi', 'Charging Point', 'Water Bottle', 'Blanket', 'Reading Light']
    });

    const bus2 = await Bus.create({
      busNumber: 'KL-07-BB-5678',
      operator: kallada._id,
      busType: 'AC Sleeper (2+1)',
      totalSeats: 28,
      layoutType: 'sleeper_2x1',
      seats: generateSeats(28, 'sleeper'),
      amenities: ['AC', 'Personal TV', 'Charging Point', 'Pillow & Blanket', 'Emergency Exit']
    });

    const bus3 = await Bus.create({
      busNumber: 'TN-02-CC-9900',
      operator: greenline._id,
      busType: 'Electric AC Seater',
      totalSeats: 40,
      layoutType: '2x2',
      seats: generateSeats(40, 'seater'),
      amenities: ['WiFi', 'USB Port', 'Snacks', 'CCTV']
    });

    console.log('Creating Routes...');
    const routeBLR_HYD = await Route.create({
      origin: 'Bangalore',
      destination: 'Hyderabad',
      distanceKm: 570,
      estimatedDurationMinutes: 540,
      boardingPoints: [
        { name: 'Majestic Bus Terminal', landmark: 'Platform 18', timeOffsetMinutes: 0 },
        { name: 'Hebbal Flyover', landmark: 'Under the flyover bus stop', timeOffsetMinutes: 30 },
        { name: 'Yelahanka Toll', landmark: 'Toll Plaza gate', timeOffsetMinutes: 50 }
      ],
      droppingPoints: [
        { name: 'Shamshabad Airport Junction', landmark: 'Airport approach road', timeOffsetMinutes: 480 },
        { name: 'Gachibowli Outer Ring Road', landmark: 'Near DLF Cybercity', timeOffsetMinutes: 520 },
        { name: 'Ameerpet Metro Station', landmark: 'Pillar 1040', timeOffsetMinutes: 540 }
      ]
    });

    const routeBLR_CHN = await Route.create({
      origin: 'Bangalore',
      destination: 'Chennai',
      distanceKm: 345,
      estimatedDurationMinutes: 390,
      boardingPoints: [
        { name: 'Shantinagar Bus Station', landmark: 'Platform 4', timeOffsetMinutes: 0 },
        { name: 'Indiranagar Metro', landmark: 'CMH Road entrance', timeOffsetMinutes: 25 },
        { name: 'Electronic City Toll', landmark: 'Near Toll Plaza', timeOffsetMinutes: 50 }
      ],
      droppingPoints: [
        { name: 'Poonamallee Bypass', landmark: 'Bus Stand', timeOffsetMinutes: 340 },
        { name: 'Koyambedu CMBT', landmark: 'Platform 1', timeOffsetMinutes: 390 }
      ]
    });

    const routeMUM_PUN = await Route.create({
      origin: 'Mumbai',
      destination: 'Pune',
      distanceKm: 150,
      estimatedDurationMinutes: 210,
      boardingPoints: [
        { name: 'Dadar TT Circle', landmark: 'Near Asiad Bus Stand', timeOffsetMinutes: 0 },
        { name: 'Vashi Plaza', landmark: 'Highway bridge', timeOffsetMinutes: 40 }
      ],
      droppingPoints: [
        { name: 'Wakad Bridge', landmark: 'Expressway junction', timeOffsetMinutes: 180 },
        { name: 'Shivajinagar Bus Station', landmark: 'Bay 3', timeOffsetMinutes: 210 }
      ]
    });

    console.log('Creating Trips for Today & Upcoming Dates...');
    const now = new Date();

    // Trip 1: Bangalore -> Hyderabad tonight
    const dep1 = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours from now
    const arr1 = new Date(dep1.getTime() + 9 * 60 * 60 * 1000);

    const trip1Seats = bus1.seats.map((s) => ({
      seatNumber: s.seatNumber,
      row: s.row,
      col: s.col,
      tier: s.tier,
      type: s.type,
      fare: 1100,
      status: 'AVAILABLE',
      bookingId: null
    }));

    const trip1 = await Trip.create({
      tripCode: 'TRIP-BLRHYD-01',
      bus: bus1._id,
      operator: srs._id,
      route: routeBLR_HYD._id,
      departureTime: dep1,
      arrivalTime: arr1,
      baseFare: 1100,
      totalSeats: bus1.totalSeats,
      availableSeatCount: bus1.totalSeats,
      seats: trip1Seats
    });

    // Trip 2: Bangalore -> Hyderabad tomorrow night (Sleeper)
    const dep2 = new Date(now.getTime() + 30 * 60 * 60 * 1000); // 30 hours from now
    const arr2 = new Date(dep2.getTime() + 9 * 60 * 60 * 1000);

    const trip2Seats = bus2.seats.map((s) => ({
      seatNumber: s.seatNumber,
      row: s.row,
      col: s.col,
      tier: s.tier,
      type: s.type,
      fare: 1450,
      status: 'AVAILABLE',
      bookingId: null
    }));

    const trip2 = await Trip.create({
      tripCode: 'TRIP-BLRHYD-02',
      bus: bus2._id,
      operator: kallada._id,
      route: routeBLR_HYD._id,
      departureTime: dep2,
      arrivalTime: arr2,
      baseFare: 1450,
      totalSeats: bus2.totalSeats,
      availableSeatCount: bus2.totalSeats,
      seats: trip2Seats
    });

    // Trip 3: Bangalore -> Chennai tomorrow morning
    const dep3 = new Date(now.getTime() + 20 * 60 * 60 * 1000);
    const arr3 = new Date(dep3.getTime() + 6.5 * 60 * 60 * 1000);

    const trip3Seats = bus3.seats.map((s) => ({
      seatNumber: s.seatNumber,
      row: s.row,
      col: s.col,
      tier: s.tier,
      type: s.type,
      fare: 750,
      status: 'AVAILABLE',
      bookingId: null
    }));

    const trip3 = await Trip.create({
      tripCode: 'TRIP-BLRCHN-01',
      bus: bus3._id,
      operator: greenline._id,
      route: routeBLR_CHN._id,
      departureTime: dep3,
      arrivalTime: arr3,
      baseFare: 750,
      totalSeats: bus3.totalSeats,
      availableSeatCount: bus3.totalSeats,
      seats: trip3Seats
    });

    // Trip 4: Mumbai -> Pune today
    const dep4 = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const arr4 = new Date(dep4.getTime() + 3.5 * 60 * 60 * 1000);

    const trip4Seats = bus1.seats.map((s) => ({
      seatNumber: s.seatNumber,
      row: s.row,
      col: s.col,
      tier: s.tier,
      type: s.type,
      fare: 450,
      status: 'AVAILABLE',
      bookingId: null
    }));

    const trip4 = await Trip.create({
      tripCode: 'TRIP-MUMPUN-01',
      bus: bus1._id,
      operator: srs._id,
      route: routeMUM_PUN._id,
      departureTime: dep4,
      arrivalTime: arr4,
      baseFare: 450,
      totalSeats: bus1.totalSeats,
      availableSeatCount: bus1.totalSeats,
      seats: trip4Seats
    });

    console.log('Seeding Confirmed Bookings for Trip 1 to populate Passenger Manifest...');
    // Seed booking for John Doe on Trip 1 seats 1A and 1B
    const booking1 = await Booking.create({
      pnr: 'PNR-20261108-JD01',
      trip: trip1._id,
      user: customer1._id,
      passengerDetails: [
        { name: 'John Doe', age: 30, gender: 'Male', seatNumber: '1A' },
        { name: 'Alice Doe', age: 28, gender: 'Female', seatNumber: '1B' }
      ],
      seatNumbers: ['1A', '1B'],
      boardingPoint: {
        name: routeBLR_HYD.boardingPoints[0].name,
        time: dep1,
        landmark: routeBLR_HYD.boardingPoints[0].landmark
      },
      droppingPoint: {
        name: routeBLR_HYD.droppingPoints[2].name,
        time: arr1,
        landmark: routeBLR_HYD.droppingPoints[2].landmark
      },
      totalAmount: 2200,
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
      contactPhone: '+91 9876543210',
      contactEmail: 'john@example.com'
    });

    // Mark seats 1A and 1B as BOOKED on trip 1
    await Trip.updateOne(
      { _id: trip1._id },
      {
        $set: {
          'seats.$[s1].status': 'BOOKED',
          'seats.$[s1].bookingId': booking1._id,
          'seats.$[s2].status': 'BOOKED',
          'seats.$[s2].bookingId': booking1._id
        },
        $inc: { availableSeatCount: -2 }
      },
      {
        arrayFilters: [
          { 's1.seatNumber': '1A' },
          { 's2.seatNumber': '1B' }
        ]
      }
    );

    // Seed booking for Priya Sharma on Trip 1 seat 2A
    const booking2 = await Booking.create({
      pnr: 'PNR-20261108-PS02',
      trip: trip1._id,
      user: customer2._id,
      passengerDetails: [
        { name: 'Priya Sharma', age: 26, gender: 'Female', seatNumber: '2A' }
      ],
      seatNumbers: ['2A'],
      boardingPoint: {
        name: routeBLR_HYD.boardingPoints[1].name,
        time: new Date(dep1.getTime() + 30 * 60 * 1000),
        landmark: routeBLR_HYD.boardingPoints[1].landmark
      },
      droppingPoint: {
        name: routeBLR_HYD.droppingPoints[1].name,
        time: new Date(arr1.getTime() - 20 * 60 * 1000),
        landmark: routeBLR_HYD.droppingPoints[1].landmark
      },
      totalAmount: 1100,
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
      contactPhone: '+91 9876543211',
      contactEmail: 'priya@example.com'
    });

    await Trip.updateOne(
      { _id: trip1._id },
      {
        $set: {
          'seats.$[s1].status': 'BOOKED',
          'seats.$[s1].bookingId': booking2._id
        },
        $inc: { availableSeatCount: -1 }
      },
      {
        arrayFilters: [{ 's1.seatNumber': '2A' }]
      }
    );

    console.log('Seeding Audit Trail entries...');
    await AuditLog.create([
      {
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: adminUser._id,
        performedBy: { userId: adminUser._id, name: adminUser.name, email: adminUser.email, role: 'admin' },
        details: { email: adminUser.email }
      },
      {
        action: 'TRIP_CREATED',
        entityType: 'Trip',
        entityId: trip1._id,
        performedBy: { userId: adminUser._id, name: adminUser.name, email: adminUser.email, role: 'admin' },
        details: { tripCode: trip1.tripCode, baseFare: 1100 }
      },
      {
        action: 'BOOKING_CREATED',
        entityType: 'Booking',
        entityId: booking1._id,
        performedBy: { userId: customer1._id, name: customer1.name, email: customer1.email, role: 'customer' },
        details: { pnr: booking1.pnr, seats: ['1A', '1B'], totalAmount: 2200 }
      }
    ]);

    console.log('---------------------------------------------------------');
    console.log(' DATABASE SEEDED SUCCESSFULLY!');
    console.log('---------------------------------------------------------');
    console.log('Demo Accounts:');
    console.log('  1. Admin:    admin@busbooking.com    / AdminPassword@123');
    console.log('  2. Operator: operator@kallada.com    / OperatorPassword@123');
    console.log('  3. Customer: john@example.com        / CustomerPassword@123');
    console.log('  4. Customer: priya@example.com       / CustomerPassword@123');
    console.log('---------------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();

