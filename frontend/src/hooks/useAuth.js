import { useState, useEffect } from "react";
import { authService } from "../services/authService";

export function useAuth(initialUser, token) {
  const [user, setUser] = useState(initialUser || null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshUser = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await authService.getMe(token);
      if (data?.user) {
        setUser(data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch user profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && !user) {
      refreshUser();
    }
  }, [token]);

  return {
    user,
    setUser,
    profile,
    setProfile,
    loading,
    error,
    refreshUser,
  };
}
