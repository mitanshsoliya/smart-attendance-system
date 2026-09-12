import { useState, useEffect, useCallback } from "react";
import { courseService } from "../services/courseService";

export function useCourses(token) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCourses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await courseService.getCourses(token);
      setCourses(data.subjects || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch courses catalog.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    loading,
    error,
    setError,
    fetchCourses,
  };
}
