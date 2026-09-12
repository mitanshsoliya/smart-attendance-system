import React, { useState } from "react";
import { formatShortDate } from "../../utils/formatters";

export function FacultyLecturesTab({
  lectures,
  subjectsList,
  lectureForm,
  setLectureForm,
  createLoading,
  createMessage,
  onCreateLecture,
  onOpenEdit,
  onDeleteLecture,
  onGenerateQR,
}) {
  return (
    <div className="space-y-8">
      <div className="border-b border-border-default pb-4">
        <h1 className="font-serif-display text-3xl text-primary font-bold">Classroom Lectures Directory</h1>
        <p className="text-sm text-text-stone mt-1">Schedule new lecture sessions, verify active status, and modify class timings.</p>
      </div>

      {/* Schedule Form */}
      <div className="bg-surface-warm border border-border-default p-6 rounded shadow-xs">
        <h3 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">add_circle</span>
          Schedule New Lecture Session
        </h3>
        {createMessage && (
          <div className="mb-4 p-3 bg-surface-container border-l-4 border-secondary text-xs text-primary">
            {createMessage}
          </div>
        )}
        <form onSubmit={onCreateLecture} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs uppercase font-semibold text-text-stone mb-1">Select Subject *</label>
            <select
              value={lectureForm.subject_id}
              onChange={(e) => setLectureForm({ ...lectureForm, subject_id: e.target.value })}
              className="w-full p-2.5 text-xs bg-surface border border-border-default text-primary rounded"
            >
              {subjectsList.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.subject_code} - {sub.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-text-stone mb-1">Lecture Date *</label>
            <input
              type="date"
              required
              value={lectureForm.lecture_date}
              onChange={(e) => setLectureForm({ ...lectureForm, lecture_date: e.target.value })}
              className="w-full p-2.5 text-xs bg-surface border border-border-default text-primary font-mono rounded"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-text-stone mb-1">Start Time *</label>
            <input
              type="time"
              step="1"
              required
              value={lectureForm.start_time}
              onChange={(e) => setLectureForm({ ...lectureForm, start_time: e.target.value })}
              className="w-full p-2.5 text-xs bg-surface border border-border-default text-primary font-mono rounded"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-semibold text-text-stone mb-1">End Time *</label>
            <input
              type="time"
              step="1"
              required
              value={lectureForm.end_time}
              onChange={(e) => setLectureForm({ ...lectureForm, end_time: e.target.value })}
              className="w-full p-2.5 text-xs bg-surface border border-border-default text-primary font-mono rounded"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={createLoading}
              className="px-6 py-2.5 bg-secondary text-on-secondary font-bold text-xs rounded hover:opacity-90 cursor-pointer disabled:opacity-50"
            >
              {createLoading ? "Creating Lecture..." : "Create & Schedule Lecture"}
            </button>
          </div>
        </form>
      </div>

      {/* Lectures List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lectures.map((lec) => {
          const isActive = lec.is_active || lec.status === "ACTIVE";
          return (
            <div key={lec.id} className="border p-5 bg-surface-bright rounded flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded font-mono">
                    {lec.subject_code || "CS501"}
                  </span>
                  <h4 className="font-bold text-lg text-primary mt-2">{lec.subject_name || "Database Systems"}</h4>
                  <p className="text-xs text-text-stone mt-1 font-mono">
                    {formatShortDate(lec.lecture_date)} • {lec.start_time} - {lec.end_time}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onOpenEdit(lec)} className="px-2 py-1 text-xs border border-border-default rounded">Edit</button>
                  <button onClick={() => onDeleteLecture(lec.id)} className="px-2 py-1 text-xs text-error">Delete</button>
                </div>
              </div>

              <div className="pt-3 border-t border-border-default flex justify-between items-center">
                <span className="text-xs font-mono text-text-stone">Lecture #{lec.id}</span>
                <button
                  onClick={() => onGenerateQR(lec.id)}
                  className="px-4 py-2 text-xs font-bold bg-secondary text-on-secondary rounded hover:opacity-90"
                >
                  Generate QR
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
