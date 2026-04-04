import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ComplaintCard from "../components/ComplaintCard";
import LogoutButton from "../components/LogoutButton";

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [message, setMessage] = useState("");

  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showWorkerDetails, setShowWorkerDetails] = useState(null);
  const [showAllWorkers, setShowAllWorkers] = useState(false);

  const [newWorker, setNewWorker] = useState({
    name: "",
    phone: "",
    employee_id: "",
  });

  const generateTempPassword = () => {
    return Math.random().toString(36).slice(-8).toUpperCase();
  };

  const fetchData = async () => {
    const { data: complaintsData, error: complaintsError } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: workersData, error: workersError } = await supabase
      .from("workers")
      .select("id, name, phone, employee_id, created_at")
      .order("created_at", { ascending: false });

    if (complaintsError) {
      setMessage(complaintsError.message);
    } else {
      setComplaints(complaintsData || []);
    }

    if (workersError) {
      setMessage(workersError.message);
    } else {
      setWorkers(workersData || []);
    }
  };

  const createWorker = async (e) => {
    e.preventDefault();

    if (!newWorker.name || !newWorker.phone || !newWorker.employee_id) {
      setMessage("Name, phone, and employee ID are required");
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from("workers")
      .select("id")
      .eq("employee_id", newWorker.employee_id)
      .maybeSingle();

    if (existingError) {
      setMessage(existingError.message);
      return;
    }

    if (existing) {
      setMessage("Employee ID already exists");
      return;
    }

    const tempPassword = generateTempPassword();

    const { data, error } = await supabase
      .from("workers")
      .insert([
        {
          name: newWorker.name,
          phone: newWorker.phone,
          employee_id: newWorker.employee_id,
          temp_password: tempPassword,
          password: null,
          is_first_login: true,
          must_change_password: true,
        },
      ])
      .select();

    console.log("Inserted worker:", data);
    console.log("Insert error:", error);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Worker created successfully! Temp password: ${tempPassword}`);
    setShowAddWorker(false);
    setNewWorker({
      name: "",
      phone: "",
      employee_id: "",
    });

    fetchData();
  };

  const openWorkerDetails = async (workerId) => {
    const { data: workerData, error: workerError } = await supabase
      .from("workers")
      .select("*")
      .eq("id", workerId)
      .single();

    if (workerError) {
      setMessage(workerError.message);
      return;
    }

    const { data: assignedComplaints, error: complaintsError } = await supabase
      .from("complaints")
      .select("status")
      .eq("assigned_to", workerId);

    if (complaintsError) {
      setMessage(complaintsError.message);
      return;
    }

    const totalAssigned = assignedComplaints?.length || 0;
    const solved =
      assignedComplaints?.filter((c) => c.status === "Resolved").length || 0;

    setShowWorkerDetails({
      ...workerData,
      totalAssigned,
      solved,
      pending: totalAssigned - solved,
    });
  };

  const assignWorker = async (complaintId, workerId) => {
    if (!workerId) return;

    const { error } = await supabase
      .from("complaints")
      .update({ assigned_to: workerId })
      .eq("id", complaintId);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Worker assigned successfully");
      fetchData();
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="app-shell">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="dashboard-subtitle">
              Manage all hostel complaints and assign workers
            </p>
          </div>

          <div className="top-actions">
            <LogoutButton />
          </div>
        </div>

        {message && <p className="message">{message}</p>}

        {showAddWorker && (
          <div
            className="modal-overlay"
            onClick={() => setShowAddWorker(false)}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Add New Worker</h3>
              <form onSubmit={createWorker}>
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    className="input"
                    value={newWorker.name}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    className="input"
                    type="tel"
                    value={newWorker.phone}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">Employee ID *</label>
                  <input
                    className="input"
                    value={newWorker.employee_id}
                    onChange={(e) =>
                      setNewWorker({
                        ...newWorker,
                        employee_id: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="inline-row">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddWorker(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Worker
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showWorkerDetails && (
          <div
            className="modal-overlay"
            onClick={() => setShowWorkerDetails(null)}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="inline-row">
                <h3>{showWorkerDetails.name}</h3>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowWorkerDetails(null)}
                >
                  Close
                </button>
              </div>

              <div className="worker-stats-grid">
                <div className="stats-card">
                  <p>Added On</p>
                  <h4>
                    {new Date(showWorkerDetails.created_at).toLocaleDateString()}
                  </h4>
                </div>
                <div className="stats-card">
                  <p>Total Assigned</p>
                  <h4>{showWorkerDetails.totalAssigned}</h4>
                </div>
                <div className="stats-card">
                  <p>Solved</p>
                  <h4>{showWorkerDetails.solved}</h4>
                </div>
                <div className="stats-card">
                  <p>Pending</p>
                  <h4>{showWorkerDetails.pending}</h4>
                </div>
              </div>

              <div className="worker-details">
                <p>
                  <strong>Phone:</strong> {showWorkerDetails.phone}
                </p>
                <p>
                  <strong>Employee ID:</strong> {showWorkerDetails.employee_id}
                </p>
                <p>
                  <strong>First Login Pending:</strong>{" "}
                  {showWorkerDetails.is_first_login ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="stats-grid">
          <div className="stats-card">
            <p>Total Complaints</p>
            <h3>{complaints.length}</h3>
          </div>

          <div className="stats-card">
            <p>Pending Assignment</p>
            <h3>{complaints.filter((c) => !c.assigned_to).length}</h3>
          </div>

          <div className="stats-card">
            <p>Available Workers</p>
            <h3>{workers.length}</h3>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Workers ({workers.length})</h2>

          <div
            className="inline-row"
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div className="stats-card stats-card-inline">
              <p>Total Workers</p>
              <h3>{workers.length}</h3>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowAddWorker(true)}
            >
              + Add New Worker
            </button>
          </div>

          {workers.slice(0, 3).map((worker) => (
            <div
              key={worker.id}
              className="worker-preview"
              onClick={() => openWorkerDetails(worker.id)}
            >
              <div>
                <h4>{worker.name}</h4>
                <p className="text-muted">
                  {worker.employee_id} • {worker.phone}
                </p>
              </div>
              <button className="btn btn-secondary btn-sm">View</button>
            </div>
          ))}

          {workers.length > 3 && (
            <button
              className="btn btn-link"
              onClick={() => setShowAllWorkers(!showAllWorkers)}
            >
              {showAllWorkers
                ? "Show Less"
                : `See All (${workers.length - 3} more)`}
            </button>
          )}

          {showAllWorkers && (
            <div className="workers-full-list">
              {workers.slice(3).map((worker) => (
                <div
                  key={worker.id}
                  className="worker-preview"
                  onClick={() => openWorkerDetails(worker.id)}
                >
                  <div>
                    <h4>{worker.name}</h4>
                    <p className="text-muted">
                      {worker.employee_id} • {worker.phone}
                    </p>
                  </div>
                  <button className="btn btn-secondary btn-sm">View</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <h2 className="panel-title">All Complaints ({complaints.length})</h2>

          {complaints.length === 0 ? (
            <div className="empty-state">
              No complaints yet. Wait for students to submit issues.
            </div>
          ) : (
            <div className="complaints-list">
              {complaints.map((item) => (
                <div key={item.id} className="complaint-card">
                  <ComplaintCard complaint={item} />

                  <div className="inline-row">
                    {item.assigned_to ? (
                      <span className="badge badge-success">
                        Assigned to worker
                      </span>
                    ) : (
                      <>
                        <label className="label">Assign worker:</label>
                        <select
                          className="select"
                          defaultValue=""
                          onChange={(e) =>
                            assignWorker(item.id, e.target.value)
                          }
                        >
                          <option value="">Select worker...</option>
                          {workers.map((worker) => (
                            <option key={worker.id} value={worker.id}>
                              {worker.name}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
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

export default AdminDashboard;