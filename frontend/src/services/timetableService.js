import axios from "axios";

const API_BASE = "http://localhost:5000";

export const timetableService = {
  /**
   * Fetch timetable for current user's department or specified department
   */
  async getTimetable(token, department) {
    const params = department ? { department } : {};
    const res = await axios.get(`${API_BASE}/timetables`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  /**
   * Fetch all department timetables
   */
  async getAllTimetables(token) {
    const res = await axios.get(`${API_BASE}/timetables/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  /**
   * HOD-only: Update department timetable
   */
  async updateTimetable(token, department, schedule) {
    const res = await axios.put(
      `${API_BASE}/timetables`,
      { department, schedule },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
};
