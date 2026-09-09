import { useEffect, useState } from "react";
import axios from "axios";
import QRScanner from "./QRScanner";
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
      const { data } = await api.post("/login", {
        email: email.trim(),
        password: password.trim(),
      });
      const accountRole = (data.user?.role || "").toUpperCase();
      const selectedRole = role.toUpperCase();

      const isFacultyOrHod = (r) => r === "FACULTY" || r === "HOD";
      const roleMatches =
        selectedRole === accountRole ||
        (isFacultyOrHod(selectedRole) && isFacultyOrHod(accountRole));

      if (!roleMatches) {
        console.warn(`Portal selected: ${selectedRole}, Actual account role: ${accountRole}. Logging in with user's registered role.`);
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
    <div style={{ marginTop: "16px", padding: "12px", background: "rgba(0,0,0,0.03)", border: "1px border-default", fontSize: "12px", color: "#666", lineHeight: "1.5" }}>
      <strong>Demo Accounts:</strong><br />
      • Student: <code>student@example.com</code> / <code>student123</code><br />
      • Faculty: <code>faculty@example.com</code> / <code>faculty123</code><br />
      • HOD: <code>hod@example.com</code> / <code>hod123</code>
    </div>
    {message && <Notice type="error">{message}</Notice>}
  </section></main>;
}

function Dashboard({ user, token, onLogout }) {
  const isFaculty = user.role === "FACULTY" || user.role === "HOD";

  if (isFaculty) {
    return <FacultyDashboard user={user} token={token} onLogout={onLogout} />;
  }

  return <StudentDashboard user={user} token={token} onLogout={onLogout} />;
}

