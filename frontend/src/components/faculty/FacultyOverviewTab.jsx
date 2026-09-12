import React from "react";
import { formatShortDate } from "../../utils/formatters";

export function FacultyOverviewTab({ user, nextLecture, totalClasses, onGenerateQR, onNavigateTab }) {
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border-default pb-6">
        <div>
          <span className="text-xs uppercase font-bold text-secondary font-mono tracking-wider">
            Faculty Academic Workspace
          </span>
          <h1 className="font-serif-display text-3xl text-primary font-bold mt-1">
            Good day, {user?.full_name || "Dr. Faculty"}!
          </h1>
          <p className="text-sm text-text-stone mt-1">
            Professor • Department of Computer Science & Engineering
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          Live Academic Session
        </span>
      </div>

      {/* Next Lecture Hero Section */}
      <div className="bg-surface-warm border border-border-default rounded p-6 shadow-xs flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-secondary text-xs uppercase font-bold tracking-wider">Next Scheduled Lecture</span>
            <span className="text-xs text-text-stone font-mono flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span>
              {nextLecture ? `${nextLecture.start_time} - ${nextLecture.end_time}` : "10:00 AM - 11:30 AM"}
            </span>
          </div>
          <h2 className="font-serif-display text-3xl text-primary font-bold">
            {nextLecture ? nextLecture.subject_name : "Database Systems"}
          </h2>
          <p className="text-sm text-text-stone mt-1">
            {nextLecture ? `${nextLecture.subject_code} • ${formatShortDate(nextLecture.lecture_date)}` : "CS501 • Room 204"}
          </p>
        </div>

        <button
          onClick={() => onGenerateQR(nextLecture?.id)}
          className="bg-secondary text-on-secondary py-3 px-8 rounded hover:opacity-90 transition-opacity shadow-sm cursor-pointer font-bold text-sm"
        >
          Start Attendance QR
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-bright border border-border-default p-5 rounded shadow-xs">
          <span className="text-xs uppercase font-bold text-text-stone">Classes Conducted Today</span>
          <div className="font-serif-display text-4xl font-bold text-primary mt-2">{totalClasses || 3}</div>
        </div>

        <div className="bg-surface-bright border border-border-default p-5 rounded shadow-xs">
          <span className="text-xs uppercase font-bold text-text-stone">Average Attendance</span>
          <div className="font-serif-display text-4xl font-bold text-primary mt-2">92.4%</div>
        </div>

        <div className="bg-surface-bright border border-border-default p-5 rounded shadow-xs">
          <span className="text-xs uppercase font-bold text-text-stone">Assigned Subjects</span>
          <div className="font-serif-display text-4xl font-bold text-primary mt-2">4</div>
        </div>
      </div>
    </div>
  );
}
