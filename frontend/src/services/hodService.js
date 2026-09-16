import api, { authHeader } from "./api";

export const hodService = {
  async getHodStats(token) {
    const { data } = await api.get("/hod/stats", authHeader(token));
    return data;
  },

  async getHodStudents(token) {
    const { data } = await api.get("/hod/students", authHeader(token));
    return data;
  },

  async addHodStudent(studentData, token) {
    const { data } = await api.post("/hod/students", studentData, authHeader(token));
    return data;
  },

  async editHodStudent(id, studentData, token) {
    const { data } = await api.put(`/hod/students/${id}`, studentData, authHeader(token));
    return data;
  },

  async deleteHodStudent(id, token) {
    const { data } = await api.delete(`/hod/students/${id}`, authHeader(token));
    return data;
  },

  async resetStudentDevice(id, token) {
    const { data } = await api.post(`/hod/students/${id}/reset-device`, {}, authHeader(token));
    return data;
  },

  async unlockStudentAttendance(id, token) {
    const { data } = await api.post(`/hod/students/${id}/unlock-attendance`, {}, authHeader(token));
    return data;
  },

  async getHodFaculty(token) {
    const { data } = await api.get("/hod/faculty", authHeader(token));
    return data;
  },

  async addHodFaculty(facultyData, token) {
    const { data } = await api.post("/hod/faculty", facultyData, authHeader(token));
    return data;
  },

  async editHodFaculty(id, facultyData, token) {
    const { data } = await api.put(`/hod/faculty/${id}`, facultyData, authHeader(token));
    return data;
  },

  async deleteHodFaculty(id, token) {
    const { data } = await api.delete(`/hod/faculty/${id}`, authHeader(token));
    return data;
  },

  async getHodDepartments(token) {
    const { data } = await api.get("/hod/departments", authHeader(token));
    return data;
  },

  async getHodAnalytics(token) {
    const { data } = await api.get("/hod/analytics", authHeader(token));
    return data;
  },

  async getHodReports(token) {
    const { data } = await api.get("/hod/reports", authHeader(token));
    return data;
  },

  async getRegistrationRequests(token) {
    const { data } = await api.get("/hod/registration-requests", authHeader(token));
    return data;
  },

  async approveRegistrationRequest(id, payloadOrToken, maybeToken) {
    let body = {};
    let token = maybeToken;
    if (typeof payloadOrToken === "string" && !maybeToken) {
      token = payloadOrToken;
      body = {};
    } else if (typeof payloadOrToken === "string" && maybeToken) {
      body = { section: payloadOrToken };
      token = maybeToken;
    } else if (typeof payloadOrToken === "object") {
      body = payloadOrToken || {};
      token = maybeToken;
    }
    const { data } = await api.post(`/hod/registration-requests/${id}/approve`, body, authHeader(token));
    return data;
  },

  async rejectRegistrationRequest(id, token) {
    const { data } = await api.post(`/hod/registration-requests/${id}/reject`, {}, authHeader(token));
    return data;
  },

  async submitRegistrationRequest(requestData) {
    const { data } = await api.post("/register/request", requestData);
    return data;
  },
};