function FacultyView({ token, view, setView }) {
  const [lectures, setLectures] = useState([]);
  const [selected, setSelected] = useState("");
  const [qr, setQr] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(0);
  const [status, setStatus] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [lectureForm, setLectureForm] = useState({ subject_id: "", lecture_date: "", start_time: "", end_time: "" });
  const [createMessage, setCreateMessage] = useState("");

  useEffect(() => { api.get("/lectures/my", auth(token)).then(({ data }) => { setLectures(data.lectures || []); setSelected(String(data.lectures?.[0]?.id || "")); }).catch((error) => setMessage(error.response?.data?.message || "Could not load lectures.")).finally(() => setLoading(false)); }, [token]);
  useEffect(() => { if (!qr) return undefined; const timer = setInterval(() => setRemaining(Math.max(0, Math.floor((new Date(qr.expires_at) - Date.now()) / 1000))), 1000); return () => clearInterval(timer); }, [qr]);

  const selectedLecture = lectures.find((lecture) => String(lecture.id) === String(selected));
  const generate = async () => {
    if (!selected) return setMessage("Choose a lecture first.");
    setMessage("");
    try { const { data } = await api.post("/qr-session/create", { lecture_id: Number(selected) }, auth(token)); setQr(data); setRemaining(Math.floor((new Date(data.expires_at) - Date.now()) / 1000)); } catch (error) { setMessage(error.response?.data?.message || "QR generation failed."); }
  };

  const createLecture = async (event) => {
    event.preventDefault();
    setCreateMessage("");
    try {
      const { data } = await api.post("/lectures/create", { ...lectureForm, subject_id: Number(lectureForm.subject_id) }, auth(token));
      setCreateMessage(data.message || "Lecture created successfully.");
      setLectureForm({ subject_id: "", lecture_date: "", start_time: "", end_time: "" });
      const refreshed = await api.get("/lectures/my", auth(token));
      setLectures(refreshed.data.lectures || []);
    } catch (error) {
      setCreateMessage(error.response?.data?.message || "Lecture creation failed.");
    }
  };

  const loadStatus = async () => {
    if (!selected) return setStatusMessage("Choose a lecture first.");
    setStatusMessage("");
    try {
      const { data } = await api.get(`/attendance/lecture/${selected}`, auth(token));
      setStatus(data.attendance || []);
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Could not load attendance status.");
    }
  };

  const presentCount = status.filter((item) => item.status === "PRESENT").length;

  if (view === "faculty-create") return <section className="content-grid"><div className="content-heading"><div><p className="eyebrow">LECTURE MANAGEMENT</p><h2>Create Lecture</h2><p className="muted">Add a scheduled class before generating its attendance QR.</p></div></div><div className="card form-card narrow-card"><form onSubmit={createLecture}><Field label="SUBJECT ID" type="number" value={lectureForm.subject_id} onChange={(value) => setLectureForm({ ...lectureForm, subject_id: value })} placeholder="e.g. 1" /><Field label="LECTURE DATE" type="date" value={lectureForm.lecture_date} onChange={(value) => setLectureForm({ ...lectureForm, lecture_date: value })} /><div className="field-row"><Field label="START TIME" type="time" value={lectureForm.start_time} onChange={(value) => setLectureForm({ ...lectureForm, start_time: value })} /><Field label="END TIME" type="time" value={lectureForm.end_time} onChange={(value) => setLectureForm({ ...lectureForm, end_time: value })} /></div><button className="button primary">Create Lecture <span>→</span></button></form>{createMessage && <Notice type={createMessage.includes("success") ? "success" : "error"}>{createMessage}</Notice>}</div></section>;

  if (view === "faculty-status") return <section className="content-grid"><div className="content-heading"><div><p className="eyebrow">LECTURE REPORT</p><h2>Attendance Status</h2><p className="muted">See which students checked in for a selected lecture.</p></div><div className="stat-strip"><Stat value={presentCount} label="Present" /><Stat value={status.length} label="Check-ins" /></div></div><div className="card status-toolbar"><select value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Select a lecture</option>{lectures.map((lecture) => <option key={lecture.id} value={lecture.id}>{lecture.subject_code} · {lecture.subject_name} · {formatDate(lecture.lecture_date)}</option>)}</select><button className="button primary" onClick={loadStatus}>Load Status <span>→</span></button></div>{statusMessage && <Notice type="error">{statusMessage}</Notice>}<FacultyStatusTable status={status} /></section>;

  return <section className="content-grid"><div className="content-heading"><div><p className="eyebrow">ATTENDANCE SESSION</p><h2>Generate QR Check-In</h2><p className="muted">Open a secure five-minute check-in window for your lecture.</p></div><span className="live-dot">● Live</span></div><div className="workspace two-column"><div className="card form-card"><label htmlFor="lecture">LECTURE</label><select id="lecture" value={selected} onChange={(event) => setSelected(event.target.value)} disabled={loading}><option value="">{loading ? "Loading lectures..." : "Select a lecture"}</option>{lectures.map((lecture) => <option key={lecture.id} value={lecture.id}>{lecture.subject_code} · {lecture.subject_name}</option>)}</select>{selectedLecture && <div className="lecture-meta"><strong>{selectedLecture.subject_name}</strong><span>{formatDate(selectedLecture.lecture_date)} · {selectedLecture.start_time} - {selectedLecture.end_time}</span></div>}<button className="button primary" onClick={generate} disabled={loading}>Generate QR <span>→</span></button>{message && <Notice type="error">{message}</Notice>}</div><div className="card qr-card">{qr ? <><div className="qr-frame"><img src={qr.qr_code} alt="Attendance QR code" /></div><div className="qr-status"><span className="live-dot">● Active session</span><strong>{formatTime(remaining)} remaining</strong></div><p className="token-label">Session token</p><div className="token-row"><code>{qr.session_token}</code><button className="icon-button" aria-label="Copy session token" onClick={() => navigator.clipboard?.writeText(qr.session_token)}>⧉</button></div></> : <div className="empty-qr"><div className="qr-placeholder">⌁</div><strong>Your QR code will appear here</strong><span>Select a lecture and generate a session.</span></div>}</div></div></section>;
}

