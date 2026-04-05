import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ComplaintForm from "../components/ComplaintForm";
import ComplaintCard from "../components/ComplaintCard";
import LogoutButton from "../components/LogoutButton";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";
import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);  // ✅ added
  const [message, setMessage] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  const { language } = useLanguage();
  const t = translations[language];

  const getStudent = () => {
    const data = localStorage.getItem("hostelUser");
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (parsed.role !== "student") return null;
    return parsed;
  };

  const fetchStudentProfile = () => {
    const s = getStudent();
    if (!s) { setMessage(t.sessionExpired); return; }
    setRoomNumber(s.room_number || "");
  };

  // ✅ Plain select, no broken FK join
  const fetchComplaints = async () => {
    const s = getStudent();
    if (!s) { setMessage(t.sessionExpired); return; }
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("created_by", s.id)
      .order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else setComplaints(data || []);
  };

  // ✅ Fetch worker names to display who is assigned
  const fetchWorkers = async () => {
    const { data } = await supabase.from("workers").select("id, name");
    if (data) setWorkers(data);
  };

  const handleAddComplaint = async (complaintData) => {
    setMessage("");
    const s = getStudent();
    if (!s) { setMessage(t.sessionExpired); return; }
    if (!s.room_number) { setMessage(t.roomNotFound); return; }
    const { error } = await supabase.from("complaints").insert([{
      ...complaintData,
      room_number: s.room_number,
      status: "Pending",
      created_by: s.id,
    }]);
    if (error) setMessage(error.message);
    else { setMessage(t.complaintSubmitted); fetchComplaints(); }
  };

  const handleWithdrawComplaint = async (complaintId) => {
    if (!window.confirm(t.withdrawConfirm)) return;
    const s = getStudent();
    if (!s) { setMessage(t.sessionExpired); return; }
    const { error } = await supabase
      .from("complaints").delete()
      .eq("id", complaintId).eq("created_by", s.id);
    if (error) { console.error("Withdraw error:", error); setMessage(error.message); }
    else { setMessage(t.complaintWithdrawn); fetchComplaints(); }
  };

  // ✅ Student confirms or rejects worker's resolution
  const handleConfirmResolution = async (complaintId, confirmed) => {
    const s = getStudent();
    if (!s) { setMessage(t.sessionExpired); return; }
    const newStatus = confirmed ? "Resolved" : "In Progress";
    const { error } = await supabase
      .from("complaints")
      .update({ status: newStatus })
      .eq("id", complaintId)
      .eq("created_by", s.id);
    if (error) setMessage(error.message);
    else {
      setMessage(confirmed
        ? "✅ Complaint marked as resolved. Thank you for confirming!"
        : "🔄 Complaint sent back to In Progress. The worker will be notified.");
      fetchComplaints();
    }
  };

  useEffect(() => {
    fetchStudentProfile();
    fetchComplaints();
    fetchWorkers();  // ✅ added
  }, []);

  useEffect(() => { fetchStudentProfile(); }, [language]);

  return (
    <div className="app-shell">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>{t.studentDashboard}</h1>
            <p className="dashboard-subtitle">{t.studentSubtitle}</p>
            {roomNumber && (
              <p className="dashboard-subtitle">{t.registeredRoom}: {roomNumber}</p>
            )}
          </div>
          <div className="top-actions">
            <button className="btn btn-secondary" onClick={() => navigate("/helpline")}>
              📞 {t.helpline || "Helpline Numbers"}
            </button>
            <LogoutButton />
          </div>
        </div>

        {message && <p className="message">{message}</p>}

        <div className="panel">
          <h2 className="panel-title">{t.raiseComplaint}</h2>
          <ComplaintForm onSubmitComplaint={handleAddComplaint} />
        </div>

        <div className="panel">
          <h2 className="panel-title">{t.myComplaints}</h2>
          {complaints.length === 0 ? (
            <div className="empty-state">{t.noComplaints}</div>
          ) : (
            <div className="complaints-list">
              {complaints.map((item) => {
                // ✅ Look up worker name from workers list
                const assignedWorker = workers.find(
                  (w) => String(w.id) === String(item.assigned_to)
                );
                return (
                  <div key={item.id} className="complaint-card">
                    <ComplaintCard complaint={item} />

                    {/* ✅ Show assigned worker name */}
                    {assignedWorker && (
                      <p className="complaint-meta" style={{ marginTop: "8px" }}>
                        👷 <strong>Assigned to:</strong> {assignedWorker.name}
                      </p>
                    )}

                    {/* ✅ Confirmation prompt when worker marks resolved */}
                    {item.status === "Awaiting Confirmation" && (
                      <div style={{
                        marginTop: "12px", padding: "14px 16px",
                        background: "#fef9c3", border: "1.5px solid #fde047",
                        borderRadius: "10px",
                      }}>
                        <p style={{ fontWeight: 600, marginBottom: "4px", color: "#854d0e" }}>
                          🔔 The worker has marked this complaint as resolved.
                        </p>
                        <p style={{ fontSize: "13px", color: "#92400e", marginBottom: "12px" }}>
                          Was your issue actually fixed? Please confirm below.
                        </p>
                        <div className="inline-row">
                          <button className="btn btn-success"
                            onClick={() => handleConfirmResolution(item.id, true)}>
                            ✅ Yes, it's resolved
                          </button>
                          <button className="btn btn-danger"
                            onClick={() => handleConfirmResolution(item.id, false)}>
                            ❌ No, still not fixed
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Withdraw only for Pending */}
                    {item.status === "Pending" && (
                      <div className="inline-row" style={{ marginTop: "12px" }}>
                        <button className="btn btn-danger"
                          onClick={() => handleWithdrawComplaint(item.id)}>
                          {t.withdrawComplaint}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;