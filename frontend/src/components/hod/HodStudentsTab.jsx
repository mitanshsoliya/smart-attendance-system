import React, { useState } from "react";

export function HodStudentsTab({ students, onOpenAddModal, onDeleteStudent, onExportLedger }) {
  const [search, setSearch] = useState("");

  const filtered = (students || []).filter((s) => {
    const name = (s.fullName || s.full_name || "").toLowerCase();
    const email = (s.email || "").toLowerCase();
    const roll = (s.rollNumber || s.roll_number || "").toLowerCase();
    const q = (search || "").toLowerCase();
    return name.includes(q) || email.includes(q) || roll.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D8D2C4]">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#BA1A1A] font-bold">
            STUDENT COHORT & EXAMINATION CLEARANCE
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">
            Student Roster & Statutory Clearance ({filtered.length})
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 max-w-3xl">
            Audit student attendance percentages, issue examination hall-ticket clearances, and manage student accounts.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-[#9E3D24] text-white text-xs font-bold rounded hover:bg-[#83311C] cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Add Student</span>
          </button>
          <button
            type="button"
            onClick={onExportLedger}
            className="px-4 py-2 bg-white border border-[#D8D2C4] hover:bg-[#F3EFE6] text-xs font-semibold rounded cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export Roster CSV</span>
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search student by name, roll number, or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5]"
      />

      <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded shadow-xs overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6B7280]">
            No student records found in the directory.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F3EFE6] border-b border-[#D8D2C4] font-mono text-xs uppercase text-[#6B7280]">
                <th className="py-3 px-4">Candidate Student</th>
                <th className="py-3 px-4">Section & Dept</th>
                <th className="py-3 px-4">Student Contact No.</th>
                <th className="py-3 px-4">Parents Contact No.</th>
                <th className="py-3 px-4 text-center">Attended / Total</th>
                <th className="py-3 px-4 text-right">Attendance %</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D2C4]/60">
              {filtered.map((s, idx) => {
                const name = s.fullName || s.full_name || "Student";
                const roll = s.rollNumber || s.roll_number || `2024-CSE-${String(s.id || idx + 1).padStart(3, "0")}`;
                const pct = s.attendancePercentage ?? s.attendance_percentage ?? 0;
                const stdPhone = s.studentPhone || s.student_phone || "N/A";
                const parPhone = s.parentPhone || s.parent_phone || "N/A";
                const dept = s.department || "CSE Department";
                return (
                  <tr key={s.id || idx} className="hover:bg-[#FBF9F5]">
                    <td className="py-3.5 px-4 font-bold text-[#12181F]">
                      <div>{name}</div>
                      <div className="text-xs font-mono font-normal text-[#6B7280]">{roll} • {s.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#555E68]">
                      <div>{s.section || "Sec A"}</div>
                      <div className="text-[11px] font-normal text-[#6B7280]">{dept}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#12181F]">{stdPhone}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#6B7280]">{parPhone}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs">{s.attendedLectures ?? s.attended_count ?? 0} / {s.totalLectures ?? s.total_lectures ?? 14}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#12181F]">{pct}%</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded ${pct >= 75 ? "bg-[#2E6B34]/15 text-[#2E6B34]" : "bg-[#BA1A1A]/15 text-[#BA1A1A]"}`}>
                        {pct >= 75 ? "CLEARED" : "DISQUALIFIED"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => onDeleteStudent(s.id)} className="text-xs text-[#BA1A1A] hover:underline cursor-pointer">
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
