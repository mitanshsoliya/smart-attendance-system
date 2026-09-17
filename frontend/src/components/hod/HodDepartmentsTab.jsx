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
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
              INSTITUTIONAL OVERVIEW
            </span>
            <span className="text-xs text-text-stone">Departmental Performance</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
            Academic Departments & Performance Metrics
          </h1>
          <p className="text-xs sm:text-sm text-text-stone mt-0.5 max-w-3xl">
            Live overview of academic departments, faculty ratios, enrolled student cohorts, and aggregate compliance rates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white border border-border-default hover:border-primary/40 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-lg">
                  {dept.code}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                    dept.attendancePct >= 75
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : dept.attendancePct > 0
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-surface-container text-text-stone"
                  }`}
                >
                  {dept.attendancePct}% Avg Attendance
                </span>
              </div>
              <h3 className="font-heading text-lg font-bold text-primary group-hover:text-primary-container transition-colors">
                {dept.name}
              </h3>
              <p className="text-xs text-text-stone mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">person</span>
                <span>Head: {dept.head}</span>
              </p>
            </div>

            <div className="pt-4 border-t border-border-default/60 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-surface-container-low p-2 rounded-xl border border-border-default/60">
                <span className="block font-bold text-primary text-base">{dept.students}</span>
                <span className="text-[10px] text-text-stone">Students</span>
              </div>
              <div className="bg-surface-container-low p-2 rounded-xl border border-border-default/60">
                <span className="block font-bold text-primary text-base">{dept.faculty}</span>
                <span className="text-[10px] text-text-stone">Faculty</span>
              </div>
              <div className="bg-surface-container-low p-2 rounded-xl border border-border-default/60">
                <span className="block font-bold text-primary text-base">{dept.courses}</span>
                <span className="text-[10px] text-text-stone">Courses</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
