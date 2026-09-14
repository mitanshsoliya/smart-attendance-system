import { useEffect, useState } from "react";
import axios from "axios";
import FacultyDashboard from "./FacultyDashboard";
import StudentDashboard from "./StudentDashboard";
import HodDashboard from "./HodDashboard";
import Login from "./components/Login";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const api = axios.create({ baseURL: API_BASE });

function storedUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
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
  if (user.role === "HOD") {
    return (
      <HodDashboard
        user={user}
        token={token}
        onLogout={onLogout}
        onToggleRole={onToggleRole}
      />
    );
  }

  if (user.role === "FACULTY") {
    return (
      <FacultyDashboard
        user={user}
        token={token}
        onLogout={onLogout}
        onToggleRole={onToggleRole}
      />
    );
  }

  return (
    <StudentDashboard
      user={user}
      token={token}
      onLogout={onLogout}
      onToggleRole={onToggleRole}
    />
  );
}

function Field({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Notice({ type, children }) {
  return <div className={`notice ${type}`}>{children}</div>;
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <i />
        <i />
      </span>
      <span>LECTURELOG</span>
    </div>
  );
}

export default App;
