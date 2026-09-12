import { useState, useEffect, useCallback } from "react";
import { lectureService } from "../services/lectureService";

export function useLectures(token) {
  const [lectures, setLectures] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLectures = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await lectureService.getMyLectures(token);
      setLectures(data.lectures || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch lectures list.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchSubjects = useCallback(async () => {
    if (!token) return;
    try {
      const data = await lectureService.getSubjects(token);
      setSubjects(data.subjects || []);
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchLectures();
    fetchSubjects();
  }, [fetchLectures, fetchSubjects]);

  return {
    lectures,
    subjects,
    loading,
    error,
    setError,
    fetchLectures,
    fetchSubjects,
  };
}
