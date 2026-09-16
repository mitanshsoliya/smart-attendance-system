const crypto = require("crypto");

const BASE = "http://localhost:5000";

async function runIdentityLockTestSuite() {
  console.log("=======================================================================");
  console.log("=== RUNNING 12-POINT IDENTITY MANIPULATION & ATTENDANCE LOCK SUITE ===");
  console.log("=======================================================================\n");

  let passCount = 0;
  let totalCount = 0;

  function assert(name, condition, extra = "") {
    totalCount++;
    if (condition) {
      passCount++;
      console.log(`  [PASS ${String(totalCount).padStart(2, "0")}] ${name}${extra ? " -> " + extra : ""}`);
    } else {
      console.error(`  [FAIL ${String(totalCount).padStart(2, "0")}] ${name}${extra ? " -> " + extra : ""}`);
    }
  }

  try {
    const ts = Date.now();
    const studentAEmail = `std.a.${ts}@univ.edu`;
    const studentBEmail = `std.b.${ts}@univ.edu`;
    const studentCEmail = `std.c.${ts}@univ.edu`;
    const studentDEmail = `std.d.${ts}@univ.edu`;
    const defaultPassword = "password123!";

    console.log("--- Setup: Registering Test Students, Faculty & HOD ---");

    // Register Student A
    const regARes = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Student Alpha",
        email: studentAEmail,
        password: defaultPassword,
        role: "STUDENT",
        roll_number: `2026-CSE-A${ts.toString().slice(-4)}`,
        section: "Sec A",
      }),
    });
    assert("Registered Student A", regARes.status === 201);

    // Register Student B (victim)
    const regBRes = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Student Beta",
        email: studentBEmail,
        password: defaultPassword,
        role: "STUDENT",
        roll_number: `2026-CSE-B${ts.toString().slice(-4)}`,
        section: "Sec A",
      }),
    });
    assert("Registered Student B", regBRes.status === 201);

    // Register Student C
    const regCRes = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Student Charlie",
        email: studentCEmail,
        password: defaultPassword,
        role: "STUDENT",
        roll_number: `2026-CSE-C${ts.toString().slice(-4)}`,
        section: "Sec A",
      }),
    });
    assert("Registered Student C", regCRes.status === 201);

    // Register Student D
    const regDRes = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Student Delta",
        email: studentDEmail,
        password: defaultPassword,
        role: "STUDENT",
        roll_number: `2026-CSE-D${ts.toString().slice(-4)}`,
        section: "Sec A",
      }),
    });
    assert("Registered Student D", regDRes.status === 201);

    // Login HOD
    const hodRes = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "hod@example.com", password: "hod123" }),
    });
    const hodData = await hodRes.json();
    const hodToken = hodData.token;
    assert("HOD authenticated", hodRes.status === 200 && Boolean(hodToken));

    // Login Faculty
    const facRes = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "faculty@example.com", password: "faculty123" }),
    });
    const facData = await facRes.json();
    const facToken = facData.token;
    assert("Faculty authenticated", facRes.status === 200 && Boolean(facToken));

    // Login Students to get JWTs and bind device tokens
    const loginA = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: studentAEmail, password: defaultPassword }),
    });
    const loginAData = await loginA.json();
    let studentAToken = loginAData.token;
    const studentADevice = loginAData.device_token;

    const loginB = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: studentBEmail, password: defaultPassword }),
    });
    const loginBData = await loginB.json();
    const studentBToken = loginBData.token;

    const loginC = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: studentCEmail, password: defaultPassword }),
    });
    const loginCData = await loginC.json();
    const studentCToken = loginCData.token;

    const loginD = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: studentDEmail, password: defaultPassword }),
    });
    const loginDData = await loginD.json();
    const studentDToken = loginDData.token;

    // Fetch HOD student directory to obtain database IDs & roll numbers
    const rosterRes = await fetch(`${BASE}/hod/students`, {
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const rosterData = await rosterRes.json();
    const studentList = rosterData.students || rosterData || [];
    const recordA = studentList.find((s) => s.email === studentAEmail);
    const recordB = studentList.find((s) => s.email === studentBEmail);
    const recordC = studentList.find((s) => s.email === studentCEmail);
    const recordD = studentList.find((s) => s.email === studentDEmail);

    assert("Found all student records in database", Boolean(recordA && recordB && recordC && recordD));

    // Setup Course & Lecture
    const subCode = `CS${Math.floor(100 + Math.random() * 900)}`;
    const subRes = await fetch(`${BASE}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facToken}` },
      body: JSON.stringify({ subject_code: subCode, subject_name: "Advanced Distributed Systems" }),
    });
    const subData = await subRes.json();
    const subId = subData.subject ? subData.subject.id : subData.id;

    // Enroll students
    await fetch(`${BASE}/subjects/${subId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facToken}` },
      body: JSON.stringify({ student_id: recordA.id }),
    });
    await fetch(`${BASE}/subjects/${subId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facToken}` },
      body: JSON.stringify({ student_id: recordB.id }),
    });
    await fetch(`${BASE}/subjects/${subId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facToken}` },
      body: JSON.stringify({ student_id: recordC.id }),
    });
    await fetch(`${BASE}/subjects/${subId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facToken}` },
      body: JSON.stringify({ student_id: recordD.id }),
    });

    const today = new Date().toISOString().split("T")[0];
    const lec1Res = await fetch(`${BASE}/lectures/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facToken}` },
      body: JSON.stringify({ subject_id: subId, lecture_date: today, start_time: "09:00:00", end_time: "10:30:00" }),
    });
    const lec1Data = await lec1Res.json();
    const lecture1Id = lec1Data.lecture_id || lec1Data.id;

    const qr1Res = await fetch(`${BASE}/qr-session/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facToken}` },
      body: JSON.stringify({
        lecture_id: lecture1Id,
        latitude: 23.0225,
        longitude: 72.5714,
        radius_meters: 500,
      }),
    });
    const qr1Data = await qr1Res.json();
    const sessionToken1 = qr1Data.session_token;

    // =========================================================================
    // TEST 1 — Normal student marks attendance (SUCCESS)
    // =========================================================================
    console.log("\n--- TEST 1: Normal Student Attendance ---");
    const test1Res = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({
        session_token: sessionToken1,
        latitude: 23.0225,
        longitude: 72.5714,
      }),
    });
    const test1Data = await test1Res.json();
    assert("TEST 1: Normal attendance marked successfully (201 Created)", test1Res.status === 201, `Attendance ID: ${test1Data.attendance_id}`);

    // =========================================================================
    // TEST 2 — Student ID manipulation (Student A tries to mark for Student B)
    // =========================================================================
    console.log("\n--- TEST 2: Student ID Manipulation ---");
    const test2Res = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentAToken}` },
      body: JSON.stringify({
        session_token: sessionToken1,
        latitude: 23.0225,
        longitude: 72.5714,
        student_id: recordB.id, // TAMPERING: attempting to mark Student B
      }),
    });
    const test2Data = await test2Res.json();
    assert(
      "TEST 2: Conflicting student_id rejected with 403 Forbidden",
      test2Res.status === 403 && test2Data.locked === true,
      `Message: ${test2Data.message}`
    );

    // Verify Student A is now locked in database
    const checkRosterA = await fetch(`${BASE}/hod/students`, {
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const rosterAfterA = await checkRosterA.json();
    const recordAAfter = (rosterAfterA.students || rosterAfterA).find((s) => s.id === recordA.id);
    assert("TEST 2: Student A attendance account is now LOCKED server-side", recordAAfter?.isAttendanceLocked === true);

    // =========================================================================
    // TEST 3 — User ID manipulation (Student C sends another student's user_id)
    // =========================================================================
    console.log("\n--- TEST 3: User ID Manipulation ---");
    const test3Res = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentCToken}` },
      body: JSON.stringify({
        session_token: sessionToken1,
        latitude: 23.0225,
        longitude: 72.5714,
        user_id: recordB.userId, // TAMPERING: conflicting user_id
      }),
    });
    const test3Data = await test3Res.json();
    assert(
      "TEST 3: Conflicting user_id rejected with 403 Forbidden & account locked",
      test3Res.status === 403 && test3Data.locked === true
    );

    const checkRosterC = await fetch(`${BASE}/hod/students`, {
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const rosterAfterC = await checkRosterC.json();
    const recordCAfter = (rosterAfterC.students || rosterAfterC).find((s) => s.id === recordC.id);
    assert("TEST 3: Student C attendance account is now LOCKED server-side", recordCAfter?.isAttendanceLocked === true);

    // =========================================================================
    // TEST 4 — Enrollment / Roll Number manipulation
    // =========================================================================
    console.log("\n--- TEST 4: Enrollment / Roll Number Manipulation ---");
    const test4Res = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentDToken}` },
      body: JSON.stringify({
        session_token: sessionToken1,
        latitude: 23.0225,
        longitude: 72.5714,
        enrollment_no: recordB.rollNumber, // TAMPERING: conflicting roll number
      }),
    });
    const test4Data = await test4Res.json();
    assert(
      "TEST 4: Conflicting enrollment number rejected with 403 Forbidden & account locked",
      test4Res.status === 403 && test4Data.locked === true
    );

    const checkRosterD = await fetch(`${BASE}/hod/students`, {
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const rosterAfterD = await checkRosterD.json();
    const recordDAfter = (rosterAfterD.students || rosterAfterD).find((s) => s.id === recordD.id);
    assert("TEST 4: Student D attendance account is now LOCKED server-side", recordDAfter?.isAttendanceLocked === true);

    // =========================================================================
    // TEST 5 — Locked Student Logs Out & In Again (New JWT cannot bypass lock)
    // =========================================================================
    console.log("\n--- TEST 5: Locked Student Cannot Bypass Lock With New JWT ---");
    // Re-authenticate Student A from their valid bound device
    const reloginA = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: studentAEmail,
        password: defaultPassword,
        device_token: studentADevice,
      }),
    });
    const reloginAData = await reloginA.json();
    const freshTokenA = reloginAData.token;
    assert("Student A successfully logs in with new session JWT", reloginA.status === 200 && Boolean(freshTokenA));

    // Attempt attendance with fresh JWT and NO tampering
    const test5Res = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${freshTokenA}` },
      body: JSON.stringify({
        session_token: sessionToken1,
        latitude: 23.0225,
        longitude: 72.5714,
      }),
    });
    const test5Data = await test5Res.json();
    assert(
      "TEST 5: Fresh JWT cannot bypass lock (403 Forbidden persisted in DB)",
      test5Res.status === 403 && test5Data.locked === true,
      `Message: ${test5Data.message}`
    );

    // =========================================================================
    // TEST 6 — HOD Unlocks Student A
    // =========================================================================
    console.log("\n--- TEST 6: HOD Unlocks Student Attendance Access ---");
    const unlockRes = await fetch(`${BASE}/hod/students/${recordA.id}/unlock-attendance`, {
      method: "POST",
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const unlockData = await unlockRes.json();
    assert("TEST 6: HOD unlocks Student A attendance (200 OK)", unlockRes.status === 200 && unlockData.unlocked === true, `Message: ${unlockData.message}`);

    const verifyUnlockRes = await fetch(`${BASE}/hod/students`, {
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const verifyUnlockData = await verifyUnlockRes.json();
    const recordAUnlocked = (verifyUnlockData.students || verifyUnlockData).find((s) => s.id === recordA.id);
    assert("TEST 6: Directory confirms Student A isAttendanceLocked is now FALSE", recordAUnlocked?.isAttendanceLocked === false);

    // =========================================================================
    // TEST 7 — Normal attendance after HOD unlock
    // =========================================================================
    console.log("\n--- TEST 7: Attendance Restored After HOD Unlock ---");
    // Create Lecture 2
    const lec2Res = await fetch(`${BASE}/lectures/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facToken}` },
      body: JSON.stringify({ subject_id: subId, lecture_date: today, start_time: "11:00:00", end_time: "12:30:00" }),
    });
    const lec2Data = await lec2Res.json();
    const lecture2Id = lec2Data.lecture_id || lec2Data.id;

    const qr2Res = await fetch(`${BASE}/qr-session/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facToken}` },
      body: JSON.stringify({
        lecture_id: lecture2Id,
        latitude: 23.0225,
        longitude: 72.5714,
        radius_meters: 500,
      }),
    });
    const qr2Data = await qr2Res.json();
    const sessionToken2 = qr2Data.session_token;

    // Student A marks attendance for Lecture 2
    const test7Res = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${freshTokenA}` },
      body: JSON.stringify({
        session_token: sessionToken2,
        latitude: 23.0225,
        longitude: 72.5714,
      }),
    });
    const test7Data = await test7Res.json();
    assert("TEST 7: Student A successfully marks attendance after unlock (201 Created)", test7Res.status === 201, `Status: ${test7Data.status}`);

    // =========================================================================
    // TEST 8 — Duplicate Attendance (Normal duplicate, NOT locked)
    // =========================================================================
    console.log("\n--- TEST 8: Duplicate Attendance Returns 409 Conflict Without Locking ---");
    const test8Res = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${freshTokenA}` },
      body: JSON.stringify({
        session_token: sessionToken2, // same lecture session!
        latitude: 23.0225,
        longitude: 72.5714,
      }),
    });
    const test8Data = await test8Res.json();
    assert(
      "TEST 8: Duplicate attendance returns 409 Conflict",
      test8Res.status === 409 && test8Data.conflict === true,
      `Message: ${test8Data.message}`
    );

    const checkRosterA2 = await fetch(`${BASE}/hod/students`, {
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const rosterA2 = await checkRosterA2.json();
    const recordA2 = (rosterA2.students || rosterA2).find((s) => s.id === recordA.id);
    assert("TEST 8: Duplicate attendance did NOT lock Student A (remains unlocked)", recordA2?.isAttendanceLocked === false);

    // =========================================================================
    // TEST 9 — Faculty Dashboard & Endpoints Non-Regression
    // =========================================================================
    console.log("\n--- TEST 9: Faculty Endpoints Non-Regression ---");
    const facMeRes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${facToken}` },
    });
    const facLecturesRes = await fetch(`${BASE}/lectures/my`, {
      headers: { Authorization: `Bearer ${facToken}` },
    });
    assert("TEST 9: Faculty /auth/me and /lectures/my respond successfully (200 OK)", facMeRes.status === 200 && facLecturesRes.status === 200);

    // =========================================================================
    // TEST 10 — HOD Dashboard & Endpoints Non-Regression
    // =========================================================================
    console.log("\n--- TEST 10: HOD Endpoints Non-Regression ---");
    const hodStatsRes = await fetch(`${BASE}/hod/stats`, {
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const hodStats = await hodStatsRes.json();
    assert("TEST 10: HOD /hod/stats responds successfully (200 OK)", hodStatsRes.status === 200 && Boolean(hodStats.institution));

    // =========================================================================
    // TEST 11 — QR Flow Integrity (Expired / Invalid QR Tokens)
    // =========================================================================
    console.log("\n--- TEST 11: QR Code Expiration & Invalid QR Integrity ---");
    const invalidQrRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({ session_token: "invalid-nonexistent-qr-token-9999" }),
    });
    assert("TEST 11: Invalid QR session token rejected with 404 Not Found", invalidQrRes.status === 404);

    // =========================================================================
    // TEST 12 — GPS Verification Integrity (Out-of-range geo-fence)
    // =========================================================================
    console.log("\n--- TEST 12: GPS Geo-Fencing Integrity ---");
    const outOfBoundsRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentBToken}` },
      body: JSON.stringify({
        session_token: sessionToken2,
        latitude: 51.5074, // London (far away from Ahmedabad classroom 23.0225)
        longitude: -0.1278,
      }),
    });
    const outOfBoundsData = await outOfBoundsRes.json();
    assert(
      "TEST 12: GPS distance outside classroom radius rejected with 403 Forbidden",
      outOfBoundsRes.status === 403 && outOfBoundsData.outOfBounds === true,
      `Message: ${outOfBoundsData.message?.slice(0, 45)}...`
    );

    console.log("\n=======================================================================");
    console.log(`=== TEST SUITE SUMMARY: ${passCount} / ${totalCount} TESTS PASSED ===`);
    console.log("=======================================================================\n");

    if (passCount === totalCount) {
      console.log(">>> ALL 12 TESTS PASSED WITH 100% SUCCESS RATE! <<<");
      process.exit(0);
    } else {
      console.error(">>> TEST SUITE FAILED. PLEASE REVIEW LOGS. <<<");
      process.exit(1);
    }
  } catch (err) {
    console.error("Fatal error during test suite execution:", err);
    process.exit(1);
  }
}

runIdentityLockTestSuite();
