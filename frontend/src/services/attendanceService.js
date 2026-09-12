import api, { authHeader } from "./api";

export const attendanceService = {
  async markAttendance(sessionToken, token) {
    const { data } = await api.post("/attendance/mark", { session_token: sessionToken }, authHeader(token));
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
};
