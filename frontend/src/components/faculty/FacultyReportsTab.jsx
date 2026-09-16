import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { attendanceService } from "../../services/attendanceService";

export function FacultyReportsTab({ lectures = [], token, onUpdateStatus }) {
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [filter, setFilter] = useState("ALL"); // 'ALL' | 'PRESENT' | 'ABSENT'
  const [searchTerm, setSearchTerm] = useState("");

  const handleOpenReport = async (lecture) => {
    setSelectedLecture(lecture);
    setFilter("ALL");
    setSearchTerm("");
    setLoadingReport(true);
    try {
      const data = await attendanceService.getLectureAttendanceRoster(lecture.id, token);
      setReportData(data);
    } catch (err) {
      console.error("Failed to load lecture report:", err);
      alert("Failed to load attendance report for this lecture.");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleCloseReport = () => {
    setSelectedLecture(null);
    setReportData(null);
  };

  const handleToggleStatusInReport = async (studentId, newStatus, attendanceId) => {
    if (!selectedLecture) return;
    if (onUpdateStatus) {
      await onUpdateStatus(studentId, newStatus, attendanceId, selectedLecture.id);
      // Re-fetch report data to keep in sync
      try {
        const freshData = await attendanceService.getLectureAttendanceRoster(selectedLecture.id, token);
        setReportData(freshData);
      } catch (e) {
        console.error("Failed to re-fetch report data:", e);
      }
    }
  };

  const handleExportCSV = () => {
    if (!selectedLecture || !reportData?.attendance) return;
    const records = reportData.attendance;
    const headers = ["Roll Number", "Student Name", "Email", "Section", "Status", "Attendance Time", "Verified Distance"];
    const rows = records.map((r) => [
      r.roll_number || "",
      `"${r.full_name || ""}"`,
      r.email || "",
      r.section || "",
      r.status || "ABSENT",
      r.attendance_time ? new Date(r.attendance_time).toLocaleTimeString() : "N/A",
      r.distance_meters !== null && r.distance_meters !== undefined ? `${r.distance_meters}m` : "N/A",
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_Report_${selectedLecture.subject_code}_${selectedLecture.lecture_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and search students in report modal
  const allRoster = reportData?.attendance || [];
  const presentList = allRoster.filter((a) => a.status === "PRESENT");
  const absentList = allRoster.filter((a) => a.status === "ABSENT");

  const filteredRoster = allRoster.filter((item) => {
    if (filter === "PRESENT" && item.status !== "PRESENT") return false;
    if (filter === "ABSENT" && item.status !== "ABSENT") return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = (item.full_name || "").toLowerCase().includes(term);
      const matchRoll = (item.roll_number || "").toLowerCase().includes(term);
      const matchEmail = (item.email || "").toLowerCase().includes(term);
      if (!matchName && !matchRoll && !matchEmail) return false;
    }
    return true;
  });

  const attendancePct = allRoster.length > 0 ? ((presentList.length / allRoster.length) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-default pb-4">
        <div>
          <h1 className="font-serif-display text-2xl sm:text-3xl text-primary font-bold">
            Session Register & Analytics Reports
          </h1>
          <p className="text-sm text-text-stone mt-1">
            Audit log of conducted lectures. Click on any lecture to view detailed Present and Absent student records.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto justify-center px-4 py-2 bg-secondary text-on-secondary text-xs font-bold rounded flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px]">print</span>
          <span>Print All Register</span>
        </button>
      </div>

      {/* Lectures List Table */}
      <div className="bg-surface-bright border border-border-default rounded overflow-x-auto custom-scrollbar touch-pan-x shadow-xs">
        <table className="w-full text-left text-xs min-w-[620px]">
          <thead>
            <tr className="bg-surface-container border-b border-border-default text-xs uppercase font-bold text-text-stone">
              <th className="p-3.5">Session ID</th>
              <th className="p-3.5">Subject</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Timings</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-right">Attendance Report</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {lectures.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-stone">
                  No lecture sessions registered yet. Schedule lectures from the Lectures tab.
                </td>
              </tr>
            ) : (
              lectures.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => handleOpenReport(l)}
                  className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                >
                  <td className="p-3.5 font-mono font-bold text-secondary">#{l.id}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-primary group-hover:text-secondary transition-colors">
                      {l.subject_code} - {l.subject_name}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-primary font-medium">{l.lecture_date}</td>
                  <td className="p-3.5 font-mono text-text-stone">
                    {l.start_time} - {l.end_time}
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2.5 py-1 text-[11px] font-bold bg-success/20 text-success rounded uppercase">
                      {l.status || "Conducted"}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenReport(l);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-on-secondary rounded text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">fact_check</span>
                      <span>View Report</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detailed Lecture Report Modal */}
      {selectedLecture && (
        <Modal
          isOpen={Boolean(selectedLecture)}
          onClose={handleCloseReport}
          title={`Attendance Dossier: ${selectedLecture.subject_code}`}
          subtitle={`${selectedLecture.subject_name} • Date: ${selectedLecture.lecture_date} (${selectedLecture.start_time} - ${selectedLecture.end_time})`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-5">
            {/* Quick Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-surface border border-border-default rounded flex flex-col justify-between">
                <span className="text-[11px] uppercase font-bold text-text-stone flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">groups</span>
                  <span>Total Enrolled</span>
                </span>
                <span className="text-2xl font-bold text-primary mt-1 font-mono">{allRoster.length}</span>
              </div>

              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded flex flex-col justify-between">
                <span className="text-[11px] uppercase font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Present</span>
                </span>
                <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 font-mono">
                  {presentList.length}
                </span>
              </div>

              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded flex flex-col justify-between">
                <span className="text-[11px] uppercase font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">cancel</span>
                  <span>Absent</span>
                </span>
                <span className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1 font-mono">
                  {absentList.length}
                </span>
              </div>

              <div className="p-3.5 bg-surface border border-border-default rounded flex flex-col justify-between">
                <span className="text-[11px] uppercase font-bold text-text-stone flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">analytics</span>
                  <span>Attendance Rate</span>
                </span>
                <span className="text-2xl font-bold text-secondary mt-1 font-mono">{attendancePct}%</span>
              </div>
            </div>

            {/* Filter Buttons & Search Input */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-1 border-t border-border-default">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilter("ALL")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    filter === "ALL"
                      ? "bg-secondary text-on-secondary"
                      : "bg-surface-container text-text-stone hover:bg-surface-container-high"
                  }`}
                >
                  All ({allRoster.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFilter("PRESENT")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-1 transition-colors cursor-pointer ${
                    filter === "PRESENT"
                      ? "bg-emerald-700 text-white"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>Present ({presentList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilter("ABSENT")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-1 transition-colors cursor-pointer ${
                    filter === "ABSENT"
                      ? "bg-rose-700 text-white"
                      : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">cancel</span>
                  <span>Absent ({absentList.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-56">
                  <span className="material-symbols-outlined absolute left-2.5 top-2 text-text-stone text-[16px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name or roll no..."
                    className="w-full pl-8 pr-2.5 py-1.5 bg-surface border border-border-default rounded text-xs text-primary focus:outline-none focus:border-secondary"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-surface-container text-text-stone hover:bg-surface-container-high border border-border-default rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Download CSV report"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            </div>

            {/* Students Table */}
            {loadingReport ? (
              <div className="p-8 text-center text-xs text-text-stone flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin text-2xl text-secondary">sync</span>
                <span>Loading session attendance dossier...</span>
              </div>
            ) : filteredRoster.length === 0 ? (
              <div className="p-8 bg-surface-bright border border-dashed border-border-default text-center text-xs text-text-stone rounded">
                No student records found matching this filter.
              </div>
            ) : (
              <div className="border border-border-default rounded overflow-x-auto custom-scrollbar touch-pan-x max-h-96">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead className="bg-surface-container-low text-text-stone uppercase text-[10px] tracking-wider sticky top-0 border-b border-border-default z-10">
                    <tr>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Roll No. / Section</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Check-in Time</th>
                      <th className="py-2.5 px-3">Verified Classroom Radius</th>
                      {onUpdateStatus && <th className="py-2.5 px-3 text-right">Quick Override</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {filteredRoster.map((att, idx) => {
                      const isPresent = att.status === "PRESENT";
                      const prevWasPresent = idx > 0 && filteredRoster[idx - 1].status === "PRESENT";
                      const isFirstAbsent = !isPresent && prevWasPresent && filter === "ALL";

                      return (
                        <React.Fragment key={att.id || `rep-${att.student_id || idx}`}>
                          {isFirstAbsent && (
                            <tr className="bg-rose-50/70 dark:bg-rose-950/40 border-y border-rose-200 dark:border-rose-900/50">
                              <td
                                colSpan={onUpdateStatus ? 6 : 5}
                                className="py-2 px-3 text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-sm">person_off</span>
                                  <span>Absent Students ({absentList.length})</span>
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr
                            className={`transition-colors ${
                              isPresent
                                ? "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"
                                : "hover:bg-rose-50/40 dark:hover:bg-rose-950/20 bg-rose-500/[0.02]"
                            }`}
                          >
                            <td className="py-2.5 px-3 font-semibold text-primary">
                              <div className={isPresent ? "text-primary" : "text-primary/80"}>
                                {att.full_name || "Enrolled Student"}
                              </div>
                              <div className="text-[10px] text-text-stone font-normal font-mono">{att.email}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-text-stone">
                              {att.roll_number || "—"} {att.section ? `(${att.section})` : ""}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {isPresent ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
                                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                  <span>PRESENT</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300">
                                  <span className="material-symbols-outlined text-[13px]">cancel</span>
                                  <span>ABSENT</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-text-stone whitespace-nowrap">
                              {isPresent ? (
                                att.attendance_time ? (
                                  new Date(att.attendance_time).toLocaleTimeString()
                                ) : (
                                  "—"
                                )
                              ) : (
                                <span className="italic text-[11px] text-rose-600/80">Did Not Check In</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {isPresent ? (
                                att.distance_meters !== null &&
                                att.distance_meters !== undefined &&
                                att.student_latitude ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-400 font-mono">
                                    <span className="material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400">
                                      location_on
                                    </span>
                                    <span>
                                      📍 <strong>{att.distance_meters}m</strong> from Classroom
                                    </span>
                                  </span>
                                ) : att.location_verified ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                    <span>Verified Presence</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-text-stone bg-surface-container font-mono">
                                    <span>Standard Check-in</span>
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-mono">
                                  <span className="material-symbols-outlined text-sm text-rose-500">
                                    do_not_disturb_on
                                  </span>
                                  <span>❌ Did Not Scan QR / Absent</span>
                                </span>
                              )}
                            </td>
                            {onUpdateStatus && (
                              <td className="py-2.5 px-3 whitespace-nowrap text-right">
                                {isPresent ? (
                                  <button
                                    onClick={() => handleToggleStatusInReport(att.student_id, "ABSENT", att.id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                                    title="Mark this student Absent"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">person_off</span>
                                    <span>Set Absent</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleStatusInReport(att.student_id, "PRESENT", att.id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                                    title="Mark this student Present"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">how_to_reg</span>
                                    <span>Set Present</span>
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-border-default">
              <button
                type="button"
                onClick={handleCloseReport}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded text-xs font-bold transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
