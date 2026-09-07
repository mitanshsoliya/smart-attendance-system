import Login from "./Login";
import StudentDashboard from "./StudentDashboard";
import FacultyDashboard from "./FacultyDashboard";

function App() {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  if (!token || !userData) {
    return <Login />;
  }

  const user = JSON.parse(userData);

  if (user.role === "STUDENT") {
    return <StudentDashboard />;
  }

  if (user.role === "FACULTY") {
    return <FacultyDashboard />;
  }

  return (
    <div>
      <h1>Unknown Role</h1>
    </div>
  );
}

export default App;