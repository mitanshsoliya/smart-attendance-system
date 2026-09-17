import React, { useState, useMemo } from "react";

export function HodFacultyTab({ faculty = [], onOpenAddFacultyModal, onDeleteFaculty }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return (faculty || []).filter((f) => {
      const name = (f.fullName || f.full_name || "").toLowerCase();
      const email = (f.email || "").toLowerCase();
      const dept = (f.department || "").toLowerCase();
      const q = search.toLowerCase();
      return name.includes(q) || email.includes(q) || dept.includes(q);
    });
  }, [faculty, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-default pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                FACULTY SUPERVISION & WORKLOAD
              </span>
              <span className="text-xs text-text-stone">Teaching Quotas</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
              Department Faculty Roster ({filtered.length})
            </h1>
            <p className="text-xs sm:text-sm text-text-stone mt-0.5 max-w-3xl">
              Supervise teaching allocations, syllabus progress, lecture completion metrics, and instructor credentials.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAddFacultyModal}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Add Faculty</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative pt-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 mt-2 -translate-y-1/2 text-text-stone text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search faculty by name, institutional email, or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-border-default rounded-xl text-xs sm:text-sm text-primary placeholder:text-text-stone/70 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Faculty Table */}
      <div className="bg-white border border-border-default rounded-2xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-text-stone space-y-2">
            <span className="material-symbols-outlined text-3xl text-text-stone/60">person_off</span>
            <p className="font-semibold text-primary">No faculty members found</p>
            <p className="text-[11px] text-text-muted">
              Add new professors or instructors to manage departmental teaching quotas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar touch-pan-x">
            <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[700px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-border-default text-[11px] font-bold uppercase tracking-wider text-text-stone">
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Conducted Classes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/60">
                {filtered.map((f, idx) => {
                  const name = f.fullName || f.full_name || "Faculty";
                  const designation =
                    f.designation || (f.role === "HOD" ? "Professor & HOD" : "Assistant Professor");
                  const dept = f.department || "Department of Computer Science & Engineering";
                  const phone = f.contactNo || f.phone || "N/A";
                  const lectures = f.lecturesConducted ?? f.lectures_conducted ?? 0;

                  return (
                    <tr key={f.id || idx} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-primary">
                        <div>{name}</div>
                        <div className="text-xs font-mono font-normal text-text-stone">{f.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-primary">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {designation}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-text-stone">{phone}</td>
                      <td className="py-3.5 px-4 text-xs text-text-stone">{dept}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs font-bold text-primary">
                        {lectures}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onDeleteFaculty(f.id)}
                          className="text-xs text-rose-600 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
