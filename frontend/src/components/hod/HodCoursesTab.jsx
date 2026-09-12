import React from "react";

export function HodCoursesTab({ courses, onOpenAddCourseModal }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D8D2C4]">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E3D24] font-bold">
            DEPARTMENTAL CURRICULUM ACCREDITATION
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">
            Accredited Courses & Curricula Modules
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 max-w-3xl">
            Manage departmental course syllabus codes, faculty allocations, and aggregate student attendance metrics.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddCourseModal}
          className="px-4 py-2 bg-[#9E3D24] hover:bg-[#83311C] text-white text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px]">add_box</span>
          <span>Register Course</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map((c) => (
          <div key={c.id} className="bg-white border border-[#D8D2C4] rounded p-5 shadow-xs space-y-3">
            <span className="text-xs font-mono font-bold bg-[#9E3D24]/10 text-[#9E3D24] px-2 py-0.5 rounded">
              {c.subjectCode || c.subject_code}
            </span>
            <h3 className="font-serif text-lg font-bold text-[#12181F]">{c.subjectName || c.subject_name}</h3>
            <div className="pt-3 border-t border-[#D8D2C4] flex justify-between text-xs font-mono text-[#6B7280]">
              <span>Credits: {c.credits || c.credit_hours || 4}</span>
              <span>Lectures: {c.lectureCount || c.lecture_count || 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
