import { useEffect, useState, lazy, Suspense } from "react";
import axios from "axios";
import Login from "./components/Login";
import "./App.css";

// Lazy-load role-specific dashboards to optimize initial bundle size
const FacultyDashboard = lazy(() => import("./FacultyDashboard"));
const StudentDashboard = lazy(() => import("./StudentDashboard"));
const HodDashboard = lazy(() => import("./HodDashboard"));

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const api = axios.create({ baseURL: API_BASE });

function storedUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

function DashboardFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          border: "3px solid var(--border)",
          borderTopColor: "var(--primary)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 500 }}>
        Loading dashboard...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(storedUser);
  const [overrideRole, setOverrideRole] = useState(
    localStorage.getItem("overrideRole") || null
  );
  const [sessionNotice, setSessionNotice] = useState("");

  // Revalidate session with /auth/me on application mount
  useEffect(() => {
    if (token) {
      api
        .get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem("user", JSON.stringify(res.data.user));
          }
        })
        .catch((err) => {
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            console.warn("Session invalidated or expired. Clearing auth state.");
            logout("Session expired or invalid. Please sign in again.");
          }
        });
    }
  }, [token]);

  const logout = async (notice = "") => {
    if (token) {
      try {
        await api.post("/auth/logout", {}, { headers: { Authorization: `Bearer ${token}` } });
      } catch {
        // Continue local cleanup even if network request fails
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("overrideRole");
    setToken(null);
    setUser(null);
    setOverrideRole(null);
    if (notice) setSessionNotice(notice);
  };

  const handleToggleRole = (newRole) => {
    setOverrideRole(newRole);
    localStorage.setItem("overrideRole", newRole);
  };

  if (!token || !user) {
    return (
      <Login
        sessionNotice={sessionNotice}
        onClearNotice={() => setSessionNotice("")}
        onLogin={(data) => {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.removeItem("overrideRole");
          setToken(data.token);
          setUser(data.user);
          setOverrideRole(null);
          setSessionNotice("");
        }}
      />
    );
  }

  const activeUser = {
    ...user,
    role: overrideRole || user.role || "STUDENT",
  };

  return (
    <Dashboard
      user={activeUser}
      token={token}
      onLogout={() => logout()}
      onToggleRole={handleToggleRole}
    />
  );
}

function Dashboard({ user, token, onLogout, onToggleRole }) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      {user.role === "HOD" && (
        <HodDashboard
          user={user}
          token={token}
          onLogout={onLogout}
          onToggleRole={onToggleRole}
        />
      )}
      {user.role === "FACULTY" && (
        <FacultyDashboard
          user={user}
          token={token}
          onLogout={onLogout}
          onToggleRole={onToggleRole}
        />
      )}
      {user.role !== "HOD" && user.role !== "FACULTY" && (
        <StudentDashboard
          user={user}
          token={token}
          onLogout={onLogout}
          onToggleRole={onToggleRole}
        />
      )}
    </Suspense>
  );
}

export default App;

