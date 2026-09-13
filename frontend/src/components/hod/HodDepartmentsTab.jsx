import React, { useMemo } from "react";

export function HodDepartmentsTab({
  departments: departmentsProp = [],
  students = [],
  faculty = [],
  courses = [],
  stats,
}) {
  // Normalize department name for robust matching
  const normalize = (val = "") => {
    const s = String(val).toLowerCase().trim();
    if (s.includes("computer") || s.includes("cse")) return "CSE";
    if (s.includes("information") || s.includes("it")) return "IT";
    if (s.includes("electronics") || s.includes("ece") || s.includes("communication")) return "ECE";
    return s;
  };

  const departments = useMemo(() => {
    const canonicalDepts = [
      {
        id: "dept-1",
        name: "Department of Computer Science & Engineering",
        code: "CSE",
        head: "Prof. Department Head",
      },
      {
        id: "dept-2",
        name: "Department of Information Technology",
        code: "IT",
        head: "Dr. A. K. Sharma",
      },
      {
        id: "dept-3",
        name: "Department of Electronics & Communication",
        code: "ECE",
        head: "Dr. Meenakshi Sundaram",
      },
    ];

    // Find any extra departments dynamically created in DB
    const knownCodes = new Set(["CSE", "IT", "ECE"]);
    const extraDepts = [];

    const checkAndAddExtra = (deptName) => {
      if (!deptName) return;
      const norm = normalize(deptName);
      if (!knownCodes.has(norm) && !extraDepts.some((e) => normalize(e.name) === norm)) {
        knownCodes.add(norm);
        const cleanName = String(deptName).trim();
        const words = cleanName.replace(/department\s+of\s+/i, "").split(/\s+/);
        const code = words.map((w) => w[0]).join("").toUpperCase().slice(0, 4) || "DEPT";
        extraDepts.push({
          id: `dept-${extraDepts.length + 4}`,
          name: cleanName,
          code,
          head: "Department In-Charge",
        });
      }
    };

    students.forEach((s) => checkAndAddExtra(s.department));
    faculty.forEach((f) => checkAndAddExtra(f.department));
    courses.forEach((c) => checkAndAddExtra(c.department));
    (departmentsProp || []).forEach((d) => checkAndAddExtra(d.name));

    const allDepts = [...canonicalDepts, ...extraDepts];

    return allDepts.map((dept) => {
      const deptNorm = normalize(dept.name);

      // 1. Exact students in this department
      const deptStudents = students.filter(
        (s) => normalize(s.department) === deptNorm || s.department === dept.name
      );

      // 2. Exact faculty in this department
      const deptFaculty = faculty.filter(
        (f) => normalize(f.department) === deptNorm || f.department === dept.name
      );

      // 3. Exact courses in this department
      const deptCourses = courses.filter(
        (c) => normalize(c.department) === deptNorm || c.department === dept.name
      );

      // Find if department metadata was provided by backend API
      const apiDept = (departmentsProp || []).find(
        (ad) => normalize(ad.name) === deptNorm || ad.code === dept.code
      );

      // Use live array counts if arrays are loaded, otherwise API response, otherwise 0
      const studentCount =
        students.length > 0
          ? deptStudents.length
          : Number(apiDept?.studentsCount ?? apiDept?.students ?? 0);

      const facultyCount =
        faculty.length > 0
          ? deptFaculty.length
          : Number(apiDept?.facultyCount ?? apiDept?.faculty ?? 0);

      const courseCount =
        courses.length > 0
          ? deptCourses.length
          : Number(apiDept?.coursesCount ?? apiDept?.courses ?? 0);

      // Calculate authentic average attendance percentage
      let attendancePct = 0;
      if (deptStudents.length > 0) {
        const totalPct = deptStudents.reduce(
          (acc, s) =>
            acc + Number(s.attendancePercentage ?? s.attendance_percentage ?? 0),
          0
        );
        attendancePct = Math.round((totalPct / deptStudents.length) * 10) / 10;
      } else if (apiDept?.avgAttendance !== undefined || apiDept?.attendancePct !== undefined) {
        attendancePct = Number(apiDept.avgAttendance ?? apiDept.attendancePct ?? 0);
      }

      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        head: apiDept?.head || dept.head,
        students: studentCount,
        faculty: facultyCount,
        courses: courseCount,
        attendancePct,
      };
    });
  }, [departmentsProp, students, faculty, courses]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D8D2C4]">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E3D24] font-bold">
            INSTITUTIONAL DEPARTMENTS OVERVIEW
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">
            Academic Departments & Performance Metrics
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 max-w-3xl">
            Live overview of academic departments, faculty ratios, enrolled student cohorts, and aggregate compliance rates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white border border-[#D8D2C4] rounded p-6 shadow-xs flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold bg-[#9E3D24]/10 text-[#9E3D24] px-2 py-0.5 rounded">
                  {dept.code}
                </span>
                <span
                  className={`text-xs font-mono font-bold ${
                    dept.attendancePct >= 75
                      ? "text-[#2E6B34]"
                      : dept.attendancePct > 0
                      ? "text-[#BA1A1A]"
                      : "text-[#6B7280]"
                  }`}
                >
                  {dept.attendancePct}% Avg Attendance
                </span>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#12181F]">{dept.name}</h3>
              <p className="text-xs text-[#6B7280] mt-1">Head: {dept.head}</p>
            </div>

            <div className="pt-4 border-t border-[#D8D2C4] grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#FBF9F5] p-2 rounded border border-[#D8D2C4]/60">
                <span className="block font-bold text-[#12181F] text-base">{dept.students}</span>
                <span className="text-[10px] text-[#6B7280]">Students</span>
              </div>
              <div className="bg-[#FBF9F5] p-2 rounded border border-[#D8D2C4]/60">
                <span className="block font-bold text-[#12181F] text-base">{dept.faculty}</span>
                <span className="text-[10px] text-[#6B7280]">Faculty</span>
              </div>
              <div className="bg-[#FBF9F5] p-2 rounded border border-[#D8D2C4]/60">
                <span className="block font-bold text-[#12181F] text-base">{dept.courses}</span>
                <span className="text-[10px] text-[#6B7280]">Courses</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
