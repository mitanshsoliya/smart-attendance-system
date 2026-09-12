import React from "react";
import { formatDateDisplay } from "../../utils/formatters";

export function HodReportsTab({ students, onExportLedger }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-[#D8D2C4] pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#12181F]">Dean of Academic Affairs Statutory Ledger</h1>
          <p className="text-sm text-[#6B7280] mt-1">Certified report forwarded to the Dean’s Office for semester hall-ticket issuance.</p>
        </div>
        <button onClick={onExportLedger} className="px-4 py-2 bg-[#9E3D24] text-white text-xs font-bold rounded cursor-pointer">
          Export Ledger CSV
        </button>
      </div>

      <div className="bg-[#FFFFFF] border-2 border-[#D8D2C4] rounded p-8 shadow-xs font-serif space-y-6">
        <div className="text-center pb-6 border-b-2 border-[#12181F]">
          <h2 className="text-2xl font-bold text-[#12181F] uppercase">Faculty of Engineering & Technology</h2>
          <h3 className="text-lg font-bold text-[#9E3D24] mt-1">Department of Computer Science & Engineering</h3>
          <p className="text-xs text-[#6B7280] font-sans mt-1">Semester V Statutory Attendance Ledger • {formatDateDisplay()}</p>
        </div>

        <div className="overflow-x-auto font-sans">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F3EFE6] border-b border-[#D8D2C4] font-bold uppercase text-[#6B7280]">
                <th className="py-2.5 px-3">Roll Number</th>
                <th className="py-2.5 px-3">Candidate Name</th>
                <th className="py-2.5 px-3 text-right">Attendance %</th>
                <th className="py-2.5 px-3 text-center">Clearance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D2C4]">
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 px-3 font-mono">{s.rollNumber}</td>
                  <td className="py-2 px-3 font-bold text-[#12181F]">{s.fullName}</td>
                  <td className="py-2 px-3 text-right font-bold">{s.attendancePercentage}%</td>
                  <td className="py-2 px-3 text-center font-bold">
                    <span className={s.attendancePercentage >= 75 ? "text-[#2E6B34]" : "text-[#BA1A1A]"}>
                      {s.attendancePercentage >= 75 ? "CLEARED" : "DISQUALIFIED"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
