import api, { authHeader } from "./api";

export const courseService = {
  async getCourses(token) {
    const { data } = await api.get("/subjects", authHeader(token));
    return data;
  },

  async getCourseDetails(id, token) {
    const { data } = await api.get(`/subjects/${id}`, authHeader(token));
    return data;
  },

  async createCourse(courseData, token) {
    const { data } = await api.post("/subjects", courseData, authHeader(token));
    return data;
  },

  async updateCourse(id, courseData, token) {
    const { data } = await api.put(`/subjects/${id}`, courseData, authHeader(token));
    return data;
  },

  async deleteCourse(id, token) {
    const { data } = await api.delete(`/subjects/${id}`, authHeader(token));
    return data;
  },

  async enrollStudent(subjectId, studentData, token) {
    const { data } = await api.post(`/subjects/${subjectId}/enroll`, studentData, authHeader(token));
    return data;
  },

  async unenrollStudent(subjectId, studentId, token) {
    const { data } = await api.delete(`/subjects/${subjectId}/unenroll`, {
      ...authHeader(token),
      data: { student_id: studentId },
    });
    return data;
  },

  async getCourseStudents(subjectId, token) {
    const { data } = await api.get(`/subjects/${subjectId}/students`, authHeader(token));
    return data;
  },
};
