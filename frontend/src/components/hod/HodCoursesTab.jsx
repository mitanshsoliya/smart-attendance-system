import React from "react";

export function HodCoursesTab({ courses = [], onOpenAddCourseModal }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
              ACCREDITED CURRICULUM
            </span>
            <span className="text-xs text-text-stone">Course Management</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
            Department Courses & Curricula ({courses.length})
          </h1>
          <p className="text-xs sm:text-sm text-text-stone mt-0.5 max-w-3xl">
            Manage course syllabus codes, credit hours, teaching allocations, and semester schedules.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddCourseModal}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add_box</span>
          <span>Register Course</span>
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-border-default hover:border-primary/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-lg">
                  {c.subjectCode || c.subject_code}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-container text-text-stone">
                  {c.credits || c.credit_hours || 4} Credits
                </span>
              </div>
              <h3 className="font-heading text-base font-bold text-primary group-hover:text-primary-container transition-colors">
                {c.subjectName || c.subject_name}
              </h3>
              <p className="text-xs text-text-stone mt-1">
                {c.department || "Department of Computer Science & Engineering"}
              </p>
            </div>

            <div className="pt-3 border-t border-border-default/60 flex justify-between items-center text-xs font-mono text-text-stone">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active Course
              </span>
              <span>{c.lectureCount || c.lecture_count || 12} Lectures</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
