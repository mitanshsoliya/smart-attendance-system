import { useEffect, useState } from "react";
import axios from "axios";
import QRScanner from "./QRScanner";

function StudentDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [attendance, setAttendance] = useState([]);
  const [message, setMessage] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/attendance/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAttendance(response.data.attendance);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Attendance fetch failed"
      );
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const totalClasses = attendance.length;

  const presentClasses = attendance.filter(
    (item) => item.status === "PRESENT"
  ).length;

  const percentage =
    totalClasses > 0
      ? ((presentClasses / totalClasses) * 100).toFixed(1)
      : 0;

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h1>Student Dashboard</h1>

        <h2>Welcome, {user?.full_name}</h2>

        <p>Email: {user?.email}</p>
        <p>Role: {user?.role}</p>

        <hr />

        <h2>My Attendance</h2>

        <div style={styles.stats}>
          <div>
            <h3>{totalClasses}</h3>
            <p>Total Classes</p>
          </div>

          <div>
            <h3>{presentClasses}</h3>
            <p>Present</p>
          </div>

          <div>
            <h3>{percentage}%</h3>
            <p>Attendance</p>
          </div>
        </div>

        <hr />

        {attendance.length === 0 ? (
          <p>No attendance records found.</p>
        ) : (
          <div>

            {attendance.map((item) => (
              <div
                key={item.id}
                style={styles.attendanceBox}
              >
                <h3>{item.subject_name}</h3>

                <p>
                  Subject Code: {item.subject_code}
                </p>

                <p>
                  Lecture ID: {item.lecture_id}
                </p>

                <p>
                  Status:{" "}
                  <strong>{item.status}</strong>
                </p>

                <p>
                  Time:{" "}
                  {new Date(
                    item.attendance_time
                  ).toLocaleString()}
                </p>
              </div>
            ))}

          </div>
        )}

        <hr />

        <button
          onClick={() => setShowScanner(!showScanner)}
          style={styles.scanButton}
        >
          {showScanner
            ? "Close Scanner"
            : "Scan Attendance QR"}
        </button>

        {showScanner && (
        <QRScanner onAttendanceMarked={fetchAttendance} />
        )}

        {message && (
          <p>{message}</p>
        )}

        <button
          onClick={logout}
          style={styles.logoutButton}
        >
          Logout
        </button>

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "30px",
    backgroundColor: "#f5f5f5",
  },

  card: {
    maxWidth: "800px",
    margin: "auto",
    padding: "30px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
  },

  stats: {
    display: "flex",
    justifyContent: "space-around",
    textAlign: "center",
    margin: "20px 0",
  },

  attendanceBox: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "15px",
    margin: "15px 0",
  },

  scanButton: {
    padding: "12px 20px",
    backgroundColor: "#222",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    margin: "10px",
  },

  logoutButton: {
    padding: "10px 20px",
    backgroundColor: "#ddd",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    margin: "10px",
  },
};

export default StudentDashboard;