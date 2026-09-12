import React, { useState } from "react";

export function FacultyStudentsTab({ studentRoster, onOpenEnrolModal }) {
  const [search, setSearch] = useState("");

  const filtered = (studentRoster || []).filter((s) => {
    const name = (s.fullName || s.full_name || "").toLowerCase();
    const email = (s.email || "").toLowerCase();
    const roll = (s.rollNumber || s.roll_number || "").toLowerCase();
    const q = (search || "").toLowerCase();
    return name.includes(q) || email.includes(q) || roll.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-default pb-4">
        <div>
          <h1 className="font-serif-display text-3xl text-primary font-bold">Student Directory & Roster ({filtered.length})</h1>
          <p className="text-sm text-text-stone mt-1">View enrolled candidates, contact numbers, and course registration statuses.</p>
        </div>
        <button
          onClick={onOpenEnrolModal}
          className="px-4 py-2 bg-secondary text-on-secondary text-xs font-bold rounded hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          <span>Onboard Student</span>
        </button>
      </div>

      <input
        type="text"
        placeholder="Search student name, email, or roll number..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2.5 bg-surface-bright border border-border-default rounded text-sm text-primary"
      />

      <div className="bg-surface-bright border border-border-default rounded overflow-x-auto shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-stone">
            No student records found in the directory.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface-container border-b border-border-default text-xs uppercase font-bold text-text-stone">
                <th className="p-3.5">Candidate Student</th>
                <th className="p-3.5">Section & Dept</th>
                <th className="p-3.5">Student Contact No.</th>
                <th className="p-3.5">Parents Contact No.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {filtered.map((s, idx) => {
                const name = s.fullName || s.full_name || "Student";
                const roll = s.rollNumber || s.roll_number || `2024-CSE-0${s.id || idx + 1}`;
                const stdPhone = s.studentPhone || s.student_phone || "N/A";
                const parPhone = s.parentPhone || s.parent_phone || "N/A";
                const dept = s.department || "CSE Department";
                return (
                  <tr key={s.id || idx} className="hover:bg-surface-container-low">
                    <td className="p-3.5 font-semibold text-primary">
                      <div>{name}</div>
                      <div className="text-xs font-mono font-normal text-text-stone">{roll} • {s.email}</div>
                    </td>
                    <td className="p-3.5 text-xs text-text-stone">
                      <div className="font-bold text-primary">{s.section || "Sec A"}</div>
                      <div>{dept}</div>
                    </td>
                    <td className="p-3.5 font-mono text-xs font-semibold text-primary">{stdPhone}</td>
                    <td className="p-3.5 font-mono text-xs font-semibold text-text-stone">{parPhone}</td>
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
