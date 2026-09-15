import React, { useState, useEffect } from "react";
import { timetableService } from "../../services/timetableService";
import { getDepartmentTimetable } from "../../data/departmentTimetables";

export function HodTimetableTab({ user, token }) {
  const hodDept =
    user?.department ||
    user?.profile?.department ||
    "Department of Computer Science & Engineering";

  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDay, setEditingDay] = useState("Monday");
  const [editableSchedule, setEditableSchedule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Fetch timetable on mount
  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const data = await timetableService.getTimetable(token, hodDept);
      if (data && data.schedule) {
        setTimetable(data.schedule);
        setEditableSchedule(JSON.parse(JSON.stringify(data.schedule)));
      } else {
        const fallback = getDepartmentTimetable(hodDept);
        setTimetable(fallback);
        setEditableSchedule(JSON.parse(JSON.stringify(fallback)));
      }
    } catch (err) {
      console.error("Failed to fetch HOD timetable:", err);
      const fallback = getDepartmentTimetable(hodDept);
      setTimetable(fallback);
      setEditableSchedule(JSON.parse(JSON.stringify(fallback)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [hodDept, token]);

  const handleOpenEdit = () => {
    if (timetable) {
      setEditableSchedule(JSON.parse(JSON.stringify(timetable)));
      setShowEditModal(true);
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await timetableService.updateTimetable(token, hodDept, editableSchedule);
      setTimetable(res.schedule || editableSchedule);
      setStatusMessage({
        type: "success",
        text: "Timetable updated and published across the system successfully!",
      });
      setShowEditModal(false);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error("Failed to update timetable:", err);
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update timetable in database.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    if (!window.confirm("Are you sure you want to reset this department timetable to the standard template?")) return;
    const defaultTemplate = getDepartmentTimetable(hodDept);
    setSaving(true);
    try {
      await timetableService.updateTimetable(token, hodDept, defaultTemplate);
      setTimetable(defaultTemplate);
      setEditableSchedule(JSON.parse(JSON.stringify(defaultTemplate)));
      setShowEditModal(false);
      setStatusMessage({
        type: "success",
        text: "Department timetable reset to standard official schedule.",
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      alert("Failed to reset timetable.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !timetable) {
    return (
      <div className="p-8 text-center text-[#475569]">
        <span className="material-symbols-outlined animate-spin text-3xl text-[#C2410C]">sync</span>
        <p className="mt-2 text-sm font-bold">Loading Department Class Timetable...</p>
      </div>
    );
  }

  const current = timetable || getDepartmentTimetable(hodDept);
  const activeDaySchedule = editableSchedule?.days?.[editingDay] || {};

  // Periods configuration for the editor
  const PERIOD_DEFS = [
    { key: "p1", periodNum: 1, label: "Period 1 (9:00 - 10:00)" },
    { key: "p2", periodNum: 2, label: "Period 2 (10:00 - 11:00)" },
    { key: "p3", periodNum: 3, label: "Period 3 (11:00 - 12:00)" },
    { key: "p4", periodNum: 4, label: "Period 4 (12:00 - 1:00)" },
    { key: "p5", periodNum: 5, label: "Period 5 (1:30 - 2:20)" },
    { key: "p6", periodNum: 6, label: "Period 6 (2:20 - 3:10)" },
    { key: "p7", periodNum: 7, label: "Period 7 (3:10 - 4:00)" },
  ];

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#CBD5E1] rounded-lg p-5 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C2410C] text-2xl font-bold">edit_calendar</span>
            <h1 className="font-serif text-2xl text-[#0F172A] font-extrabold tracking-tight">
              Department Class Timetable Governance
            </h1>
          </div>
          <p className="text-xs font-semibold text-[#475569] mt-1">
            Exclusive administration of weekly lecture slots, lab rotations, and classroom allocations for{" "}
            <strong className="text-[#0F172A]">{hodDept}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-[#9E3D24] hover:bg-[#83311C] rounded-lg shadow-md transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base font-bold">edit</span>
            <span>Edit Timetable</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-[#0F172A] bg-[#F1F5F9] border-2 border-[#CBD5E1] rounded-lg hover:bg-[#E2E8F0] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base font-bold">print</span>
            <span>Print Matrix</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-lg text-xs font-extrabold flex items-center gap-2 border-2 ${
            statusMessage.type === "success"
              ? "bg-[#F0FDF4] text-[#14532D] border-[#16A34A]"
              : "bg-[#FEF2F2] text-[#991B1B] border-[#DC2626]"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {statusMessage.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Department Lock Indicator Badge */}
      <div className="flex items-center justify-between bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-lg px-4 py-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[#C2410C] text-lg font-bold">verified_user</span>
          <span className="font-extrabold text-[#475569]">Authorized Governance Scope:</span>
          <span className="font-black text-[#0F172A] bg-white border border-[#CBD5E1] px-2.5 py-1 rounded shadow-2xs">
            {current.deptFullName || hodDept} (Room {current.roomNo})
          </span>
        </div>
        <span className="text-xs font-bold text-[#64748B]">
          Sections: Sec A • Sec B • Sec C
        </span>
      </div>

      {/* Official BMU Matrix Table */}
      <div className="bg-white border-2 border-[#0F172A] rounded-md shadow-md overflow-hidden text-[#0F172A] print:border-black">
        {/* Document Header */}
        <div className="grid grid-cols-12 border-b-2 border-[#0F172A] text-[11px] font-sans">
          <div className="col-span-3 border-r-2 border-[#0F172A] divide-y divide-[#0F172A]/70">
            <div className="px-3 py-1.5 flex justify-between bg-[#F8FAFC]">
              <span className="font-bold italic">Term:</span>
              <span className="font-black text-[#0F172A]">{current.term}</span>
            </div>
            <div className="px-3 py-1.5 text-center font-black bg-[#F1F5F9] text-[#0F172A]">
              Effective From: {current.effectiveFrom}
            </div>
            <div className="px-3 py-1.5 flex justify-between">
              <span className="font-bold italic">Semester:</span>
              <span className="font-black text-[#0F172A]">{current.semester}</span>
            </div>
            <div className="px-3 py-1.5 flex justify-between">
              <span className="font-bold italic">Class:</span>
              <span className="font-black text-[#0F172A]">{current.class}</span>
            </div>
            <div className="px-3 py-1.5 flex justify-between">
              <span className="font-bold italic">Room No.:</span>
              <span className="font-black font-mono text-[#C2410C] text-xs">Room {current.roomNo}</span>
            </div>
          </div>

          <div className="col-span-6 flex flex-col items-center justify-center p-3 text-center border-r-2 border-[#0F172A] bg-white">
            <h2 className="font-serif text-base tracking-wider font-extrabold text-[#0F172A] uppercase">
              {current.facultyName}
            </h2>
            <h3 className="font-sans text-xs tracking-widest font-black text-[#C2410C] uppercase mt-0.5">
              OFFICIAL CLASS TIME TABLE
            </h3>
            <div className="mt-1.5 text-[11px] font-black tracking-wide uppercase px-3 py-0.5 border-t-2 border-b-2 border-[#0F172A]/30 w-full text-center text-[#1E293B]">
              {current.deptFullName}
            </div>
          </div>

          <div className="col-span-3 divide-y divide-[#0F172A]/70 text-[11px]">
            <div className="px-3 py-1.5 flex justify-between bg-[#F8FAFC]">
              <span className="font-bold italic">Doc No.:</span>
              <span className="font-mono text-[10px] font-bold">{current.docNo}</span>
            </div>
            <div className="px-3 py-1.5 flex justify-between">
              <span className="font-bold">Effective From:</span>
              <span className="font-black text-[#0F172A]">{current.effectiveFrom}</span>
            </div>
            <div className="px-3 py-1.5 flex justify-between">
              <span className="font-bold italic">Revision No.</span>
              <span className="font-black font-mono text-[#0F172A]">{current.revisionNo}</span>
            </div>
            <div className="px-3 py-1.5 flex justify-between">
              <span className="font-bold italic">Issue No.</span>
              <span className="font-black font-mono text-[#0F172A]">{current.issueNo}</span>
            </div>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="overflow-x-auto custom-scrollbar touch-pan-x">
          <table className="w-full text-center border-collapse text-xs min-w-[720px]">
            <thead>
              <tr className="border-b-2 border-[#0F172A] font-extrabold bg-[#F1F5F9] text-[11px] text-[#0F172A]">
                <th className="border-r-2 border-[#0F172A] p-2.5 w-28 text-left font-black">Period</th>
                <th className="border-r border-[#0F172A]/80 p-2.5 w-[11%]">1</th>
                <th className="border-r border-[#0F172A]/80 p-2.5 w-[11%]">2</th>
                <th className="border-r border-[#0F172A]/80 p-2.5 w-[11%]">3</th>
                <th className="border-r-2 border-[#0F172A] p-2.5 w-[11%]">4</th>
                <th className="border-r-2 border-[#0F172A] p-2.5 w-20 bg-[#E2E8F0] text-[10px] font-black uppercase tracking-wider text-[#334155]">
                  01:00 - 01:30
                </th>
                <th className="border-r border-[#0F172A]/80 p-2.5 w-[11%]">5</th>
                <th className="border-r border-[#0F172A]/80 p-2.5 w-[11%]">6</th>
                <th className="p-2.5 w-[11%]">7</th>
              </tr>
              <tr className="border-b-2 border-[#0F172A] font-bold bg-white text-[10px] text-[#334155]">
                <th className="border-r-2 border-[#0F172A] p-2 text-left italic font-bold">Day / Time</th>
                <th className="border-r border-[#0F172A]/80 p-2 font-mono">9:00 TO 10:00</th>
                <th className="border-r border-[#0F172A]/80 p-2 font-mono">10:00 TO 11:00</th>
                <th className="border-r border-[#0F172A]/80 p-2 font-mono">11:00 TO 12:00</th>
                <th className="border-r-2 border-[#0F172A] p-2 font-mono">12:00 TO 1:00</th>
                <th className="border-r-2 border-[#0F172A] p-2 bg-[#E2E8F0] text-[9px] font-black text-[#475569] uppercase">
                  LUNCH BREAK
                </th>
                <th className="border-r border-[#0F172A]/80 p-2 font-mono">1:30 TO 2:20</th>
                <th className="border-r border-[#0F172A]/80 p-2 font-mono">2:20 TO 3:10</th>
                <th className="p-2 font-mono">3:10 TO 4.00</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#0F172A] font-medium">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((dayName) => {
                const day = current.days?.[dayName] || {};
                return (
                  <tr key={dayName} className="hover:bg-slate-50">
                    <td className="border-r-2 border-[#0F172A] p-2.5 font-black text-left bg-[#F8FAFC]">
                      {dayName}
                    </td>

                    {/* Period 1 & 2 */}
                    {day.lab1?.periodSpan?.includes(1) && day.lab1?.periodSpan?.includes(2) ? (
                      <td colSpan={2} className="border-r border-[#0F172A] p-1.5 bg-emerald-50/40">
                        {renderHodLabCell(day.lab1)}
                      </td>
                    ) : (
                      <>
                        <td className="border-r border-[#0F172A]/70 p-1.5 font-bold">
                          {renderHodCell(day.p1)}
                        </td>
                        <td className="border-r border-[#0F172A]/70 p-1.5 font-bold">
                          {renderHodCell(day.p2)}
                        </td>
                      </>
                    )}

                    {/* Period 3 & 4 */}
                    {day.lab1?.periodSpan?.includes(3) && day.lab1?.periodSpan?.includes(4) ? (
                      <td colSpan={2} className="border-r-2 border-[#0F172A] p-1.5 bg-emerald-50/40">
                        {renderHodLabCell(day.lab1)}
                      </td>
                    ) : (
                      <>
                        <td className="border-r border-[#0F172A]/70 p-1.5 font-bold">
                          {renderHodCell(day.p3)}
                        </td>
                        <td className="border-r-2 border-[#0F172A] p-1.5 font-bold">
                          {renderHodCell(day.p4)}
                        </td>
                      </>
                    )}

                    {/* Lunch Break */}
                    <td className="border-r-2 border-[#0F172A] bg-[#F1F5F9]"></td>

                    {/* Period 5 */}
                    {day.lab2?.periodSpan?.includes(5) && day.lab2?.periodSpan?.includes(6) ? (
                      <td colSpan={2} className="border-r border-[#0F172A]/70 p-1.5 bg-emerald-50/40">
                        {renderHodLabCell(day.lab2)}
                      </td>
                    ) : (
                      <td className="border-r border-[#0F172A]/70 p-1.5 font-bold">
                        {renderHodCell(day.p5)}
                      </td>
                    )}

                    {/* Period 6 & 7 */}
                    {day.lab2?.periodSpan?.includes(6) && day.lab2?.periodSpan?.includes(7) ? (
                      <td colSpan={2} className="p-1.5 bg-emerald-50/40">
                        {renderHodLabCell(day.lab2)}
                      </td>
                    ) : day.lab2?.periodSpan?.includes(5) && day.lab2?.periodSpan?.includes(6) ? (
                      <td className="p-1.5 font-bold">{renderHodCell(day.p7)}</td>
                    ) : (
                      <>
                        <td className="border-r border-[#0F172A]/70 p-1.5 font-bold">
                          {renderHodCell(day.p6)}
                        </td>
                        <td className="p-1.5 font-bold">{renderHodCell(day.p7)}</td>
                      </>
                    )}
                  </tr>
                );
              })}

              {/* Saturday */}
              <tr className="bg-[#F8FAFC]">
                <td className="border-r-2 border-[#0F172A] p-2.5 font-bold text-left text-[#64748B]">
                  Saturday
                </td>
                <td colSpan={8} className="p-3 text-center text-[#64748B] italic font-semibold text-xs">
                  {current.days?.Saturday?.text || "Non-instructional Day / Weekend Holiday"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Faculty and Course Reference Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:break-before-page">
        <div className="bg-white border-2 border-[#CBD5E1] rounded-xl p-5 shadow-xs">
          <h4 className="font-extrabold text-sm text-[#0F172A] mb-3 flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
            <span className="material-symbols-outlined text-[#C2410C] text-lg font-bold">badge</span>
            Department Faculty Code Directory
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {(current.facultyDirectory || []).map((f) => (
              <div
                key={f.code}
                className="p-2.5 rounded-lg border bg-[#F8FAFC] border-[#E2E8F0] flex items-center gap-2.5"
              >
                <span className="font-mono font-black text-[#C2410C] bg-[#FFF7ED] border border-[#FFEDD5] px-2 py-0.5 rounded text-xs shrink-0">
                  [{f.code}]
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-[#0F172A] truncate">{f.name}</div>
                  {f.subject && (
                    <div className="text-[11px] font-semibold text-[#64748B] truncate">{f.subject}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border-2 border-[#CBD5E1] rounded-xl p-5 shadow-xs">
          <h4 className="font-extrabold text-sm text-[#0F172A] mb-3 flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
            <span className="material-symbols-outlined text-[#C2410C] text-lg font-bold">menu_book</span>
            Curriculum Courses & Nomenclature
          </h4>
          <div className="space-y-2 text-xs">
            {(current.subjectDirectory || []).map((s) => (
              <div
                key={s.code}
                className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono font-black text-[#0F172A] bg-[#F1F5F9] border border-[#CBD5E1] px-2 py-0.5 rounded text-xs shrink-0">
                    {s.code}
                  </span>
                  <span className="text-[#0F172A] font-bold truncate">{s.name}</span>
                </div>
                <span className="text-[11px] text-[#64748B] font-semibold uppercase shrink-0 ml-2">
                  {s.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 100% OPAQUE INTERACTIVE HOD TIMETABLE EDIT MODAL */}
      {/* ========================================================================= */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-slate-700 rounded-2xl max-w-5xl w-full p-6 space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto text-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3.5">
              <div>
                <h3 className="font-serif text-2xl font-black text-[#0F172A]">
                  Edit Class Timetable • {hodDept}
                </h3>
                <p className="text-xs font-bold text-[#475569] mt-0.5">
                  Full control over all 7 periods and rotating laboratory sessions. Any changes saved here sync live across all student and faculty portals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black flex items-center justify-center text-2xl font-bold cursor-pointer transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Day Switcher Tabs */}
            <div className="flex gap-2 border-b-2 border-slate-200 pb-2.5 overflow-x-auto">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setEditingDay(day)}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    editingDay === day
                      ? "bg-[#9E3D24] text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-black"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Day Slots Form */}
            <form onSubmit={handleSaveSchedule} className="space-y-6">
              {/* ALL 7 PERIODS EDITOR */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-[#9E3D24] tracking-wider">
                    {editingDay} — All 7 Period Lecture Slots
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    Edit theory subject, teacher code, and classroom venue for each period
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {PERIOD_DEFS.map(({ key, periodNum, label }) => {
                    const slotData = activeDaySchedule[key] || {
                      subject: "",
                      faculty: "",
                      room: current.roomNo || "503",
                      title: "",
                    };

                    // Check if this period is part of a lab block
                    const isLab1 = activeDaySchedule.lab1?.periodSpan?.includes(periodNum);
                    const isLab2 = activeDaySchedule.lab2?.periodSpan?.includes(periodNum);

                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border-2 space-y-2 ${
                          isLab1 || isLab2
                            ? "bg-emerald-50/80 border-emerald-400"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-slate-900">{label}</span>
                          {(isLab1 || isLab2) && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-700 text-white">
                              Lab Block
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block">Subject</label>
                            <input
                              type="text"
                              value={slotData.subject || ""}
                              placeholder="e.g. DDSP"
                              onChange={(e) => {
                                const updated = { ...editableSchedule };
                                if (!updated.days[editingDay][key]) {
                                  updated.days[editingDay][key] = { type: "theory", room: current.roomNo || "503" };
                                }
                                updated.days[editingDay][key].subject = e.target.value;
                                const fac = updated.days[editingDay][key].faculty || "";
                                updated.days[editingDay][key].title = fac
                                  ? `${e.target.value} (${fac})`
                                  : e.target.value;
                                setEditableSchedule(updated);
                              }}
                              className="w-full p-1.5 bg-white border-2 border-slate-300 rounded font-bold text-slate-900 text-xs focus:border-slate-800 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block">Faculty</label>
                            <input
                              type="text"
                              value={slotData.faculty || ""}
                              placeholder="e.g. ST"
                              onChange={(e) => {
                                const updated = { ...editableSchedule };
                                if (!updated.days[editingDay][key]) {
                                  updated.days[editingDay][key] = { type: "theory", room: current.roomNo || "503" };
                                }
                                updated.days[editingDay][key].faculty = e.target.value;
                                const sub = updated.days[editingDay][key].subject || "";
                                updated.days[editingDay][key].title = e.target.value
                                  ? `${sub} (${e.target.value})`
                                  : sub;
                                setEditableSchedule(updated);
                              }}
                              className="w-full p-1.5 bg-white border-2 border-slate-300 rounded font-bold text-slate-900 text-xs focus:border-slate-800 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block">Room</label>
                            <input
                              type="text"
                              value={slotData.room || ""}
                              placeholder="e.g. 503"
                              onChange={(e) => {
                                const updated = { ...editableSchedule };
                                if (!updated.days[editingDay][key]) {
                                  updated.days[editingDay][key] = { type: "theory" };
                                }
                                updated.days[editingDay][key].room = e.target.value;
                                setEditableSchedule(updated);
                              }}
                              className="w-full p-1.5 bg-white border-2 border-slate-300 rounded font-bold text-slate-900 text-xs focus:border-slate-800 outline-none font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ROTATING LABORATORY BLOCKS EDITOR */}
              {(activeDaySchedule.lab1 || activeDaySchedule.lab2) && (
                <div className="space-y-4 border-t-2 border-slate-200 pt-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-[#9E3D24] tracking-wider">
                      {editingDay} — Rotating Lab Sessions (Sec A / B / C)
                    </h4>
                    <span className="text-[11px] font-bold text-slate-500">
                      Customize 2-hour practical assignments, faculty mentors, and lab rooms
                    </span>
                  </div>

                  {/* Lab 1 Block */}
                  {activeDaySchedule.lab1?.batches && (
                    <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-300/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-emerald-950">
                            Morning Lab Session
                          </span>
                          <span className="text-xs font-bold text-emerald-800">
                            (Periods {activeDaySchedule.lab1.periodSpan?.join(" & ")})
                          </span>
                        </div>
                        <input
                          type="text"
                          value={activeDaySchedule.lab1.timeRange || ""}
                          placeholder="e.g. 11:00 TO 1:00"
                          onChange={(e) => {
                            const updated = { ...editableSchedule };
                            updated.days[editingDay].lab1.timeRange = e.target.value;
                            setEditableSchedule(updated);
                          }}
                          className="text-xs font-bold bg-white border border-emerald-300 rounded px-2.5 py-1 text-slate-900"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {["Sec A", "Sec B", "Sec C"].map((sec) => {
                          const b = activeDaySchedule.lab1.batches[sec];
                          if (!b) return null;
                          return (
                            <div
                              key={sec}
                              className="p-3 bg-white border-2 border-emerald-300 rounded-lg space-y-2 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs text-emerald-900">
                                  Section {sec.replace("Sec ", "")} ({sec})
                                </span>
                              </div>
                              <div className="space-y-1.5 text-xs">
                                <div>
                                  <label className="text-[9px] font-bold text-slate-500 uppercase">Subject</label>
                                  <input
                                    type="text"
                                    placeholder="Subject Code"
                                    value={b.subject || ""}
                                    onChange={(e) => {
                                      const updated = { ...editableSchedule };
                                      const target = updated.days[editingDay].lab1.batches[sec];
                                      target.subject = e.target.value;
                                      target.text = `${e.target.value}- ${target.faculty} (${target.lab})`;
                                      setEditableSchedule(updated);
                                    }}
                                    className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-slate-500 uppercase">Faculty Code</label>
                                  <input
                                    type="text"
                                    placeholder="Faculty Code"
                                    value={b.faculty || ""}
                                    onChange={(e) => {
                                      const updated = { ...editableSchedule };
                                      const target = updated.days[editingDay].lab1.batches[sec];
                                      target.faculty = e.target.value;
                                      target.text = `${target.subject}- ${e.target.value} (${target.lab})`;
                                      setEditableSchedule(updated);
                                    }}
                                    className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-slate-500 uppercase">Lab Room Venue</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Lab 512"
                                    value={b.lab || ""}
                                    onChange={(e) => {
                                      const updated = { ...editableSchedule };
                                      const target = updated.days[editingDay].lab1.batches[sec];
                                      target.lab = e.target.value;
                                      target.text = `${target.subject}- ${target.faculty} (${e.target.value})`;
                                      setEditableSchedule(updated);
                                    }}
                                    className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900 text-xs font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Lab 2 Block */}
                  {activeDaySchedule.lab2?.batches && (
                    <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-300/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-emerald-950">
                            Afternoon Lab Session
                          </span>
                          <span className="text-xs font-bold text-emerald-800">
                            (Periods {activeDaySchedule.lab2.periodSpan?.join(" & ")})
                          </span>
                        </div>
                        <input
                          type="text"
                          value={activeDaySchedule.lab2.timeRange || ""}
                          placeholder="e.g. 1:30 TO 3:10"
                          onChange={(e) => {
                            const updated = { ...editableSchedule };
                            updated.days[editingDay].lab2.timeRange = e.target.value;
                            setEditableSchedule(updated);
                          }}
                          className="text-xs font-bold bg-white border border-emerald-300 rounded px-2.5 py-1 text-slate-900"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {["Sec A", "Sec B", "Sec C"].map((sec) => {
                          const b = activeDaySchedule.lab2.batches[sec];
                          if (!b) return null;
                          return (
                            <div
                              key={sec}
                              className="p-3 bg-white border-2 border-emerald-300 rounded-lg space-y-2 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs text-emerald-900">
                                  Section {sec.replace("Sec ", "")} ({sec})
                                </span>
                              </div>
                              <div className="space-y-1.5 text-xs">
                                <div>
                                  <label className="text-[9px] font-bold text-slate-500 uppercase">Subject</label>
                                  <input
                                    type="text"
                                    placeholder="Subject Code"
                                    value={b.subject || ""}
                                    onChange={(e) => {
                                      const updated = { ...editableSchedule };
                                      const target = updated.days[editingDay].lab2.batches[sec];
                                      target.subject = e.target.value;
                                      target.text = `${e.target.value}- ${target.faculty} (${target.lab})`;
                                      setEditableSchedule(updated);
                                    }}
                                    className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-slate-500 uppercase">Faculty Code</label>
                                  <input
                                    type="text"
                                    placeholder="Faculty Code"
                                    value={b.faculty || ""}
                                    onChange={(e) => {
                                      const updated = { ...editableSchedule };
                                      const target = updated.days[editingDay].lab2.batches[sec];
                                      target.faculty = e.target.value;
                                      target.text = `${target.subject}- ${e.target.value} (${target.lab})`;
                                      setEditableSchedule(updated);
                                    }}
                                    className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-slate-500 uppercase">Lab Room Venue</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Lab 415"
                                    value={b.lab || ""}
                                    onChange={(e) => {
                                      const updated = { ...editableSchedule };
                                      const target = updated.days[editingDay].lab2.batches[sec];
                                      target.lab = e.target.value;
                                      target.text = `${target.subject}- ${target.faculty} (${e.target.value})`;
                                      setEditableSchedule(updated);
                                    }}
                                    className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900 text-xs font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t-2 border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={handleResetDefault}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-black text-red-700 bg-red-50 hover:bg-red-100 border-2 border-red-300 rounded-lg transition-colors cursor-pointer"
                >
                  Reset to Standard Template
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    disabled={saving}
                    className="px-4 py-2 text-xs font-extrabold text-slate-700 bg-slate-100 border-2 border-slate-300 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 text-xs font-black text-white bg-[#9E3D24] hover:bg-[#83311C] rounded-lg shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    {saving && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                    <span>{saving ? "Publishing Changes..." : "Save & Publish Changes"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function renderHodCell(cell) {
  if (!cell) return <span className="text-[#94A3B8] font-bold">—</span>;
  return (
    <div className="py-1">
      <span className="block text-xs font-black text-[#0F172A] tracking-tight">
        {cell.title}
      </span>
      {cell.room && (
        <span className="text-[10px] font-black text-[#334155] font-mono block mt-0.5">
          Room {cell.room}
        </span>
      )}
    </div>
  );
}

function renderHodLabCell(labBlock) {
  if (!labBlock || !labBlock.batches) return <span className="text-[#94A3B8] font-bold">—</span>;
  return (
    <div className="space-y-1 text-left text-[11px] py-1">
      {Object.entries(labBlock.batches).map(([secKey, b]) => {
        const displaySec = secKey.includes("A1") ? "Sec A" : secKey.includes("A2") ? "Sec B" : secKey.includes("A3") ? "Sec C" : secKey;
        const displayText = (b.text || `${b.subject}- ${b.faculty} (${b.lab})`)
          .replace(/\s*\((?:Sec|Batch)\s*[A-C1-3]\)/gi, "");

        return (
          <div
            key={secKey}
            className="px-2 py-0.5 rounded font-bold flex items-center justify-between hover:bg-white/80 text-[#0F172A]"
          >
            <span className="truncate">{displayText}</span>
            <span className="text-xs font-mono font-bold text-[#475569] ml-1 shrink-0">
              {displaySec}
            </span>
          </div>
        );
      })}
    </div>
  );
}