function FacultyStatusTable({ status }) { return <div className="card table-card">{status.length ? <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>EMAIL</th><th>CHECK-IN TIME</th><th>STATUS</th></tr></thead><tbody>{status.map((item) => <tr key={item.id}><td><strong>{item.full_name}</strong></td><td>{item.email}</td><td>{formatDateTime(item.attendance_time)}</td><td><span className={`status ${item.status === "PRESENT" ? "present" : "absent"}`}>{item.status}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><strong>No check-ins loaded</strong><span>Select a lecture and load its attendance status.</span></div>}</div>; }

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

  return <section className="content-grid"><div className="content-heading"><div><p className="eyebrow">{view === "student-my" ? "MY RECORDS" : "CHECK-IN"}</p><h2>{view === "student-my" ? "My Attendance" : "Mark Attendance"}</h2><p className="muted">{view === "student-my" ? "A clear record of your recent lecture check-ins." : "Scan the faculty QR or enter its session details."}</p></div><div className="stat-strip"><Stat value={attendance.length} label="Classes" /><Stat value={present} label="Present" /><Stat value={percentage} label="Attendance" /></div></div>{view === "student-my" ? <><AttendanceInsights attendance={attendance} /><AttendanceTable attendance={attendance} message={message} /></> : <div className="workspace two-column"><div className="card form-card"><form onSubmit={markAttendance}><Field label="LECTURE ID" type="number" value={lectureId} onChange={setLectureId} placeholder="e.g. 2" /><Field label="SESSION TOKEN" value={sessionToken} onChange={setSessionToken} placeholder="Paste token from faculty QR" /><button className="button primary full">Mark Present <span>→</span></button></form>{message && <Notice type={message.includes("success") ? "success" : "error"}>{message}</Notice>}<button className="button secondary full scanner-trigger" onClick={() => setShowScanner(!showScanner)}>{showScanner ? "Close scanner" : "Scan attendance QR"}</button></div><div className="card checkin-card"><div className="checkin-number">01</div><h3>Quick check-in</h3><p>Use your camera to read the live QR code displayed by your faculty member.</p><div className="scan-mark">⌗</div></div></div>}{showScanner && <div className="scanner-panel"><QRScanner onAttendanceMarked={() => { setShowScanner(false); loadAttendance(); }} /></div>}</section>;
}

function AttendanceInsights({ attendance }) {
  const subjectCounts = attendance.reduce((counts, item) => { const key = item.subject_code || item.subject_name || "Other"; counts[key] = (counts[key] || 0) + 1; return counts; }, {});
  const subjects = Object.entries(subjectCounts).sort(([, first], [, second]) => second - first);
  const maxCount = Math.max(...subjects.map(([, count]) => count), 1);
  const recent = attendance.slice(0, 5);

  return <div className="insights-grid"><div className="card insight-card"><div className="insight-heading"><div><p className="eyebrow">SUBJECT BREAKDOWN</p><h3>Where you show up</h3></div><span className="insight-total">{attendance.length} total</span></div>{subjects.length ? <div className="subject-bars">{subjects.map(([subject, count]) => <div className="subject-bar" key={subject}><div className="bar-label"><span>{subject}</span><strong>{count}</strong></div><div className="bar-track"><span style={{ width: `${(count / maxCount) * 100}%` }} /></div></div>)}</div> : <div className="mini-empty">Check-ins will create your subject chart.</div>}</div><div className="card insight-card"><div className="insight-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h3>Latest check-ins</h3></div><span className="activity-mark">●</span></div>{recent.length ? <div className="activity-list">{recent.map((item) => <div className="activity-item" key={item.id}><span className="activity-dot" /><div><strong>{item.subject_code} <small>{item.status}</small></strong><span>{item.subject_name}</span></div><time>{formatDateTime(item.attendance_time)}</time></div>)}</div> : <div className="mini-empty">Your latest check-ins will appear here.</div>}</div></div>;
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
