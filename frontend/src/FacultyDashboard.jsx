import { useEffect, useState } from "react";
import axios from "axios";

function FacultyDashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [lectures, setLectures] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState("");

  const [qrCode, setQrCode] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [message, setMessage] = useState("");

  // Fetch Faculty Lectures
  useEffect(() => {
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/lectures/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLectures(response.data.lectures);

      // Automatically select first lecture
      if (response.data.lectures.length > 0) {
        setSelectedLecture(response.data.lectures[0].id);
      }
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Lectures load failed"
      );
    }
  };

  // Generate QR
  const generateQR = async () => {
    if (!selectedLecture) {
      setMessage("Please select a lecture first");
      return;
    }

    try {
      setMessage("Generating QR Code...");

      const response = await axios.post(
        "http://localhost:5000/qr-session/create",
        {
          lecture_id: Number(selectedLecture),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setQrCode(response.data.qr_code);
      setSessionToken(response.data.session_token);

      setMessage("QR Code generated successfully!");
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "QR Code generation failed"
      );
    }
  };

  // Logout
  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h1>Faculty Dashboard</h1>

        <h2>Welcome, {user?.full_name}</h2>

        <p>Email: {user?.email}</p>
        <p>Role: {user?.role}</p>

        <hr />

        <h2>Lecture Management</h2>

        {/* Lecture Dropdown */}
        <select
          value={selectedLecture}
          onChange={(e) =>
            setSelectedLecture(e.target.value)
          }
          style={styles.select}
        >
          <option value="">
            Select Lecture
          </option>

          {lectures.map((lecture) => (
            <option
              key={lecture.id}
              value={lecture.id}
            >
              {lecture.subject_name} ({lecture.subject_code})
              {" - "}
              {new Date(lecture.lecture_date).toLocaleDateString()}
              {" - "}
              {lecture.start_time}
            </option>
          ))}
        </select>

        <br />
        <br />

        {/* Selected Lecture Details */}
        {selectedLecture && (
          <div style={styles.lectureBox}>
            {lectures
              .filter(
                (lecture) =>
                  lecture.id === Number(selectedLecture)
              )
              .map((lecture) => (
                <div key={lecture.id}>
                  <h3>{lecture.subject_name}</h3>

                  <p>
                    Subject Code: {lecture.subject_code}
                  </p>

                  <p>
                    Lecture ID: {lecture.id}
                  </p>

                  <p>
                    Date:{" "}
                    {new Date(
                      lecture.lecture_date
                    ).toLocaleDateString()}
                  </p>

                  <p>
                    Time: {lecture.start_time} -{" "}
                    {lecture.end_time}
                  </p>
                </div>
              ))}
          </div>
        )}

        <button
          onClick={generateQR}
          style={styles.button}
        >
          Generate QR Code
        </button>

        {message && (
          <p style={styles.message}>
            {message}
          </p>
        )}

        {/* QR Code */}
        {qrCode && (
          <div style={styles.qrContainer}>

            <h2>Scan This QR</h2>

            <img
              src={qrCode}
              alt="Attendance QR Code"
              style={styles.qr}
            />

            <p>
              QR Session expires in 5 minutes.
            </p>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  sessionToken
                );

                alert("Session Token Copied");
              }}
            >
              Copy Session Token
            </button>

          </div>
        )}

        <br />

        <button
          onClick={logout}
          style={styles.logout}
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
    padding: "40px",
    backgroundColor: "#f5f5f5",
  },

  card: {
    maxWidth: "600px",
    margin: "auto",
    padding: "30px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.15)",
    textAlign: "center",
  },

  select: {
    width: "100%",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "16px",
  },

  lectureBox: {
    padding: "15px",
    marginBottom: "20px",
    backgroundColor: "#f1f1f1",
    borderRadius: "8px",
  },

  button: {
    padding: "12px 25px",
    backgroundColor: "#222",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
  },

  message: {
    marginTop: "15px",
    fontWeight: "bold",
  },

  qrContainer: {
    marginTop: "25px",
  },

  qr: {
    width: "300px",
    height: "300px",
    border: "1px solid #ddd",
  },

  logout: {
    padding: "10px 20px",
    backgroundColor: "#ddd",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default FacultyDashboard;