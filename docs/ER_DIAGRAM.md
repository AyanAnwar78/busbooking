# Entity-Relationship (ER) Diagram
## Bus Booking Management System

```mermaid
erDiagram
    USER ||--o{ BOOKING : "places"
    USER ||--o{ AUDIT_LOG : "triggers"
    OPERATOR ||--o{ BUS : "owns"
    OPERATOR ||--o{ TRIP : "operates"
    OPERATOR ||--o{ USER : "employs"
    BUS ||--o{ TRIP : "assigned_to"
    ROUTE ||--o{ TRIP : "defines_path"
    TRIP ||--o{ BOOKING : "has"
    BOOKING ||--o{ AUDIT_LOG : "generates"

    USER {
        ObjectId _id PK
        string name "Full Name"
        string email UK "Unique Email"
        string password "Bcrypt Hashed"
        string phone "Contact Number"
        string role "customer | operator | admin"
        ObjectId operator FK "Reference to Operator"
        Date createdAt
        Date updatedAt
    }

    OPERATOR {
        ObjectId _id PK
        string name UK "Company Name"
        string contactEmail
        string contactPhone
        string licenseNumber
        number rating "1.0 - 5.0"
        boolean isActive
        Date createdAt
        Date updatedAt
    }

    BUS {
        ObjectId _id PK
        string busNumber UK "Registration Number"
        ObjectId operator FK "Ref to Operator"
        string busType "AC Sleeper | AC Seater | Electric"
        number totalSeats "1 - 60"
        string layoutType "2x2 | sleeper_2x1"
        array seats "Subdocument layout: seatNo, row, col, type, multiplier"
        array amenities "WiFi, Charging Point, Water Bottle"
        boolean isActive
        Date createdAt
        Date updatedAt
    }

    ROUTE {
        ObjectId _id PK
        string origin "Origin City"
        string destination "Destination City"
        number distanceKm
        number estimatedDurationMinutes
        array boardingPoints "name, landmark, timeOffsetMinutes"
        array droppingPoints "name, landmark, timeOffsetMinutes"
        boolean isActive
        Date createdAt
        Date updatedAt
    }

    TRIP {
        ObjectId _id PK
        string tripCode UK "Unique Trip Identifier"
        ObjectId bus FK "Ref to Bus"
        ObjectId operator FK "Ref to Operator"
        ObjectId route FK "Ref to Route"
        Date departureTime
        Date arrivalTime
        number baseFare
        string status "SCHEDULED | BOARDING | IN_TRANSIT | COMPLETED | CANCELLED"
        array seats "Subdocument: seatNo, fare, status, bookingId"
        number totalSeats
        number availableSeatCount
        object cancellationPolicy "Configurable refund rules"
        Date createdAt
        Date updatedAt
    }

    BOOKING {
        ObjectId _id PK
        string pnr UK "Unique PNR Reference (e.g. PNR-20261108-XXXX)"
        ObjectId trip FK "Ref to Trip"
        ObjectId user FK "Ref to User"
        array passengerDetails "name, age, gender, seatNumber"
        array seatNumbers "Allocated seat labels"
        object boardingPoint "name, time, landmark"
        object droppingPoint "name, time, landmark"
        number totalAmount
        string paymentStatus "PAID | REFUNDED | PARTIALLY_REFUNDED"
        string status "CONFIRMED | CANCELLED"
        object cancellationDetails "refundAmount, refundPercentage, cancellationFee, refundStatus"
        string contactPhone
        string contactEmail
        Date createdAt
        Date updatedAt
    }

    AUDIT_LOG {
        ObjectId _id PK
        string action "BOOKING_CREATED | BOOKING_CANCELLED | TRIP_CREATED | etc."
        string entityType "Booking | Trip | User | Bus | Route"
        ObjectId entityId
        object performedBy "userId, name, email, role"
        object details "Action snapshot payload"
        string ipAddress
        Date timestamp
    }
```

---

### Key Relationships & Data Integrity Constraints

1. **Atomic Concurrency Protection**:
   - `Trip.seats` stores each seat's real-time reservation status (`AVAILABLE` vs `BOOKED`) and the associated `bookingId`.
   - Seat reservation executes via atomic document matching (`seats: { $all: [{ $elemMatch: { seatNumber: 'X', status: 'AVAILABLE' } }] }`), guaranteeing zero double-bookings under concurrent requests.
2. **Cancellation & Inventory Release**:
   - Cancelling a booking updates `Booking.status = 'CANCELLED'`, computes the refund according to `Trip.cancellationPolicy.rules`, and atomically resets `Trip.seats.status = 'AVAILABLE'` and increments `availableSeatCount`.
3. **Compound Indexes**:
   - `Route`: `{ origin: 1, destination: 1 }`
   - `Trip`: `{ route: 1, departureTime: 1, status: 1 }`
   - `Booking`: `{ pnr: 1 }` (Unique), `{ user: 1, createdAt: -1 }`, `{ trip: 1, status: 1 }`
   - `AuditLog`: `{ entityType: 1, entityId: 1 }`, `{ timestamp: -1 }`

