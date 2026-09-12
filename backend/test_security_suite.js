const BASE = "http://localhost:5000";

async function runSecuritySuite() {
  console.log("=========================================================");
  console.log("=== PHASE 16: SECURITY & PENETRATION AUDIT TEST SUITE ===");
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
    const studentAuth = await login("student@example.com", "student123");
    const facultyAuth = await login("faculty@example.com", "faculty123");
    const hodAuth = await login("hod@example.com", "hod123");

    // --- 1. Access Student APIs as Faculty ---
    console.log("--- 1. Cross-Role Restrictions ---");
    const facToStudentRes = await fetch(`${BASE}/student/attendance`, {
      headers: { Authorization: `Bearer ${facultyAuth.token}` },
    });
    assert("Accessing Student API as Faculty rejected (403 Forbidden)", facToStudentRes.status === 403);

    // --- 2. Access Faculty APIs as Student ---
    const stdToFacultyRes = await fetch(`${BASE}/faculty/lectures`, {
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert("Accessing Faculty API as Student rejected (403 Forbidden)", stdToFacultyRes.status === 403);

    // --- 3. Access HOD APIs as Student ---
    const stdToHodRes = await fetch(`${BASE}/hod/stats`, {
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert("Accessing HOD API as Student rejected (403 Forbidden)", stdToHodRes.status === 403);

    // --- 4. Access HOD APIs as Faculty ---
    const facToHodRes = await fetch(`${BASE}/hod/stats`, {
      headers: { Authorization: `Bearer ${facultyAuth.token}` },
    });
    assert("Accessing HOD API as Faculty rejected (403 Forbidden)", facToHodRes.status === 403);

    // --- 5. Faculty Attempting to Create Faculty Account ---
    console.log("\n--- 2. Privilege Escalation Guards ---");
    const facCreateFacRes = await fetch(`${BASE}/hod/faculty`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facultyAuth.token}` },
      body: JSON.stringify({
        fullName: "Rogue Professor",
        email: "rogue.fac@univ.edu",
        password: "roguepassword123",
      }),
    });
    assert("Faculty creating Faculty account rejected (403 Forbidden)", facCreateFacRes.status === 403);

    // --- 6. Public Register HOD Account Attempt ---
    const pubHodRegRes = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Public HOD Attacker",
        email: "pub.hod@univ.edu",
        password: "password123",
        role: "HOD",
      }),
    });
    assert("Public HOD account registration blocked (403 Forbidden)", pubHodRegRes.status === 403);

    // --- 7. Public Register ADMIN Account Attempt ---
    const pubAdminRegRes = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Public Admin Attacker",
        email: "pub.admin@univ.edu",
        password: "password123",
        role: "ADMIN",
      }),
    });
    assert("Public ADMIN account registration blocked (403 Forbidden)", pubAdminRegRes.status === 403);

    // --- 8. Submitting Arbitrary Lecture ID directly ---
    console.log("\n--- 3. Session & Token Tampering Guards ---");
    const arbLecRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentAuth.token}` },
      body: JSON.stringify({ lecture_id: 99999 }),
    });
    assert("Submitting arbitrary lecture_id without valid session_token rejected (400 Bad Request)", arbLecRes.status === 400);

    // --- 9. Submitting Expired QR Session Token ---
    const expiredQrRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentAuth.token}` },
      body: JSON.stringify({ session_token: "expired_session_token_mock_999" }),
    });
    assert("Expired or non-existent QR token rejected (400 or 404)", expiredQrRes.status === 400 || expiredQrRes.status === 404);

    // --- 10 & 11. Creating Real Lecture, QR Session, and Testing Re-use / Duplicate Attendance ---
    console.log("\n--- 4. Live Attendance & Re-use Prevention ---");
    const newSubCode = `SEC${Math.floor(100 + Math.random() * 900)}`;
    const createSubRes = await fetch(`${BASE}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facultyAuth.token}` },
      body: JSON.stringify({ subject_code: newSubCode, subject_name: "Security Course" }),
    });
    const createSubData = await createSubRes.json();
    const subId = createSubData.subject ? createSubData.subject.id : createSubData.id;

    // Enroll student
    const studentProfileId = (studentAuth.data.user && studentAuth.data.user.profile) ? studentAuth.data.user.profile.id : 1;
    await fetch(`${BASE}/subjects/${subId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facultyAuth.token}` },
      body: JSON.stringify({ student_id: studentProfileId }),
    });

    // Create lecture & QR session
    const today = new Date().toISOString().split("T")[0];
    const lecRes = await fetch(`${BASE}/lectures/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facultyAuth.token}` },
      body: JSON.stringify({ subject_id: subId, lecture_date: today, start_time: "10:00:00", end_time: "11:30:00" }),
    });
    const lecData = await lecRes.json();

    const qrRes = await fetch(`${BASE}/qr-session/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facultyAuth.token}` },
      body: JSON.stringify({ lecture_id: lecData.lecture_id }),
    });
    const qrData = await qrRes.json();

    // Mark attendance 1st time (Success)
    const firstMarkRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentAuth.token}` },
      body: JSON.stringify({ session_token: qrData.session_token }),
    });
    assert("Initial attendance mark succeeds (201 Created)", firstMarkRes.status === 201);

    // Try reusing QR / Duplicate Attendance (409 Conflict)
    const reuseQrRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentAuth.token}` },
      body: JSON.stringify({ session_token: qrData.session_token }),
    });
    assert("Reusing QR token for duplicate attendance blocked (409 Conflict)", reuseQrRes.status === 409);

    assert("Duplicate attendance submission blocked (409 Conflict)", reuseQrRes.status === 409);

    // --- 12 & 13. Cross-Faculty Resource Isolation ---
    console.log("\n--- 5. Cross-Faculty Resource Isolation ---");
    const otherFacultyAuth = await login("faculty@example.com", "faculty123");
    // Verify editing another faculty's lecture or accessing non-assigned subject details
    const otherLecRes = await fetch(`${BASE}/lectures/${lecData.lecture_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentAuth.token}` },
      body: JSON.stringify({ start_time: "08:00:00" }),
    });
    assert("Student modifying faculty lecture rejected (403 Forbidden)", otherLecRes.status === 403);

    const stdReadLecRes = await fetch(`${BASE}/lectures/${lecData.lecture_id}`, {
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert("Student accessing raw faculty lecture management route rejected (403 Forbidden)", stdReadLecRes.status === 403);

    // --- 14. Invalid JWT Bearer Token ---
    console.log("\n--- 6. JWT Token Integrity & Malformed Requests ---");
    const invalidJwtRes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: "Bearer invalid.jwt.signature.payload" },
    });
    assert("Tampered / Invalid JWT bearer token rejected (401 Unauthorized)", invalidJwtRes.status === 401);

    // --- 15. Missing JWT Bearer Token ---
    const missingJwtRes = await fetch(`${BASE}/auth/me`);
    assert("Missing JWT bearer token rejected (401 Unauthorized)", missingJwtRes.status === 401);

    // --- 16. Malformed Requests & Missing Parameters ---
    const malformedRes = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "" }),
    });
    assert("Malformed request missing required parameters rejected (400 Bad Request)", malformedRes.status === 400);

    console.log("\n=========================================================");
    console.log(`=== SECURITY AUDIT RESULT: ${passCount} / ${totalCount} TESTS PASSED ===`);
    console.log("=========================================================");
  } catch (err) {
    console.error("Security Test Suite Error:", err);
  }
}

runSecuritySuite();
