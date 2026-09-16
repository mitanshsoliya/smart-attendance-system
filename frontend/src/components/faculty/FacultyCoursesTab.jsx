import React from "react";

export function FacultyCoursesTab({
  courses = [],
  user,
  selectedFacultyCode,
  departmentName,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-default pb-4">
        <div>
          <h1 className="font-serif-display text-2xl sm:text-3xl text-primary font-bold">
            Assigned Courses & Curricula
          </h1>
          <p className="text-sm text-text-stone mt-1">
            Courses strictly assigned to your teaching workload per official department timetable.
          </p>
        </div>
        {departmentName && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-secondary/10 text-secondary px-3 py-1 rounded">
              {selectedFacultyCode ? `Instructor: ${selectedFacultyCode} • ` : ""}
              {departmentName}
            </span>
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="bg-surface-warm border border-border-default rounded p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-text-stone">menu_book</span>
          <p className="text-sm font-bold text-primary mt-2">No Courses Assigned in Current Timetable</p>
          <p className="text-xs text-text-stone mt-1">
            Check the Schedule tab or contact the Head of Department for workload allocation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <div
              key={c.id || c.subject_code}
              className="bg-surface-bright border border-border-default rounded p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-secondary/50 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold bg-secondary/10 text-secondary px-2.5 py-0.5 rounded">
                    {c.subject_code}
                  </span>
                  {c.type && (
                    <span className="text-[11px] font-mono text-text-stone bg-surface-container px-2 py-0.5 rounded">
                      {c.type}
                    </span>
                  )}
                </div>
                <h3 className="font-serif-display text-lg font-bold text-primary leading-snug">
                  {c.subject_name}
                </h3>
                <p className="text-xs text-text-stone">{c.department || departmentName}</p>
              </div>

              <div className="pt-3 border-t border-border-default text-xs font-mono text-text-stone flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-secondary">verified</span>
                  {c.credit_hours || 4} Credit Hours
                </span>
                <span className="text-[11px] bg-surface-container px-2 py-0.5 rounded font-bold text-primary">
                  Timetable Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
