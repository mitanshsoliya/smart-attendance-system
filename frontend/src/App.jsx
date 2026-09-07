import { useEffect, useState } from "react";
import axios from "axios";
import QRScanner from "./QRScanner";
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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return <Login onLogin={(data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }} />;
  }

  return <Dashboard user={user} token={token} onLogout={logout} />;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { data } = await api.post("/login", { email, password });
      const accountRole = data.user?.role;
      const roleMatches = role === accountRole || (role === "HOD" && accountRole === "HOD");
      if (!roleMatches) {
        setMessage(`This account is registered as ${accountRole || "another role"}. Choose the matching portal.`);
        return;
      }
      onLogin(data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="login-screen"><section className="login-card">
    <Brand />
    <div className="eyebrow">SMART ATTENDANCE</div>
    <h1>Welcome back.</h1>
    <p className="login-intro">Sign in to keep your academic day moving.</p>
    <form onSubmit={submit}>
      <div className="role-picker" aria-label="Choose your portal">
        <span className="role-picker-label">I AM A</span>
        <div className="role-options">
          {[['STUDENT', 'Student'], ['FACULTY', 'Faculty'], ['HOD', 'HOD']].map(([value, label]) => <button key={value} type="button" className={`role-option ${role === value ? "selected" : ""}`} onClick={() => setRole(value)}>{label}</button>)}
        </div>
      </div>
      <Field label="EMAIL" type="email" value={email} onChange={setEmail} placeholder="you@academy.edu" />
      <Field label="PASSWORD" type="password" value={password} onChange={setPassword} placeholder="Enter your password" />
      <button className="button primary full" disabled={loading}>{loading ? "Signing in..." : "Log in"}</button>
    </form>
    {message && <Notice type="error">{message}</Notice>}
  </section></main>;
}

function Dashboard({ user, token, onLogout }) {
  const isFaculty = user.role === "FACULTY" || user.role === "HOD";
  const [view, setView] = useState(isFaculty ? "faculty-qr" : "student-mark");
  const [mobileNav, setMobileNav] = useState(false);

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
      <Brand />
      <p className="tagline">Smart attendance. Simple academics.</p>
      <nav>
        {isFaculty ? <NavItem active={view === "faculty-qr"} onClick={() => { setView("faculty-qr"); setMobileNav(false); }}>Generate QR</NavItem> : <>
          <NavItem active={view === "student-mark"} onClick={() => { setView("student-mark"); setMobileNav(false); }}>Mark Attendance</NavItem>
          <NavItem active={view === "student-my"} onClick={() => { setView("student-my"); setMobileNav(false); }}>My Attendance</NavItem>
        </>}
      </nav>
      <button className="logout-link" onClick={onLogout}>Log out <span>↗</span></button>
    </aside>
    {mobileNav && <button className="scrim" aria-label="Close menu" onClick={() => setMobileNav(false)} />}
    <main className="main-content">
      <header className="topbar"><button className="menu-button" onClick={() => setMobileNav(true)} aria-label="Open menu">☰</button><div><p className="eyebrow">{isFaculty ? "FACULTY DESK" : "STUDENT DESK"}</p><h1>Good morning, {user.full_name?.split(" ")[0]}.</h1></div><div className="profile"><span className="avatar">{user.full_name?.charAt(0)}</span><span className="profile-name">{user.full_name}</span><span className="role-badge">{user.role}</span></div></header>
      {isFaculty ? <FacultyView token={token} /> : <StudentView token={token} view={view} />}
    </main>
  </div>;
}

function FacultyView({ token }) {
  const [lectures, setLectures] = useState([]);
  const [selected, setSelected] = useState("");
  const [qr, setQr] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => { api.get("/lectures/my", auth(token)).then(({ data }) => { setLectures(data.lectures || []); setSelected(String(data.lectures?.[0]?.id || "")); }).catch((error) => setMessage(error.response?.data?.message || "Could not load lectures.")).finally(() => setLoading(false)); }, [token]);
  useEffect(() => { if (!qr) return undefined; const timer = setInterval(() => setRemaining(Math.max(0, Math.floor((new Date(qr.expires_at) - Date.now()) / 1000))), 1000); return () => clearInterval(timer); }, [qr]);

  const selectedLecture = lectures.find((lecture) => String(lecture.id) === String(selected));
  const generate = async () => {
    if (!selected) return setMessage("Choose a lecture first.");
    setMessage("");
    try { const { data } = await api.post("/qr-session/create", { lecture_id: Number(selected) }, auth(token)); setQr(data); setRemaining(Math.floor((new Date(data.expires_at) - Date.now()) / 1000)); } catch (error) { setMessage(error.response?.data?.message || "QR generation failed."); }
  };

  return <section className="content-grid"><div className="content-heading"><div><p className="eyebrow">ATTENDANCE SESSION</p><h2>Generate QR Check-In</h2><p className="muted">Open a secure five-minute check-in window for your lecture.</p></div><span className="live-dot">● Live</span></div><div className="workspace two-column"><div className="card form-card"><label htmlFor="lecture">LECTURE</label><select id="lecture" value={selected} onChange={(event) => setSelected(event.target.value)} disabled={loading}><option value="">{loading ? "Loading lectures..." : "Select a lecture"}</option>{lectures.map((lecture) => <option key={lecture.id} value={lecture.id}>{lecture.subject_code} · {lecture.subject_name}</option>)}</select>{selectedLecture && <div className="lecture-meta"><strong>{selectedLecture.subject_name}</strong><span>{formatDate(selectedLecture.lecture_date)} · {selectedLecture.start_time} - {selectedLecture.end_time}</span></div>}<button className="button primary" onClick={generate} disabled={loading}>Generate QR <span>→</span></button>{message && <Notice type="error">{message}</Notice>}</div><div className="card qr-card">{qr ? <><div className="qr-frame"><img src={qr.qr_code} alt="Attendance QR code" /></div><div className="qr-status"><span className="live-dot">● Active session</span><strong>{formatTime(remaining)} remaining</strong></div><p className="token-label">Session token</p><div className="token-row"><code>{qr.session_token}</code><button className="icon-button" aria-label="Copy session token" onClick={() => navigator.clipboard?.writeText(qr.session_token)}>⧉</button></div></> : <div className="empty-qr"><div className="qr-placeholder">⌁</div><strong>Your QR code will appear here</strong><span>Select a lecture and generate a session.</span></div>}</div></div></section>;
}

