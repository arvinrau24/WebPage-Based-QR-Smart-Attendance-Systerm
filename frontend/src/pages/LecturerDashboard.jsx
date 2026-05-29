import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const S = {
  // Layout
  page: {
    minHeight: "100vh",
    background: "#f8f7f4",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    color: "#1a1917",
  },
  topbar: {
    background: "#fff",
    borderBottom: "1px solid #e8e6e1",
    padding: "0 2rem",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontWeight: 700,
    fontSize: "16px",
    letterSpacing: "-0.3px",
    color: "#1a1917",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  topbarRight: { display: "flex", alignItems: "center", gap: "12px" },
  userPill: {
    fontSize: "13px",
    color: "#6b6963",
    background: "#f3f2ef",
    padding: "4px 12px",
    borderRadius: "20px",
  },
  body: { display: "flex", minHeight: "calc(100vh - 60px)" },

  // Sidebar
  sidebar: {
    width: "260px",
    background: "#fff",
    borderRight: "1px solid #e8e6e1",
    padding: "1.5rem 0",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
  },
  sideSection: { marginBottom: "1.5rem" },
  sideLabel: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#a09d97",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "0 1.25rem",
    marginBottom: "4px",
  },
  courseItem: (active) => ({
    padding: "9px 1.25rem",
    cursor: "pointer",
    fontSize: "13.5px",
    fontWeight: active ? 600 : 400,
    color: active ? "#1a1917" : "#4a4845",
    background: active ? "#f3f2ef" : "transparent",
    borderRight: active ? "2px solid #1a1917" : "2px solid transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "background 0.15s",
  }),
  courseCode: {
    fontSize: "11px",
    background: "#f3f2ef",
    color: "#6b6963",
    padding: "2px 7px",
    borderRadius: "4px",
    fontWeight: 500,
  },
  addCourseBtn: {
    margin: "0 1.25rem",
    padding: "8px",
    border: "1px dashed #d0cec9",
    borderRadius: "8px",
    background: "transparent",
    color: "#6b6963",
    fontSize: "13px",
    cursor: "pointer",
    width: "calc(100% - 2.5rem)",
    textAlign: "center",
    transition: "all 0.15s",
  },
  sideFooter: { marginTop: "auto", padding: "1.25rem" },

  // Main area
  main: { flex: 1, padding: "2rem", overflowY: "auto" },
  pageHeader: { marginBottom: "1.5rem" },
  pageTitle: {
    fontSize: "22px",
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.4px",
  },
  pageSubtitle: { fontSize: "13px", color: "#6b6963", margin: "2px 0 0" },

  // Cards / panels
  panel: {
    background: "#fff",
    border: "1px solid #e8e6e1",
    borderRadius: "12px",
    marginBottom: "1.5rem",
    overflow: "hidden",
  },
  panelHeader: {
    padding: "1rem 1.25rem",
    borderBottom: "1px solid #f0eeea",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelTitle: { fontSize: "14px", fontWeight: 600, margin: 0 },
  panelBody: { padding: "1.25rem" },

  // Grid
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1rem",
  },

  // Stat cards
  stat: {
    background: "#f8f7f4",
    borderRadius: "10px",
    padding: "1rem",
    border: "1px solid #eeece8",
  },
  statLabel: { fontSize: "12px", color: "#6b6963", marginBottom: "6px" },
  statValue: { fontSize: "28px", fontWeight: 700, letterSpacing: "-0.5px" },
  statSub: { fontSize: "12px", color: "#a09d97", marginTop: "2px" },

  // Today sessions
  sessionCard: {
    border: "1px solid #e8e6e1",
    borderRadius: "10px",
    padding: "1rem 1.25rem",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#fff",
  },
  sessionInfo: { flex: 1 },
  sessionCourse: { fontSize: "14px", fontWeight: 600 },
  sessionTime: { fontSize: "12px", color: "#6b6963", marginTop: "2px" },
  sessionActions: { display: "flex", gap: "8px" },

  // QR box
  qrPanel: {
    background: "#fff",
    border: "1px solid #e8e6e1",
    borderRadius: "12px",
    padding: "1.5rem",
    textAlign: "center",
    marginBottom: "1.5rem",
  },
  countdown: (urgent) => ({
    fontSize: "52px",
    fontWeight: 800,
    letterSpacing: "-2px",
    color: urgent ? "#d85a30" : "#1a1917",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
    marginBottom: "4px",
  }),

  // Student table
  table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
  th: {
    padding: "8px 12px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 600,
    color: "#6b6963",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    borderBottom: "1px solid #eeece8",
    background: "#faf9f7",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #f3f2ef",
    verticalAlign: "middle",
  },
  trHover: { background: "#faf9f7" },

  // Buttons
  btn: (variant = "primary") =>
    ({
      primary: {
        background: "#1a1917",
        color: "#fff",
        border: "none",
        padding: "8px 16px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
      },
      secondary: {
        background: "#fff",
        color: "#1a1917",
        border: "1px solid #d0cec9",
        padding: "8px 16px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
      },
      danger: {
        background: "#fff0ee",
        color: "#c13515",
        border: "1px solid #fac4b3",
        padding: "6px 12px",
        borderRadius: "6px",
        fontSize: "12px",
        cursor: "pointer",
      },
      ghost: {
        background: "transparent",
        color: "#6b6963",
        border: "none",
        padding: "6px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        cursor: "pointer",
      },
      green: {
        background: "#27500a",
        color: "#fff",
        border: "none",
        padding: "8px 16px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
      },
      red: {
        background: "#a32d2d",
        color: "#fff",
        border: "none",
        padding: "8px 16px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
      },
    })[variant],

  // Form
  formRow: { marginBottom: "12px" },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    color: "#6b6963",
    marginBottom: "4px",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d0cec9",
    borderRadius: "8px",
    fontSize: "13px",
    background: "#fff",
    color: "#1a1917",
    boxSizing: "border-box",
    outline: "none",
  },

  // Badge
  badge: (color) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: 500,
    background:
      color === "green"
        ? "#eaf3de"
        : color === "red"
          ? "#fcebeb"
          : color === "amber"
            ? "#faeeda"
            : "#f3f2ef",
    color:
      color === "green"
        ? "#3b6d11"
        : color === "red"
          ? "#a32d2d"
          : color === "amber"
            ? "#854f0b"
            : "#5f5e5a",
  }),

  // Modal overlay
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  modal: {
    background: "#fff",
    borderRadius: "14px",
    width: "100%",
    maxWidth: "480px",
    maxHeight: "80vh",
    overflow: "auto",
    boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
  },
  modalHeader: {
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid #f0eeea",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontSize: "15px", fontWeight: 600, margin: 0 },
  modalBody: { padding: "1.5rem" },

  // Alerts
  alertCard: (type) => ({
    border: `1px solid ${type === "bar" ? "#fac4b3" : "#fac775"}`,
    borderLeft: `4px solid ${type === "bar" ? "#d85a30" : "#ef9f27"}`,
    borderRadius: "8px",
    padding: "12px 14px",
    marginBottom: "10px",
    background: type === "bar" ? "#faece7" : "#faeeda",
    cursor: "pointer",
    transition: "box-shadow 0.15s ease",
  }),
  alertOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(26,25,23,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "24px",
  },
  alertModal: {
    background: "#fff",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "640px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
  },
  missedRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    background: "#faf9f7",
    borderRadius: "8px",
    marginBottom: "8px",
    fontSize: "13px",
  },
  missedRowBlock: {
    padding: "12px",
    background: "#faf9f7",
    borderRadius: "8px",
    marginBottom: "10px",
    fontSize: "13px",
    border: "1px solid #f0eeea",
  },
  excusedRow: {
    padding: "10px 12px",
    background: "#eef6ee",
    borderRadius: "8px",
    marginBottom: "8px",
    fontSize: "13px",
    border: "1px solid #c8e6c9",
  },

  // Misc
  divider: {
    border: "none",
    borderTop: "1px solid #f0eeea",
    margin: "1rem 0",
  },
  empty: {
    color: "#a09d97",
    fontSize: "13px",
    fontStyle: "italic",
    padding: "1rem 0",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "#f3f2ef",
    borderRadius: "6px",
    padding: "3px 8px",
    fontSize: "12px",
    color: "#4a4845",
  },
};

