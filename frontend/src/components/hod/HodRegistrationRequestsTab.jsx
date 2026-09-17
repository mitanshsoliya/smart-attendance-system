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
    const confirmMsg =
      role === "STUDENT"
        ? `Are you sure you want to onboard candidate ${name} into ${targetSection}?`
        : `Are you sure you want to onboard ${name} (${role}) into the departmental registry?`;

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
        onDataChanged();
      }
    } catch (err) {
      console.error("Approve error:", err);
      setError(err.response?.data?.message || "Failed to approve registration request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id, name) => {
    const reason = window.prompt(
      `Enter reason for rejecting registration for ${name} (optional):`,
      "Information does not match departmental records"
    );
    if (reason === null) return;

    try {
      setProcessingId(id);
      setError("");
      setSuccessMessage("");
      const res = await hodService.rejectRegistrationRequest(id, { reason }, token);
      setSuccessMessage(res.message || "Registration request rejected.");
      await fetchRequests();
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (err) {
      console.error("Reject error:", err);
      setError(err.response?.data?.message || "Failed to reject registration request.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchRole = r.role === activeSection;
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        (r.fullName || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        (r.rollNumber || "").toLowerCase().includes(q) ||
        (r.employeeId || "").toLowerCase().includes(q);
      return matchRole && matchStatus && matchSearch;
    });
  }, [requests, activeSection, statusFilter, search]);

  const studentRequestsCount = counts.pendingStudents || 0;
  const facultyRequestsCount = counts.pendingFaculty || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
              ONBOARDING WORKSPACE
            </span>
            <span className="text-xs text-text-stone">Identity & Section Verification</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
            Registration Requests & Verification
          </h1>
          <p className="text-xs sm:text-sm text-text-stone mt-0.5 max-w-3xl">
            Review self-registration requests from candidate students and faculty members. Allowing a request automatically registers their user credentials, creates their profile, and integrates them into their assigned cohort section.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold rounded-xl transition-colors self-start md:self-auto flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          <span>Refresh Requests</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-border-default rounded-2xl shadow-xs">
          <div className="text-[10px] uppercase font-bold text-amber-700 tracking-wider font-mono">
            PENDING VERIFICATION
          </div>
          <div className="text-2xl font-heading font-black text-amber-600 mt-1">
            {counts.pendingTotal}
          </div>
          <div className="text-[11px] text-text-stone mt-0.5">Awaiting HOD action</div>
        </div>

        <div className="p-4 bg-white border border-border-default rounded-2xl shadow-xs">
          <div className="text-[10px] uppercase font-bold text-text-stone tracking-wider font-mono">
            STUDENT REQUESTS
          </div>
          <div className="text-2xl font-heading font-black text-primary mt-1">
            {studentRequestsCount}
          </div>
          <div className="text-[11px] text-text-stone mt-0.5">Candidate enrollments</div>
        </div>

        <div className="p-4 bg-white border border-border-default rounded-2xl shadow-xs">
          <div className="text-[10px] uppercase font-bold text-text-stone tracking-wider font-mono">
            FACULTY REQUESTS
          </div>
          <div className="text-2xl font-heading font-black text-primary mt-1">
            {facultyRequestsCount}
          </div>
          <div className="text-[11px] text-text-stone mt-0.5">Instructor applications</div>
        </div>

        <div className="p-4 bg-white border border-border-default rounded-2xl shadow-xs">
          <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider font-mono">
            APPROVED ONBOARDED
          </div>
          <div className="text-2xl font-heading font-black text-emerald-600 mt-1">
            {counts.approvedTotal}
          </div>
          <div className="text-[11px] text-text-stone mt-0.5">Added to registry</div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600 text-base">error</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage("")} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Role Toggle Tabs */}
      <div className="flex items-center gap-3 border-b border-border-default pb-2">
        <button
          type="button"
          onClick={() => setActiveSection("STUDENT")}
          className={`pb-2.5 px-4 font-bold text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeSection === "STUDENT"
              ? "border-primary text-primary"
              : "border-transparent text-text-stone hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">school</span>
          <span>Student Requests</span>
          {studentRequestsCount > 0 && (
            <span className="px-2 py-0.5 bg-primary text-white text-[10px] rounded-full font-bold">
              {studentRequestsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("FACULTY")}
          className={`pb-2.5 px-4 font-bold text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeSection === "FACULTY"
              ? "border-primary text-primary"
              : "border-transparent text-text-stone hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
          <span>Faculty Requests</span>
          {facultyRequestsCount > 0 && (
            <span className="px-2 py-0.5 bg-primary text-white text-[10px] rounded-full font-bold">
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
            className="w-full p-2.5 bg-white border border-border-default rounded-xl text-xs text-primary focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-text-stone whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-white border border-border-default rounded-xl text-xs font-medium text-primary focus:outline-none focus:border-primary cursor-pointer"
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
        <div className="p-12 text-center bg-white border border-border-default rounded-2xl">
          <div className="animate-spin inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full mb-3"></div>
          <p className="text-sm font-medium text-text-stone">Loading registration requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-10 text-center bg-white border border-border-default rounded-2xl shadow-xs space-y-2">
          <span className="material-symbols-outlined text-3xl text-text-stone/60">inbox</span>
          <p className="font-semibold text-primary">No registration requests found</p>
          <p className="text-xs text-text-stone">
            All applications have been processed, or none match the active filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const isPending = req.status === "PENDING";
            const isApproved = req.status === "APPROVED";
            const isProcessing = processingId === req.id;

            return (
              <div
                key={req.id}
                className="bg-white border border-border-default rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:border-primary/40"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Identity Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-heading text-base font-bold text-primary shrink-0">
                      {req.fullName ? req.fullName.slice(0, 2).toUpperCase() : "U"}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading text-base font-bold text-primary">
                          {req.fullName}
                        </h3>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPending
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : isApproved
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="text-xs text-text-stone flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-primary">{req.email}</span>
                        <span>•</span>
                        <span className="text-primary font-semibold">{req.department}</span>
                      </div>

                      {/* Detail Badges depending on Role */}
                      <div className="flex items-center gap-3 pt-1 text-xs text-text-stone flex-wrap">
                        {req.role === "STUDENT" ? (
                          <>
                            <div>
                              <span className="font-bold text-text-stone">Roll No:</span>{" "}
                              <code className="font-mono bg-surface-container-low px-1.5 py-0.5 rounded border border-border-default text-primary">
                                {req.rollNumber || "Not Provided"}
                              </code>
                            </div>
                            <div>
                              <span className="font-bold text-text-stone">Section:</span>{" "}
                              {req.section === "Pending HOD Allocation" || !req.section ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <span className="material-symbols-outlined text-[12px]">pending</span>
                                  <span>Pending HOD Allocation</span>
                                </span>
                              ) : (
                                <span className="font-bold text-primary bg-surface-container-low px-2 py-0.5 rounded border border-border-default">
                                  {req.section}
                                </span>
                              )}
                            </div>
                            {req.studentPhone && (
                              <div>
                                <span className="font-bold text-text-stone">Phone:</span>{" "}
                                <span>{req.studentPhone}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="font-bold text-text-stone">Employee ID:</span>{" "}
                              <code className="font-mono bg-surface-container-low px-1.5 py-0.5 rounded border border-border-default text-primary">
                                {req.employeeId || "Not Provided"}
                              </code>
                            </div>
                            <div>
                              <span className="font-bold text-text-stone">Designation:</span>{" "}
                              <span>{req.designation || "Assistant Professor"}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-end lg:self-center pt-2 lg:pt-0 w-full sm:w-auto">
                    {isPending ? (
                      <>
                        {req.role === "STUDENT" && (
                          <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-surface-container-low py-1.5 px-3 rounded-xl border border-border-default w-full sm:w-auto">
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[16px] text-primary">school</span>
                              <label className="text-[10px] font-bold text-text-stone uppercase tracking-wider whitespace-nowrap">
                                Section:
                              </label>
                            </div>
                            <select
                              value={assignedSections[req.id] || "Sec A"}
                              onChange={(e) =>
                                setAssignedSections((prev) => ({ ...prev, [req.id]: e.target.value }))
                              }
                              disabled={isProcessing}
                              className="py-1 px-2.5 bg-white border border-border-default rounded-lg text-xs font-bold text-primary focus:outline-none focus:border-primary cursor-pointer"
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
                          className="flex-1 sm:flex-initial justify-center px-3.5 py-2 bg-white border border-border-default hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-text-stone font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApprove(req.id, req.fullName, req.role)}
                          className="flex-1 sm:flex-initial justify-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
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
                                  : "Allow & Onboard"}
                              </span>
                            </>
                          )}
                        </button>
                      </>
                    ) : isApproved ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <span>Active in Department Roster</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
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
