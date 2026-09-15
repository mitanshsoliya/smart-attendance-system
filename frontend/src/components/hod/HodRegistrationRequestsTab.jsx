import React, { useState, useEffect, useMemo } from "react";
import { hodService } from "../../services/hodService";

export function HodRegistrationRequestsTab({ token, onDataChanged }) {
  const [activeSection, setActiveSection] = useState("STUDENT"); // "STUDENT" or "FACULTY"
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    pendingTotal: 0,
    pendingStudents: 0,
    pendingFaculty: 0,
    approvedTotal: 0,
    rejectedTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [processingId, setProcessingId] = useState(null);
  const [assignedSections, setAssignedSections] = useState({});

  const fetchRequests = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await hodService.getRegistrationRequests(token);
      setRequests(data.requests || []);
      if (data.counts) setCounts(data.counts);
    } catch (err) {
      console.error("Failed to load registration requests:", err);
      setError(err.response?.data?.message || "Failed to load registration requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleApprove = async (id, name, role) => {
    const targetSection = assignedSections[id] || "Sec A";
    const confirmMsg = role === "STUDENT"
      ? `Are you sure you want to onboard candidate ${name} into ${targetSection}?`
      : `Are you sure you want to ALLOW and onboard ${name} (${role}) into the departmental registry?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setProcessingId(id);
      setError("");
      setSuccessMessage("");
      const payload = role === "STUDENT" ? { section: targetSection } : {};
      const res = await hodService.approveRegistrationRequest(id, payload, token);
      setSuccessMessage(res.message || `${role} account approved and added to department!`);
      await fetchRequests();
      if (onDataChanged) {
        onDataChanged(); // Re-sync students, faculty, and departments in parent dashboard!
      }
    } catch (err) {
      console.error("Approve error:", err);
      setError(err.response?.data?.message || "Failed to approve registration request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to REJECT the registration request for ${name}?`)) {
      return;
    }

    try {
      setProcessingId(id);
      setError("");
      setSuccessMessage("");
      const res = await hodService.rejectRegistrationRequest(id, token);
      setSuccessMessage(res.message || "Registration request rejected.");
      await fetchRequests();
    } catch (err) {
      console.error("Reject error:", err);
      setError(err.response?.data?.message || "Failed to reject registration request.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Role section filter
      if (r.role !== activeSection) return false;

      // Status filter
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;

      // Search filter
      const q = search.toLowerCase().trim();
      if (!q) return true;
      const name = (r.fullName || "").toLowerCase();
      const email = (r.email || "").toLowerCase();
      const roll = (r.rollNumber || "").toLowerCase();
      const empId = (r.employeeId || "").toLowerCase();
      const dept = (r.department || "").toLowerCase();

      return (
        name.includes(q) ||
        email.includes(q) ||
        roll.includes(q) ||
        empId.includes(q) ||
        dept.includes(q)
      );
    });
  }, [requests, activeSection, statusFilter, search]);

  const studentRequestsCount = requests.filter((r) => r.role === "STUDENT" && r.status === "PENDING").length;
  const facultyRequestsCount = requests.filter((r) => r.role === "FACULTY" && r.status === "PENDING").length;

  return (
    <div className="space-y-6 animate-fadeIn font-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D8D2C4]">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#BA1A1A] font-bold">
            ACADEMIC ONBOARDING & ADMISSION CLEARANCE
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#12181F] mt-1">
            Registration Requests & Verification
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 max-w-3xl">
            Review self-registration requests from candidate students and faculty members. Allowing a request automatically registers their user credentials, creates their profile, and integrates them into their academic department roster.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          className="px-3.5 py-2 bg-white border border-[#D8D2C4] hover:bg-[#F3EFE6] text-xs font-semibold rounded cursor-pointer flex items-center gap-1.5 transition-colors self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          <span>Refresh Requests</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#D8D2C4] rounded-lg shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider font-mono">
            PENDING VERIFICATION
          </div>
          <div className="text-2xl font-serif font-bold text-[#9E3D24] mt-1">
            {counts.pendingTotal}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">Awaiting HOD action</div>
        </div>

        <div className="p-4 bg-white border border-[#D8D2C4] rounded-lg shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider font-mono">
            STUDENT REQUESTS
          </div>
          <div className="text-2xl font-serif font-bold text-[#12181F] mt-1">
            {studentRequestsCount}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">Candidate enrollments</div>
        </div>

        <div className="p-4 bg-white border border-[#D8D2C4] rounded-lg shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider font-mono">
            FACULTY REQUESTS
          </div>
          <div className="text-2xl font-serif font-bold text-[#12181F] mt-1">
            {facultyRequestsCount}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">Instructor applications</div>
        </div>

        <div className="p-4 bg-white border border-[#D8D2C4] rounded-lg shadow-xs">
          <div className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider font-mono">
            APPROVED ONBOARDED
          </div>
          <div className="text-2xl font-serif font-bold text-[#2E7D32] mt-1">
            {counts.approvedTotal}
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">Active in Department</div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-[#FDE8E8] border border-[#F8B4B4] text-[#9B1C1C] text-xs rounded font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-[#DEF7EC] border border-[#BCF0DA] text-[#03543F] text-xs rounded font-medium flex items-center justify-between">
          <span>✓ {successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* 2 Main Sub-Sections: Student vs Faculty Toggle */}
      <div className="flex items-center gap-2 border-b border-[#D8D2C4]">
        <button
          type="button"
          onClick={() => setActiveSection("STUDENT")}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeSection === "STUDENT"
              ? "border-[#9E3D24] text-[#9E3D24]"
              : "border-transparent text-[#6B7280] hover:text-[#12181F]"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">school</span>
          <span>Student Requests</span>
          {studentRequestsCount > 0 && (
            <span className="px-2 py-0.5 bg-[#9E3D24] text-white text-[10px] rounded-full font-bold">
              {studentRequestsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("FACULTY")}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeSection === "FACULTY"
              ? "border-[#9E3D24] text-[#9E3D24]"
              : "border-transparent text-[#6B7280] hover:text-[#12181F]"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
          <span>Faculty Requests</span>
          {facultyRequestsCount > 0 && (
            <span className="px-2 py-0.5 bg-[#9E3D24] text-white text-[10px] rounded-full font-bold">
              {facultyRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder={
              activeSection === "STUDENT"
                ? "Search by student name, roll no, email..."
                : "Search by faculty name, employee id, email..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2.5 bg-white border border-[#D8D2C4] rounded text-xs text-[#12181F] focus:outline-none focus:border-[#9E3D24]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-[#6B7280] whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-white border border-[#D8D2C4] rounded text-xs font-medium text-[#12181F] focus:outline-none focus:border-[#9E3D24] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Verification</option>
            <option value="APPROVED">Approved / Onboarded</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Content View: Request List */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-[#D8D2C4] rounded-lg">
          <div className="animate-spin inline-block w-8 h-8 border-3 border-[#9E3D24] border-t-transparent rounded-full mb-3"></div>
          <p className="text-sm font-medium text-[#6B7280]">Loading registration requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-white border border-[#D8D2C4] rounded-lg space-y-2">
          <span className="material-symbols-outlined text-4xl text-[#9CA3AF]">
            {activeSection === "STUDENT" ? "person_search" : "badge"}
          </span>
          <h3 className="font-serif text-lg font-bold text-[#12181F]">
            No {activeSection === "STUDENT" ? "Student" : "Faculty"} Requests Found
          </h3>
          <p className="text-xs text-[#6B7280] max-w-md mx-auto">
            {search || statusFilter !== "ALL"
              ? "No registration requests matched your filter query."
              : `There are currently no new registration requests submitted for ${activeSection.toLowerCase()}s.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const isPending = req.status === "PENDING";
            const isApproved = req.status === "APPROVED";
            const isRejected = req.status === "REJECTED";
            const isProcessing = processingId === req.id;

            return (
              <div
                key={req.id}
                className="bg-white border border-[#D8D2C4] rounded-lg p-5 shadow-xs transition-all hover:border-[#9E3D24]/40"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Identity Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-[#F3EFE6] border border-[#D8D2C4] flex items-center justify-center font-serif text-base font-bold text-[#9E3D24] shrink-0">
                      {req.fullName ? req.fullName.slice(0, 2).toUpperCase() : "U"}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif text-lg font-bold text-[#12181F]">
                          {req.fullName}
                        </h3>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isPending
                              ? "bg-[#FEF08A] text-[#854D0E] border border-[#FDE047]"
                              : isApproved
                              ? "bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]"
                              : "bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="text-xs text-[#6B7280] flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#12181F]">{req.email}</span>
                        <span>•</span>
                        <span className="text-[#9E3D24] font-semibold">{req.department}</span>
                      </div>

                      {/* Detail Badges depending on Role */}
                      <div className="flex items-center gap-4 pt-1 text-xs text-[#4B5563] flex-wrap">
                        {req.role === "STUDENT" ? (
                          <>
                            <div>
                              <span className="font-bold text-[#6B7280]">Roll No:</span>{" "}
                              <code className="font-mono bg-[#FBF9F5] px-1.5 py-0.5 rounded border border-[#E5E7EB]">
                                {req.rollNumber || "Not Provided"}
                              </code>
                            </div>
                            <div>
                              <span className="font-bold text-[#6B7280]">Section:</span>{" "}
                              {req.section === "Pending HOD Allocation" || !req.section ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF08A] text-[#854D0E] border border-[#FDE047]">
                                  <span className="material-symbols-outlined text-[12px]">pending</span>
                                  <span>Pending HOD Allocation</span>
                                </span>
                              ) : (
                                <span className="font-semibold text-[#12181F] bg-[#FBF9F5] px-1.5 py-0.5 rounded border border-[#E5E7EB]">
                                  {req.section}
                                </span>
                              )}
                            </div>
                            {req.studentPhone && (
                              <div>
                                <span className="font-bold text-[#6B7280]">Student Phone:</span>{" "}
                                <span>{req.studentPhone}</span>
                              </div>
                            )}
                            {req.parentPhone && (
                              <div>
                                <span className="font-bold text-[#6B7280]">Parents Phone:</span>{" "}
                                <span>{req.parentPhone}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="font-bold text-[#6B7280]">Employee ID:</span>{" "}
                              <code className="font-mono bg-[#FBF9F5] px-1.5 py-0.5 rounded border border-[#E5E7EB]">
                                {req.employeeId || "Not Provided"}
                              </code>
                            </div>
                            <div>
                              <span className="font-bold text-[#6B7280]">Designation:</span>{" "}
                              <span>{req.designation || "Assistant Professor"}</span>
                            </div>
                            {req.phone && (
                              <div>
                                <span className="font-bold text-[#6B7280]">Phone:</span>{" "}
                                <span>{req.phone}</span>
                              </div>
                            )}
                          </>
                        )}

                        <div className="text-[11px] text-[#9CA3AF] font-mono">
                          Requested: {new Date(req.createdAt).toLocaleDateString()} at{" "}
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-center pt-2 lg:pt-0">
                    {isPending ? (
                      <>
                        {req.role === "STUDENT" && (
                          <div className="flex items-center gap-1.5 bg-[#FBF9F5] py-1 px-2 rounded border border-[#D8D2C4]">
                            <span className="material-symbols-outlined text-[15px] text-[#9E3D24]">school</span>
                            <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider whitespace-nowrap">
                              Assign Section:
                            </label>
                            <select
                              value={assignedSections[req.id] || "Sec A"}
                              onChange={(e) => setAssignedSections((prev) => ({ ...prev, [req.id]: e.target.value }))}
                              disabled={isProcessing}
                              className="py-1 px-2 bg-white border border-[#D8D2C4] rounded text-xs font-bold text-[#9E3D24] focus:outline-none focus:border-[#9E3D24] cursor-pointer"
                            >
                              <option value="Sec A">Sec A</option>
                              <option value="Sec B">Sec B</option>
                              <option value="Sec C">Sec C</option>
                              <option value="Sec D">Sec D</option>
                            </select>
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleReject(req.id, req.fullName)}
                          className="px-3 py-1.5 bg-white border border-[#D8D2C4] hover:bg-[#FDE8E8] hover:text-[#BA1A1A] hover:border-[#F8B4B4] text-[#6B7280] font-bold text-xs rounded transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApprove(req.id, req.fullName, req.role)}
                          className="px-4 py-1.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-xs rounded transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {isProcessing ? (
                            <>
                              <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                              <span>Onboarding...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              <span>
                                {req.role === "STUDENT"
                                  ? `Assign & Allow (${assignedSections[req.id] || "Sec A"})`
                                  : "Allow / Approve"}
                              </span>
                            </>
                          )}
                        </button>
                      </>
                    ) : isApproved ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E7D32] bg-[#DCFCE7] px-3 py-1.5 rounded border border-[#BBF7D0]">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <span>Active in Department Roster</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#991B1B] bg-[#FEE2E2] px-3 py-1.5 rounded border border-[#FECACA]">
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        <span>Request Rejected</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
