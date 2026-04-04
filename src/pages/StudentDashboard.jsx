import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ComplaintForm from "../components/ComplaintForm";
import ComplaintCard from "../components/ComplaintCard";
import LogoutButton from "../components/LogoutButton";

function StudentDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [message, setMessage] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [student, setStudent] = useState(null);

  const getStudent = () => {
    const data = localStorage.getItem("hostelUser");
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (parsed.role !== "student") return null;
    return parsed;
  };

  const fetchStudentProfile = () => {
    const s = getStudent();
    if (!s) {
      setMessage("Session expired. Please login again.");
      return;
    }
    setStudent(s);
    setRoomNumber(s.room_number || "");
  };

  const fetchComplaints = async () => {
    const s = getStudent();
    if (!s) {
      setMessage("Session expired. Please login again.");
      return;
    }

    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        assigned_worker:profiles!complaints_assigned_to_fkey(name)
      `)
      .eq("created_by", s.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setComplaints(data || []);
    }
  };

  const handleAddComplaint = async (complaintData) => {
    setMessage("");

    const s = getStudent();
    if (!s) {
      setMessage("Session expired. Please login again.");
      return;
    }

    if (!s.room_number) {
      setMessage("Room number not found. Please sign up again.");
      return;
    }

    const { error } = await supabase.from("complaints").insert([
      {
        ...complaintData,
        room_number: s.room_number,
        status: "Pending",
        created_by: s.id,
      },
    ]);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Complaint submitted successfully!");
      fetchComplaints();
    }
  };

  const handleWithdrawComplaint = async (complaintId) => {
    const confirmWithdraw = window.confirm(
      "Are you sure you want to withdraw this complaint?"
    );
    if (!confirmWithdraw) return;

    const s = getStudent();
    if (!s) {
      setMessage("Session expired. Please login again.");
      return;
    }

    const { error } = await supabase
      .from("complaints")
      .delete()
      .eq("id", complaintId)
      .eq("created_by", s.id)
      .eq("status", "Pending");

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Complaint withdrawn successfully");
      fetchComplaints();
    }
  };

  useEffect(() => {
    fetchStudentProfile();
    fetchComplaints();
  }, []);

  return (
    <div className="app-shell">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Student Dashboard</h1>
            <p className="dashboard-subtitle">
              Raise and track hostel room complaints easily.
            </p>
            {roomNumber && (
              <p className="dashboard-subtitle">
                Registered Room: {roomNumber}
              </p>
            )}
          </div>

          <div className="top-actions">
            <LogoutButton />
          </div>
        </div>

        {message && <p className="message">{message}</p>}

        <div className="panel">
          <h2 className="panel-title">Raise Complaint</h2>
          <ComplaintForm onSubmitComplaint={handleAddComplaint} />
        </div>

        <div className="panel">
          <h2 className="panel-title">My Complaints</h2>

          {complaints.length === 0 ? (
            <div className="empty-state">
              No complaints found. Submit your first complaint above.
            </div>
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
                        Withdraw Complaint
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