function StudentView({ token, view }) {
  const [attendance, setAttendance] = useState([]);
  const [message, setMessage] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [lectureId, setLectureId] = useState("");
  const [sessionToken, setSessionToken] = useState("");

  const loadAttendance = async () => { try { const { data } = await api.get("/attendance/my", auth(token)); setAttendance(data.attendance || []); } catch (error) { setMessage(error.response?.data?.message || "Could not load attendance."); } };
  useEffect(() => {
    let active = true;
    api.get("/attendance/my", auth(token)).then(({ data }) => {
      if (active) setAttendance(data.attendance || []);
    }).catch((error) => {
      if (active) setMessage(error.response?.data?.message || "Could not load attendance.");
    });
    return () => { active = false; };
  }, [token]);
  const markAttendance = async (event) => { event.preventDefault(); setMessage(""); try { const { data } = await api.post("/attendance/mark", { lecture_id: Number(lectureId), session_token: sessionToken.trim() }, auth(token)); setMessage(data.message || "Attendance marked successfully."); setLectureId(""); setSessionToken(""); await loadAttendance(); } catch (error) { setMessage(error.response?.data?.message || "Attendance marking failed."); } };
  const present = attendance.filter((item) => item.status === "PRESENT").length;
  const percentage = attendance.length ? `${Math.round((present / attendance.length) * 100)}%` : "0%";

  return <section className="content-grid"><div className="content-heading"><div><p className="eyebrow">{view === "student-my" ? "MY RECORDS" : "CHECK-IN"}</p><h2>{view === "student-my" ? "My Attendance" : "Mark Attendance"}</h2><p className="muted">{view === "student-my" ? "A clear record of your recent lecture check-ins." : "Scan the faculty QR or enter its session details."}</p></div><div className="stat-strip"><Stat value={attendance.length} label="Classes" /><Stat value={percentage} label="Attendance" /></div></div>{view === "student-my" ? <AttendanceTable attendance={attendance} message={message} /> : <div className="workspace two-column"><div className="card form-card"><form onSubmit={markAttendance}><Field label="LECTURE ID" type="number" value={lectureId} onChange={setLectureId} placeholder="e.g. 2" /><Field label="SESSION TOKEN" value={sessionToken} onChange={setSessionToken} placeholder="Paste token from faculty QR" /><button className="button primary full">Mark Present <span>→</span></button></form>{message && <Notice type={message.includes("success") ? "success" : "error"}>{message}</Notice>}<button className="button secondary full scanner-trigger" onClick={() => setShowScanner(!showScanner)}>{showScanner ? "Close scanner" : "Scan attendance QR"}</button></div><div className="card checkin-card"><div className="checkin-number">01</div><h3>Quick check-in</h3><p>Use your camera to read the live QR code displayed by your faculty member.</p><div className="scan-mark">⌗</div></div></div>}{showScanner && <div className="scanner-panel"><QRScanner onAttendanceMarked={() => { setShowScanner(false); loadAttendance(); }} /></div>}</section>;
}

function AttendanceTable({ attendance, message }) { return <div className="card table-card">{message && <Notice type="error">{message}</Notice>}{attendance.length ? <div className="table-wrap"><table><thead><tr><th>SUBJECT</th><th>DATE / TIME</th><th>STATUS</th></tr></thead><tbody>{attendance.map((item) => <tr key={item.id}><td><strong>{item.subject_code}</strong><span>{item.subject_name}</span></td><td>{formatDateTime(item.attendance_time)}</td><td><span className={`status ${item.status === "PRESENT" ? "present" : "absent"}`}>{item.status}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><strong>No attendance records yet</strong><span>Your check-ins will appear here after you attend a lecture.</span></div>}</div>; }
function Field({ label, type = "text", value, onChange, placeholder }) { return <div className="field"><label>{label}</label><input required type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></div>; }
function Notice({ type, children }) { return <div className={`notice ${type}`}>{children}</div>; }
function NavItem({ active, onClick, children }) { return <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>{children}<span>→</span></button>; }
function Brand() { return <div className="brand"><span className="brand-mark"><i /><i /></span><span>LECTURELOG</span></div>; }
function Stat({ value, label }) { return <div><strong>{value}</strong><span>{label}</span></div>; }
function auth(token) { return { headers: { Authorization: `Bearer ${token}` } }; }
function formatDate(value) { return value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : ""; }
function formatDateTime(value) { return value ? new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""; }
function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }

export default App;
