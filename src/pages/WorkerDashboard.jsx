import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ComplaintCard from "../components/ComplaintCard";
import LogoutButton from "../components/LogoutButton";

function WorkerDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [message, setMessage] = useState("");

  const fetchAssignedComplaints = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      setMessage("User not found");
      return;
    }

    const user = userData.user;

    const { data, error } = await supabase
  .from("complaints")
  .select(`
    *,
    assigned_worker:profiles!complaints_assigned_to_fkey(name)
  `)
  .eq("assigned_to", user.id)
  .in("status", ["Pending", "In Progress"])
  .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setComplaints(data || []);
    }
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      setMessage("User not found");
      return;
    }

    const { error } = await supabase
      .from("complaints")
      .update({ status: newStatus })
      .eq("id", complaintId)
      .eq("assigned_to", userData.user.id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(`Status updated to ${newStatus}`);
      fetchAssignedComplaints();
    }
  };

  useEffect(() => {
    fetchAssignedComplaints();
  }, []);

  return (
    <div className="app-shell">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Worker Dashboard</h1>
            <p className="dashboard-subtitle">
              Update status on assigned hostel complaints
            </p>
          </div>

          <div className="top-actions">
            <LogoutButton />
          </div>
        </div>

        {message && <p className="message">{message}</p>}

        <div className="stats-grid">
          <div className="stats-card">
            <p>Assigned Complaints</p>
            <h3>{complaints.length}</h3>
          </div>
          <div className="stats-card">
            <p>Pending Actions</p>
            <h3>
              {complaints.filter((c) => c.status === "Pending").length}
            </h3>
          </div>
          <div className="stats-card">
            <p>In Progress</p>
            <h3>
              {complaints.filter((c) => c.status === "In Progress").length}
            </h3>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Assigned Complaints</h2>

          {complaints.length === 0 ? (
            <div className="empty-state">
              No assigned complaints. Check back later.
            </div>
          ) : (
            <div className="complaints-list">
              {complaints.map((item) => (
                <div key={item.id} className="complaint-card">
                  <ComplaintCard complaint={item} showAssignedWorker={false} />

                  <div className="inline-row">
                    <button
                      className="btn"
                      onClick={() => handleStatusUpdate(item.id, "In Progress")}
                      disabled={item.status === "In Progress"}
                    >
                      Mark In Progress
                    </button>

                    <button
                      className="btn btn-success"
                      onClick={() => handleStatusUpdate(item.id, "Resolved")}
                      disabled={item.status === "Resolved"}
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkerDashboard;