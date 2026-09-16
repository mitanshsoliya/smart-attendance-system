const crypto = require("crypto");

const BASE = "http://localhost:5000";

async function runSecurityTestSuite() {
  console.log("=================================================================");
  console.log("=== RUNNING ZERO-TRUST & DEVICE BINDING SECURITY TEST SUITE ===");
  console.log("=================================================================\n");

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
    const studentBEmail = `student.b.${ts}@univ.edu`;
    const studentAEmail = `student.a.${ts}@univ.edu`;
    const studentPassword = "securePassword123!";

    console.log("--- Setup: Registering Test Accounts ---");
    
    // 1. Register Student B (victim whose credentials could be stolen)
    const regBRes = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Student B (Legitimate Student)",
        email: studentBEmail,
        password: studentPassword,
        role: "STUDENT",
        roll_number: `2026-CSE-B${ts.toString().slice(-4)}`,
        section: "Sec A",
      }),
    });
    const regBData = await regBRes.json();
    assert("Student B account created", regBRes.status === 201 && (regBData.user_id || regBData.id));

    // 2. Register Student A (proxy attacker)
    const regARes = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Student A (Attacker)",
        email: studentAEmail,
        password: studentPassword,
        role: "STUDENT",
        roll_number: `2026-CSE-A${ts.toString().slice(-4)}`,
        section: "Sec A",
      }),
    });
    const regAData = await regARes.json();
    assert("Student A account created", regARes.status === 201 && (regAData.user_id || regAData.id));

    // 3. Login as HOD to administer student cohort
    const hodRes = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "hod@example.com", password: "hod123" }),
    });
    const hodData = await hodRes.json();
    const hodToken = hodData.token;
    assert("HOD authentication successful", hodRes.status === 200 && Boolean(hodToken));

    // 4. Login as Faculty to setup lecture and dynamic QR session
    const facRes = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "faculty@example.com", password: "faculty123" }),
    });
    const facData = await facRes.json();
    const facToken = facData.token;
    assert("Faculty authentication successful", facRes.status === 200 && Boolean(facToken));

    // =========================================================================
    // TEST 1: Student B First Login & Device Binding
    // =========================================================================
    console.log("\n--- TEST 1: First Login Device Binding for Student ---");
    
    const loginB1 = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: studentBEmail, password: studentPassword }),
    });
    const loginB1Data = await loginB1.json();
    const studentBDeviceToken = loginB1Data.device_token;
    const studentBToken = loginB1Data.token;

    assert("First login succeeds (200 OK)", loginB1.status === 200);
    assert("First login generates and returns 256-bit device token", Boolean(studentBDeviceToken) && studentBDeviceToken.length === 64, `Token prefix: ${studentBDeviceToken?.slice(0, 10)}...`);

    // =========================================================================
    // TEST 2: Attacker Logs In With Student B's Credentials on Unregistered Device
    // =========================================================================
    console.log("\n--- TEST 2: Proxy Login Blocked (Stolen Credentials on Unregistered Device) ---");
    
    // Case A: Missing device token (fresh browser / incognito mode)
    const proxyLoginNoToken = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: studentBEmail, password: studentPassword }),
    });
    const proxyLoginNoTokenData = await proxyLoginNoToken.json();
    assert(
      "Login blocked with 403 Forbidden when device token is missing",
      proxyLoginNoToken.status === 403 && proxyLoginNoTokenData.code === "DEVICE_NOT_AUTHORIZED",
      `Message: ${proxyLoginNoTokenData.message}`
    );

    // Case B: Attacker uses their own / random device token
    const fakeDeviceToken = crypto.randomBytes(32).toString("hex");
    const proxyLoginFakeToken = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: studentBEmail,
        password: studentPassword,
        device_token: fakeDeviceToken,
      }),
    });
    const proxyLoginFakeTokenData = await proxyLoginFakeToken.json();
    assert(
      "Login blocked with 403 Forbidden when unauthorized device token is provided",
      proxyLoginFakeToken.status === 403 && proxyLoginFakeTokenData.code === "DEVICE_NOT_AUTHORIZED"
    );

    // =========================================================================
    // TEST 3: Legitimate Student B Login from Bound Device
    // =========================================================================
    console.log("\n--- TEST 3: Legitimate Student B Login from Authorized Device ---");
    
    const loginBValid = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: studentBEmail,
        password: studentPassword,
        device_token: studentBDeviceToken,
      }),
    });
    const loginBValidData = await loginBValid.json();
    assert(
      "Student B logs in successfully from registered device (200 OK)",
      loginBValid.status === 200 && Boolean(loginBValidData.token)
    );

    // =========================================================================
    // TEST 4: Zero-Trust Attendance API Parameter Tampering Defense
    // =========================================================================
    console.log("\n--- TEST 4: Zero-Trust Attendance API Parameter Tampering Defense ---");

    // Login Student A and get their device token & auth token
    const loginA = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: studentAEmail, password: studentPassword }),
    });
    const loginAData = await loginA.json();
    const studentAToken = loginAData.token;

    // Fetch HOD student directory to locate records
    const hodStudentsRes = await fetch(`${BASE}/hod/students`, {
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const hodStudentsData = await hodStudentsRes.json();
    const studentList = hodStudentsData.students || hodStudentsData || [];
    const recordA = studentList.find((s) => s.email === studentAEmail);
    const recordB = studentList.find((s) => s.email === studentBEmail);

    assert("Found database records for Student A and Student B", Boolean(recordA && recordB));

    // Faculty creates subject and enrolls Student A and Student B
    const subCode = `SEC${Math.floor(100 + Math.random() * 900)}`;
    const createSubRes = await fetch(`${BASE}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facToken}` },
      body: JSON.stringify({ subject_code: subCode, subject_name: "Security Engineering" }),
    });
    const createSubData = await createSubRes.json();
    const subId = createSubData.subject ? createSubData.subject.id : createSubData.id;

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

    // Faculty creates a lecture and dynamic QR session with 500m radius
    const today = new Date().toISOString().split("T")[0];
    const lecRes = await fetch(`${BASE}/lectures/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facToken}` },
      body: JSON.stringify({
        subject_id: subId,
        lecture_date: today,
        start_time: "09:00:00",
        end_time: "10:30:00",
      }),
    });
    const lecData = await lecRes.json();
    const lectureId = lecData.lecture_id || lecData.id;

    const qrRes = await fetch(`${BASE}/qr-session/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facToken}` },
      body: JSON.stringify({
        lecture_id: lectureId,
        latitude: 23.0225,
        longitude: 72.5714,
        radius_meters: 500,
      }),
    });
    const qrData = await qrRes.json();
    const sessionToken = qrData.session_token;

    assert("Lecture session and QR code created", Boolean(lectureId && sessionToken));

    // Student A tries to mark attendance for Student B by injecting student_id / user_id
    const tamperRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentAToken}`, // Student A's JWT!
      },
      body: JSON.stringify({
        session_token: sessionToken,
        latitude: 23.0225,
        longitude: 72.5714,
        // MALICIOUS INJECTION:
        student_id: recordB.id,
        studentId: recordB.id,
        user_id: recordB.userId,
        userId: recordB.userId,
      }),
    });
    const tamperData = await tamperRes.json();
    assert(
      "Zero-Trust & Lock: Malicious parameter injection rejected with 403 Forbidden & account locked",
      tamperRes.status === 403 && tamperData.locked === true,
      `Message: ${tamperData.message}`
    );

    // Verify who got marked: Query lecture attendance
    const checkLecRes = await fetch(`${BASE}/attendance/lecture/${lectureId}`, {
      headers: { Authorization: `Bearer ${facToken}` },
    });
    const checkLecData = await checkLecRes.json();
    const attendanceRecords = checkLecData.attendance || checkLecData || [];

    const isAMarked = attendanceRecords.some((att) => att.student_id === recordA.id);
    const isBMarked = attendanceRecords.some((att) => att.student_id === recordB.id);

    assert(
      "Zero-Trust: Tampered request rejected so neither Student A nor Student B is marked",
      !isAMarked && !isBMarked,
      `Student A marked: ${isAMarked}, Student B marked: ${isBMarked}`
    );
    assert(
      "Zero-Trust: Injected student_id ignored! Student B's attendance was NOT marked",
      !isBMarked,
      `Student B marked: ${isBMarked}`
    );

    // =========================================================================
    // TEST 5: Faculty & HOD Roles Exempt from Device Lock
    // =========================================================================
    console.log("\n--- TEST 5: Faculty & HOD Multi-Device Exemption ---");

    const facLogin1 = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "faculty@example.com", password: "faculty123" }),
    });
    assert("Faculty login without device token succeeds (200 OK)", facLogin1.status === 200);

    const facLogin2 = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "faculty@example.com",
        password: "faculty123",
        device_token: "different-device-token-prof-laptop",
      }),
    });
    assert("Faculty login from secondary device/token succeeds without restriction", facLogin2.status === 200);

    const hodLogin1 = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "hod@example.com", password: "hod123" }),
    });
    assert("HOD login without device token succeeds (200 OK)", hodLogin1.status === 200);

    // =========================================================================
    // TEST 6: Geo-Fence & QR Expiration Preserved
    // =========================================================================
    console.log("\n--- TEST 6: Geo-Fencing & Expiration Protections Preserved ---");

    // Outside geo-fence attempt (coordinates far away in London: 51.5074, -0.1278)
    const outOfBoundsRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentBToken}`,
      },
      body: JSON.stringify({
        session_token: sessionToken,
        latitude: 51.5074,
        longitude: -0.1278,
      }),
    });
    const outOfBoundsData = await outOfBoundsRes.json();
    assert(
      "Out-of-range geo-fence request rejected (403 Forbidden)",
      outOfBoundsRes.status === 403,
      `Message: ${outOfBoundsData.message?.slice(0, 40)}...`
    );

    // =========================================================================
    // TEST 7: HOD Device Reset Flow & New Device Binding
    // =========================================================================
    console.log("\n--- TEST 7: HOD Device Binding Reset & Re-binding ---");

    // 1. Verify Student B shows isDeviceBound: true
    assert("Student B shows isDeviceBound: true in HOD student directory", recordB.isDeviceBound === true);

    // 2. Non-HOD trying to reset device should be forbidden
    const unauthorizedReset = await fetch(`${BASE}/hod/students/${recordB.id}/reset-device`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentAToken}` },
    });
    assert("Unauthorized user (Student) cannot reset device binding (403 Forbidden)", unauthorizedReset.status === 403);

    // 3. HOD resets device binding for Student B
    const resetRes = await fetch(`${BASE}/hod/students/${recordB.id}/reset-device`, {
      method: "POST",
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const resetData = await resetRes.json();
    assert("HOD resets Student B device binding successfully (200 OK)", resetRes.status === 200, `Message: ${resetData.message}`);

    // 4. Verify in HOD directory that isDeviceBound is now false
    const hodStudentsAfterRes = await fetch(`${BASE}/hod/students`, {
      headers: { Authorization: `Bearer ${hodToken}` },
    });
    const hodStudentsAfterData = await hodStudentsAfterRes.json();
    const studentListAfter = hodStudentsAfterData.students || hodStudentsAfterData || [];
    const recordBAfter = studentListAfter.find((s) => s.email === studentBEmail);
    assert("Student B now shows isDeviceBound: false in directory", recordBAfter?.isDeviceBound === false);

    // 5. Student B logs in from new replacement device (no device token)
    const newDeviceLogin = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: studentBEmail, password: studentPassword }),
    });
    const newDeviceData = await newDeviceLogin.json();
    const newDeviceToken = newDeviceData.device_token;
    assert(
      "Student B successfully binds new device on next login (200 OK)",
      newDeviceLogin.status === 200 && Boolean(newDeviceToken)
    );
    assert("New device token differs from old device token", newDeviceToken !== studentBDeviceToken);

    // 6. Old revoked device token is now blocked
    const oldDeviceAttempt = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: studentBEmail,
        password: studentPassword,
        device_token: studentBDeviceToken, // old revoked token
      }),
    });
    assert(
      "Old revoked device token is rejected with 403 Forbidden",
      oldDeviceAttempt.status === 403
    );

    console.log("\n=================================================================");
    console.log(`=== SECURITY TEST SUITE RESULTS: ${passCount} / ${totalCount} PASSED ===`);
    console.log("=================================================================\n");

    if (passCount === totalCount) {
      console.log(">>> ALL SECURITY REQUIREMENTS MET WITH 100% PASS RATE! <<<");
      process.exit(0);
    } else {
      console.error(">>> SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE. <<<");
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution encountered fatal error:", err);
    process.exit(1);
  }
}

runSecurityTestSuite();
