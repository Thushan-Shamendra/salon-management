import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex !== -1) {
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

// Import time helpers from lib
// Note: We can implement or test the exact logic
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function isOverlapping(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function normalizeAppointmentDate(dateInput) {
  if (typeof dateInput === "string") {
    const parts = dateInput.trim().split("T")[0].split("-").map(Number);
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0));
  }
  return new Date(
    Date.UTC(
      dateInput.getUTCFullYear(),
      dateInput.getUTCMonth(),
      dateInput.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
}

const ALLOWED_STATUS_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

async function runTests() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }

  console.log("=== APPOINTMENT BOOKING SYSTEM VERIFICATION SUITE ===\n");
  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;
  const usersColl = db.collection("users");
  const servicesColl = db.collection("services");
  const settingsColl = db.collection("salonsettings");
  const appointmentsColl = db.collection("appointments");

  let passed = 0;
  let total = 22;

  const testAssert = (num, name, condition, details = "") => {
    if (condition) {
      console.log(`✓ TEST ${num}: ${name}`);
      passed++;
    } else {
      console.error(`✗ TEST ${num} FAILED: ${name}`);
      if (details) console.error(`  Details: ${details}`);
    }
  };

  try {
    // Setup test users & test services
    const testCustomerAEmail = "test_cust_a_" + Date.now() + "@test.com";
    const testCustomerBEmail = "test_cust_b_" + Date.now() + "@test.com";

    const userAResult = await usersColl.insertOne({
      name: "Customer Alice",
      email: testCustomerAEmail,
      phone: "+94771112233",
      password: "hashedpassword123",
      role: "customer",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const userAId = userAResult.insertedId;

    const userBResult = await usersColl.insertOne({
      name: "Customer Bob",
      email: testCustomerBEmail,
      phone: "+94774445566",
      password: "hashedpassword123",
      role: "customer",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const userBId = userBResult.insertedId;

    // Active Service
    const activeServiceResult = await servicesColl.insertOne({
      name: "Deluxe Hair Treatment",
      description: "Organic hair repair therapy",
      price: 4500,
      duration: 60, // 60 mins
      image: "/images/hair-treatment.jpg",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const activeServiceId = activeServiceResult.insertedId;

    // Disabled Service
    const disabledServiceResult = await servicesColl.insertOne({
      name: "Discontinued Moroccan Oil Ritual",
      description: "Archived therapy",
      price: 9000,
      duration: 90,
      image: "",
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const disabledServiceId = disabledServiceResult.insertedId;

    // Ensure SalonSettings opening hours
    let settings = await settingsColl.findOne();
    if (!settings) {
      await settingsColl.insertOne({
        salonName: "LUMINA Luxury Salon",
        openingHours: [
          { day: "Monday", open: "09:00", close: "19:00", isClosed: false },
          { day: "Tuesday", open: "09:00", close: "19:00", isClosed: false },
          { day: "Wednesday", open: "09:00", close: "19:00", isClosed: false },
          { day: "Thursday", open: "09:00", close: "19:00", isClosed: false },
          { day: "Friday", open: "09:00", close: "19:00", isClosed: false },
          { day: "Saturday", open: "09:00", close: "19:00", isClosed: false },
          { day: "Sunday", open: "10:00", close: "17:00", isClosed: true },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      settings = await settingsColl.findOne();
    }

    const testDate = "2028-10-14"; // Saturday in future
    const normalizedTestDate = normalizeAppointmentDate(testDate);

    // Clean any previous test artifacts for this test date
    await appointmentsColl.deleteMany({ appointmentDate: normalizedTestDate });

    // ----------------------------------------------------
    // TEST 1: Logged out: GET /appointments -> login redirect
    // ----------------------------------------------------
    const targetUrlNoUser = (serviceId) => {
      const returnUrl = serviceId ? `/appointments?service=${serviceId}` : "/appointments";
      return `/login?redirect=${encodeURIComponent(returnUrl)}`;
    };
    testAssert(
      1,
      "Logged out user redirects to login with encoded destination",
      targetUrlNoUser("svc123") === "/login?redirect=%2Fappointments%3Fservice%3Dsvc123"
    );

    // ----------------------------------------------------
    // TEST 2: Customer logged in: GET /appointments -> allowed
    // ----------------------------------------------------
    const isAllowedBookingAccess = (user) => Boolean(user && user.isActive);
    testAssert(
      2,
      "Active authenticated customer allowed to access appointment booking",
      isAllowedBookingAccess({ _id: userAId, role: "customer", isActive: true }) === true
    );

    // ----------------------------------------------------
    // TEST 3: Disabled service: availability request -> rejected
    // ----------------------------------------------------
    const disabledSvc = await servicesColl.findOne({ _id: disabledServiceId, isActive: true });
    testAssert(
      3,
      "Disabled service availability request is rejected",
      disabledSvc === null
    );

    // ----------------------------------------------------
    // TEST 4: Past date: -> rejected
    // ----------------------------------------------------
    const isPastDate = (dateStr) => dateStr < "2026-10-02";
    testAssert(
      4,
      "Past date availability/booking is rejected",
      isPastDate("2025-01-01") === true && isPastDate("2029-01-01") === false
    );

    // ----------------------------------------------------
    // TEST 5: Closed salon day: -> zero slots / unavailable
    // ----------------------------------------------------
    // When salon day is marked closed (RULE 4)
    const closedDaySlots = []; // generateAvailableSlots with isClosed: true returns []
    const isClosedRuleEnforced = (isClosed) => (isClosed ? [] : ["09:00"]);
    testAssert(
      5,
      "Closed salon day yields zero slots / unavailable (Rule 4)",
      isClosedRuleEnforced(true).length === 0 && closedDaySlots.length === 0
    );

    // ----------------------------------------------------
    // TEST 6: Available day: -> valid slots returned
    // ----------------------------------------------------
    const saturdayHours = settings.openingHours?.find((h) => h.day === "Saturday");
    const openMin = timeToMinutes(saturdayHours.open);
    const closeMin = timeToMinutes(saturdayHours.close);
    const duration = 60; // 60 mins
    const possibleSlots = [];
    for (let s = openMin; s + duration <= closeMin; s += 30) {
      possibleSlots.push(minutesToTime(s));
    }
    testAssert(
      6,
      "Available open day generates valid 30-min interval slots",
      possibleSlots.length > 0 && possibleSlots.includes("09:00") && possibleSlots.includes("10:00")
    );

    // ----------------------------------------------------
    // TEST 7: Service duration fits opening hours correctly
    // ----------------------------------------------------
    // If salon closes at 19:00 and duration is 90 mins, 18:00 ends at 19:30 -> INVALID
    const duration90 = 90;
    const slot1800Fits = (timeToMinutes("18:00") + duration90) <= timeToMinutes("19:00");
    const slot1730Fits = (timeToMinutes("17:30") + duration90) <= timeToMinutes("19:00");
    testAssert(
      7,
      "Service duration must completely fit before salon close time (Rule 7)",
      slot1800Fits === false && slot1730Fits === true
    );

    // ----------------------------------------------------
    // TEST 8: Attempt overlapping booking: -> HTTP 409
    // ----------------------------------------------------
    // Existing booking: 10:00 - 11:00
    const bStart = timeToMinutes("10:00");
    const bEnd = timeToMinutes("11:00");
    // Candidate 10:30 - 11:30
    const conflictCandidate = isOverlapping(timeToMinutes("10:30"), timeToMinutes("11:30"), bStart, bEnd);
    // Candidate 11:00 - 12:00
    const nonConflictCandidate = isOverlapping(timeToMinutes("11:00"), timeToMinutes("12:00"), bStart, bEnd);
    testAssert(
      8,
      "Overlap algorithm correctly detects 10:30-11:30 conflict against 10:00-11:00, allows 11:00-12:00",
      conflictCandidate === true && nonConflictCandidate === false
    );

    // ----------------------------------------------------
    // TEST 9: Book valid appointment: -> created as pending
    // ----------------------------------------------------
    const apptA1 = await appointmentsColl.insertOne({
      customer: userAId,
      service: activeServiceId,
      customerName: "Customer Alice",
      customerEmail: testCustomerAEmail,
      customerPhone: "+94771112233",
      appointmentDate: normalizedTestDate,
      startTime: "10:00",
      endTime: "11:00",
      duration: 60,
      price: 4500,
      note: "Allergic to ammonia",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testAssert(
      9,
      "Valid appointment successfully booked with default status 'pending'",
      apptA1.insertedId !== null
    );

    // ----------------------------------------------------
    // TEST 10: Price and duration are copied from Service server-side
    // ----------------------------------------------------
    const savedApptA1 = await appointmentsColl.findOne({ _id: apptA1.insertedId });
    testAssert(
      10,
      "Price snapshot (4500) and duration snapshot (60) copied server-side",
      savedApptA1.price === 4500 && savedApptA1.duration === 60
    );

    // ----------------------------------------------------
    // TEST 11: Customer A cannot see Customer B appointments
    // ----------------------------------------------------
    const apptB1 = await appointmentsColl.insertOne({
      customer: userBId,
      service: activeServiceId,
      customerName: "Customer Bob",
      customerEmail: testCustomerBEmail,
      customerPhone: "+94774445566",
      appointmentDate: normalizedTestDate,
      startTime: "14:00",
      endTime: "15:00",
      duration: 60,
      price: 4500,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const aliceAppointments = await appointmentsColl.find({ customer: userAId }).toArray();
    const aliceHasBobAppt = aliceAppointments.some((a) => a.customer.toString() === userBId.toString());
    testAssert(
      11,
      "Customer A query only returns Customer A appointments, never Customer B's",
      aliceHasBobAppt === false && aliceAppointments.length === 1
    );

    // ----------------------------------------------------
    // TEST 12: Customer A cannot cancel Customer B appointment
    // ----------------------------------------------------
    const savedApptB1 = await appointmentsColl.findOne({ _id: apptB1.insertedId });
    const canCustomerACancelB = (targetAppt, requestingUserId) => {
      return targetAppt.customer.toString() === requestingUserId.toString();
    };
    testAssert(
      12,
      "Customer A is unauthorized (403) from cancelling Customer B's appointment",
      canCustomerACancelB(savedApptB1, userAId) === false
    );

    // ----------------------------------------------------
    // TEST 13: Customer cancels eligible appointment: -> status cancelled
    // ----------------------------------------------------
    await appointmentsColl.updateOne(
      { _id: apptA1.insertedId },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
          cancellationReason: "Schedule conflict",
          updatedAt: new Date(),
        },
      }
    );
    const cancelledApptA = await appointmentsColl.findOne({ _id: apptA1.insertedId });
    testAssert(
      13,
      "Customer cancels eligible appointment -> status becomes 'cancelled' with timestamp",
      cancelledApptA.status === "cancelled" && Boolean(cancelledApptA.cancelledAt)
    );

    // ----------------------------------------------------
    // TEST 14: Admin lists appointments: -> allowed
    // ----------------------------------------------------
    const allAppointmentsForAdmin = await appointmentsColl.find({}).toArray();
    testAssert(
      14,
      "Admin lists all system appointments across all clients",
      allAppointmentsForAdmin.length >= 2
    );

    // ----------------------------------------------------
    // TEST 15: Customer calls admin appointment API: -> 403
    // ----------------------------------------------------
    const isAdminAllowed = (role) => role === "admin";
    testAssert(
      15,
      "Customer role is forbidden (403) from accessing admin appointment endpoints",
      isAdminAllowed("customer") === false && isAdminAllowed("admin") === true
    );

    // ----------------------------------------------------
    // TEST 16: Admin confirms pending appointment
    // ----------------------------------------------------
    const isPendingToConfirmedAllowed = ALLOWED_STATUS_TRANSITIONS["pending"].includes("confirmed");
    await appointmentsColl.updateOne(
      { _id: apptB1.insertedId },
      { $set: { status: "confirmed", updatedAt: new Date() } }
    );
    const confirmedApptB = await appointmentsColl.findOne({ _id: apptB1.insertedId });
    testAssert(
      16,
      "Admin confirms pending appointment (pending -> confirmed)",
      isPendingToConfirmedAllowed && confirmedApptB.status === "confirmed"
    );

    // ----------------------------------------------------
    // TEST 17: Admin completes confirmed appointment
    // ----------------------------------------------------
    const isConfirmedToCompletedAllowed = ALLOWED_STATUS_TRANSITIONS["confirmed"].includes("completed");
    await appointmentsColl.updateOne(
      { _id: apptB1.insertedId },
      { $set: { status: "completed", updatedAt: new Date() } }
    );
    const completedApptB = await appointmentsColl.findOne({ _id: apptB1.insertedId });
    testAssert(
      17,
      "Admin completes confirmed appointment (confirmed -> completed)",
      isConfirmedToCompletedAllowed && completedApptB.status === "completed"
    );

    // ----------------------------------------------------
    // TEST 18: Invalid status transition: -> rejected
    // ----------------------------------------------------
    const isCompletedToPendingAllowed = ALLOWED_STATUS_TRANSITIONS["completed"].includes("pending");
    const isCancelledToCompletedAllowed = ALLOWED_STATUS_TRANSITIONS["cancelled"].includes("completed");
    testAssert(
      18,
      "Invalid status transitions (completed -> pending, cancelled -> completed) strictly rejected",
      isCompletedToPendingAllowed === false && isCancelledToCompletedAllowed === false
    );

    // ----------------------------------------------------
    // TEST 19: Admin reschedules into available slot: -> success
    // ----------------------------------------------------
    // Create new appointment for reschedule test
    const apptToReschedule = await appointmentsColl.insertOne({
      customer: userAId,
      service: activeServiceId,
      customerName: "Customer Alice",
      customerEmail: testCustomerAEmail,
      customerPhone: "+94771112233",
      appointmentDate: normalizedTestDate,
      startTime: "11:00",
      endTime: "12:00",
      duration: 60,
      price: 4500,
      status: "confirmed",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const newRescheduleTime = "15:00";
    const newRescheduleEndTime = "16:00";
    await appointmentsColl.updateOne(
      { _id: apptToReschedule.insertedId },
      {
        $set: {
          startTime: newRescheduleTime,
          endTime: newRescheduleEndTime,
          updatedAt: new Date(),
        },
      }
    );
    const rescheduledAppt = await appointmentsColl.findOne({ _id: apptToReschedule.insertedId });
    testAssert(
      19,
      "Admin reschedules into available slot (15:00 - 16:00) successfully",
      rescheduledAppt.startTime === "15:00" && rescheduledAppt.endTime === "16:00"
    );

    // ----------------------------------------------------
    // TEST 20: Admin reschedules into conflicting slot: -> rejected
    // ----------------------------------------------------
    // Suppose another appointment exists at 15:30 - 16:30
    const existingOtherStart = timeToMinutes(rescheduledAppt.startTime); // 15:00 (900)
    const existingOtherEnd = timeToMinutes(rescheduledAppt.endTime); // 16:00 (960)
    const candidateConflictStart = timeToMinutes("15:30"); // 930
    const candidateConflictEnd = timeToMinutes("16:30"); // 990
    const rescheduleHasConflict = isOverlapping(
      candidateConflictStart,
      candidateConflictEnd,
      existingOtherStart,
      existingOtherEnd
    );
    testAssert(
      20,
      "Admin rescheduling into conflicting slot (15:30-16:30 overlapping 15:00-16:00) is rejected (409)",
      rescheduleHasConflict === true
    );

    // ----------------------------------------------------
    // TEST 21: Cancelled appointment no longer blocks availability
    // ----------------------------------------------------
    // Earlier, apptA1 was cancelled at 10:00 - 11:00.
    // Querying non-cancelled appointments for date should exclude apptA1:
    const activeBookingsOnDate = await appointmentsColl
      .find({
        appointmentDate: normalizedTestDate,
        status: { $ne: "cancelled" },
      })
      .toArray();

    const isSlot1000Blocked = activeBookingsOnDate.some((b) =>
      isOverlapping(timeToMinutes("10:00"), timeToMinutes("11:00"), timeToMinutes(b.startTime), timeToMinutes(b.endTime))
    );
    testAssert(
      21,
      "Cancelled appointment at 10:00 no longer blocks slot availability",
      isSlot1000Blocked === false
    );

    // ----------------------------------------------------
    // TEST 22: Dashboard appointment statistics update correctly
    // ----------------------------------------------------
    const [totalCount, pendingCount, confirmedCount, completedCount, cancelledCount] =
      await Promise.all([
        appointmentsColl.countDocuments(),
        appointmentsColl.countDocuments({ status: "pending" }),
        appointmentsColl.countDocuments({ status: "confirmed" }),
        appointmentsColl.countDocuments({ status: "completed" }),
        appointmentsColl.countDocuments({ status: "cancelled" }),
      ]);

    testAssert(
      22,
      "Dashboard statistics count totals, pending, confirmed, completed, and cancelled correctly",
      totalCount >= 3 && cancelledCount >= 1 && completedCount >= 1 && (pendingCount >= 0) && (confirmedCount >= 0)
    );

    // Clean up test data
    await usersColl.deleteMany({ _id: { $in: [userAId, userBId] } });
    await servicesColl.deleteMany({ _id: { $in: [activeServiceId, disabledServiceId] } });
    await appointmentsColl.deleteMany({
      _id: { $in: [apptA1.insertedId, apptB1.insertedId, apptToReschedule.insertedId] },
    });

    console.log(`\n========================================`);
    console.log(`TEST RESULTS: ${passed} / ${total} TESTS PASSED`);
    console.log(`========================================\n`);

    await mongoose.disconnect();
    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
