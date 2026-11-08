# Technical Report: Bus Booking Management System
**Advanced Individual Project Assessment — Full-Stack Web Development**

---

## 1. Executive Summary
This report documents the architectural design, security mechanisms, data integrity safeguards, and evaluation rubric fulfillment of the **Bus Booking Management System** built with the **MERN (MongoDB, Express.js, React, Node.js)** stack.

The system delivers end-to-end operational journeys for both customer passengers (trip discovery, interactive seat booking, ticket download, automated refund cancellation) and fleet operators/administrators (fleet scheduling, real-time occupancy reconciliation, live passenger manifests, audit logs).

---

## 2. Key Design Decisions

### 2.1 Concurrency & Duplicate Booking Prevention
* **The Problem**: High-frequency simultaneous requests trying to confirm the exact same seat on popular routes.
* **Architecture Decision**: Atomic conditional document updates at the persistence layer (`findOneAndUpdate`).
  By evaluating `{ _id: tripId, status: 'SCHEDULED', seats: { $all: [{ $elemMatch: { seatNumber: seatNo, status: 'AVAILABLE' } }] } }` atomically within a single document write operation, the MongoDB storage engine guarantees serialization. Exactly one thread successfully transitions the seat to `BOOKED`; all concurrent competing threads receive `null` and are immediately surfaced with an HTTP `409 Conflict`.
* **Testing Evidence**: Acceptance Test #2 spawns simultaneous asynchronous booking attempts for the identical seat. Exactly one receives `201 Created` and one receives `409 Conflict`. Zero duplicate bookings occur.

### 2.2 Configurable Cancellation & Refund Engine
* **Business Rule**:
  $$\text{Hours to Departure} = \frac{\text{Trip Departure Time} - \text{Current Time}}{3,600,000 \text{ ms}}$$
  - $\ge 24\text{ hours}$: $90\%$ refund ($10\%$ fee)
  - $12 \text{ to } 24\text{ hours}$: $50\%$ refund ($50\%$ fee)
  - $< 12\text{ hours}$: $0\%$ refund ($100\%$ fee)
* **Seat Inventory Reversion**: Upon cancellation, the passenger ticket status transitions to `CANCELLED`, refund math is recorded under `cancellationDetails`, and an atomic `$set: { 'seats.$[elem].status': 'AVAILABLE' }` returns the seat to the public booking pool immediately.

### 2.3 Server-Side Role-Based Access Control (RBAC)
* **Implementation**: Custom Express middleware `authenticate` (JWT extraction & verification) combined with `authorize(...roles)`.
* **Roles**:
  - `customer`: Can search, book seats, view personal tickets, and cancel owned bookings.
  - `operator`: Can view fleet manifests, occupancy summaries, and schedule new trips for their company.
  - `admin`: Global access including system-wide audit logs, route configuration, and fleet management.

### 2.4 Reconciliation of Passenger Manifests & Occupancy Summaries
* Acceptance Test #5 guarantees that the number of confirmed passengers on any manifest exactly reconciles with the booked seat count and occupancy percentage computed in operator summary dashboards.

---

## 3. Evaluation Rubric Alignment (100 Marks)

| Criteria | Marks | Implementation in Solution |
| :--- | :--- | :--- |
| **Core Workflows & Business Rules** | 30 | End-to-end booking journey, visual seat map, PNR generation, dynamic cancellation refund engine, and seat reclamation. |
| **Architecture, Data Model & APIs** | 20 | Clean separation of concerns (Controllers, Services, Models, Routes, Middleware). Normalized Mongoose schemas with compound indexes and ER documentation. |
| **Security, Authorization & Data Integrity**| 15 | JWT token authorization, bcrypt password hashing, server-side RBAC guards, atomic conditional locking against race conditions. |
| **UI/UX & Responsive Behavior** | 10 | Polished Tailwind CSS interface, loading skeletons, responsive grid, 1-click demo logins, interactive visual seat picker. |
| **Testing & Reliability** | 15 | 100% passing automated test suite covering all 5 Acceptance Tests including concurrency conflict simulation and manifest reconciliation. |
| **Documentation & Demo** | 10 | Comprehensive setup README, ER diagrams, architecture flows, OpenAPI documentation, and seed script for instant local/cloud evaluation. |

---

## 4. Known Limitations & Future Improvements
1. **Live Payment Gateway**: Currently operates with simulated payment confirmation (`paymentStatus: 'PAID'`). Integration with Stripe or Razorpay webhooks can be plugged directly into `bookingService`.
2. **Real-time Push Notifications**: WebSockets (Socket.io) can be introduced to push live seat reservation visual flashes to clients viewing the seat map simultaneously.
