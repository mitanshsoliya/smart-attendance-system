import React from "react";

export function FacultyCoursesTab({ courses }) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border-default pb-4">
        <h1 className="font-serif-display text-3xl text-primary font-bold">Assigned Courses & Curricula</h1>
        <p className="text-sm text-text-stone mt-1">Courses assigned to your teaching workload for this semester.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((c) => (
          <div key={c.id} className="bg-surface-bright border border-border-default rounded p-6 shadow-xs space-y-3">
            <span className="text-xs font-mono font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded">{c.subject_code}</span>
            <h3 className="font-serif-display text-xl font-bold text-primary">{c.subject_name}</h3>
            <p className="text-xs text-text-stone">{c.department || "Department of Computer Science & Engineering"}</p>
            <div className="pt-3 border-t border-border-default text-xs font-mono text-text-stone flex justify-between">
              <span>{c.credit_hours || 4} Credit Hours</span>
              <span>{c.enrolled_count || 0} Enrolled Students</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
