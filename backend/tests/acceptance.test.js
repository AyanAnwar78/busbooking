const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Operator = require('../src/models/Operator');
const Bus = require('../src/models/Bus');
const Route = require('../src/models/Route');
const Trip = require('../src/models/Trip');
const Booking = require('../src/models/Booking');

describe('Bus Booking Management System - Acceptance Tests', () => {
  let customerToken, customer2Token, operatorToken, adminToken;
  let customerUser, customer2User, operatorUser, adminUser;
  let testOperator, testBus, testRoute, testTrip;

  beforeEach(async () => {
    // 1. Create Operator
    testOperator = await Operator.create({
      name: 'Royal Express',
      contactEmail: 'contact@royalexpress.com',
      contactPhone: '+91 9876543210',
      licenseNumber: 'KA-2026-9901'
    });

    // 2. Create Users
    customerUser = await User.create({
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: 'Password123',
      phone: '+91 9999911111',
      role: 'customer'
    });

    customer2User = await User.create({
      name: 'Bob Jones',
      email: 'bob@example.com',
      password: 'Password123',
      phone: '+91 9999922222',
      role: 'customer'
    });

    operatorUser = await User.create({
      name: 'Operator Officer',
      email: 'officer@royalexpress.com',
      password: 'Password123',
      phone: '+91 9999933333',
      role: 'operator',
      operator: testOperator._id
    });

    adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@system.com',
      password: 'Password123',
      phone: '+91 9999944444',
      role: 'admin'
    });

    // Login users to get tokens
    const custRes = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'Password123'
    });
    customerToken = custRes.body.token;

    const cust2Res = await request(app).post('/api/auth/login').send({
      email: 'bob@example.com',
      password: 'Password123'
    });
    customer2Token = cust2Res.body.token;

    const optRes = await request(app).post('/api/auth/login').send({
      email: 'officer@royalexpress.com',
      password: 'Password123'
    });
    operatorToken = optRes.body.token;

    const admRes = await request(app).post('/api/auth/login').send({
      email: 'admin@system.com',
      password: 'Password123'
    });
    adminToken = admRes.body.token;

    // 3. Create Bus
    const seats = [
      { seatNumber: '1A', row: 1, col: 1, tier: 'lower', type: 'seater', basePriceMultiplier: 1 },
      { seatNumber: '1B', row: 1, col: 2, tier: 'lower', type: 'seater', basePriceMultiplier: 1 },
      { seatNumber: '2A', row: 2, col: 1, tier: 'lower', type: 'seater', basePriceMultiplier: 1 },
      { seatNumber: '2B', row: 2, col: 2, tier: 'lower', type: 'seater', basePriceMultiplier: 1 }
    ];

    testBus = await Bus.create({
      busNumber: 'KA-05-AB-1234',
      operator: testOperator._id,
      busType: 'AC Seater (2+2)',
      totalSeats: 4,
      layoutType: '2x2',
      seats
    });

    // 4. Create Route
    testRoute = await Route.create({
      origin: 'Bangalore',
      destination: 'Hyderabad',
      distanceKm: 570,
      estimatedDurationMinutes: 540,
      boardingPoints: [
        { name: 'Majestic Bus Stand', landmark: 'Platform 1', timeOffsetMinutes: 0 }
      ],
      droppingPoints: [
        { name: 'Ameerpet', landmark: 'Metro Station', timeOffsetMinutes: 540 }
      ]
    });

    // 5. Create Trip (scheduled 30 hours in future)
    const departure = new Date(Date.now() + 30 * 60 * 60 * 1000);
    const arrival = new Date(departure.getTime() + 9 * 60 * 60 * 1000);

    testTrip = await Trip.create({
      tripCode: 'TRIP-ACCEPT-01',
      bus: testBus._id,
      operator: testOperator._id,
      route: testRoute._id,
      departureTime: departure,
      arrivalTime: arrival,
      baseFare: 1000,
      totalSeats: 4,
      availableSeatCount: 4,
      seats: seats.map((s) => ({
        seatNumber: s.seatNumber,
        row: s.row,
        col: s.col,
        tier: s.tier,
        type: s.type,
        fare: 1000,
        status: 'AVAILABLE',
        bookingId: null
      })),
      cancellationPolicy: {
        rules: [
          { minHoursBefore: 24, refundPercentage: 90 },
          { minHoursBefore: 12, refundPercentage: 50 },
          { minHoursBefore: 0, refundPercentage: 0 }
        ]
      }
    });
  });

  // =========================================================================
  // Acceptance Test 1: Passenger search and seat booking
  // =========================================================================
  test('Acceptance Test 1: Passenger can search a valid trip and book an available seat', async () => {
    // Search trips
    const searchRes = await request(app)
      .get('/api/trips/search')
      .query({ origin: 'Bangalore', destination: 'Hyderabad' });

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.success).toBe(true);
    expect(searchRes.body.count).toBe(1);
    expect(searchRes.body.trips[0].tripCode).toBe('TRIP-ACCEPT-01');
    expect(searchRes.body.trips[0].availableSeats).toBe(4);

    // Book seat 1A
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        tripId: testTrip._id,
        seatNumbers: ['1A'],
        passengerDetails: [
          { name: 'Alice Smith', age: 28, gender: 'Female', seatNumber: '1A' }
        ],
        boardingPoint: testRoute.boardingPoints[0],
        droppingPoint: testRoute.droppingPoints[0],
        contactPhone: '+91 9999911111',
        contactEmail: 'alice@example.com'
      });

    expect(bookingRes.status).toBe(201);
    expect(bookingRes.body.success).toBe(true);
    expect(bookingRes.body.booking.status).toBe('CONFIRMED');
    expect(bookingRes.body.booking.pnr).toMatch(/^PNR-/);
    expect(bookingRes.body.booking.seatNumbers).toEqual(['1A']);
    expect(bookingRes.body.booking.totalAmount).toBe(1000);

    // Verify trip seat count decremented
    const updatedTrip = await Trip.findById(testTrip._id);
    expect(updatedTrip.availableSeatCount).toBe(3);
    const seat1A = updatedTrip.seats.find((s) => s.seatNumber === '1A');
    expect(seat1A.status).toBe('BOOKED');
  });

  // =========================================================================
  // Acceptance Test 2: Concurrency test - Two users cannot book the same seat
  // =========================================================================
  test('Acceptance Test 2: Two simultaneous requests cannot confirm the same seat on one trip', async () => {
    const bookingPayload1 = {
      tripId: testTrip._id,
      seatNumbers: ['2A'],
      passengerDetails: [
        { name: 'Alice Smith', age: 28, gender: 'Female', seatNumber: '2A' }
      ],
      boardingPoint: testRoute.boardingPoints[0],
      droppingPoint: testRoute.droppingPoints[0],
      contactPhone: '+91 9999911111',
      contactEmail: 'alice@example.com'
    };

    const bookingPayload2 = {
      tripId: testTrip._id,
      seatNumbers: ['2A'],
      passengerDetails: [
        { name: 'Bob Jones', age: 32, gender: 'Male', seatNumber: '2A' }
      ],
      boardingPoint: testRoute.boardingPoints[0],
      droppingPoint: testRoute.droppingPoints[0],
      contactPhone: '+91 9999922222',
      contactEmail: 'bob@example.com'
    };

    // Execute both requests concurrently
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingPayload1),
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send(bookingPayload2)
    ]);

    const statuses = [res1.status, res2.status];
    // Exactly one must succeed (201) and one must be rejected with 409 Conflict
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    // Verify only one booking exists in DB for seat 2A
    const confirmedBookings = await Booking.find({
      trip: testTrip._id,
      seatNumbers: '2A',
      status: 'CONFIRMED'
    });
    expect(confirmedBookings.length).toBe(1);

    // Verify trip seats array has only one booked for 2A
    const updatedTrip = await Trip.findById(testTrip._id);
    const seat2A = updatedTrip.seats.find((s) => s.seatNumber === '2A');
    expect(seat2A.status).toBe('BOOKED');
  });

  // =========================================================================
  // Acceptance Test 3: PNR includes correct passenger, route, date and seat details
  // =========================================================================
  test('Acceptance Test 3: The PNR includes correct passenger, route, date and seat details', async () => {
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        tripId: testTrip._id,
        seatNumbers: ['1B'],
        passengerDetails: [
          { name: 'Alice Smith', age: 28, gender: 'Female', seatNumber: '1B' }
        ],
        boardingPoint: testRoute.boardingPoints[0],
        droppingPoint: testRoute.droppingPoints[0],
        contactPhone: '+91 9999911111',
        contactEmail: 'alice@example.com'
      });

    const pnr = bookingRes.body.booking.pnr;

    // Retrieve ticket by PNR
    const ticketRes = await request(app)
      .get(`/api/bookings/ticket/${pnr}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(ticketRes.status).toBe(200);
    const ticket = ticketRes.body.booking;

    expect(ticket.pnr).toBe(pnr);
    expect(ticket.passengerDetails[0].name).toBe('Alice Smith');
    expect(ticket.passengerDetails[0].seatNumber).toBe('1B');
    expect(ticket.seatNumbers).toEqual(['1B']);
    expect(ticket.trip.route.origin).toBe('Bangalore');
    expect(ticket.trip.route.destination).toBe('Hyderabad');
    expect(new Date(ticket.trip.departureTime).toISOString()).toBe(testTrip.departureTime.toISOString());
  });

  // =========================================================================
  // Acceptance Test 4: Cancellation changes seat availability & refund status
  // =========================================================================
  test('Acceptance Test 4: Cancellation changes seat availability and refund status according to the rule', async () => {
    // First, make a booking
    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        tripId: testTrip._id,
        seatNumbers: ['2B'],
        passengerDetails: [
          { name: 'Alice Smith', age: 28, gender: 'Female', seatNumber: '2B' }
        ],
        boardingPoint: testRoute.boardingPoints[0],
        droppingPoint: testRoute.droppingPoints[0],
        contactPhone: '+91 9999911111',
        contactEmail: 'alice@example.com'
      });

    const bookingId = bookRes.body.booking._id;

    // Trip departure is 30 hours away (> 24 hours), so refund policy rule specifies 90% refund
    const cancelRes = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Personal emergency' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);

    const cancelledBooking = cancelRes.body.booking;
    expect(cancelledBooking.status).toBe('CANCELLED');
    expect(cancelledBooking.cancellationDetails.refundPercentage).toBe(90);
    expect(cancelledBooking.cancellationDetails.refundAmount).toBe(900); // 90% of 1000
    expect(cancelledBooking.cancellationDetails.cancellationFee).toBe(100);
    expect(cancelledBooking.cancellationDetails.refundStatus).toBe('PROCESSED');

    // Verify seat 2B is freed and available again for other passengers
    const refreshedTrip = await Trip.findById(testTrip._id);
    const seat2B = refreshedTrip.seats.find((s) => s.seatNumber === '2B');
    expect(seat2B.status).toBe('AVAILABLE');
    expect(seat2B.bookingId).toBeNull();
  });

  // =========================================================================
  // Acceptance Test 5: Manifest and Occupancy summaries reconcile with confirmed tickets
  // =========================================================================
  test('Acceptance Test 5: Operator manifest and occupancy summaries reconcile with confirmed tickets', async () => {
    // Customer 1 books seat 1A and 1B
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        tripId: testTrip._id,
        seatNumbers: ['1A', '1B'],
        passengerDetails: [
          { name: 'Alice Smith', age: 28, gender: 'Female', seatNumber: '1A' },
          { name: 'Charlie Smith', age: 30, gender: 'Male', seatNumber: '1B' }
        ],
        boardingPoint: testRoute.boardingPoints[0],
        droppingPoint: testRoute.droppingPoints[0],
        contactPhone: '+91 9999911111',
        contactEmail: 'alice@example.com'
      });

    // Customer 2 books seat 2A
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        tripId: testTrip._id,
        seatNumbers: ['2A'],
        passengerDetails: [
          { name: 'Bob Jones', age: 35, gender: 'Male', seatNumber: '2A' }
        ],
        boardingPoint: testRoute.boardingPoints[0],
        droppingPoint: testRoute.droppingPoints[0],
        contactPhone: '+91 9999922222',
        contactEmail: 'bob@example.com'
      });

    // Operator requests passenger manifest
    const manifestRes = await request(app)
      .get(`/api/reports/manifest/${testTrip._id}`)
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(manifestRes.status).toBe(200);
    expect(manifestRes.body.success).toBe(true);
    expect(manifestRes.body.manifest.totalConfirmedPassengers).toBe(3);

    const passengerNames = manifestRes.body.manifest.passengers.map((p) => p.passengerName);
    expect(passengerNames).toContain('Alice Smith');
    expect(passengerNames).toContain('Charlie Smith');
    expect(passengerNames).toContain('Bob Jones');

    // Operator requests occupancy summary
    const occupancyRes = await request(app)
      .get('/api/reports/occupancy')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(occupancyRes.status).toBe(200);
    expect(occupancyRes.body.summary.totalBookedSeats).toBe(3);
    expect(occupancyRes.body.summary.totalCapacity).toBe(4);
    // Occupancy rate = 3 / 4 = 75.0%
    expect(occupancyRes.body.summary.overallOccupancyRate).toBe(75.0);
    // Total Revenue = 3 * 1000 = 3000
    expect(occupancyRes.body.summary.totalRevenue).toBe(3000);
  });
});

