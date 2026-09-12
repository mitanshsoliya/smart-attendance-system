import React, { useState } from "react";

export function HodFacultyTab({ faculty, onOpenAddFacultyModal, onDeleteFaculty }) {
  const [search, setSearch] = useState("");

  const filtered = (faculty || []).filter((f) => {
    const name = (f.fullName || f.full_name || "").toLowerCase();
    const email = (f.email || "").toLowerCase();
    const dept = (f.department || "").toLowerCase();
    const q = (search || "").toLowerCase();
    return name.includes(q) || email.includes(q) || dept.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D8D2C4]">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E3D24] font-bold">
            FACULTY SUPERVISION & GOVERNANCE
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">
            Department Faculty Teaching Quotas & Compliance ({filtered.length})
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 max-w-3xl">
            Supervise teaching loads, syllabus progress, lecture completion percentages, and faculty onboardings.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddFacultyModal}
          className="px-4 py-2 bg-[#9E3D24] text-white text-xs font-bold rounded hover:bg-[#83311C] cursor-pointer shadow-xs flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          <span>Add Faculty</span>
        </button>
      </div>

      <input
        type="text"
        placeholder="Search faculty by name, email, or department..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-[#D8D2C4] rounded bg-[#FBF9F5]"
      />

      <div className="bg-[#FFFFFF] border border-[#D8D2C4] rounded shadow-xs overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6B7280]">
            No faculty records found in the directory.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F3EFE6] border-b border-[#D8D2C4] font-mono text-xs uppercase text-[#6B7280]">
                <th className="py-3 px-4">Faculty Member</th>
                <th className="py-3 px-4">Contact No.</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Lectures Conducted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D2C4]/60">
              {filtered.map((f, idx) => {
                const name = f.fullName || f.full_name || "Faculty";
                const designation = f.designation || (f.role === "HOD" ? "Professor & HOD" : "Assistant Professor");
                const dept = f.department || "Department of Computer Science & Engineering";
                const phone = f.contactNo || f.phone || "N/A";
                const lectures = f.lecturesConducted ?? f.lectures_conducted ?? 0;
                return (
                  <tr key={f.id || idx} className="hover:bg-[#FBF9F5]">
                    <td className="py-3.5 px-4 font-bold text-[#12181F]">
                      <div>{name}</div>
                      <div className="text-xs font-mono font-normal text-[#6B7280]">{f.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#12181F]">{phone}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#555E68]">{designation}</td>
                    <td className="py-3.5 px-4 text-xs text-[#555E68]">{dept}</td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs font-bold text-[#12181F]">{lectures}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button onClick={() => onDeleteFaculty(f.id)} className="text-xs text-[#BA1A1A] hover:underline cursor-pointer">
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
