import React from "react";

export function StudentCoursesTab({ courses }) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border-default pb-4">
        <h1 className="font-serif-display text-3xl text-primary font-bold">Enrolled Courses & Curriculum</h1>
        <p className="text-sm text-text-stone mt-1">Official subjects registered in your academic program.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(courses.length > 0 ? courses : [
          { id: 1, subject_code: "CS501", subject_name: "Database Systems", credit_hours: 4, department: "Department of Computer Science & Engineering" },
          { id: 2, subject_code: "CS502", subject_name: "Computer Networks", credit_hours: 4, department: "Department of Computer Science & Engineering" },
          { id: 3, subject_code: "CS503", subject_name: "Operating Systems", credit_hours: 4, department: "Department of Computer Science & Engineering" },
          { id: 4, subject_code: "MA504", subject_name: "Mathematics II", credit_hours: 3, department: "Department of Computer Science & Engineering" },
        ]).map((c) => (
          <div key={c.id} className="bg-surface-bright border border-border-default rounded p-6 shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded">
                  {c.subject_code}
                </span>
                <span className="text-xs font-mono font-semibold text-text-stone">
                  {c.credit_hours || 4} Credits
                </span>
              </div>
              <h3 className="font-serif-display text-xl font-bold text-primary">{c.subject_name}</h3>
              <p className="text-xs text-text-stone mt-1">{c.department || "Department of Computer Science & Engineering"}</p>
            </div>

            <div className="pt-4 border-t border-border-default flex justify-between items-center text-xs">
              <span className="text-success font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                Active Enrollment
              </span>
              <span className="font-mono text-text-stone">Semester V</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
