import React from "react";

export function StudentCoursesTab({ courses = [] }) {
  const displayCourses = courses.length > 0 ? courses : [
    { id: 1, subject_code: "CS501", subject_name: "Database Systems", credit_hours: 4, department: "Department of Computer Science & Engineering", semester: "Semester VI" },
    { id: 2, subject_code: "CS502", subject_name: "Computer Networks", credit_hours: 4, department: "Department of Computer Science & Engineering", semester: "Semester VI" },
    { id: 3, subject_code: "CS503", subject_name: "Operating Systems", credit_hours: 4, department: "Department of Computer Science & Engineering", semester: "Semester VI" },
    { id: 4, subject_code: "MA504", subject_name: "Discrete Mathematics & Graph Theory", credit_hours: 3, department: "Department of Mathematics", semester: "Semester VI" },
    { id: 5, subject_code: "CS505", subject_name: "Software Engineering & Agile", credit_hours: 3, department: "Department of Computer Science & Engineering", semester: "Semester VI" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
              CURRICULUM ENROLLMENT
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl text-primary font-bold mt-1">
              Registered Academic Courses ({displayCourses.length})
            </h1>
            <p className="text-xs sm:text-sm text-text-stone mt-0.5">
              Official accredited syllabus subjects enrolled for examination grading & attendance audits.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-xl text-xs font-semibold text-primary">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Accredited Curriculum</span>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayCourses.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-border-default hover:border-primary/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg">
                  {c.subject_code}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-container text-text-stone flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">timer</span>
                  {c.credit_hours || 4} Credits
                </span>
              </div>

              <h3 className="font-heading text-lg font-bold text-primary group-hover:text-primary-container transition-colors">
                {c.subject_name}
              </h3>
              <p className="text-xs text-text-stone mt-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-text-stone/80">account_balance</span>
                <span>{c.department || "Department of Computer Science & Engineering"}</span>
              </p>
            </div>

            <div className="pt-4 border-t border-border-default/60 flex justify-between items-center text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Enrollment
              </span>
              <span className="font-mono text-text-stone text-[11px]">
                {c.semester || "Semester VI"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
