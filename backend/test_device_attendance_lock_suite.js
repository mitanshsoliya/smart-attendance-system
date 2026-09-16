const crypto = require("crypto");

const BASE = "http://localhost:5000";

async function runDeviceAttendanceLockSuite() {
  console.log("=========================================================================");
  console.log("=== RUNNING SINGLE-DEVICE LECTURE ENFORCEMENT & ANTI-PROXY TEST SUITE ===");
  console.log("=========================================================================\n");

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
    const student1Email = `dev.std1.${ts}@univ.edu`;
    const student2Email = `dev.std2.${ts}@univ.edu`;
    const defaultPassword = "password123!";

    console.log("--- Setup: Registering Students, HOD & Faculty ---");

    // 1. Register Student 1 & Student 2
    const reg1Res = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Student One",
        email: student1Email,
        password: defaultPassword,
        role: "STUDENT",
        roll_number: `2026-CSE-S1${ts.toString().slice(-4)}`,
        section: "Sec A",
      }),
    });
    assert("Registered Student 1", reg1Res.status === 201);

    const reg2Res = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Student Two",
        email: student2Email,
        password: defaultPassword,
        role: "STUDENT",
        roll_number: `2026-CSE-S2${ts.toString().slice(-4)}`,
        section: "Sec A",
      }),
    });
    assert("Registered Student 2", reg2Res.status === 201);

    // 2. Login HOD
    const hodRes = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "hod@example.com", password: "hod123" }),
    });
    const hodData = await hodRes.json();
    const hodToken = hodData.token;
    assert("HOD authenticated", hodRes.status === 200 && Boolean(hodToken));

    // 3. Login Faculty
    const facRes = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "faculty@example.com", password: "faculty123" }),
    });
    const facData = await facRes.json();
    const facToken = facData.token;
    assert("Faculty authenticated", facRes.status === 200 && Boolean(facToken));

    // 4. Student 1 logs in from Device 1
    const login1 = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: student1Email, password: defaultPassword }),
    });
    const login1Data = await login1.json();
    const student1Token = login1Data.token;
    const device1Token = login1Data.device_token;
    assert("Student 1 logged in & bound to Device 1", login1.status === 200 && Boolean(device1Token));

    // 5. Test Anti-Device Sharing at Login:
    // Student 2 tries to log in presenting Device 1's token
    console.log("\n--- TEST: Anti-Device Sharing at Login ---");
    const login2ShareDevice = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: student2Email,
        password: defaultPassword,
        device_token: device1Token, // Attempting to share Student 1's device!
      }),
    });
    const login2ShareData = await login2ShareDevice.json();
    assert(
      "Student 2 blocked from logging in on Student 1's bound device (403 Forbidden)",
      login2ShareDevice.status === 403 && login2ShareData.code === "DEVICE_ALREADY_BOUND",
      `Message: ${login2ShareData.message}`
    );

    // 6. Student 2 logs in from their own Device 2
    const login2 = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: student2Email, password: defaultPassword }),
    });
    const login2Data = await login2.json();
    const student2Token = login2Data.token;
    const device2Token = login2Data.device_token;
    assert("Student 2 logged in & bound to Device 2", login2.status === 200 && Boolean(device2Token));

    // Retrieve database IDs
    const rosterRes = await fetch(`${BASE}/hod/students`, {
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const rosterData = await rosterRes.json();
    const studentList = rosterData.students || rosterData || [];
    const record1 = studentList.find((s) => s.email === student1Email);
    const record2 = studentList.find((s) => s.email === student2Email);

    // Setup Course & Lecture 1
    const subCode = `DEV${Math.floor(100 + Math.random() * 900)}`;
    const subRes = await fetch(`${BASE}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facToken}` },
      body: JSON.stringify({ subject_code: subCode, subject_name: "Mobile & Device Security" }),
    });
    const subData = await subRes.json();
    const subId = subData.subject ? subData.subject.id : subData.id;

    await fetch(`${BASE}/subjects/${subId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facToken}` },
      body: JSON.stringify({ student_id: record1.id }),
    });
    await fetch(`${BASE}/subjects/${subId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facToken}` },
      body: JSON.stringify({ student_id: record2.id }),
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
    // STEP 1: Student 1 marks attendance from Device 1
    // =========================================================================
    console.log("\n--- STEP 1: Student 1 Marks Attendance from Device 1 ---");
    const std1MarkRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        session_token: sessionToken1,
        latitude: 23.0225,
        longitude: 72.5714,
        device_token: device1Token,
      }),
    });
    const std1MarkData = await std1MarkRes.json();
    assert("Student 1 marks attendance successfully on Device 1 (201 Created)", std1MarkRes.status === 201, `Status: ${std1MarkData.status}`);

    // =========================================================================
    // STEP 2: Student 1 Normal Duplicate Submission
    // =========================================================================
    console.log("\n--- STEP 2: Student 1 Duplicate Resubmission ---");
    const std1DupRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        session_token: sessionToken1, // same active session
        latitude: 23.0225,
        longitude: 72.5714,
        device_token: device1Token,
      }),
    });
    const std1DupData = await std1DupRes.json();
    assert(
      "Student 1 resubmitting from their own device returns normal 409 Conflict (not locked)",
      std1DupRes.status === 409 && std1DupData.conflict === true
    );

    // =========================================================================
    // STEP 3: Proxy Attempt: Student 2 tries to mark attendance for Lecture 1 from Device 1!
    // =========================================================================
    console.log("\n--- STEP 3: Proxy Attempt: Student 2 Tries to Mark Attendance on Device 1 ---");
    const std2ProxyRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${student2Token}` },
      body: JSON.stringify({
        session_token: sessionToken1,
        latitude: 23.0225,
        longitude: 72.5714,
        device_token: device1Token, // SUBMITTED FROM STUDENT 1's DEVICE!
      }),
    });
    const std2ProxyData = await std2ProxyRes.json();
    assert(
      "Proxy attempt blocked: Device already marked this session (403 Forbidden)",
      std2ProxyRes.status === 403 && std2ProxyData.deviceConflict === true,
      `Message: ${std2ProxyData.message}`
    );

    // Verify Student 2 account is now LOCKED in database
    const verifyLockRes = await fetch(`${BASE}/hod/students`, {
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const verifyLockData = await verifyLockRes.json();
    const record2After = (verifyLockData.students || verifyLockData).find((s) => s.id === record2.id);
    assert("Student 2 attendance account is now LOCKED server-side", record2After?.isAttendanceLocked === true);

    // =========================================================================
    // STEP 4: Locked Student 2 Cannot Mark Attendance in Any Subsequent Lecture
    // =========================================================================
    console.log("\n--- STEP 4: Locked Student 2 Blocked in Subsequent Lectures ---");
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

    // Student 2 tries to mark Lecture 2 (even on their own Device 2)
    const std2Lec2Res = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${student2Token}` },
      body: JSON.stringify({
        session_token: sessionToken2,
        latitude: 23.0225,
        longitude: 72.5714,
        device_token: device2Token,
      }),
    });
    const std2Lec2Data = await std2Lec2Res.json();
    assert(
      "Student 2 blocked from marking Lecture 2 because account is locked (403 Forbidden)",
      std2Lec2Res.status === 403 && std2Lec2Data.locked === true,
      `Message: ${std2Lec2Data.message}`
    );

    // =========================================================================
    // STEP 5: HOD Unlocks Student 2
    // =========================================================================
    console.log("\n--- STEP 5: HOD Unlocks Student 2 ---");
    const unlock2Res = await fetch(`${BASE}/hod/students/${record2.id}/unlock-attendance`, {
      method: "POST",
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    assert("HOD unlocks Student 2 (200 OK)", unlock2Res.status === 200);

    // =========================================================================
    // STEP 6: Student 2 Marks Attendance on Their Own Device 2 (SUCCESS)
    // =========================================================================
    console.log("\n--- STEP 6: Student 2 Marks Attendance on Device 2 After Unlock ---");
    const std2ValidRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${student2Token}` },
      body: JSON.stringify({
        session_token: sessionToken2,
        latitude: 23.0225,
        longitude: 72.5714,
        device_token: device2Token, // THEIR OWN DEVICE 2!
      }),
    });
    const std2ValidData = await std2ValidRes.json();
    assert("Student 2 successfully marks attendance on their own device (201 Created)", std2ValidRes.status === 201, `Status: ${std2ValidData.status}`);

    console.log("\n=========================================================================");
    console.log(`=== TEST SUMMARY: ${passCount} / ${totalCount} TESTS PASSED ===`);
    console.log("=========================================================================\n");

    if (passCount === totalCount) {
      console.log(">>> ALL DEVICE ANTI-PROXY TESTS PASSED (100% SUCCESS)! <<<");
      process.exit(0);
    } else {
      console.error(">>> TESTS FAILED. PLEASE REVIEW LOGS ABOVE. <<<");
      process.exit(1);
    }
  } catch (err) {
    console.error("Fatal error during test:", err);
    process.exit(1);
  }
}

runDeviceAttendanceLockSuite();
