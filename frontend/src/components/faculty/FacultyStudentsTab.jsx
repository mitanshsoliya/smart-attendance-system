import React, { useState } from "react";

export function FacultyStudentsTab({ studentRoster, onOpenEnrolModal }) {
  const [search, setSearch] = useState("");

  const filtered = studentRoster.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-default pb-4">
        <div>
          <h1 className="font-serif-display text-3xl text-primary font-bold">Student Directory & Roster</h1>
          <p className="text-sm text-text-stone mt-1">View enrolled candidates and course registration statuses.</p>
        </div>
        <button
          onClick={onOpenEnrolModal}
          className="px-4 py-2 bg-secondary text-on-secondary text-xs font-bold rounded hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          <span>Enrol Student</span>
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
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-surface-container border-b border-border-default text-xs uppercase font-bold text-text-stone">
              <th className="p-3.5">Roll Number</th>
              <th className="p-3.5">Full Name</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Section</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-surface-container-low">
                <td className="p-3.5 font-mono text-xs font-bold text-secondary">{s.roll_number || `2024-CSE-0${s.id}`}</td>
                <td className="p-3.5 font-semibold text-primary">{s.full_name}</td>
                <td className="p-3.5 text-xs text-text-stone">{s.email}</td>
                <td className="p-3.5 text-xs font-medium">{s.section || "Sec A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
