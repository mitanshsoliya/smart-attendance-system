import { useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("Authenticating credentials...");

    try {
      const response = await axios.post(`${API_BASE}/login`, {
        email: email.trim(),
        password: password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      setMessage("Authentication successful! Loading workspace...");
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch (error) {
      console.error("Login Error:", error);
      setMessage(error.response?.data?.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#12181F] flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-md bg-white border border-[#D8D2C4] rounded p-8 shadow-sm space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto bg-[#12181F] text-[#D4A373] flex items-center justify-center rounded font-serif text-lg font-bold border border-[#9E3D24]">
            LL
          </div>
          <h1 className="font-serif-display text-3xl font-bold text-[#12181F] tracking-tight">
            LectureLog
          </h1>
          <p className="text-xs uppercase tracking-widest font-mono text-[#9E3D24] font-bold">
            Smart Attendance Management Platform
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-mono font-bold text-[#6B7280] mb-1">
              Institutional Email *
            </label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-mono font-bold text-[#6B7280] mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-[#FBF9F5] border border-[#D8D2C4] rounded text-sm text-[#12181F] focus:outline-none focus:border-[#9E3D24] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#9E3D24] hover:bg-[#83311C] text-white font-bold text-sm rounded shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Workspace"}
          </button>
        </form>

        {message && (
          <div className="p-3 bg-[#F5F2EA] border-l-4 border-[#9E3D24] text-xs font-semibold text-[#12181F] text-center">
            {message}
          </div>
        )}

        {/* Demo Credentials Quick Fill */}
        <div className="pt-4 border-t border-[#D8D2C4] text-center space-y-2">
          <span className="text-[11px] font-mono uppercase text-[#6B7280] font-bold block">
            Demo Portal Credentials
          </span>
          <div className="flex flex-wrap justify-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => fillDemo("student@example.com", "student123")}
              className="px-2.5 py-1 bg-[#FBF9F5] border border-[#D8D2C4] hover:bg-[#EBE7E6] text-[#12181F] font-semibold rounded cursor-pointer"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => fillDemo("faculty@example.com", "faculty123")}
              className="px-2.5 py-1 bg-[#FBF9F5] border border-[#D8D2C4] hover:bg-[#EBE7E6] text-[#12181F] font-semibold rounded cursor-pointer"
            >
              Faculty
            </button>
            <button
              type="button"
              onClick={() => fillDemo("hod@example.com", "hod123")}
              className="px-2.5 py-1 bg-[#FBF9F5] border border-[#D8D2C4] hover:bg-[#EBE7E6] text-[#12181F] font-semibold rounded cursor-pointer"
            >
              HOD / Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;