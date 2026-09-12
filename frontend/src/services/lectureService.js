import api, { authHeader } from "./api";

export const lectureService = {
  async getMyLectures(token) {
    const { data } = await api.get("/lectures/my", authHeader(token));
    return data;
  },

  async createLecture(lectureData, token) {
    const { data } = await api.post("/lectures/create", lectureData, authHeader(token));
    return data;
  },

  async updateLecture(id, lectureData, token) {
    const { data } = await api.put(`/lectures/${id}`, lectureData, authHeader(token));
    return data;
  },

  async deleteLecture(id, token) {
    const { data } = await api.delete(`/lectures/${id}`, authHeader(token));
    return data;
  },

  async createQrSession(lectureId, token) {
    const { data } = await api.post("/qr-session/create", { lecture_id: lectureId }, authHeader(token));
    return data;
  },

  async getSubjects(token) {
    const { data } = await api.get("/lectures/subjects", authHeader(token));
    return data;
  },
};
