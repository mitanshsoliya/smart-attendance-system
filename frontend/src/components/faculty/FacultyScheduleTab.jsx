import React from "react";

export function FacultyScheduleTab() {
  const schedule = [
    { day: "Monday", slots: [{ time: "10:00 - 11:30", subject: "CS501 - Database Systems", room: "Room 204" }] },
    { day: "Tuesday", slots: [{ time: "11:00 - 12:30", subject: "CS503 - Operating Systems", room: "Lab 3" }] },
    { day: "Wednesday", slots: [{ time: "10:00 - 11:30", subject: "CS501 - Database Systems", room: "Room 204" }] },
    { day: "Thursday", slots: [{ time: "14:00 - 15:30", subject: "CS502 - Computer Networks", room: "Room 102" }] },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-border-default pb-4">
        <h1 className="font-serif-display text-3xl text-primary font-bold">Faculty Teaching Schedule</h1>
        <p className="text-sm text-text-stone mt-1">Weekly timetables and assigned classroom allocations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {schedule.map((s) => (
          <div key={s.day} className="bg-surface-bright border border-border-default rounded p-5 shadow-xs">
            <h3 className="font-bold text-lg text-primary border-b border-border-default pb-2 mb-3">{s.day}</h3>
            {s.slots.map((slot, i) => (
              <div key={i} className="p-3 bg-surface-container-low border border-border-default rounded text-xs">
                <span className="font-mono text-secondary font-bold block">{slot.time}</span>
                <span className="font-bold text-primary block mt-1">{slot.subject}</span>
                <span className="text-text-stone block mt-0.5">{slot.room}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
