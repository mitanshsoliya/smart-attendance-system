import api, { authHeader } from "./api";

export const attendanceService = {
  async markAttendance(sessionToken, token) {
    const deviceToken = typeof localStorage !== "undefined" ? localStorage.getItem("lecturelog_device_token") : null;
    const { data } = await api.post(
      "/attendance/mark",
      { session_token: sessionToken, ...(deviceToken ? { device_token: deviceToken } : {}) },
      authHeader(token)
    );
    return data;
  },

  async getMyStudentAttendance(token) {
    const { data } = await api.get("/attendance/my", authHeader(token));
    return data;
  },

  async getLectureAttendanceRoster(lectureId, token) {
    const { data } = await api.get(`/attendance/lecture/${lectureId}`, authHeader(token));
    return data;
  },

  async updateAttendanceStatus({ lectureId, studentId, attendanceId, status }, token) {
    const { data } = await api.put(
      "/attendance/status",
      {
        lecture_id: lectureId,
        student_id: studentId,
        attendance_id: attendanceId,
        status,
      },
      authHeader(token)
    );
    return data;
  },
};
