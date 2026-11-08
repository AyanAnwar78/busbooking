# Interview Walkthrough & Live Debugging Preparation Guide
**Advanced Individual Project Assessment — Bus Booking Management System**

This guide prepares you for both parts of your evaluation:
1. **The 3–5 Minute Walkthrough Video**
2. **The 15-minute Technical Walkthrough Interview**
3. **The 10-minute Live Change / Debugging Task**

---

## 📹 Part 1: 3–5 Minute Walkthrough Video Script

Record your screen using OBS, Loom, or Windows Game Bar (`Win + G`).

### Scene 1: Introduction & Architecture Overview (0:00 - 0:45)
* **What to show**: VS Code showing the repository root and `docs/ARCHITECTURE.md`.
* **What to say**:
  > *"Hello! My name is [Your Name], and this is my submission for the Bus Booking Management System built with the MERN stack. The project is structured as a modular monolith separating UI, business logic, and MongoDB persistence. Today I will demonstrate the complete customer journey, operator analytics, and how our atomic concurrency locking prevents double-bookings."*

### Scene 2: Customer Journey — Search & Seat Selection (0:45 - 2:00)
* **What to show**: Browser at `http://localhost:5173`.
* **What to say**:
  > *"Starting as a passenger, I search for Bangalore to Hyderabad. Here we see scheduled trips with real-time seat availability, departure times, and prices. Clicking 'Select Seats' opens our interactive bus layout. Notice the visual 2x2 layout, aisle, and driver cabin. I will pick seats 1A and 1B. As I select them, the passenger manifest form dynamically prompts for passenger details, age, gender, and boarding stops."*
* **Action**: Click "Confirm Booking & Generate PNR". Show the confirmed ticket with unique PNR (e.g. `PNR-20261108-XXXX`).

### Scene 3: Concurrency & Duplicate Booking Prevention (2:00 - 3:00)
* **What to show**: Split-screen with two browser windows or terminal test.
* **What to say**:
  > *"Data integrity is a critical requirement of this brief: two users must not confirm the same seat simultaneously. In `bookingService.js`, we use MongoDB atomic conditional updates (`findOneAndUpdate`) matching `{ seats: { $all: [{ $elemMatch: { seatNumber: '2A', status: 'AVAILABLE' } }] } }`. In our automated test suite, two concurrent asynchronous requests compete for seat 2A. Exactly one receives 201 Created and the other receives 409 Conflict. Zero duplicate bookings can ever occur."*

### Scene 4: Operator Portal, Manifests & Occupancy (3:00 - 4:15)
* **What to show**: Log in as `operator@kallada.com` using the 1-Click Demo Login.
* **What to say**:
  > *"Switching to the Operator Portal, fleet managers have a live dashboard showing overall fleet occupancy rate, total revenue, and route schedules. Clicking 'Manifest' opens the official passenger manifest. Conductors can search passengers by seat, PNR, or name, and export to CSV or print directly."*

### Scene 5: Automated Cancellation & Refund Rule (4:15 - 5:00)
* **What to show**: Customer My Bookings page -> Click "Cancel Booking".
* **What to say**:
  > *"Finally, cancellation policy rules are automated: cancelling more than 24 hours before departure computes a 90% refund, while under 12 hours yields 0%. Upon cancellation, the seats immediately revert to available in the database pool for other passengers. All 5 acceptance tests pass hermetically in our test suite. Thank you!"*

---

## 🎙️ Part 2: 15-Minute Technical Walkthrough Q&A

### Q1: "How do you guarantee that two users cannot book the same seat simultaneously?"
* **Answer**:
  > *"We avoid standard 'check-then-act' patterns which are prone to race conditions. Instead, we use MongoDB's single-document atomic operations via `Trip.findOneAndUpdate`. The query condition specifies `seats: { $all: [{ $elemMatch: { seatNumber, status: 'AVAILABLE' } }] }`. If another user booked the seat 1 millisecond earlier, the condition fails to match, returning `null`. Our service immediately catches this and responds with HTTP `409 Conflict`. No locks or external mutexes are needed because MongoDB handles document-level write locks atomically."*

### Q2: "How is Authorization enforced?"
* **Answer**:
  > *"We enforce authorization on the server via our `authenticate` and `authorize('admin', 'operator')` Express middlewares. The JWT is verified, the user is looked up in the database, and their assigned `role` is validated against the allowed roles for that route. Hiding UI buttons in React is only for UX; an unauthorized customer hitting `/api/reports/manifest` directly with curl will receive `403 Forbidden`."*

### Q3: "Explain how your cancellation and refund logic works."
* **Answer**:
  > *"Each trip has a configurable `cancellationPolicy.rules` array with threshold hours and refund percentages. When a cancellation request arrives, `refundService.calculateRefund()` computes the delta between `trip.departureTime` and current time. It picks the matching tier, calculates `refundAmount = (totalAmount * refundPercentage) / 100`, updates the booking status to `CANCELLED`, and atomically sets `seats.$[elem].status = 'AVAILABLE'` while incrementing `availableSeatCount`."*

---

## 🛠️ Part 3: 10-Minute Live Debugging Task Cheat Sheet

During the live coding task, the reviewer may ask you to make a small change to verify you wrote and understand the code. Here are the 4 most common scenarios and their exact solutions:

### Scenario A: "Add a 10% Early Bird Discount Coupon ('EARLY10')"
* **File to modify**: `backend/src/services/bookingService.js`
* **Change**:
  ```javascript
  // In createBooking function, accept couponCode in arguments:
  const discountMultiplier = couponCode === 'EARLY10' ? 0.9 : 1.0;
  totalAmount = Math.round(totalAmount * discountMultiplier);
  ```

### Scenario B: "Change the cancellation rule so cancellations > 48 hours get a 100% full refund"
* **File to modify**: `backend/src/services/refundService.js`
* **Change**:
  ```javascript
  // Update the default rules array:
  const rules = [
    { minHoursBefore: 48, refundPercentage: 100 },
    { minHoursBefore: 24, refundPercentage: 90 },
    { minHoursBefore: 12, refundPercentage: 50 },
    { minHoursBefore: 0, refundPercentage: 0 }
  ];
  ```

### Scenario C: "Prevent bookings if the trip departure time is in the past"
* **File to modify**: `backend/src/services/bookingService.js`
* **Change**:
  ```javascript
  if (new Date(trip.departureTime).getTime() <= Date.now()) {
    const error = new Error('Cannot book tickets for past or departed trips.');
    error.statusCode = 400;
    throw error;
  }
  ```

### Scenario D: "Add gender filter to passenger manifest"
* **File to modify**: `frontend/src/pages/ManifestPage.jsx`
* **Change**:
  ```javascript
  // In filteredPassengers filter function:
  if (selectedGender && selectedGender !== 'ALL') {
    return p.gender === selectedGender;
  }
  ```
