import React from "react";

export function FacultyReportsTab({ lectures }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-border-default pb-4">
        <div>
          <h1 className="font-serif-display text-3xl text-primary font-bold">Session Register & Analytics Reports</h1>
          <p className="text-sm text-text-stone mt-1">Audit log of conducted lectures and aggregate attendance ratios.</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 bg-secondary text-on-secondary text-xs font-bold rounded">
          Export Report
        </button>
      </div>

      <div className="bg-surface-bright border border-border-default rounded overflow-x-auto shadow-xs">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-surface-container border-b border-border-default text-xs uppercase font-bold text-text-stone">
              <th className="p-3.5">ID</th>
              <th className="p-3.5">Subject</th>
              <th className="p-3.5">Date</th>
              <th className="p-3.5">Time</th>
              <th className="p-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {lectures.map((l) => (
              <tr key={l.id}>
                <td className="p-3.5 font-mono text-xs text-text-stone">#{l.id}</td>
                <td className="p-3.5 font-semibold text-primary">{l.subject_code} - {l.subject_name}</td>
                <td className="p-3.5 font-mono text-xs">{l.lecture_date}</td>
                <td className="p-3.5 font-mono text-xs">{l.start_time} - {l.end_time}</td>
                <td className="p-3.5 text-center">
                  <span className="px-2 py-0.5 text-xs font-bold bg-success/20 text-success rounded uppercase">Conducted</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
