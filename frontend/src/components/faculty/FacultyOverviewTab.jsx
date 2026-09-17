import React from "react";
import { formatShortDate } from "../../utils/formatters";
import { LiveCampusPulse } from "../common/LiveCampusPulse";

export function FacultyOverviewTab({
  user,
  nextLecture,
  totalClasses,
  onGenerateQR,
  onNavigateTab,
  assignedSubjectsCount,
  assignedSubjectsList = [],
}) {
  const professorName = user?.full_name || "Faculty Member";
  const departmentName = user?.department || "Academic Department";
  const subjectsCount =
    assignedSubjectsCount !== undefined ? assignedSubjectsCount : assignedSubjectsList.length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                PROFESSOR & INSTRUCTOR PORTAL
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-container text-text-stone">
                NBA Tier-1 Accredited Workspace
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Good day, {professorName}! 👨‍🏫
            </h1>
            <p className="text-xs sm:text-sm text-text-stone mt-1">
              {departmentName} • Broadcast dynamic attendance sessions, monitor live rosters, and manage student attendance overrides.
            </p>

            {/* Quick Meta Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border-default/60 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low border border-border-default font-medium text-primary">
                <span className="material-symbols-outlined text-[15px] text-primary">school</span>
                <span>{departmentName}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low border border-border-default font-medium text-primary">
                <span className="material-symbols-outlined text-[15px] text-primary">auto_stories</span>
                <span>Teaching: <strong className="font-bold text-primary">{subjectsCount} Courses</strong></span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low border border-border-default font-medium text-primary">
                <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
                <span>GPS Anti-Proxy Active</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch gap-3 shrink-0">
            <button
              onClick={() => onGenerateQR(nextLecture?.id)}
              className="px-6 py-3.5 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">
                qr_code_2
              </span>
              <span>Broadcast Live QR</span>
            </button>
            <button
              onClick={() => onNavigateTab("attendance")}
              className="px-4 py-3.5 bg-surface-bright border border-border-default text-primary hover:bg-surface-container font-semibold text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">rule</span>
              <span>Roster Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Next Lecture Hero Banner */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border border-primary/20 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white uppercase tracking-wider">
              Upcoming Lecture Session
            </span>
            <span className="text-xs font-mono font-semibold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              {nextLecture ? `${nextLecture.start_time} - ${nextLecture.end_time}` : "10:00 AM - 11:30 AM"}
            </span>
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-primary">
            {nextLecture
              ? nextLecture.subject_name
              : assignedSubjectsList[0]?.subject_name || "Database Management Systems (CS501)"}
          </h2>
          <p className="text-xs sm:text-sm text-text-stone mt-1">
            {nextLecture
              ? `${nextLecture.subject_code} • ${formatShortDate(nextLecture.lecture_date)} • Classroom Hall 402`
              : `${assignedSubjectsList[0]?.subject_code || "CS501"} • Timetable Teaching Schedule • Room 402`}
          </p>
        </div>

        <button
          onClick={() => onGenerateQR(nextLecture?.id)}
          className="w-full md:w-auto px-5 py-3 bg-primary hover:bg-primary-container text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">play_circle</span>
          <span>Start Session QR</span>
        </button>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white border border-border-default rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-stone">
              Conducted Classes
            </span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">co_present</span>
            </span>
          </div>
          <div className="font-heading text-3xl font-black text-primary mt-2">
            {totalClasses || 14}
          </div>
          <div className="mt-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
            Syllabus On Track (78%)
          </div>
        </div>

        <div className="bg-white border border-border-default rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-stone">
              Average Attendance
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
            </span>
          </div>
          <div className="font-heading text-3xl font-black text-primary mt-2">
            92.4%
          </div>
          <div className="mt-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
            +17.4% Above Cutoff
          </div>
        </div>

        <div className="bg-white border border-border-default rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-stone">
              Assigned Subjects
            </span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">library_books</span>
            </span>
          </div>
          <div className="font-heading text-3xl font-black text-primary mt-2">
            {subjectsCount}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {assignedSubjectsList.slice(0, 3).map((sub) => (
              <span
                key={sub.id || sub.subject_code}
                className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary"
              >
                {sub.subject_code}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white border border-border-default rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-stone">
              Geo-Fence Security
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">fmd_good</span>
            </span>
          </div>
          <div className="font-heading text-xl font-black text-primary mt-2">
            50m - 100m
          </div>
          <div className="mt-2 text-[11px] font-medium text-text-stone">
            Perimeter Anchor Locked
          </div>
        </div>
      </div>
    </div>
  );
}
