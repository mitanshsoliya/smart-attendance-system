import React from "react";

export function StudentTimetableTab() {
  const timetable = [
    { day: "Monday", slots: [{ time: "09:00 - 10:30", course: "CS501 - Database Systems", room: "Room 204" }, { time: "11:00 - 12:30", course: "CS502 - Computer Networks", room: "Room 102" }] },
    { day: "Tuesday", slots: [{ time: "10:00 - 11:30", course: "CS503 - Operating Systems", room: "Lab 3" }, { time: "14:00 - 15:30", course: "MA504 - Mathematics II", room: "Room 305" }] },
    { day: "Wednesday", slots: [{ time: "09:00 - 10:30", course: "CS501 - Database Systems", room: "Room 204" }, { time: "11:00 - 12:30", course: "CS503 - Operating Systems Lab", room: "Lab 3" }] },
    { day: "Thursday", slots: [{ time: "10:00 - 11:30", course: "CS502 - Computer Networks", room: "Room 102" }, { time: "13:00 - 14:30", course: "MA504 - Mathematics II", room: "Room 305" }] },
    { day: "Friday", slots: [{ time: "09:00 - 11:00", course: "CS501 - DB Project Work", room: "Lab 1" }] },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-border-default pb-4">
        <h1 className="font-serif-display text-3xl text-primary font-bold">Class Timetable & Schedule</h1>
        <p className="text-sm text-text-stone mt-1">Weekly lecture slots and assigned room allocations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {timetable.map((t) => (
          <div key={t.day} className="bg-surface-bright border border-border-default rounded p-5 shadow-xs">
            <h3 className="font-bold text-lg text-primary border-b border-border-default pb-2 mb-3">{t.day}</h3>
            <div className="space-y-3">
              {t.slots.map((s, idx) => (
                <div key={idx} className="p-3 bg-surface-container-low border border-border-default rounded text-xs">
                  <span className="font-mono text-secondary font-bold block">{s.time}</span>
                  <span className="font-bold text-primary block mt-1">{s.course}</span>
                  <span className="text-text-stone block mt-0.5">{s.room}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
