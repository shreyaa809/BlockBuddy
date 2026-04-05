import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import ComplaintCard from "../components/ComplaintCard";
import LogoutButton from "../components/LogoutButton";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";

function WorkerDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [message, setMessage] = useState("");
  const [worker, setWorker] = useState(null);
  const navigate = useNavigate();

  const { language } = useLanguage();
  const t = translations[language];

  const getWorker = () => {
    const data = localStorage.getItem("hostelUser");
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (parsed.role !== "worker") return null;
    return parsed;
  };

  const fetchAssignedComplaints = async () => {
    const w = getWorker();
    if (!w) { setMessage(t.sessionExpired); return; }
    setWorker(w);
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("assigned_to", String(w.id))  // ✅ string comparison
      .order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else setComplaints(data || []);
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    const w = getWorker();
    if (!w) { setMessage(t.sessionExpired); return; }

    const updates = { status: newStatus };
    // ✅ Record timestamp when worker marks as resolved
    if (newStatus === "Awaiting Confirmation") {
      updates.worker_resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("complaints")
      .update(updates)
      .eq("id", complaintId)
      .eq("assigned_to", String(w.id));  // ✅ string comparison

    if (error) setMessage(error.message);
    else {
      setMessage(newStatus === "Awaiting Confirmation"
        ? "✅ Marked as resolved — waiting for student confirmation."
        : `Status updated to ${newStatus}`);
      fetchAssignedComplaints();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  useEffect(() => { fetchAssignedComplaints(); }, []);

  const pending = complaints.filter((c) => c.status === "Pending");
  const inProgress = complaints.filter((c) => c.status === "In Progress");
  const awaitingConfirmation = complaints.filter((c) => c.status === "Awaiting Confirmation");
  const resolved = complaints.filter((c) => c.status === "Resolved");

  const ComplaintSection = ({ title, items, showActions = true }) => (
    <div className="panel" style={{ marginBottom: "24px" }}>
      <h2 className="panel-title">
        {title}{" "}
        <span style={{ background: "#e2e8f0", borderRadius: "999px", padding: "2px 10px", fontSize: "14px", fontWeight: 600 }}>
          {items.length}
        </span>
      </h2>
      {items.length === 0 ? (
        <div className="empty-state">{t.noAssignedComplaints}</div>
      ) : (
        <div className="complaints-list">
          {items.map((item) => (
            <div key={item.id} className="complaint-card">
              {/* ✅ Assignment date/time info */}
              <div style={{ marginBottom: "10px", padding: "8px 12px", background: "#f1f5f9", borderRadius: "8px" }}>
                <p className="complaint-meta" style={{ fontSize: "13px", color: "#64748b" }}>
                  📅 <strong>Assigned on:</strong> {formatDate(item.assigned_at || item.created_at)}
                </p>
                {item.worker_resolved_at && (
                  <p className="complaint-meta" style={{ fontSize: "13px", color: "#64748b" }}>
                    🔧 <strong>Marked resolved on:</strong> {formatDate(item.worker_resolved_at)}
                  </p>
                )}
              </div>

              <ComplaintCard complaint={item} showAssignedWorker={false} />

              {showActions && (
                <div className="inline-row" style={{ marginTop: "12px" }}>
                  {item.status === "Pending" && (
                    <button className="btn"
                      onClick={() => handleStatusUpdate(item.id, "In Progress")}>
                      {t.markInProgress}
                    </button>
                  )}
                  {(item.status === "Pending" || item.status === "In Progress") && (
                    <button className="btn btn-success"
                      onClick={() => {
                        if (window.confirm("Mark as resolved? The student will be asked to confirm."))
                          handleStatusUpdate(item.id, "Awaiting Confirmation");
                      }}>
                      ✅ Mark as Resolved
                    </button>
                  )}
                </div>
              )}

              {/*  Show waiting message for awaiting confirmation items */}
              {item.status === "Awaiting Confirmation" && (
                <div style={{ marginTop: "10px", padding: "10px 14px", background: "#fef9c3", borderRadius: "8px", fontSize: "13px", color: "#854d0e" }}>
                  ⏳ Waiting for the student to confirm this resolution.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="app-shell">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>{t.workerDashboard}</h1>
            {worker && (
              <div style={{ marginTop: "6px" }}>
                <p className="dashboard-subtitle" style={{ fontWeight: 600, fontSize: "16px" }}>
                  👷 {worker.name}
                </p>
                <p className="dashboard-subtitle" style={{ fontSize: "13px", color: "#64748b" }}>
                  ID: {worker.employee_id} &nbsp;|&nbsp; 📞 {worker.phone}
                </p>
              </div>
            )}
          </div>
          <div className="top-actions">
            <button className="btn btn-secondary" onClick={() => navigate("/helpline")}>
              📞 {t.helpline || "Helpline"}
            </button>
            <LogoutButton />
          </div>
        </div>

        {message && <p className="message">{message}</p>}

        <div className="stats-grid">
          <div className="stats-card"><p>{t.assignedComplaints}</p><h3>{complaints.length}</h3></div>
          <div className="stats-card"><p>{t.inProgress}</p><h3>{inProgress.length}</h3></div>
          <div className="stats-card"><p>Awaiting Confirmation</p><h3>{awaitingConfirmation.length}</h3></div>
          <div className="stats-card"><p>{t.statusResolved}</p><h3>{resolved.length}</h3></div>
        </div>

        <ComplaintSection title={`🔧 ${t.inProgress}`} items={inProgress} showActions={true} />
        <ComplaintSection title={`⏳ ${t.pendingActions}`} items={pending} showActions={true} />
        <ComplaintSection title="🕐 Awaiting Student Confirmation" items={awaitingConfirmation} showActions={false} />
        <ComplaintSection title={`✅ ${t.statusResolved}`} items={resolved} showActions={false} />
      </div>
    </div>
  );
}

export default WorkerDashboard;