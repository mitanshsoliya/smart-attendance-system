import React from "react";

export function HodAnalyticsTab({ students }) {
  const lowAttendance = students.filter((s) => s.attendancePercentage < 75);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D8D2C4]">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#9E3D24] font-bold">
            NAAC / NBA COMPLIANCE ANALYTICS
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">
            Institutional Attendance Metrics & Cohort Risk
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 max-w-3xl">
            Accreditation committee compliance metrics, cohort attendance distribution bands, and statutory audit dossiers.
          </p>
        </div>
      </div>

      {/* Low Attendance Audit Table */}
      <div className="bg-white border border-[#D8D2C4] rounded p-6 shadow-xs space-y-4">
        <h3 className="font-serif text-xl font-bold text-[#BA1A1A]">Students Below 75% Statutory Threshold ({lowAttendance.length})</h3>
        {lowAttendance.length === 0 ? (
          <p className="text-xs text-[#2E6B34] font-semibold">All enrolled students are above the 75% statutory attendance threshold!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F3EFE6] border-b border-[#D8D2C4] font-mono font-bold text-[#6B7280]">
                  <th className="p-3">Roll Number</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3 text-right">Attendance %</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8D2C4]">
                {lowAttendance.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3 font-mono font-bold">{s.rollNumber}</td>
                    <td className="p-3 font-bold text-[#12181F]">{s.fullName}</td>
                    <td className="p-3 text-[#6B7280]">{s.email}</td>
                    <td className="p-3 text-right font-bold text-[#BA1A1A]">{s.attendancePercentage}%</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-[#BA1A1A]/10 text-[#BA1A1A] font-bold rounded">
                        DISQUALIFIED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
