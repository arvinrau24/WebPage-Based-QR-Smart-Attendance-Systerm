import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function LecturerDashboard() {
  const [timetableKey, setTimetableKey] = useState(0);
  const [studentListKey, setStudentListKey] = useState(0);
  const [studentListMsg, setStudentListMsg] = useState("");
  const [uploadingStudents, setUploadingStudents] = useState(false);
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [qrImage, setQrImage] = useState(null);
  const [qrToken, setQrToken] = useState(null);
  const [qrInterval, setQrInterval] = useState(null);
  const [qrCountdown, setQrCountdown] = useState(180);
  const [timetableMsg, setTimetableMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [semesterStart, setSemesterStart] = useState("");
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", code: "" });
  const [showAddSession, setShowAddSession] = useState(false);
  const [newSession, setNewSession] = useState({
    date: "",
    start_time: "",
    end_time: "",
  });

  const [showAddCourseForm, setShowAddCourseForm] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: "",
    name: "",
    section: "",
  });

  const [newStudent, setNewStudent] = useState({
    matric_number: "",
    full_name: "",
    phone: "",
    email: "",
  });

  const [sessionMsg, setSessionMsg] = useState("");
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [countSessionId, setCountSessionId] = useState(null);
  const navigate = useNavigate();
  const [studentList, setStudentList] = useState([]);
  const [showStudents, setShowStudents] = useState(false);
  const [finalizeMsg, setFinalizeMsg] = useState({});
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedCourseForStudents, setSelectedCourseForStudents] =
    useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(stored));
    fetchCourses();
    fetchAlerts();
    fetchTodaySessions();
  }, []);

  useEffect(() => {
    if (!qrImage) return;
    setQrCountdown(180);
    const timer = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) return 180;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qrImage]);

  const fetchCourses = async () => {
    const res = await api.get("/courses/");
    setCourses(res.data);
  };

  const fetchAlerts = async () => {
    const res = await api.get("/alerts/");
    setAlerts(res.data);
  };

  const fetchTodaySessions = async () => {
    const res = await api.get("/sessions/today/");
    setTodaySessions(res.data);
  };

  const fetchAttendanceCount = async (sessionId) => {
    const res = await api.get(`/sessions/${sessionId}/attendance/`);
    setAttendanceCount(res.data.length);
    setCountSessionId(sessionId);
  };

  const selectCourse = async (course) => {
    setSelectedCourse(course);
    setQrImage(null);
    setQrToken(null);
    setShowStudents(false);
    setStudentList([]);
    setStudentListMsg("");
    if (qrInterval) clearInterval(qrInterval);
    const res = await api.get(`/courses/${course.id}/sessions/`);
    setSessions(res.data);
    fetchStudentList(course.id);
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm("Delete this course and all its sessions?")) return;
    await api.delete(`/courses/${courseId}/delete/`);
    setSelectedCourse(null);
    setSessions([]);
    fetchCourses();
    fetchTodaySessions();
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm("Delete this session?")) return;
    await api.delete(`/sessions/${sessionId}/delete/`);
    if (selectedCourse) {
      const res = await api.get(`/courses/${selectedCourse.id}/sessions/`);
      setSessions(res.data);
    }
    fetchTodaySessions();
  };

  const saveEditCourse = async (courseId) => {
    await api.patch(`/courses/${courseId}/edit/`, editForm);
    setEditingCourse(null);
    fetchCourses();
  };

  const createSession = async () => {
    if (!newSession.date || !newSession.start_time || !newSession.end_time) {
      setSessionMsg("Please fill in all fields");
      return;
    }
    try {
      await api.post(`/courses/${selectedCourse.id}/sessions/`, {
        ...newSession,
        start_time: newSession.start_time + ":00",
        end_time: newSession.end_time + ":00",
      });
      setSessionMsg("Session added!");
      setNewSession({ date: "", start_time: "", end_time: "" });
      const res = await api.get(`/courses/${selectedCourse.id}/sessions/`);
      setSessions(res.data);
      fetchTodaySessions();
    } catch {
      setSessionMsg("Failed to add session.");
    }
  };

  const startQR = (sessionId) => {
    if (qrInterval) clearInterval(qrInterval);
    setAttendanceCount(0);
    setCountSessionId(sessionId);

    const generate = async () => {
      const res = await api.post(`/sessions/${sessionId}/generate-qr/`);
      setQrImage(res.data.qr_image);
      setQrToken(res.data.token);
    };
    generate();
    const interval = setInterval(generate, 180000);
    setQrInterval(interval);

    fetchAttendanceCount(sessionId);
    const countInterval = setInterval(
      () => fetchAttendanceCount(sessionId),
      10000,
    );
    setQrInterval(countInterval);
  };

  const exportExcel = (sessionId) => {
    const token = localStorage.getItem("token");
    window.open(
      `http://127.0.0.1:8000/api/sessions/${sessionId}/export/?token=${token}`,
      "_blank",
    );
  };

  const uploadTimetable = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!semesterStart) {
      setTimetableMsg("Please enter the semester start date first.");
      return;
    }
    setUploading(true);
    setTimetableMsg("");
    const formData = new FormData();
    formData.append("image", file);
    formData.append("semester_start", semesterStart);
    try {
      const res = await api.post("/upload-timetable/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTimetableMsg(res.data.message);
      fetchCourses();
      fetchTodaySessions();
    } catch {
      setTimetableMsg("Failed to parse timetable.");
    }
    setUploading(false);
    setTimetableKey((prev) => prev + 1);
  };

  const uploadStudentList = async (e, courseId) => {
    const file = e.target.files[0];
    if (!file) return;
    setStudentListMsg("⏳ Importing...");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post(
        `/courses/${courseId}/upload-students/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setStudentListMsg(
        `✅ ${res.data.message} (${res.data.sections.join(", ")})`,
      );
      fetchStudentList(courseId);
    } catch {
      setStudentListMsg("❌ Failed to upload.");
    }
    setStudentListKey((prev) => prev + 1);
  };

  const fetchStudentList = async (courseId) => {
    const res = await api.get(`/courses/${courseId}/students/`);
    setStudentList(res.data.students);
    setShowStudents(true);
  };

  const resetSemester = async () => {
    if (
      !window.confirm(
        "⚠️ This will DELETE all courses, sessions, attendance records and enrolled students. Are you sure?",
      )
    )
      return;
    if (!window.confirm("Are you absolutely sure? This cannot be undone!"))
      return;
    try {
      const res = await api.delete("/reset-semester/");
      alert(res.data.message);
      fetchCourses();
      fetchTodaySessions();
      setSelectedCourse(null);
      setSessions([]);
      setStudentList([]);
      setQrImage(null);
    } catch {
      alert("Failed to reset semester.");
    }
  };

  const logout = () => {
    api.post("/auth/logout/");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    if (qrInterval) clearInterval(qrInterval);
    navigate("/login");
  };

  const today = new Date().toLocaleDateString("en-MY", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const finalizeSession = async (sessionId) => {
    if (
      !window.confirm(
        "Finalize this session? Absent records will be created for students who did not scan.",
      )
    )
      return;
    try {
      const res = await api.post(`/sessions/${sessionId}/finalize/`);
      setFinalizeMsg((prev) => ({
        ...prev,
        [sessionId]: `✅ ${res.data.present} present, ${res.data.absent} absent out of ${res.data.total_enrolled}. ${res.data.alerts_triggered} alert(s) sent.`,
      }));
      fetchAttendanceCount(sessionId);
      fetchAlerts();
    } catch (err) {
      setFinalizeMsg((prev) => ({
        ...prev,
        [sessionId]: `❌ ${err.response?.data?.error || "Failed to finalize."}`,
      }));
    }
  };

  // ========== COURSE MANAGEMENT ==========

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/courses/create/", newCourse);
      alert("✅ " + response.data.message);
      setNewCourse({ code: "", name: "", section: "" });
      setShowAddCourseForm(false);
      fetchCourses(); // Refresh list
    } catch (error) {
      alert("❌ " + (error.response?.data?.error || "Failed to create course"));
    }
  };

  // ========== STUDENT ENROLLMENT MANAGEMENT ==========

  const fetchEnrolledStudents = async (courseId) => {
    try {
      const response = await api.get(`/api/courses/${courseId}/students/`);
      setEnrolledStudents(response.data.students);
      setSelectedCourseForStudents(response.data.course);
      setShowStudentModal(true);
    } catch (error) {
      alert("❌ Failed to fetch students");
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(
        `/api/courses/${selectedCourseForStudents.id}/students/add/`,
        newStudent,
      );
      alert("✅ " + response.data.message);
      setNewStudent({ matric_number: "", full_name: "", phone: "", email: "" });
      setShowAddStudentForm(false);
      fetchEnrolledStudents(selectedCourseForStudents.id); // Refresh list
    } catch (error) {
      alert("❌ " + (error.response?.data?.error || "Failed to add student"));
    }
  };

  const handleRemoveStudent = async (studentId, matricNumber) => {
    if (!confirm(`Remove ${matricNumber} from this course?`)) return;

    try {
      const response = await api.delete(
        `/api/courses/${selectedCourseForStudents.id}/students/${studentId}/remove/`,
      );
      alert("✅ " + response.data.message);
      fetchEnrolledStudents(selectedCourseForStudents.id); // Refresh list
    } catch (error) {
      alert(
        "❌ " + (error.response?.data?.error || "Failed to remove student"),
      );
    }
  };

  const handleClearAllEnrollments = async () => {
    if (
      !confirm(
        "⚠️ Delete ALL student enrollments from this course?\n\nThis cannot be undone!",
      )
    )
      return;

    try {
      const response = await api.delete(
        `/api/courses/${selectedCourseForStudents.id}/students/clear/`,
      );
      alert("✅ " + response.data.message);
      fetchEnrolledStudents(selectedCourseForStudents.id); // Refresh list
    } catch (error) {
      alert(
        "❌ " + (error.response?.data?.error || "Failed to clear enrollments"),
      );
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>👨‍🏫 Lecturer Dashboard</h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>{today}</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={resetSemester}
            style={{
              ...styles.logoutBtn,
              background: "#dc2626",
              fontSize: "12px",
            }}
          >
            🗑️ Reset Semester
          </button>
          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
      {/* Timetable Upload */}
      <div style={styles.section}>
        <h3>📤 Import Timetable</h3>
        <p style={{ color: "#888", fontSize: "13px" }}>
          Enter semester start date then upload your timetable — 14 weeks of
          sessions will be created automatically.
        </p>
        <input
          style={styles.input}
          type="date"
          value={semesterStart}
          onChange={(e) => setSemesterStart(e.target.value)}
        />
        <input
          type="file"
          key={timetableKey}
          accept="image/*,.pdf,.docx,.doc"
          onChange={uploadTimetable}
        />
        {uploading && (
          <p style={{ color: "#4f46e5" }}>⏳ Reading timetable...</p>
        )}
        {timetableMsg && (
          <p
            style={{ color: timetableMsg.includes("Failed") ? "red" : "green" }}
          >
            {timetableMsg}
          </p>
        )}
      </div>

      {/* Today's Sessions */}
      <div style={styles.section}>
        <h3>📅 Today's Sessions</h3>
        {todaySessions.length === 0 ? (
          <p style={styles.empty}>No classes scheduled for today.</p>
        ) : (
          todaySessions.map((session) => (
            <div key={session.id} style={styles.todayCard}>
              <div>
                <b>
                  {courses.find((c) => c.id === session.course)?.code ||
                    `Course ${session.course}`}
                </b>
                <span style={{ marginLeft: "8px", color: "#666" }}>
                  {session.start_time} - {session.end_time}
                </span>
                {finalizeMsg[session.id] && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "12px",
                      color: finalizeMsg[session.id].includes("❌")
                        ? "red"
                        : "green",
                    }}
                  >
                    {finalizeMsg[session.id]}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  style={styles.qrBtn}
                  onClick={() => startQR(session.id)}
                >
                  📱 Generate QR
                </button>
                <button
                  style={{ ...styles.qrBtn, background: "#16a34a" }}
                  onClick={() => finalizeSession(session.id)}
                >
                  ✅ Finalize
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/*ADD COURSE SECTION */}
      <div className="add-course-section">
        <h2>Courses</h2>
        <button onClick={() => setShowAddCourseForm(!showAddCourseForm)}>
          ➕ Add Course Manually
        </button>

        {showAddCourseForm && (
          <form onSubmit={handleCreateCourse} className="add-course-form">
            <input
              type="text"
              placeholder="Course Code (e.g., BITM3233)"
              value={newCourse.code}
              onChange={(e) =>
                setNewCourse({ ...newCourse, code: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Course Name"
              value={newCourse.name}
              onChange={(e) =>
                setNewCourse({ ...newCourse, name: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Section (optional, e.g., 1/1)"
              value={newCourse.section}
              onChange={(e) =>
                setNewCourse({ ...newCourse, section: e.target.value })
              }
            />
            <div>
              <button type="submit">Create Course</button>
              <button type="button" onClick={() => setShowAddCourseForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>



      {/* QR Code */}
      {qrImage && (
        <div style={styles.qrBox}>
          <h3>📱 Active QR Code</h3>
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: qrCountdown <= 10 ? "#ef4444" : "#4f46e5",
              letterSpacing: "2px",
              marginBottom: "8px",
            }}
          >
            {String(Math.floor(qrCountdown / 60)).padStart(2, "0")}:
            {String(qrCountdown % 60).padStart(2, "0")}
          </div>
          <p style={styles.hint}>QR refreshes every 3 minutes</p>
          <img src={qrImage} alt="QR Code" style={styles.qr} />
          <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
            Token:{" "}
            <code
              style={{
                background: "#f0f0f0",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              {qrToken}
            </code>
          </p>
          <button
            onClick={() => exportExcel(countSessionId)}
            style={{ ...styles.btn, marginTop: "12px", background: "#16a34a" }}
          >
            📥 Download Attendance Excel
          </button>
        </div>
      )}

      {/* Attendance Count */}
      {countSessionId && (
        <div
          style={{
            textAlign: "center",
            margin: "1rem 0",
            padding: "1rem",
            background: "#f0fdf4",
            borderRadius: "12px",
            border: "1px solid #bbf7d0",
          }}
        >
          <span
            style={{ fontSize: "32px", fontWeight: "bold", color: "#16a34a" }}
          >
            {attendanceCount}
          </span>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: "14px" }}>
            students marked attendance
          </p>
        </div>
      )}

      {/* Course List */}
      <div style={styles.section}>
        <h3>📚 My Courses</h3>
        {courses.length === 0 && <p style={styles.empty}>No courses yet.</p>}
        {courses.map((course) => (
          <div
            key={course.id}
            style={{
              ...styles.card,
              background:
                selectedCourse?.id === course.id ? "#ede9fe" : "#f9f9f9",
            }}
          >
            {editingCourse === course.id ? (
              <div>
                <input
                  style={styles.input}
                  value={editForm.code}
                  onChange={(e) =>
                    setEditForm({ ...editForm, code: e.target.value })
                  }
                  placeholder="Course Code"
                />
                <input
                  style={styles.input}
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="Course Name"
                />
                <button
                  style={styles.btn}
                  onClick={() => saveEditCourse(course.id)}
                >
                  Save
                </button>
                <button
                  style={{ ...styles.deleteBtn, marginLeft: "8px" }}
                  onClick={() => setEditingCourse(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  onClick={() => selectCourse(course)}
                  style={{ cursor: "pointer", flex: 1 }}
                >
                  <b>{course.code}</b> — {course.name}
                </span>
                <button
                  onClick={() => {
                    setEditingCourse(course.id);
                    setEditForm({ name: course.name, code: course.code });
                  }}
                  style={{ ...styles.deleteBtn, marginRight: "6px" }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteCourse(course.id)}
                  style={styles.deleteBtn}
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sessions */}
      {selectedCourse && (
        <div style={styles.section}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3>🗓️ Sessions — {selectedCourse.code}</h3>
            <button
              style={styles.toggleBtn}
              onClick={() => setShowAllSessions(!showAllSessions)}
            >
              {showAllSessions ? "Show Upcoming Only" : "Show All 14 Weeks"}
            </button>
          </div>

          <button
            style={{ ...styles.toggleBtn, marginBottom: "1rem" }}
            onClick={() => setShowAddSession(!showAddSession)}
          >
            {showAddSession ? "Cancel" : "➕ Add Session Manually"}
          </button>

          {showAddSession && (
            <div
              style={{
                background: "#f9f9f9",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1rem",
              }}
            >
              <input
                style={styles.input}
                type="date"
                value={newSession.date}
                onChange={(e) =>
                  setNewSession({ ...newSession, date: e.target.value })
                }
              />
              <input
                style={styles.input}
                type="time"
                value={newSession.start_time}
                onChange={(e) =>
                  setNewSession({ ...newSession, start_time: e.target.value })
                }
              />
              <input
                style={styles.input}
                type="time"
                value={newSession.end_time}
                onChange={(e) =>
                  setNewSession({ ...newSession, end_time: e.target.value })
                }
              />
              <button style={styles.btn} onClick={createSession}>
                Add Session
              </button>
              {sessionMsg && (
                <p
                  style={{
                    color: sessionMsg.includes("Failed") ? "red" : "green",
                    fontSize: "13px",
                  }}
                >
                  {sessionMsg}
                </p>
              )}
            </div>
          )}

          {sessions
            .filter(
              (s) =>
                showAllSessions ||
                new Date(s.date) >= new Date(new Date().toDateString()),
            )
            .map((session) => (
              <div key={session.id} style={styles.card}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    📆 {session.date} | {session.start_time} -{" "}
                    {session.end_time}
                  </span>
                  <div>
                    <button
                      onClick={() => exportExcel(session.id)}
                      style={{ ...styles.toggleBtn, marginRight: "6px" }}
                    >
                      📥 Export
                    </button>
                    <button
                      onClick={() => deleteSession(session.id)}
                      style={styles.deleteBtn}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Student List */}
      <div style={{ marginTop: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3>
            👥 Students — {selectedCourse?.code} ({studentList.length} enrolled)
          </h3>
          <button
            style={styles.toggleBtn}
            onClick={() => setShowStudents(!showStudents)}
          >
            {showStudents ? "Hide" : "Show Students"}
          </button>
        </div>

        <div style={{ marginBottom: "8px" }}>
          <label
            style={{ fontSize: "13px", color: "#666", marginRight: "8px" }}
          >
            Upload student list (.xlsx,.pdf,.docx,.doc,image):
          </label>
          <input
            type="file"
            key={studentListKey}
            accept=".xlsx,.pdf,.docx,.doc,image/*"
            onChange={(e) => uploadStudentList(e, selectedCourse.id)}
          />
        </div>
        {studentListMsg && (
          <p
            style={{
              fontSize: "13px",
              color: studentListMsg.includes("❌") ? "red" : "green",
            }}
          >
            {studentListMsg}
          </p>
        )}

        {showStudents && studentList.length > 0 && (
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Matric</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Section</th>
                <th style={styles.th}>Email</th>
              </tr>
            </thead>
            <tbody>
              {studentList.map((s, i) => (
                <tr
                  key={s.matric_number}
                  style={i % 2 === 0 ? styles.trEven : styles.trOdd}
                >
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{s.matric_number}</td>
                  <td style={styles.td}>{s.full_name}</td>
                  <td style={styles.td}>{s.section}</td>
                  <td style={styles.td}>{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


      {/* Alerts */}
      <div style={styles.section}>
        <h3>⚠️ Alerts</h3>
        {alerts.length === 0 && (
          <p style={styles.empty}>No alerts triggered yet.</p>
        )}
        {alerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              ...styles.card,
              borderLeft: `4px solid ${alert.alert_type === "bar" ? "red" : "orange"}`,
            }}
          >
            <b>{alert.alert_type.toUpperCase()} LETTER</b> — Student:{" "}
            {alert.student} | Course: {alert.course}
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#555" }}>
              {alert.notes}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "2rem",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  section: { marginBottom: "2rem" },
  card: {
    background: "#f9f9f9",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "10px",
    border: "1px solid #eee",
  },
  todayCard: {
    background: "#f0fdf4",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "10px",
    border: "1px solid #bbf7d0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  input: {
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    marginRight: "8px",
    marginBottom: "8px",
  },
  btn: {
    padding: "8px 16px",
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  qrBtn: {
    padding: "6px 12px",
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
  },
  deleteBtn: {
    background: "#fee2e2",
    border: "none",
    borderRadius: "6px",
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  toggleBtn: {
    background: "#e0e7ff",
    border: "none",
    borderRadius: "6px",
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: "12px",
  },
  logoutBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  qrBox: {
    textAlign: "center",
    margin: "2rem 0",
    background: "#fafafa",
    padding: "1.5rem",
    borderRadius: "12px",
    border: "1px solid #eee",
  },
  qr: { width: "220px", height: "220px" },
  hint: { color: "#888", fontSize: "12px" },
  empty: { color: "#aaa", fontStyle: "italic" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  tableHeader: { background: "#4f46e5", color: "white" },
  th: { padding: "8px 10px", textAlign: "left" },
  td: { padding: "8px 10px", borderBottom: "1px solid #eee" },
  trEven: { background: "#f9f9f9" },
  trOdd: { background: "white" },
};
