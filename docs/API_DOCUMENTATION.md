# API Documentation & Contracts

Base URL: `http://localhost:5000/api`

---

## 1. Authentication Endpoints

### Register User
- **POST** `/auth/register`
- **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "phone": "+91 9876543210",
    "role": "customer"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Registration successful",
    "token": "eyJhbGciOi...",
    "user": { "id": "...", "name": "John Doe", "email": "john@example.com", "role": "customer" }
  }
  ```

### User Login
- **POST** `/auth/login`
- **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "Password123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOi...",
    "user": { "id": "...", "name": "John Doe", "role": "customer" }
  }
  ```

---

## 2. Trip Endpoints

### Search Trips
- **GET** `/trips/search?origin=Bangalore&destination=Hyderabad&date=2026-11-08&sortBy=departure`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "count": 2,
    "trips": [
      {
        "_id": "672db1a9f0e1a2b3c4d5e6f7",
        "tripCode": "TRIP-BLRHYD-01",
        "departureTime": "2026-11-08T18:00:00.000Z",
        "arrivalTime": "2026-11-09T03:00:00.000Z",
        "baseFare": 1100,
        "availableSeats": 34,
        "durationFormatted": "9h 0m",
        "operator": { "name": "SRS Travels", "rating": 4.7 },
        "bus": { "busNumber": "KA-01-FA-1234", "busType": "Volvo Multi-Axle AC" }
      }
    ]
  }
  ```

### Get Trip Details (Seat Map & Status)
- **GET** `/trips/:id`
- **Response `200 OK`**: Returns trip with full seat matrix including statuses (`AVAILABLE` or `BOOKED`).

---

## 3. Booking Endpoints

### Create Booking (Atomic Concurrency Protected)
- **POST** `/bookings`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "tripId": "672db1a9f0e1a2b3c4d5e6f7",
    "seatNumbers": ["1A", "1B"],
    "passengerDetails": [
      { "name": "John Doe", "age": 30, "gender": "Male", "seatNumber": "1A" },
      { "name": "Alice Doe", "age": 28, "gender": "Female", "seatNumber": "1B" }
    ],
    "boardingPoint": { "name": "Majestic Bus Stand", "time": "2026-11-08T18:00:00.000Z" },
    "droppingPoint": { "name": "Ameerpet Metro", "time": "2026-11-09T03:00:00.000Z" },
    "contactPhone": "+91 9876543210",
    "contactEmail": "john@example.com"
  }
  ```
- **Success Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Booking confirmed successfully!",
    "booking": {
      "_id": "672db1a9f0e1a2b3c4d5e6f8",
      "pnr": "PNR-20261108-A1B2",
      "status": "CONFIRMED",
      "seatNumbers": ["1A", "1B"],
      "totalAmount": 2200
    }
  }
  ```
- **Conflict Response `409 Conflict` (Simultaneous seat attempt)**:
  ```json
  {
    "success": false,
    "message": "Concurrency conflict: One or more of the selected seats were just booked by another user. Please choose another seat."
  }
  ```

### Cancel Booking (With Refund Math)
- **PATCH** `/bookings/:id/cancel`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "reason": "Change in itinerary" }`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Booking cancelled successfully. Refund processed according to cancellation rules.",
    "booking": {
      "status": "CANCELLED",
      "cancellationDetails": {
        "refundPercentage": 90,
        "refundAmount": 1980,
        "cancellationFee": 220,
        "refundStatus": "PROCESSED"
      }
    }
  }
  ```

---

## 4. Operator Reporting & Manifest Endpoints

### Get Passenger Manifest (Acceptance Test #5)
- **GET** `/reports/manifest/:tripId`
- **Headers**: `Authorization: Bearer <operator_or_admin_token>`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "trip": {
      "tripCode": "TRIP-BLRHYD-01",
      "totalSeats": 36,
      "bookedSeats": 12,
      "occupancyPercentage": 33.3
    },
    "manifest": {
      "totalConfirmedPassengers": 12,
      "passengers": [
        {
          "seatNumber": "1A",
          "passengerName": "John Doe",
          "age": 30,
          "gender": "Male",
          "pnr": "PNR-20261108-A1B2",
          "boardingPoint": "Majestic Bus Stand",
          "droppingPoint": "Ameerpet Metro",
          "status": "CONFIRMED"
        }
      ]
    }
  }
  ```

### Get Occupancy Summary (Acceptance Test #5)
- **GET** `/reports/occupancy`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "summary": {
      "totalTrips": 4,
      "totalCapacity": 144,
      "totalBookedSeats": 42,
      "overallOccupancyRate": 29.2,
      "totalRevenue": 46200
    },
    "reports": [...]
  }
  ```

