import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ComplaintForm from "../components/ComplaintForm";
import ComplaintCard from "../components/ComplaintCard";
import LogoutButton from "../components/LogoutButton";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";

function StudentDashboard() {
  const [complaints, setComplaints] = useState([]);
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

  const fetchComplaints = async () => {
    const s = getStudent();
    if (!s) { setMessage(t.sessionExpired); return; }

    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        assigned_worker:workers!complaints_assigned_to_fkey(id, name, employee_id)
      `)
      .eq("created_by", s.id)
      .order("created_at", { ascending: false });

    if (error) {
      // Fallback without join if FK name differs
      const { data: fallback, error: fallbackError } = await supabase
        .from("complaints")
        .select("*")
        .eq("created_by", s.id)
        .order("created_at", { ascending: false });

      if (!fallbackError) setComplaints(fallback || []);
      else setMessage(error.message);
    } else {
      setComplaints(data || []);
    }
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
    created_by: s.id,   // make sure this is always the same id used below
  }]);

  if (error) setMessage(error.message);
  else { setMessage(t.complaintSubmitted); fetchComplaints(); }
};

const handleWithdrawComplaint = async (complaintId) => {
  const confirmWithdraw = window.confirm(t.withdrawConfirm);
  if (!confirmWithdraw) return;

  const s = getStudent();
  if (!s) { setMessage(t.sessionExpired); return; }

  const { error, count } = await supabase
    .from("complaints")
    .delete()
    .eq("id", complaintId)
    .eq("created_by", s.id);
    // ✅ Removed .eq("status", "Pending") — the button is already conditionally shown,
    //    and this extra filter was silently killing the delete when status drifted.

  if (error) {
    console.error("Withdraw error:", error);
    setMessage(error.message);
  } else {
    setMessage(t.complaintWithdrawn);
    fetchComplaints();
  }
};

  useEffect(() => {
    fetchStudentProfile();
    fetchComplaints();
  }, []);

  useEffect(() => {
    fetchStudentProfile();
  }, [language]);

  return (
    <div className="app-shell">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>{t.studentDashboard}</h1>
            <p className="dashboard-subtitle">{t.studentSubtitle}</p>
            {roomNumber && (
              <p className="dashboard-subtitle">
                {t.registeredRoom}: {roomNumber}
              </p>
            )}
          </div>
          <div className="top-actions">
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
              {complaints.map((item) => (
                <div key={item.id} className="complaint-card">
                  <ComplaintCard complaint={item} />

                  {item.status === "Pending" && (
                    <div className="inline-row" style={{ marginTop: "12px" }}>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleWithdrawComplaint(item.id)}
                      >
                        {t.withdrawComplaint}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
