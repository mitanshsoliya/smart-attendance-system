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
};
