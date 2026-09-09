import { useEffect, useState } from "react";
import axios from "axios";
import FacultyDashboard from "./FacultyDashboard";
import StudentDashboard from "./StudentDashboard";
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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("overrideRole");
    setToken(null);
    setUser(null);
    setOverrideRole(null);
  };

  const handleToggleRole = (newRole) => {
    setOverrideRole(newRole);
    localStorage.setItem("overrideRole", newRole);
  };

  if (!token || !user) {
    return (
      <Login
        onLogin={(data) => {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.removeItem("overrideRole");
          setToken(data.token);
          setUser(data.user);
          setOverrideRole(null);
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
      onLogout={logout}
      onToggleRole={handleToggleRole}
    />
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("FACULTY");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fillDemo = (demoRole) => {
    setRole(demoRole);
    if (demoRole === "STUDENT") {
      setEmail("student@example.com");
      setPassword("student123");
    } else if (demoRole === "FACULTY") {
      setEmail("faculty@example.com");
      setPassword("faculty123");
    } else {
      setEmail("hod@example.com");
      setPassword("hod123");
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { data } = await api.post("/login", { email, password });
      onLogin(data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-screen">
      <section className="login-card">
        <Brand />
        <div className="eyebrow">SMART ATTENDANCE SUITE</div>
        <h1>Welcome back.</h1>
        <p className="login-intro">Sign in to keep your academic day moving.</p>

        {/* Demo Quick Accounts */}
        <div className="mb-4 p-3 bg-surface-container rounded text-left border border-border-default">
          <div className="text-[11px] font-bold text-text-stone uppercase tracking-wider mb-2">
            Quick Demo Auto-Fill:
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillDemo("FACULTY")}
              className="px-2.5 py-1 text-xs bg-secondary text-white rounded font-medium cursor-pointer"
            >
              Faculty Portal
            </button>
            <button
              type="button"
              onClick={() => fillDemo("STUDENT")}
              className="px-2.5 py-1 text-xs bg-primary text-white rounded font-medium cursor-pointer"
            >
              Student Portal
            </button>
            <button
              type="button"
              onClick={() => fillDemo("HOD")}
              className="px-2.5 py-1 text-xs bg-warning text-white rounded font-medium cursor-pointer"
            >
              HOD Portal
            </button>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="role-picker" aria-label="Choose your portal">
            <span className="role-picker-label">I AM A</span>
            <div className="role-options">
              {[
                ["STUDENT", "Student"],
                ["FACULTY", "Faculty"],
                ["HOD", "HOD"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`role-option ${role === value ? "selected" : ""}`}
                  onClick={() => setRole(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Field
            label="EMAIL"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@academy.edu"
          />
          <Field
            label="PASSWORD"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
          />
          <button className="button primary full" disabled={loading}>
            {loading ? "Signing in..." : "Log in"}
          </button>
        </form>
        {message && <Notice type="error">{message}</Notice>}
      </section>
    </main>
  );
}

function Dashboard({ user, token, onLogout, onToggleRole }) {
  const isFaculty = user.role === "FACULTY" || user.role === "HOD";

  if (isFaculty) {
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
