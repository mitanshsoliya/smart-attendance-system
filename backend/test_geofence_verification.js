const BASE = "http://localhost:5000";

async function runGeoFenceVerification() {
  console.log("==================================================================");
  console.log("=== GEO-FENCING & GPS ATTENDANCE VERIFICATION AUTOMATED TEST ===");
  console.log("==================================================================\n");

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
    // 1. Authenticate HOD & Create Dedicated Test Faculty
    console.log("--- 1. Authenticate HOD & Setup Faculty & Student ---");
    const hodAuth = await login("hod@example.com", "hod123");
    assert("HOD login succeeded", hodAuth.status === 200 && Boolean(hodAuth.token));

    const facEmail = `geo.prof.${Math.floor(1000 + Math.random() * 9000)}@univ.edu`;
    const facPassword = "faculty123password";
    const addFacRes = await fetch(`${BASE}/hod/faculty`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${hodAuth.token}` },
      body: JSON.stringify({
        fullName: "Dr. Geo Fencing Specialist",
        email: facEmail,
        password: facPassword,
        department: "Department of Computer Science & Engineering",
        designation: "Assistant Professor",
      }),
    });
    assert("HOD creates dedicated Faculty member (201 Created)", addFacRes.status === 201);

    const facultyAuth = await login(facEmail, facPassword);
    assert("Faculty login succeeded", facultyAuth.status === 200 && Boolean(facultyAuth.token));

    // Register Candidate Student
    const regEmail = `geo.student.${Math.floor(1000 + Math.random() * 9000)}@univ.edu`;
    const regRes = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Aman Verma",
        email: regEmail,
        password: "student123password",
        role: "STUDENT",
        roll_number: `2026-GEO-${Math.floor(100 + Math.random() * 900)}`,
        section: "Sec A",
        department: "Department of Computer Science & Engineering",
      }),
    });
    const studentAuth = await login(regEmail, "student123password");
    assert("Student registration & login succeeded", studentAuth.status === 200 && Boolean(studentAuth.token));

    const studentProfileId = studentAuth.data.user?.profile?.id;

    // 2. Create Subject, Enroll Student, Create Lecture
    console.log("\n--- 2. Subject, Enrollment & Lecture Setup ---");
    const subCode = `GEO${Math.floor(100 + Math.random() * 900)}`;
    const createSubRes = await fetch(`${BASE}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facultyAuth.token}` },
      body: JSON.stringify({ subject_code: subCode, subject_name: "GPS Geo-Fencing Lab" }),
    });
    const subData = await createSubRes.json();
    const subId = subData.subject?.id || subData.id;
    assert("Subject created successfully", Boolean(subId));

    const enrollRes = await fetch(`${BASE}/subjects/${subId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facultyAuth.token}` },
      body: JSON.stringify({ student_id: studentProfileId }),
    });
    assert("Student enrolled into subject", enrollRes.status === 201);

    const today = new Date().toISOString().split("T")[0];
    const lecRes = await fetch(`${BASE}/lectures/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facultyAuth.token}` },
      body: JSON.stringify({ subject_id: subId, lecture_date: today, start_time: "09:00:00", end_time: "10:30:00" }),
    });
    const lecData = await lecRes.json();
    const lectureId = lecData.lecture_id;
    assert("Lecture created successfully", Boolean(lectureId));

    // 3. Faculty Generates QR Session with Classroom Anchor Coordinates (21.1702, 72.8311, 100m radius)
    console.log("\n--- 3. Generate QR Session with Geo-Fence ---");
    const classroomLat = 21.1702;
    const classroomLon = 72.8311;
    const allowedRadius = 100;

    const qrRes = await fetch(`${BASE}/qr-session/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${facultyAuth.token}` },
      body: JSON.stringify({
        lecture_id: lectureId,
        latitude: classroomLat,
        longitude: classroomLon,
        radius_meters: allowedRadius,
      }),
    });
    const qrData = await qrRes.json();
    assert(
      "Faculty creates QR session with Geo-Fence (201 Created)",
      qrRes.status === 201 && Boolean(qrData.session_token) && qrData.geo_fence?.radius_meters === 100
    );

    const sessionToken = qrData.session_token;

    // 4. Student Scans from Home/Hostel (Remote Proxy - ~2.2km away: 21.1850, 72.8450) -> Must Be Blocked (403)
    console.log("\n--- 4. Test Anti-Proxy Protection: Remote/Out-of-Bounds Student ---");
    const remoteLat = 21.1850;
    const remoteLon = 72.8450;

    const remoteRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentAuth.token}` },
      body: JSON.stringify({
        session_token: sessionToken,
        latitude: remoteLat,
        longitude: remoteLon,
      }),
    });
    const remoteData = await remoteRes.json();

    assert(
      "Out-of-bounds attendance rejected (403 Forbidden with outOfBounds: true)",
      remoteRes.status === 403 && remoteData.outOfBounds === true && remoteData.distance > 100,
      `Calculated Distance: ${remoteData.distance}m (Allowed Radius: ${remoteData.allowedRadius}m)`
    );

    // 5. Student Scans from Classroom (Inside 100m radius: ~10m away: 21.17025, 72.83115) -> Must Succeed (201)
    console.log("\n--- 5. Test In-Classroom Student Attendance (Inside Geo-Fence) ---");
    const inClassLat = 21.17025;
    const inClassLon = 72.83115;

    const inClassRes = await fetch(`${BASE}/attendance/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentAuth.token}` },
      body: JSON.stringify({
        session_token: sessionToken,
        latitude: inClassLat,
        longitude: inClassLon,
      }),
    });
    const inClassData = await inClassRes.json();

    assert(
      "In-classroom attendance accepted (201 Created with PRESENT status and verified distance)",
      inClassRes.status === 201 &&
        inClassData.status === "PRESENT" &&
        inClassData.distance_meters !== null &&
        inClassData.distance_meters <= 100,
      `Verified Distance: ${inClassData.distance_meters}m from classroom`
    );

    // 6. Faculty Dashboard Fetches Lecture Attendance -> Must Contain Verified Radius/Distance
    console.log("\n--- 6. Faculty Attendance Roster Verification ---");
    const rosterRes = await fetch(`${BASE}/attendance/lecture/${lectureId}`, {
      headers: { Authorization: `Bearer ${facultyAuth.token}` },
    });
    const rosterData = await rosterRes.json();
    const studentRecord = rosterData.attendance?.find((a) => a.email === regEmail);

    assert(
      "Faculty roster contains student with distance_meters & location_verified",
      rosterRes.status === 200 &&
        Boolean(studentRecord) &&
        studentRecord.distance_meters !== null &&
        studentRecord.location_verified === true,
      `Student: ${studentRecord?.full_name}, Distance: ${studentRecord?.distance_meters}m`
    );

    console.log("\n==================================================================");
    console.log(`=== TEST SUMMARY: ${passCount}/${totalCount} TESTS PASSED ===`);
    console.log("==================================================================\n");

    if (passCount === totalCount) {
      console.log("🎉 ALL GEO-FENCING & FACULTY RADIUS TESTS PASSED PERFECTLY!\n");
    } else {
      console.error("❌ Some tests failed!");
    }
  } catch (err) {
    console.error("Test execution error:", err);
  }
}

runGeoFenceVerification();
