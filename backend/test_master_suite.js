const BASE = "http://localhost:5000";

async function runMasterTestSuite() {
  console.log("=========================================================");
  console.log("=== PHASE 15: MASTER END-TO-END AUTOMATED TEST SUITE ===");
  console.log("=========================================================\n");

  let passCount = 0;
  let totalCount = 0;

  function assert(name, condition, extra) {
    totalCount++;
    if (condition) {
      passCount++;
      console.log(`  [PASS ${String(totalCount).padStart(2, "0")}] ${name}`, extra ? `-> ${extra}` : "");
    } else {
      console.error(`  [FAIL ${String(totalCount).padStart(2, "0")}] ${name}`, extra ? `-> ${extra}` : "");
    }
  }

  async function login(email, password) {
    const res = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    return { status: res.status, token: data.token, data };
  }

  try {
    // --- 1. Database Connection & Backend Health ---
    console.log("--- 1. System Health & Database Connection ---");
    const healthRes = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid@check.com", password: "invalidpassword" }),
    });
    assert("Backend HTTP server & Database connection healthy", healthRes.status === 401 || healthRes.status === 400);

    // --- 2. Account Registration API ---
    console.log("\n--- 2. Account Registration API ---");
    const regEmail = `test.student.${Math.floor(1000 + Math.random() * 9000)}@univ.edu`;
    const regRes = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Test Candidate",
        email: regEmail,
        password: "student123password",
        role: "STUDENT",
        roll_number: `2026-CSE-${Math.floor(100 + Math.random() * 900)}`,
        section: "Sec A",
      }),
    });
    const regData = await regRes.json();
    assert("POST /register creates user profile (201 Created)", regRes.status === 201 && Boolean(regData.user_id || regData.id));

    // --- 3. Duplicate Account Prevention (409 Conflict) ---
    console.log("\n--- 3. Duplicate Account Prevention ---");
    const dupRegRes = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Duplicate Candidate",
        email: regEmail,
        password: "student123password",
        role: "STUDENT",
      }),
    });
    assert("Duplicate account registration blocked (409 Conflict)", dupRegRes.status === 409);

    // --- 4. Login & JWT Authentication ---
    console.log("\n--- 4. Login & JWT Authentication ---");
    const invalidAuth = await login("nonexistent@domain.com", "wrongpass");
    assert("Invalid credentials rejected (401 Unauthorized)", invalidAuth.status === 401);

    const studentAuth = await login(regEmail, "student123password");
    const facultyAuth = await login("faculty@example.com", "faculty123");
    const hodAuth = await login("hod@example.com", "hod123");

    assert("Student authentication succeeds (200 OK)", studentAuth.status === 200 && Boolean(studentAuth.token));
    assert("Faculty authentication succeeds (200 OK)", facultyAuth.status === 200 && Boolean(facultyAuth.token));
    assert("HOD/Admin authentication succeeds (200 OK)", hodAuth.status === 200 && Boolean(hodAuth.token));

    // --- 5. JWT Token Payload & /auth/me Profile ---
    console.log("\n--- 5. JWT Profile Verification ---");
    const meRes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    const meData = await meRes.json();
    assert("GET /auth/me decodes JWT payload & profile (200 OK)", meRes.status === 200 && Boolean(meData.user));

    // --- 6. Role Permissions & Restrictions (401 & 403) ---
    console.log("\n--- 6. Role Permissions & Restrictions ---");
    const noTokenRes = await fetch(`${BASE}/hod/stats`);
    assert("Missing Authorization header rejected (401 Unauthorized)", noTokenRes.status === 401);

    const stdToHodRes = await fetch(`${BASE}/hod/stats`, {
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert("Student accessing HOD endpoint rejected (403 Forbidden)", stdToHodRes.status === 403);

    const facToHodRes = await fetch(`${BASE}/hod/stats`, {
      headers: { Authorization: `Bearer ${facultyAuth.token}` },
    });
    assert("Faculty accessing HOD endpoint rejected (403 Forbidden)", facToHodRes.status === 403);

    const hodStatsRes = await fetch(`${BASE}/hod/stats`, {
      headers: { Authorization: `Bearer ${hodAuth.token}` },
    });
    assert("HOD accessing HOD endpoint allowed (200 OK)", hodStatsRes.status === 200);

    // --- 7. HOD Student & Faculty Management (Add Student & Add Faculty) ---
    console.log("\n--- 7. HOD User Management APIs ---");
    const addStdEmail = `std.add.${Math.floor(1000 + Math.random() * 9000)}@univ.edu`;
    const addStdRes = await fetch(`${BASE}/hod/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${hodAuth.token}` },
      body: JSON.stringify({
        fullName: "HOD Added Student",
        email: addStdEmail,
        password: "password123",
        rollNumber: `2026-CSE-${Math.floor(100 + Math.random() * 900)}`,
        section: "Sec B",
      }),
    });
    assert("HOD adds new student (201 Created)", addStdRes.status === 201);

    const addFacEmail = `fac.add.${Math.floor(1000 + Math.random() * 9000)}@univ.edu`;
    const addFacRes = await fetch(`${BASE}/hod/faculty`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${hodAuth.token}` },
      body: JSON.stringify({
        fullName: "Dr. Added Professor",
        email: addFacEmail,
        password: "faculty123password",
        department: "Department of Computer Science & Engineering",
        designation: "Associate Professor",
      }),
    });
    assert("HOD adds new faculty member (201 Created)", addFacRes.status === 201);

    // --- 8. Course Creation & Student Enrollment ---
    console.log("\n--- 8. Course Creation & Enrollment Validation ---");
    const newSubCode = `CS${Math.floor(100 + Math.random() * 900)}`;
    const createSubRes = await fetch(`${BASE}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facultyAuth.token}` },
      body: JSON.stringify({ subject_code: newSubCode, subject_name: "Master Suite Course" }),
    });
    const createSubData = await createSubRes.json();
    const subId = createSubData.subject ? createSubData.subject.id : createSubData.id;
    assert("Faculty creates subject (201 Created)", createSubRes.status === 201 && Boolean(subId));

    // Enroll registered student
    const studentProfileId = (studentAuth.data.user && studentAuth.data.user.profile) ? studentAuth.data.user.profile.id : 1;
    const enrollRes = await fetch(`${BASE}/subjects/${subId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facultyAuth.token}` },
      body: JSON.stringify({ student_id: studentProfileId }),
    });
    assert("Faculty enrolls student into course (201 Created)", enrollRes.status === 201);

    // --- 9. Lecture Creation & QR Session Generation ---
    console.log("\n--- 9. Lecture Creation & Dynamic QR Sessions ---");
    const today = new Date().toISOString().split("T")[0];
    const lecRes = await fetch(`${BASE}/lectures/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facultyAuth.token}` },
      body: JSON.stringify({ subject_id: subId, lecture_date: today, start_time: "10:00:00", end_time: "11:30:00" }),
    });
    const lecData = await lecRes.json();
    assert("Faculty creates lecture session (201 Created)", lecRes.status === 201 && Boolean(lecData.lecture_id));

    const qrRes = await fetch(`${BASE}/qr-session/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facultyAuth.token}` },
      body: JSON.stringify({ lecture_id: lecData.lecture_id }),
    });
    const qrData = await qrRes.json();
    assert("Faculty creates dynamic QR session (200 OK / 201 Created)", (qrRes.status === 200 || qrRes.status === 201) && Boolean(qrData.session_token));

    // --- 10. QR Expiration & Invalid QR Token Tests ---
    console.log("\n--- 10. QR Token Expiration & Invalid QR Verification ---");
    const invalidQrRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentAuth.token}` },
      body: JSON.stringify({ session_token: "invalid-malformed-qr-token-12345" }),
    });
    assert("Invalid or fake QR session token rejected (400 or 404)", invalidQrRes.status === 400 || invalidQrRes.status === 404);

    // --- 11. Attendance Marking & Duplicate Check ---
    console.log("\n--- 11. Attendance Marking & Duplicate Prevention ---");
    const markRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentAuth.token}` },
      body: JSON.stringify({ session_token: qrData.session_token }),
    });
    assert("Enrolled student marks attendance via valid QR (201 Created)", markRes.status === 201);

    const dupMarkRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentAuth.token}` },
      body: JSON.stringify({ session_token: qrData.session_token }),
    });
    assert("Duplicate attendance submission blocked (409 Conflict)", dupMarkRes.status === 409);

    // --- 12. Statutory Reports ---
    console.log("\n--- 12. Statutory Reports & Audit Dossiers ---");
    const reportsRes = await fetch(`${BASE}/hod/reports`, {
      headers: { Authorization: `Bearer ${hodAuth.token}` },
    });
    assert("HOD fetches statutory attendance audit report (200 OK)", reportsRes.status === 200);

    console.log("\n=========================================================");
    console.log(`=== MASTER TEST RESULT: ${passCount} / ${totalCount} TESTS PASSED ===`);
    console.log("=========================================================");
  } catch (err) {
    console.error("Master Test Suite Execution Error:", err);
  }
}

runMasterTestSuite();
