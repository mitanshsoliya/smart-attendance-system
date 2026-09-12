import api, { authHeader } from "./api";

export const authService = {
  async login(email, password) {
    const { data } = await api.post("/login", { email, password });
    return data;
  },

  async getMe(token) {
    const { data } = await api.get("/auth/me", authHeader(token));
    return data;
  },

  async changePassword(currentPassword, newPassword, token) {
    const { data } = await api.put("/auth/change-password", { currentPassword, newPassword }, authHeader(token));
    return data;
  },

  async updateFacultyProfile(profileData, token) {
    const { data } = await api.put("/faculty/profile", profileData, authHeader(token));
    return data;
  },

  async getFacultyProfile(token) {
    const { data } = await api.get("/faculty/profile", authHeader(token));
    return data;
  },
};
