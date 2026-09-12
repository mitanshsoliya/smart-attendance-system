import { useState } from "react";
import { attendanceService } from "../services/attendanceService";

export function useAttendance(token) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const markAttendance = async (sessionToken) => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const data = await attendanceService.markAttendance(sessionToken, token);
      setMessage(data.message || "Attendance marked successfully!");
      return { success: true, data };
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to mark attendance.";
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAttendance = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getMyStudentAttendance(token);
      setAttendanceRecords(data.attendance || []);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch attendance records.");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    message,
    setMessage,
    error,
    setError,
    attendanceRecords,
    markAttendance,
    fetchMyAttendance,
  };
}
