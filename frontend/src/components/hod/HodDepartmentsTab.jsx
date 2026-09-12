import React from "react";

export function HodDepartmentsTab({ stats, studentsCount, facultyCount, coursesCount }) {
  const departments = [
    {
      id: "dept-1",
      name: "Department of Computer Science & Engineering",
      code: "CSE",
      head: "Prof. Department Head",
      students: studentsCount || 142,
      faculty: facultyCount || 18,
      courses: coursesCount || 12,
      attendancePct: stats?.aggregateAttendance || 91.4,
    },
    {
      id: "dept-2",
      name: "Department of Information Technology",
      code: "IT",
      head: "Dr. A. K. Sharma",
      students: 110,
      faculty: 14,
      courses: 10,
      attendancePct: 88.7,
    },
    {
      id: "dept-3",
      name: "Department of Electronics & Communication",
      code: "ECE",
      head: "Dr. Meenakshi Sundaram",
      students: 98,
      faculty: 12,
      courses: 8,
      attendancePct: 86.2,
    },
  ];

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
            Overview of all academic departments, faculty ratios, enrolled cohorts, and aggregate compliance rates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white border border-[#D8D2C4] rounded p-6 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold bg-[#9E3D24]/10 text-[#9E3D24] px-2 py-0.5 rounded">
                  {dept.code}
                </span>
                <span className="text-xs font-mono font-bold text-[#2E6B34]">
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