/** Drop sessions whose end time has already passed (browser local clock). */
function filterActiveTodaySessions(sessions) {
  const now = new Date();
  return sessions.filter((s) => {
    const parts = String(s.end_time).split(":");
    const h = Number(parts[0]);
    const m = Number(parts[1]) || 0;
    const end = new Date();
    end.setHours(h, m, 0, 0);
    return now < end;
  });
}

export default function LecturerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Data
  const [courses, setCourses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [studentList, setStudentList] = useState([]);

  // UI state
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview | sessions | students | alerts
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showStudents, setShowStudents] = useState(false);

  // Student modal
  const [studentModal, setStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null); // null = add mode, object = edit mode
  const [studentForm, setStudentForm] = useState({
    matric_number: "",
    full_name: "",
    section: "",
    phone: "",
    email: "",
  });

  // QR
  const [qrImage, setQrImage] = useState(null);
  const [qrToken, setQrToken] = useState(null);
  const [qrInterval, setQrInterval] = useState(null);
  const [qrCountdown, setQrCountdown] = useState(180);
  const [countSessionId, setCountSessionId] = useState(null);
  const [attendanceCount, setAttendanceCount] = useState(0);

  // Forms
  const [newCourse, setNewCourse] = useState({
    code: "",
    name: "",
    section: "",
  });
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", code: "" });
  const [newSession, setNewSession] = useState({
    date: "",
    start_time: "",
    end_time: "",
  });
  const [semesterStart, setSemesterStart] = useState("");
  const [timetableKey, setTimetableKey] = useState(0);
  const [studentListKey, setStudentListKey] = useState(0);

  // Messages
  const [timetableMsg, setTimetableMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sessionMsg, setSessionMsg] = useState("");
  const [studentListMsg, setStudentListMsg] = useState("");
  const [finalizeMsg, setFinalizeMsg] = useState({});
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alertSendLoading, setAlertSendLoading] = useState(false);
  const [alertActionMsg, setAlertActionMsg] = useState("");
  const [lecturerMessage, setLecturerMessage] = useState("");
  const [excuseReasons, setExcuseReasons] = useState({});
  const [excusingSessionId, setExcusingSessionId] = useState(null);

  const [pastSessions, setPastSessions] = useState([]);
  const [coursePastSessions, setCoursePastSessions] = useState([]);
  const [selectedPastSession, setSelectedPastSession] = useState(null);
  const [pastSessionRoster, setPastSessionRoster] = useState([]);
  const [pastExcuseReasons, setPastExcuseReasons] = useState({});
  const [pastExcusingMatric, setPastExcusingMatric] = useState(null);
  const [pastClassMsg, setPastClassMsg] = useState("");

  const pendingAlerts = alerts.filter((a) => !a.is_sent);
  const mediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://127.0.0.1:8000${path}`;
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "lecturer") {
      navigate("/login");
      return;
    }
    setUser(parsed);
    fetchCourses();
    fetchAlerts();
    fetchTodaySessions();
    fetchPastSessions();
  }, []);

  useEffect(() => {
    if (!qrImage) return;
    setQrCountdown(180);
    const t = setInterval(
      () => setQrCountdown((p) => (p <= 1 ? 180 : p - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [qrImage]);

  useEffect(() => {
    const prune = () =>
      setTodaySessions((prev) => filterActiveTodaySessions(prev));
    prune();
    const interval = setInterval(prune, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchCourses = async () => {
    const r = await api.get("/courses/");
    setCourses(r.data);
  };
  const fetchAlerts = async () => {
    const r = await api.get("/alerts/");
    setAlerts(r.data);
  };

  const openAlertDetail = async (alert) => {
    setAlertActionMsg("");
    setExcuseReasons({});
    setExcusingSessionId(null);
    try {
      const r = await api.get(`/alerts/${alert.id}/`);
      setSelectedAlert(r.data);
      setLecturerMessage(r.data.lecturer_message || "");
    } catch {
      setSelectedAlert(alert);
      setLecturerMessage(alert.lecturer_message || "");
    }
  };

  const closeAlertModal = () => {
    setSelectedAlert(null);
    setAlertActionMsg("");
    setLecturerMessage("");
    setExcuseReasons({});
    setExcusingSessionId(null);
  };

  const excuseAlertSession = async (sessionId, fileInput) => {
    if (!selectedAlert || selectedAlert.is_sent) return;
    const file = fileInput?.files?.[0];
    if (!file) {
      setAlertActionMsg("Upload proof (MC, note, PDF, or image) to excuse this class.");
      return;
    }
    const reasonType = excuseReasons[sessionId] || "mc";
    setExcusingSessionId(sessionId);
    setAlertActionMsg("");
    const fd = new FormData();
    fd.append("session_id", String(sessionId));
    fd.append("reason_type", reasonType);
    fd.append("proof", file);
    try {
      const r = await api.post(`/alerts/${selectedAlert.id}/excuse/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAlertActionMsg(r.data.message);
      await fetchAlerts();
      if (r.data.alert_revoked) {
        setTimeout(() => closeAlertModal(), 1200);
        return;
      }
      if (r.data.alert) {
        setSelectedAlert(r.data.alert);
        setLecturerMessage(r.data.alert.lecturer_message || "");
      }
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setAlertActionMsg(err.response?.data?.error || "Failed to excuse session");
    } finally {
      setExcusingSessionId(null);
    }
  };

  const sendAlertToStudent = async () => {
    if (!selectedAlert || selectedAlert.is_sent) return;
    setAlertSendLoading(true);
    setAlertActionMsg("");
    try {
      const r = await api.post(`/alerts/${selectedAlert.id}/send/`, {
        lecturer_message: lecturerMessage,
      });
      setAlertActionMsg(r.data.message);
      await fetchAlerts();
      const updated = await api.get(`/alerts/${selectedAlert.id}/`);
      setSelectedAlert(updated.data);
      setLecturerMessage(updated.data.lecturer_message || "");
    } catch (err) {
      setAlertActionMsg(err.response?.data?.error || "Failed to send email");
    } finally {
      setAlertSendLoading(false);
    }
  };

  const formatSessionDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-MY", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };
  const fetchTodaySessions = async () => {
    const r = await api.get("/sessions/today/");
    setTodaySessions(filterActiveTodaySessions(r.data));
  };

  const fetchPastSessions = async () => {
    try {
      const r = await api.get("/sessions/past/");
      setPastSessions(r.data);
    } catch {
      setPastSessions([]);
    }
  };

  const fetchCoursePastSessions = async (courseId) => {
    try {
      const r = await api.get(`/courses/${courseId}/sessions/past/`);
      setCoursePastSessions(r.data);
    } catch {
      setCoursePastSessions([]);
    }
  };

  const openPastSession = async (session) => {
    setSelectedPastSession(session);
    setPastClassMsg("");
    setPastExcuseReasons({});
    setPastExcusingMatric(null);
    try {
      const r = await api.get(`/sessions/${session.id}/attendance/`);
      setPastSessionRoster(r.data.roster || []);
    } catch {
      setPastSessionRoster([]);
      setPastClassMsg("Could not load attendance.");
    }
  };

  const closePastSessionModal = () => {
    setSelectedPastSession(null);
    setPastSessionRoster([]);
    setPastClassMsg("");
    setPastExcusingMatric(null);
  };

  const excusePastStudent = async (matric, fileInput) => {
    if (!selectedPastSession) return;
    const file = fileInput?.files?.[0];
    if (!file) {
      setPastClassMsg("Upload proof (MC, note, PDF, or image) to mark as excused.");
      return;
    }
    const reasonType = pastExcuseReasons[matric] || "mc";
    setPastExcusingMatric(matric);
    setPastClassMsg("");
    const fd = new FormData();
    fd.append("matric_number", matric);
    fd.append("reason_type", reasonType);
    fd.append("proof", file);
    try {
      const r = await api.post(
        `/sessions/${selectedPastSession.id}/excuse/`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setPastSessionRoster(r.data.roster || []);
      setPastClassMsg(r.data.message);
      await fetchPastSessions();
      if (selectedCourse) fetchCoursePastSessions(selectedCourse.id);
      await fetchAlerts();
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setPastClassMsg(err.response?.data?.error || "Failed to upload excuse.");
    } finally {
      setPastExcusingMatric(null);
    }
  };
  const fetchAttendanceCount = async (sid) => {
    const r = await api.get(`/sessions/${sid}/attendance/`);
    setAttendanceCount(r.data.length);
  };

  const selectCourse = async (course) => {
    setSelectedCourse(course);
    setQrImage(null);
    setQrToken(null);
    if (qrInterval) clearInterval(qrInterval);
    const r = await api.get(`/courses/${course.id}/sessions/`);
    setSessions(r.data);
    fetchStudentList(course.id);
    fetchCoursePastSessions(course.id);
    setActiveTab("overview");
  };

  const fetchStudentList = async (courseId) => {
    const r = await api.get(`/courses/${courseId}/students/`);
    setStudentList(r.data.students || []);
  };

  const deleteCourse = async (id) => {
    if (!window.confirm("Delete this course and all its sessions?")) return;
    await api.delete(`/courses/${id}/delete/`);
    setSelectedCourse(null);
    setSessions([]);
    setStudentList([]);
    fetchCourses();
    fetchTodaySessions();
  };

  const saveEditCourse = async (id) => {
    await api.patch(`/courses/${id}/edit/`, editForm);
    setEditingCourse(null);
    fetchCourses();
  };

  const createSession = async () => {
    if (!newSession.date || !newSession.start_time || !newSession.end_time) {
      setSessionMsg("Fill all fields");
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
      const r = await api.get(`/courses/${selectedCourse.id}/sessions/`);
      setSessions(r.data);
      fetchTodaySessions();
    } catch {
      setSessionMsg("Failed to add session.");
    }
  };

  const deleteSession = async (id) => {
    if (!window.confirm("Delete this session?")) return;
    await api.delete(`/sessions/${id}/delete/`);
    if (selectedCourse) {
      const r = await api.get(`/courses/${selectedCourse.id}/sessions/`);
      setSessions(r.data);
    }
    fetchTodaySessions();
  };

  const startQR = (sessionId) => {
    if (qrInterval) clearInterval(qrInterval);
    setAttendanceCount(0);
    setCountSessionId(sessionId);
    const generate = async () => {
      const r = await api.post(`/sessions/${sessionId}/generate-qr/`);
      setQrImage(r.data.qr_image);
      setQrToken(r.data.token);
    };
    generate();
    const iv = setInterval(generate, 180000);
    setQrInterval(iv);
    fetchAttendanceCount(sessionId);
    const cv = setInterval(() => fetchAttendanceCount(sessionId), 10000);
    setQrInterval(cv);
  };

  const exportExcel = (sessionId) => {
    const token = localStorage.getItem("token");
    window.open(
      `http://127.0.0.1:8000/api/sessions/${sessionId}/export/?token=${token}`,
      "_blank",
    );
  };

  const resetTimetableFileInput = (inputEl) => {
    if (inputEl) inputEl.value = "";
    setTimetableKey((p) => p + 1);
  };

  const uploadTimetable = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    if (!semesterStart) {
      setTimetableMsg("Enter semester start date first.");
      resetTimetableFileInput(input);
      return;
    }

    setUploading(true);
    setTimetableMsg("");
    const fd = new FormData();
    fd.append("image", file);
    fd.append("semester_start", semesterStart);

    try {
      const r = await api.post("/upload-timetable/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const end = r.data.semester_end;
      setTimetableMsg(
        end
          ? `${r.data.message} Semester: ${semesterStart} → ${end}.`
          : r.data.message,
      );
      fetchCourses();
      fetchTodaySessions();
    } catch (err) {
      setTimetableMsg(
        err.response?.data?.error || "Failed to parse timetable.",
      );
    } finally {
      setUploading(false);
      resetTimetableFileInput(input);
    }
  };

  const uploadStudentList = async (e, courseId) => {
    const file = e.target.files[0];
    if (!file) return;
    setStudentListMsg("Importing...");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await api.post(`/courses/${courseId}/upload-students/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStudentListMsg(`Imported: ${r.data.sections?.join(", ")}`);
      fetchStudentList(courseId);
    } catch {
      setStudentListMsg("Failed to upload.");
    }
    setStudentListKey((p) => p + 1);
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post("/courses/create/", newCourse);
      setNewCourse({ code: "", name: "", section: "" });
      setShowAddCourseForm(false);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create course");
    }
  };

  const finalizeSession = async (sessionId) => {
    if (
      !window.confirm(
        "Finalize session? Absent records will be created for students who didn't scan.",
      )
    )
      return;
    try {
      const r = await api.post(`/sessions/${sessionId}/finalize/`);
      setFinalizeMsg((p) => ({
        ...p,
        [sessionId]: `${r.data.present} present, ${r.data.absent} absent. ${r.data.alerts_pending_review || 0} alert(s) pending your review.`,
      }));
      setQrImage(null);
      setQrToken(null);
      setCountSessionId(null);
      setAttendanceCount(0);
      if (qrInterval) {
        clearInterval(qrInterval);
        setQrInterval(null);
      }
      // Refresh session lists so finalized session disappears
      fetchTodaySessions();
      fetchPastSessions();
      if (selectedCourse) {
        const res = await api.get(`/courses/${selectedCourse.id}/sessions/`);
        setSessions(res.data);
        fetchCoursePastSessions(selectedCourse.id);
      }
      fetchAlerts();
    } catch (err) {
      setFinalizeMsg((p) => ({
        ...p,
        [sessionId]: err.response?.data?.error || "Failed.",
      }));
    }
  };

  // ── Student CRUD ──
  const openAddStudent = () => {
    setEditingStudent(null);
    setStudentForm({
      matric_number: "",
      full_name: "",
      section: "",
      phone: "",
      email: "",
    });
    setStudentModal(true);
  };

  const openEditStudent = (s) => {
    setEditingStudent(s);
    setStudentForm({
      matric_number: s.matric_number,
      full_name: s.full_name,
      section: s.section || "",
      phone: s.phone || "",
      email: s.email || "",
    });
    setStudentModal(true);
  };

  const saveStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        `/courses/${selectedCourse.id}/students/add/`,
        studentForm,
      );
      setStudentModal(false);
      fetchStudentList(selectedCourse.id);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save student");
    }
  };

  const deleteStudent = async (student) => {
    if (
      !window.confirm(`Remove ${student.matric_number} — ${student.full_name}?`)
    )
      return;
    try {
      await api.delete(
        `/courses/${selectedCourse.id}/students/${student.id}/remove/`,
      );
      fetchStudentList(selectedCourse.id);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to remove student");
    }
  };

  const clearAllStudents = async () => {
    if (
      !window.confirm(
        "Remove ALL students from this course? This cannot be undone.",
      )
    )
      return;
    try {
      await api.delete(`/courses/${selectedCourse.id}/students/clear/`);
      fetchStudentList(selectedCourse.id);
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
    }
  };

  const resetSemester = async () => {
    if (
      !window.confirm(
        "Delete ALL courses, sessions, and attendance? This cannot be undone.",
      )
    )
      return;
    if (!window.confirm("Are you absolutely sure?")) return;
    try {
      await api.delete("/reset-semester/");
      setSelectedCourse(null);
      setSessions([]);
      setStudentList([]);
      setQrImage(null);
      fetchCourses();
      fetchTodaySessions();
    } catch {
      alert("Failed to reset.");
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
  const upcomingSessions = sessions.filter(
    (s) =>
      showAllSessions ||
      new Date(s.date) >= new Date(new Date().toDateString()),
  );

  const statusLabel = (status) => {
    if (status === "present") return { text: "Present", color: "#2d6a4f" };
    if (status === "excused") return { text: "Excused", color: "#2d6a4f" };
    return { text: "Absent", color: "#a32d2d" };
  };

  const renderPastSessionRow = (session, showCourseCode = false) => (
    <div key={session.id} style={{ ...S.sessionCard, marginBottom: "8px" }}>
      <div style={S.sessionInfo}>
        {showCourseCode && (
          <p style={S.sessionCourse}>
            {session.course_code || session.course_name}
          </p>
        )}
        <p style={{ ...S.sessionCourse, fontWeight: 500 }}>
          {formatSessionDate(session.date)}
        </p>
        <p style={S.sessionTime}>
          {session.start_time} – {session.end_time}
        </p>
      </div>
      <div style={S.sessionActions}>
        <button
          style={S.btn("secondary")}
          onClick={() => openPastSession(session)}
        >
          View attendance
        </button>
        <button
          style={S.btn("ghost")}
          onClick={() => exportExcel(session.id)}
        >
          📥 Export
        </button>
      </div>
    </div>
  );

  const Tab = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: "7px 14px",
        border: "none",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: activeTab === id ? 600 : 400,
        color: activeTab === id ? "#1a1917" : "#6b6963",
        background: "transparent",
        borderBottom:
          activeTab === id ? "2px solid #1a1917" : "2px solid transparent",
        marginBottom: "-1px",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={S.page}>
      {/* ── Topbar ── */}
      <div style={S.topbar}>
        <div style={S.logo}>
          <span style={{ fontSize: "20px" }}>◈</span>
          Smart Attendance
        </div>
        <div style={S.topbarRight}>
          <span style={S.userPill}>👨‍🏫 {user?.username}</span>
          <span style={{ fontSize: "12px", color: "#a09d97" }}>{today}</span>
          <button
            onClick={resetSemester}
            style={{ ...S.btn("ghost"), color: "#c13515", fontSize: "12px" }}
          >
            Reset Semester
          </button>
          <button onClick={logout} style={S.btn("primary")}>
            Log out
          </button>
        </div>
      </div>

      <div style={S.body}>
        {/* ── Sidebar ── */}
        <div style={S.sidebar}>
          <div style={S.sideSection}>
            <p style={S.sideLabel}>My Courses</p>
            {courses.length === 0 && (
              <p style={{ ...S.empty, padding: "0 1.25rem", fontSize: "12px" }}>
                No courses yet
              </p>
            )}
            {courses.map((c) => (
              <div
                key={c.id}
                style={S.courseItem(selectedCourse?.id === c.id)}
                onClick={() => selectCourse(c)}
              >
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.name}
                </span>
                <span style={S.courseCode}>{c.code}</span>
              </div>
            ))}
          </div>

          <button
            style={S.addCourseBtn}
            onClick={() => setShowAddCourseForm(true)}
          >
            + Add course
          </button>

          <div style={S.sideFooter}>
            <p style={{ fontSize: "11px", color: "#c0bdb8", margin: 0 }}>
              UTeM Smart Attendance v2
            </p>
          </div>
        </div>

        {/* ── Main ── */}
        <div style={S.main}>
          {/* ── Overview when no course selected ── */}
          {!selectedCourse && (
            <>
              <div style={S.pageHeader}>
                <h1 style={S.pageTitle}>Dashboard</h1>
                <p style={S.pageSubtitle}>
                  Overview of today's schedule and system status
                </p>
              </div>

              {/* Stats row */}
              <div style={S.grid3}>
                <div style={S.stat}>
                  <p style={S.statLabel}>Total Courses</p>
                  <p style={S.statValue}>{courses.length}</p>
                </div>
                <div style={S.stat}>
                  <p style={S.statLabel}>Today's Sessions</p>
                  <p style={S.statValue}>{todaySessions.length}</p>
                </div>
                <div style={S.stat}>
                  <p style={S.statLabel}>Alerts</p>
                  <p style={S.statValue}>{pendingAlerts.length}</p>
                  <p style={S.statSub}>
                    {pendingAlerts.length} pending review
                    {alerts.filter((a) => a.is_sent).length > 0 &&
                      ` · ${alerts.filter((a) => a.is_sent).length} sent`}
                  </p>
                </div>
              </div>

              <hr style={S.divider} />

              {/* Timetable import */}
              <div style={S.panel}>
                <div style={S.panelHeader}>
                  <p style={S.panelTitle}>📤 Import Timetable</p>
                </div>
                <div style={S.panelBody}>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#6b6963",
                      margin: "0 0 12px",
                    }}
                  >
                    Upload your timetable image/PDF — AI will extract all
                    courses and schedule 14 class weeks (7 weeks, 1-week
                    holiday break, then 7 more weeks). The semester start you
                    enter sets the window; the end date is 15 calendar weeks
                    later (including the break).
                    Bar letters trigger only when attendance falls below 80%
                    within that semester.
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-end",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={S.formRow}>
                      <label style={S.label}>Semester start date</label>
                      <input
                        style={{ ...S.input, width: "160px" }}
                        type="date"
                        value={semesterStart}
                        onChange={(e) => setSemesterStart(e.target.value)}
                      />
                      {semesterStart && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#6b6963",
                            margin: "4px 0 0",
                          }}
                        >
                          Semester ends:{" "}
                          {(() => {
                            const d = new Date(`${semesterStart}T12:00:00`);
                            d.setDate(d.getDate() + 15 * 7 - 1);
                            return d.toISOString().slice(0, 10);
                          })()}
                        </p>
                      )}
                    </div>
                    <div style={S.formRow}>
                      <label style={S.label}>Timetable file</label>
                      <input
                        key={timetableKey}
                        type="file"
                        accept="image/*,.pdf,.docx,.doc"
                        onChange={uploadTimetable}
                        style={{ fontSize: "13px", color: "#4a4845" }}
                      />
                    </div>
                  </div>
                  {uploading && (
                    <p
                      style={{
                        color: "#185fa5",
                        fontSize: "13px",
                        margin: "8px 0 0",
                      }}
                    >
                      ⏳ Reading timetable with AI...
                    </p>
                  )}
                  {timetableMsg && (
                    <p
                      style={{
                        color: timetableMsg.includes("Failed")
                          ? "#a32d2d"
                          : "#3b6d11",
                        fontSize: "13px",
                        margin: "8px 0 0",
                      }}
                    >
                      {timetableMsg}
                    </p>
                  )}
                </div>
              </div>

              {/* Today's sessions */}
              <div style={S.panel}>
                <div style={S.panelHeader}>
                  <p style={S.panelTitle}>📅 Today's Sessions</p>
                  <span style={S.badge("green")}>
                    {todaySessions.length} scheduled
                  </span>
                </div>
                <div style={S.panelBody}>
                  {todaySessions.length === 0 ? (
                    <p style={S.empty}>No classes scheduled for today.</p>
                  ) : (
                    todaySessions.map((session) => (
                      <div key={session.id} style={S.sessionCard}>
                        <div style={S.sessionInfo}>
                          <p style={S.sessionCourse}>
                            {courses.find((c) => c.id === session.course)
                              ?.code || `Course ${session.course}`}
                          </p>
                          <p style={S.sessionTime}>
                            {session.start_time} – {session.end_time}
                          </p>
                          {finalizeMsg[session.id] && (
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#3b6d11",
                                margin: "4px 0 0",
                              }}
                            >
                              {finalizeMsg[session.id]}
                            </p>
                          )}
                        </div>
                        <div style={S.sessionActions}>
                          <button
                            style={S.btn("secondary")}
                            onClick={() => startQR(session.id)}
                          >
                            📱 Generate QR
                          </button>
                          <button
                            style={S.btn("green")}
                            onClick={() => finalizeSession(session.id)}
                          >
                            ✅ Finalize
                          </button>
                          <button
                            style={S.btn("ghost")}
                            onClick={() => exportExcel(session.id)}
                          >
                            📥 Export
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Past classes (finalized) */}
              <div style={S.panel}>
                <div style={S.panelHeader}>
                  <p style={S.panelTitle}>📚 Past Classes</p>
                  <span style={S.badge("gray")}>
                    {pastSessions.length} finalized
                  </span>
                </div>
                <div style={S.panelBody}>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#6b6963",
                      margin: "0 0 12px",
                    }}
                  >
                    Finalized sessions appear here. Open a class to review
                    attendance and upload MC or notes to mark absent students as
                    excused (counts as present).
                  </p>
                  {pastSessions.length === 0 ? (
                    <p style={S.empty}>
                      No finalized classes yet. Use Finalize on today&apos;s
                      sessions when class ends.
                    </p>
                  ) : (
                    pastSessions.slice(0, 15).map((session) =>
                      renderPastSessionRow(session, true),
                    )
                  )}
                  {pastSessions.length > 15 && (
                    <p style={{ fontSize: "12px", color: "#a09d97", marginTop: "8px" }}>
                      Showing 15 most recent. Select a course for the full list.
                    </p>
                  )}
                </div>
              </div>

              {/* QR + count */}
              {qrImage && (
                <div style={S.qrPanel}>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#6b6963",
                      margin: "0 0 8px",
                    }}
                  >
                    Active QR Code
                  </p>
                  <div style={S.countdown(qrCountdown <= 10)}>
                    {String(Math.floor(qrCountdown / 60)).padStart(2, "0")}:
                    {String(qrCountdown % 60).padStart(2, "0")}
                  </div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#a09d97",
                      margin: "0 0 12px",
                    }}
                  >
                    Refreshes every 3 minutes
                  </p>
                  <img
                    src={qrImage}
                    alt="QR Code"
                    style={{
                      width: "200px",
                      height: "200px",
                      borderRadius: "8px",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#a09d97",
                      margin: "8px 0 0",
                    }}
                  >
                    Token:{" "}
                    <code
                      style={{
                        background: "#f3f2ef",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {qrToken}
                    </code>
                  </p>
                  <div
                    style={{
                      marginTop: "16px",
                      display: "inline-block",
                      background: "#f3f2ef",
                      borderRadius: "10px",
                      padding: "12px 24px",
                    }}
                  >
                    <span style={{ fontSize: "36px", fontWeight: 800 }}>
                      {attendanceCount}
                    </span>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b6963",
                        margin: "2px 0 0",
                      }}
                    >
                      students present
                    </p>
                  </div>
                </div>
              )}

              {/* Alerts — review before emailing students */}
              {alerts.length > 0 && (
                <div style={S.panel}>
                  <div style={S.panelHeader}>
                    <p style={S.panelTitle}>⚠️ Attendance alerts</p>
                    <span style={S.badge("red")}>{pendingAlerts.length} pending</span>
                  </div>
                  <div style={S.panelBody}>
                    <p style={{ fontSize: "13px", color: "#6b6963", margin: "0 0 12px" }}>
                      Click an alert to review missed classes. Upload MC or other proof
                      to excuse a day (updates or removes pending alerts). Add an optional
                      message, then send the email to the student.
                    </p>
                    {alerts.map((a) => (
                      <div
                        key={a.id}
                        role="button"
                        tabIndex={0}
                        style={S.alertCard(a.alert_type)}
                        onClick={() => openAlertDetail(a)}
                        onKeyDown={(e) => e.key === "Enter" && openAlertDetail(a)}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                            marginBottom: "6px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span
                              style={S.badge(
                                a.alert_type === "bar" ? "red" : "amber",
                              )}
                            >
                              {a.alert_type === "bar" ? "Bar" : "Warning"}
                            </span>
                            <span style={{ fontSize: "12px", color: "#6b6963" }}>
                              {a.course_code || `Course #${a.course}`}
                            </span>
                          </div>
                          <span
                            style={S.badge(a.is_sent ? "green" : "amber")}
                          >
                            {a.is_sent ? "Sent" : "Review"}
                          </span>
                        </div>
                        <p style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 4px" }}>
                          {a.student_name || a.matric_number}
                        </p>
                        <p style={{ fontSize: "12px", margin: 0, color: "#6b6963" }}>
                          {a.reason_label}
                          {a.consecutive_count
                            ? ` · ${a.consecutive_count} in a row`
                            : ""}
                          {a.attendance_percentage != null
                            ? ` · ${a.attendance_percentage}% attendance`
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Course detail view ── */}
          {selectedCourse && (
            <>
              <div style={S.pageHeader}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "4px",
                  }}
                >
                  <button
                    style={S.btn("ghost")}
                    onClick={() => setSelectedCourse(null)}
                  >
                    ← Back
                  </button>
                  <span style={{ color: "#d0cec9" }}>|</span>
                  {editingCourse === selectedCourse.id ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <input
                        style={{ ...S.input, width: "120px" }}
                        value={editForm.code}
                        onChange={(e) =>
                          setEditForm({ ...editForm, code: e.target.value })
                        }
                        placeholder="Code"
                      />
                      <input
                        style={{ ...S.input, width: "200px" }}
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        placeholder="Name"
                      />
                      <button
                        style={S.btn("primary")}
                        onClick={() => saveEditCourse(selectedCourse.id)}
                      >
                        Save
                      </button>
                      <button
                        style={S.btn("ghost")}
                        onClick={() => setEditingCourse(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <h1 style={{ ...S.pageTitle, fontSize: "18px" }}>
                        {selectedCourse.name}
                      </h1>
                      <span style={S.courseCode}>{selectedCourse.code}</span>
                      <button
                        style={S.btn("ghost")}
                        onClick={() => {
                          setEditingCourse(selectedCourse.id);
                          setEditForm({
                            name: selectedCourse.name,
                            code: selectedCourse.code,
                          });
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        style={S.btn("danger")}
                        onClick={() => deleteCourse(selectedCourse.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div
                  style={{
                    borderBottom: "1px solid #e8e6e1",
                    display: "flex",
                    gap: "0",
                    marginTop: "12px",
                  }}
                >
                  <Tab id="overview" label="Overview" />
                  <Tab id="sessions" label={`Sessions (${sessions.length})`} />
                  <Tab
                    id="students"
                    label={`Students (${studentList.length})`}
                  />
                </div>
              </div>

              {/* ── Tab: Overview ── */}
              {activeTab === "overview" && (
                <>
                  <div style={S.grid3}>
                    <div style={S.stat}>
                      <p style={S.statLabel}>Total Sessions</p>
                      <p style={S.statValue}>{sessions.length}</p>
                    </div>
                    <div style={S.stat}>
                      <p style={S.statLabel}>Students Enrolled</p>
                      <p style={S.statValue}>{studentList.length}</p>
                    </div>
                    <div style={S.stat}>
                      <p style={S.statLabel}>Today</p>
                      <p style={S.statValue}>
                        {
                          todaySessions.filter(
                            (s) => s.course === selectedCourse.id,
                          ).length
                        }
                      </p>
                      <p style={S.statSub}>session(s) today</p>
                    </div>
                  </div>

                  {/* QR panel */}
                  {qrImage && (
                    <div style={{ ...S.qrPanel, marginTop: "1.5rem" }}>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#6b6963",
                          margin: "0 0 8px",
                        }}
                      >
                        Active QR Code
                      </p>
                      <div style={S.countdown(qrCountdown <= 10)}>
                        {String(Math.floor(qrCountdown / 60)).padStart(2, "0")}:
                        {String(qrCountdown % 60).padStart(2, "0")}
                      </div>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#a09d97",
                          margin: "0 0 12px",
                        }}
                      >
                        Refreshes every 3 minutes
                      </p>
                      <img
                        src={qrImage}
                        alt="QR Code"
                        style={{
                          width: "200px",
                          height: "200px",
                          borderRadius: "8px",
                        }}
                      />
                      <div
                        style={{
                          marginTop: "16px",
                          display: "inline-block",
                          background: "#f3f2ef",
                          borderRadius: "10px",
                          padding: "12px 24px",
                        }}
                      >
                        <span style={{ fontSize: "36px", fontWeight: 800 }}>
                          {attendanceCount}
                        </span>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#6b6963",
                            margin: "2px 0 0",
                          }}
                        >
                          students present
                        </p>
                      </div>
                      <div style={{ marginTop: "12px" }}>
                        <button
                          style={S.btn("green")}
                          onClick={() => exportExcel(countSessionId)}
                        >
                          📥 Download Excel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Today's sessions for this course */}
                  <div style={{ ...S.panel, marginTop: "1.5rem" }}>
                    <div style={S.panelHeader}>
                      <p style={S.panelTitle}>Today's Sessions</p>
                    </div>
                    <div style={S.panelBody}>
                      {todaySessions.filter(
                        (s) => s.course === selectedCourse.id,
                      ).length === 0 ? (
                        <p style={S.empty}>
                          No sessions today for this course.
                        </p>
                      ) : (
                        todaySessions
                          .filter((s) => s.course === selectedCourse.id)
                          .map((session) => (
                            <div key={session.id} style={S.sessionCard}>
                              <div style={S.sessionInfo}>
                                <p style={S.sessionCourse}>{session.date}</p>
                                <p style={S.sessionTime}>
                                  {session.start_time} – {session.end_time}
                                </p>
                                {finalizeMsg[session.id] && (
                                  <p
                                    style={{
                                      fontSize: "12px",
                                      color: "#3b6d11",
                                      margin: "4px 0 0",
                                    }}
                                  >
                                    {finalizeMsg[session.id]}
                                  </p>
                                )}
                              </div>
                              <div style={S.sessionActions}>
                                <button
                                  style={S.btn("secondary")}
                                  onClick={() => startQR(session.id)}
                                >
                                  📱 QR
                                </button>
                                <button
                                  style={S.btn("green")}
                                  onClick={() => finalizeSession(session.id)}
                                >
                                  ✅ Finalize
                                </button>
                                <button
                                  style={S.btn("ghost")}
                                  onClick={() => exportExcel(session.id)}
                                >
                                  📥
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Past classes for this course */}
                  <div style={{ ...S.panel, marginTop: "1.5rem" }}>
                    <div style={S.panelHeader}>
                      <p style={S.panelTitle}>📚 Past Classes</p>
                      <span style={S.badge("gray")}>
                        {coursePastSessions.length} finalized
                      </span>
                    </div>
                    <div style={S.panelBody}>
                      {coursePastSessions.length === 0 ? (
                        <p style={S.empty}>
                          No finalized classes for this course yet.
                        </p>
                      ) : (
                        coursePastSessions.map((session) =>
                          renderPastSessionRow(session, false),
                        )
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ── Tab: Sessions ── */}
              {activeTab === "sessions" && (
                <div style={S.panel}>
                  <div style={S.panelHeader}>
                    <p style={S.panelTitle}>All Sessions</p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        style={S.btn("ghost")}
                        onClick={() => setShowAllSessions(!showAllSessions)}
                      >
                        {showAllSessions
                          ? "Upcoming only"
                          : "Show full semester"}
                      </button>
                      <button
                        style={S.btn("secondary")}
                        onClick={() => setShowAddSession(!showAddSession)}
                      >
                        {showAddSession ? "Cancel" : "+ Add session"}
                      </button>
                    </div>
                  </div>

                  {showAddSession && (
                    <div
                      style={{
                        padding: "1.25rem",
                        borderBottom: "1px solid #f0eeea",
                        background: "#faf9f7",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                          alignItems: "flex-end",
                        }}
                      >
                        <div style={S.formRow}>
                          <label style={S.label}>Date</label>
                          <input
                            style={{ ...S.input, width: "150px" }}
                            type="date"
                            value={newSession.date}
                            onChange={(e) =>
                              setNewSession({
                                ...newSession,
                                date: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div style={S.formRow}>
                          <label style={S.label}>Start time</label>
                          <input
                            style={{ ...S.input, width: "120px" }}
                            type="time"
                            value={newSession.start_time}
                            onChange={(e) =>
                              setNewSession({
                                ...newSession,
                                start_time: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div style={S.formRow}>
                          <label style={S.label}>End time</label>
                          <input
                            style={{ ...S.input, width: "120px" }}
                            type="time"
                            value={newSession.end_time}
                            onChange={(e) =>
                              setNewSession({
                                ...newSession,
                                end_time: e.target.value,
                              })
                            }
                          />
                        </div>
                        <button
                          style={{ ...S.btn("primary"), marginBottom: "12px" }}
                          onClick={createSession}
                        >
                          Add
                        </button>
                      </div>
                      {sessionMsg && (
                        <p
                          style={{
                            fontSize: "13px",
                            color: sessionMsg.includes("Failed")
                              ? "#a32d2d"
                              : "#3b6d11",
                            margin: 0,
                          }}
                        >
                          {sessionMsg}
                        </p>
                      )}
                    </div>
                  )}

                  <div style={S.panelBody}>
                    {upcomingSessions.length === 0 ? (
                      <p style={S.empty}>No sessions found.</p>
                    ) : (
                      upcomingSessions.map((s) => (
                        <div
                          key={s.id}
                          style={{ ...S.sessionCard, marginBottom: "8px" }}
                        >
                          <div style={S.sessionInfo}>
                            <p style={{ ...S.sessionCourse, fontWeight: 500 }}>
                              {s.date}
                            </p>
                            <p style={S.sessionTime}>
                              {s.start_time} – {s.end_time}
                            </p>
                            {finalizeMsg[s.id] && (
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#3b6d11",
                                  margin: "4px 0 0",
                                }}
                              >
                                {finalizeMsg[s.id]}
                              </p>
                            )}
                          </div>
                          <div style={S.sessionActions}>
                            <button
                              style={S.btn("secondary")}
                              onClick={() => startQR(s.id)}
                            >
                              📱 QR
                            </button>
                            <button
                              style={S.btn("green")}
                              onClick={() => finalizeSession(s.id)}
                            >
                              ✅ Finalize
                            </button>
                            <button
                              style={S.btn("ghost")}
                              onClick={() => exportExcel(s.id)}
                            >
                              📥 Export
                            </button>
                            <button
                              style={S.btn("danger")}
                              onClick={() => deleteSession(s.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ── Tab: Students ── */}
              {activeTab === "students" && (
                <div style={S.panel}>
                  <div style={S.panelHeader}>
                    <p style={S.panelTitle}>Enrolled Students</p>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <label style={{ fontSize: "12px", color: "#6b6963" }}>
                        Upload list:
                        <input
                          key={studentListKey}
                          type="file"
                          accept=".xlsx,.pdf,.docx,.doc,image/*"
                          style={{ marginLeft: "8px", fontSize: "12px" }}
                          onChange={(e) =>
                            uploadStudentList(e, selectedCourse.id)
                          }
                        />
                      </label>
                      {studentList.length > 0 && (
                        <button
                          style={S.btn("danger")}
                          onClick={clearAllStudents}
                        >
                          Clear all
                        </button>
                      )}
                      <button style={S.btn("primary")} onClick={openAddStudent}>
                        + Add student
                      </button>
                    </div>
                  </div>

                  {studentListMsg && (
                    <div
                      style={{
                        padding: "8px 1.25rem",
                        background: "#eaf3de",
                        borderBottom: "1px solid #c0dd97",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#3b6d11",
                          margin: 0,
                        }}
                      >
                        {studentListMsg}
                      </p>
                    </div>
                  )}

                  {studentList.length === 0 ? (
                    <div
                      style={{
                        ...S.panelBody,
                        textAlign: "center",
                        padding: "3rem",
                      }}
                    >
                      <p style={{ fontSize: "32px", margin: "0 0 8px" }}>👥</p>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          margin: "0 0 4px",
                        }}
                      >
                        No students enrolled yet
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#6b6963",
                          margin: "0 0 16px",
                        }}
                      >
                        Upload a student list or add manually
                      </p>
                      <button style={S.btn("primary")} onClick={openAddStudent}>
                        + Add first student
                      </button>
                    </div>
                  ) : (
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>#</th>
                          <th style={S.th}>Matric No.</th>
                          <th style={S.th}>Full Name</th>
                          <th style={S.th}>Section</th>
                          <th style={S.th}>Email</th>
                          <th style={S.th}>Phone</th>
                          <th style={{ ...S.th, textAlign: "right" }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentList.map((s, i) => (
                          <tr
                            key={s.matric_number}
                            style={{
                              background: i % 2 === 0 ? "#fff" : "#faf9f7",
                            }}
                          >
                            <td
                              style={{
                                ...S.td,
                                color: "#a09d97",
                                width: "36px",
                              }}
                            >
                              {i + 1}
                            </td>
                            <td
                              style={{
                                ...S.td,
                                fontWeight: 600,
                                fontFamily: "monospace",
                                fontSize: "12px",
                              }}
                            >
                              {s.matric_number}
                            </td>
                            <td style={S.td}>{s.full_name}</td>
                            <td style={S.td}>
                              <span style={s.section ? S.tag : {}}>
                                {s.section || "—"}
                              </span>
                            </td>
                            <td
                              style={{
                                ...S.td,
                                fontSize: "12px",
                                color: "#6b6963",
                              }}
                            >
                              {s.email || "—"}
                            </td>
                            <td
                              style={{
                                ...S.td,
                                fontSize: "12px",
                                color: "#6b6963",
                              }}
                            >
                              {s.phone || "—"}
                            </td>
                            <td style={{ ...S.td, textAlign: "right" }}>
                              <button
                                style={{
                                  ...S.btn("ghost"),
                                  marginRight: "4px",
                                }}
                                onClick={() => openEditStudent(s)}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                style={S.btn("danger")}
                                onClick={() => deleteStudent(s)}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Add Course Modal ── */}
      {showAddCourseForm && (
        <div style={S.overlay} onClick={() => setShowAddCourseForm(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <p style={S.modalTitle}>Add Course</p>
              <button
                style={S.btn("ghost")}
                onClick={() => setShowAddCourseForm(false)}
              >
                ✕
              </button>
            </div>
            <div style={S.modalBody}>
              <form onSubmit={handleCreateCourse}>
                <div style={S.formRow}>
                  <label style={S.label}>Course Code *</label>
                  <input
                    style={S.input}
                    placeholder="e.g. BITM3233"
                    value={newCourse.code}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, code: e.target.value })
                    }
                    required
                  />
                </div>
                <div style={S.formRow}>
                  <label style={S.label}>Course Name *</label>
                  <input
                    style={S.input}
                    placeholder="e.g. Software Engineering"
                    value={newCourse.name}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div style={S.formRow}>
                  <label style={S.label}>Section (optional)</label>
                  <input
                    style={S.input}
                    placeholder="e.g. 1/1"
                    value={newCourse.section}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, section: e.target.value })
                    }
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                    marginTop: "8px",
                  }}
                >
                  <button
                    type="button"
                    style={S.btn("secondary")}
                    onClick={() => setShowAddCourseForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={S.btn("primary")}>
                    Create Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Student Modal ── */}
      {studentModal && (
        <div style={S.overlay} onClick={() => setStudentModal(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <p style={S.modalTitle}>
                {editingStudent ? "Edit Student" : "Add Student"}
              </p>
              <button
                style={S.btn("ghost")}
                onClick={() => setStudentModal(false)}
              >
                ✕
              </button>
            </div>
            <div style={S.modalBody}>
              <form onSubmit={saveStudent}>
                <div style={S.formRow}>
                  <label style={S.label}>Matric Number *</label>
                  <input
                    style={S.input}
                    placeholder="e.g. B122320018"
                    value={studentForm.matric_number}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        matric_number: e.target.value.toUpperCase(),
                      })
                    }
                    required
                  />
                </div>
                <div style={S.formRow}>
                  <label style={S.label}>Full Name *</label>
                  <input
                    style={S.input}
                    placeholder="As per matric card"
                    value={studentForm.full_name}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        full_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div style={S.formRow}>
                  <label style={S.label}>Section</label>
                  <input
                    style={S.input}
                    placeholder="e.g. 1/1"
                    value={studentForm.section}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        section: e.target.value,
                      })
                    }
                  />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ ...S.formRow, flex: 1 }}>
                    <label style={S.label}>Phone</label>
                    <input
                      style={S.input}
                      placeholder="e.g. 0123456789"
                      value={studentForm.phone}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div style={{ ...S.formRow, flex: 1 }}>
                    <label style={S.label}>Email</label>
                    <input
                      style={S.input}
                      type="email"
                      placeholder="student@utem.edu.my"
                      value={studentForm.email}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                    marginTop: "8px",
                  }}
                >
                  <button
                    type="button"
                    style={S.btn("secondary")}
                    onClick={() => setStudentModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={S.btn("primary")}>
                    {editingStudent ? "Save Changes" : "Add Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Past class attendance modal */}
      {selectedPastSession && (
        <div style={S.overlay} onClick={closePastSessionModal}>
          <div
            style={{ ...S.modal, maxWidth: "720px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={S.modalHeader}>
              <div>
                <p style={S.modalTitle}>Past class attendance</p>
                <p style={{ fontSize: "13px", color: "#6b6963", margin: "4px 0 0" }}>
                  {selectedPastSession.course_code
                    ? `${selectedPastSession.course_code} · `
                    : ""}
                  {formatSessionDate(selectedPastSession.date)}{" "}
                  {selectedPastSession.start_time} – {selectedPastSession.end_time}
                </p>
              </div>
              <button
                type="button"
                style={S.btn("ghost")}
                onClick={closePastSessionModal}
              >
                ✕
              </button>
            </div>
            <div style={S.modalBody}>
              <p style={{ fontSize: "13px", color: "#6b6963", margin: "0 0 12px" }}>
                For absent students, upload MC or a supporting document to mark them
                as excused (counts toward attendance).
              </p>

              {pastSessionRoster.length === 0 ? (
                <p style={S.empty}>No enrolled students for this class.</p>
              ) : (
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>Matric</th>
                      <th style={S.th}>Name</th>
                      <th style={S.th}>Section</th>
                      <th style={S.th}>Status</th>
                      <th style={{ ...S.th, textAlign: "right" }}>Excuse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastSessionRoster.map((row) => {
                      const st = statusLabel(row.status);
                      const canExcuse = row.status === "absent";
                      return (
                        <tr key={row.matric_number}>
                          <td style={S.td}>{row.matric_number}</td>
                          <td style={S.td}>{row.full_name}</td>
                          <td style={S.td}>{row.section || "—"}</td>
                          <td style={S.td}>
                            <span style={{ color: st.color, fontWeight: 600 }}>
                              {st.text}
                            </span>
                            {row.excuse?.proof_url && (
                              <p style={{ margin: "4px 0 0", fontSize: "11px" }}>
                                <a
                                  href={mediaUrl(row.excuse.proof_url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: "#185fa5" }}
                                >
                                  View proof
                                </a>
                              </p>
                            )}
                          </td>
                          <td style={{ ...S.td, textAlign: "right" }}>
                            {canExcuse ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "6px",
                                  alignItems: "flex-end",
                                }}
                              >
                                <select
                                  style={{ ...S.input, fontSize: "12px", width: "180px" }}
                                  value={pastExcuseReasons[row.matric_number] || "mc"}
                                  onChange={(e) =>
                                    setPastExcuseReasons((prev) => ({
                                      ...prev,
                                      [row.matric_number]: e.target.value,
                                    }))
                                  }
                                >
                                  <option value="mc">Medical certificate (MC)</option>
                                  <option value="written_note">Written note</option>
                                  <option value="official_letter">Official letter</option>
                                  <option value="other">Other document</option>
                                </select>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,image/*"
                                  style={{ fontSize: "11px", maxWidth: "200px" }}
                                  id={`past-excuse-${row.matric_number}`}
                                />
                                <button
                                  type="button"
                                  style={{ ...S.btn("green"), fontSize: "12px" }}
                                  disabled={pastExcusingMatric === row.matric_number}
                                  onClick={() => {
                                    const el = document.getElementById(
                                      `past-excuse-${row.matric_number}`,
                                    );
                                    excusePastStudent(row.matric_number, el);
                                  }}
                                >
                                  {pastExcusingMatric === row.matric_number
                                    ? "Uploading…"
                                    : "Upload & excuse"}
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: "12px", color: "#a09d97" }}>
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {pastClassMsg && (
                <p
                  style={{
                    fontSize: "13px",
                    marginTop: "12px",
                    color: pastClassMsg.toLowerCase().includes("fail")
                      ? "#c13515"
                      : "#2d6a4f",
                  }}
                >
                  {pastClassMsg}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "16px",
                }}
              >
                <button
                  type="button"
                  style={S.btn("secondary")}
                  onClick={() => exportExcel(selectedPastSession.id)}
                >
                  📥 Export Excel
                </button>
                <button
                  type="button"
                  style={S.btn("primary")}
                  onClick={closePastSessionModal}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert detail modal */}
      {selectedAlert && (
        <div style={S.alertOverlay} onClick={closeAlertModal}>
          <div
            style={S.alertModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={S.modalHeader}>
              <p style={S.modalTitle}>
                {selectedAlert.alert_type === "bar"
                  ? "Bar letter"
                  : "Warning letter"}{" "}
                — {selectedAlert.course_code}
              </p>
              <button
                type="button"
                style={S.btn("ghost")}
                onClick={closeAlertModal}
              >
                ✕
              </button>
            </div>
            <div style={S.modalBody}>
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "16px", fontWeight: 600, margin: "0 0 4px" }}>
                  {selectedAlert.student_name}
                </p>
                <p style={{ fontSize: "13px", color: "#6b6963", margin: 0 }}>
                  {selectedAlert.matric_number}
                  {selectedAlert.student_email
                    ? ` · ${selectedAlert.student_email}`
                    : " · No email on file"}
                </p>
              </div>

              <div style={S.grid3}>
                <div style={{ ...S.stat, padding: "12px" }}>
                  <p style={S.statLabel}>Subject</p>
                  <p style={{ ...S.statValue, fontSize: "15px" }}>
                    {selectedAlert.course_code}
                  </p>
                  <p style={S.statSub}>{selectedAlert.course_name}</p>
                </div>
                <div style={{ ...S.stat, padding: "12px" }}>
                  <p style={S.statLabel}>Issue</p>
                  <p style={{ ...S.statValue, fontSize: "14px" }}>
                    {selectedAlert.reason_label}
                  </p>
                </div>
                <div style={{ ...S.stat, padding: "12px" }}>
                  <p style={S.statLabel}>Status</p>
                  <p style={{ ...S.statValue, fontSize: "14px" }}>
                    {selectedAlert.is_sent ? "Email sent" : "Pending review"}
                  </p>
                </div>
              </div>

              {selectedAlert.consecutive_count > 0 && (
                <p style={{ fontSize: "13px", margin: "16px 0 8px" }}>
                  Missed{" "}
                  <strong>{selectedAlert.consecutive_count}</strong> consecutive
                  class(es)
                </p>
              )}
              {selectedAlert.attendance_percentage != null && (
                <p style={{ fontSize: "13px", margin: "16px 0 8px" }}>
                  Overall attendance:{" "}
                  <strong>{selectedAlert.attendance_percentage}%</strong> (below
                  80% required)
                </p>
              )}

              {(selectedAlert.excuses?.length > 0) && (
                <>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#2d6a4f",
                      margin: "12px 0 8px",
                    }}
                  >
                    Excused (proof on file)
                  </p>
                  {selectedAlert.excuses.map((ex) => (
                    <div key={ex.id} style={S.excusedRow}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <span>
                          {formatSessionDate(ex.session_date)}{" "}
                          {String(ex.start_time).slice(0, 5)} –{" "}
                          {String(ex.end_time).slice(0, 5)}
                        </span>
                        <span style={{ color: "#2d6a4f", fontWeight: 600 }}>
                          Excused
                        </span>
                      </div>
                      <p style={{ margin: "4px 0 0", color: "#6b6963", fontSize: "12px" }}>
                        {ex.reason_label}
                        {ex.reason_note ? ` — ${ex.reason_note}` : ""}
                        {ex.proof_url && (
                          <>
                            {" · "}
                            <a
                              href={ex.proof_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#185fa5" }}
                            >
                              View proof
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                  ))}
                </>
              )}

              {(selectedAlert.missed_sessions?.length > 0) && (
                <>
                  <p
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#4a4845",
                      margin: "12px 0 8px",
                    }}
                  >
                    Classes not attended
                    {!selectedAlert.is_sent && (
                      <span style={{ fontWeight: 400, color: "#6b6963" }}>
                        {" "}
                        — upload MC / note / PDF to excuse and update alerts
                      </span>
                    )}
                  </p>
                  {selectedAlert.missed_sessions.map((s) => (
                    <div
                      key={s.session_id || `${s.date}-${s.start_time}`}
                      style={S.missedRowBlock}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: selectedAlert.is_sent ? 0 : "10px",
                        }}
                      >
                        <span>{formatSessionDate(s.date)}</span>
                        <span style={{ color: "#6b6963" }}>
                          {s.start_time} – {s.end_time}
                        </span>
                      </div>
                      {!selectedAlert.is_sent && s.session_id && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <select
                            style={{ ...S.input, fontSize: "13px" }}
                            value={excuseReasons[s.session_id] || "mc"}
                            onChange={(e) =>
                              setExcuseReasons((prev) => ({
                                ...prev,
                                [s.session_id]: e.target.value,
                              }))
                            }
                          >
                            <option value="mc">Medical certificate (MC)</option>
                            <option value="written_note">Written note / letter</option>
                            <option value="official_letter">Official letter</option>
                            <option value="other">Other document</option>
                          </select>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,image/*"
                            style={{ fontSize: "12px" }}
                            id={`excuse-file-${s.session_id}`}
                          />
                          <button
                            type="button"
                            style={S.btn("green")}
                            disabled={excusingSessionId === s.session_id}
                            onClick={() => {
                              const el = document.getElementById(
                                `excuse-file-${s.session_id}`,
                              );
                              excuseAlertSession(s.session_id, el);
                            }}
                          >
                            {excusingSessionId === s.session_id
                              ? "Uploading…"
                              : "Upload proof & excuse"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {!selectedAlert.is_sent && (
                <div style={{ marginTop: "16px" }}>
                  <label style={S.label}>
                    Additional message for student email (optional)
                  </label>
                  <textarea
                    style={{
                      ...S.input,
                      width: "100%",
                      minHeight: "88px",
                      resize: "vertical",
                      marginTop: "6px",
                    }}
                    placeholder="e.g. Please submit any remaining MC to the faculty office by Friday."
                    value={lecturerMessage}
                    onChange={(e) => setLecturerMessage(e.target.value)}
                  />
                </div>
              )}

              {alertActionMsg && (
                <p
                  style={{
                    fontSize: "13px",
                    marginTop: "12px",
                    color:
                      alertActionMsg.includes("sent") ||
                      alertActionMsg.includes("Excused") ||
                      alertActionMsg.includes("excused")
                        ? "#2d6a4f"
                        : "#c13515",
                  }}
                >
                  {alertActionMsg}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                  marginTop: "20px",
                }}
              >
                <button
                  type="button"
                  style={S.btn("secondary")}
                  onClick={closeAlertModal}
                >
                  Close
                </button>
                {!selectedAlert.is_sent && (
                  <button
                    type="button"
                    style={S.btn("primary")}
                    disabled={alertSendLoading || !selectedAlert.student_email}
                    onClick={sendAlertToStudent}
                  >
                    {alertSendLoading
                      ? "Sending…"
                      : "Send email to student"}
                  </button>
                )}
              </div>
              {!selectedAlert.student_email && !selectedAlert.is_sent && (
                <p style={{ fontSize: "12px", color: "#c13515", marginTop: "8px" }}>
                  Add the student&apos;s email via the student list upload or edit
                  student details.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
