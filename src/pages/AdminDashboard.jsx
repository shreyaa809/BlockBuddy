import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ComplaintCard from "../components/ComplaintCard";
import LogoutButton from "../components/LogoutButton";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [message, setMessage] = useState("");

  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showWorkerDetails, setShowWorkerDetails] = useState(null);
  const [showAllWorkers, setShowAllWorkers] = useState(false);

  // Track selected worker per complaint before saving
  const [selectedWorkers, setSelectedWorkers] = useState({});

  const [newWorker, setNewWorker] = useState({ name: "", phone: "", employee_id: "" });

  const { language } = useLanguage();
  const t = translations[language];

  const generateTempPassword = () => Math.random().toString(36).slice(-8).toUpperCase();

  const fetchData = async () => {
    // Fetch complaints with assigned worker name from workers table directly
    const { data: complaintsData, error: complaintsError } = await supabase
      .from("complaints")
      .select(`
        *,
        assigned_worker:workers!complaints_assigned_to_fkey(id, name, employee_id)
      `)
      .order("created_at", { ascending: false });

    const { data: workersData, error: workersError } = await supabase
      .from("workers")
      .select("id, name, phone, employee_id, created_at")
      .order("created_at", { ascending: false });

    if (complaintsError) {
      // Fallback: fetch without join if foreign key name differs
      const { data: fallback, error: fallbackError } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (!fallbackError) setComplaints(fallback || []);
      else setMessage(complaintsError.message);
    } else {
      setComplaints(complaintsData || []);
    }

    if (workersError) setMessage(workersError.message);
    else setWorkers(workersData || []);
  };

  const handleSelectWorker = (complaintId, workerId) => {
    setSelectedWorkers((prev) => ({ ...prev, [complaintId]: workerId }));
  };

  const assignWorker = async (complaintId) => {
  const workerId = selectedWorkers[complaintId];
  if (!workerId) { setMessage("Please select a worker first."); return; }

  // ✅ Send as string — matches text column, works for both int and UUID
  const { error } = await supabase
    .from("complaints")
    .update({
      assigned_to: String(workerId),
      status: "In Progress",
      assigned_at: new Date().toISOString(),
    })
    .eq("id", complaintId);

  if (error) {
    console.error("Assign error:", error);
    setMessage(error.message);
  } else {
    const workerName = workers.find((w) => String(w.id) === String(workerId))?.name || "worker";
    setMessage(`✅ Task assigned to ${workerName} successfully!`);
    setSelectedWorkers((prev) => {
      const updated = { ...prev };
      delete updated[complaintId];
      return updated;
    });
    fetchData();
  }
};

  const unassignWorker = async (complaintId) => {
    const confirm = window.confirm("Remove this worker assignment?");
    if (!confirm) return;

    const { error } = await supabase
      .from("complaints")
      .update({ assigned_to: null, status: "Pending" })
      .eq("id", complaintId);

    if (error) setMessage(error.message);
    else { setMessage("Worker unassigned."); fetchData(); }
  };

  const createWorker = async (e) => {
    e.preventDefault();

    if (!newWorker.name || !newWorker.phone || !newWorker.employee_id) {
      setMessage(t.fieldsRequired);
      return;
    }

    const { data: existing } = await supabase
      .from("workers")
      .select("id")
      .eq("employee_id", newWorker.employee_id)
      .maybeSingle();

    if (existing) { setMessage(t.employeeIdExists); return; }

    const tempPassword = generateTempPassword();

    const { error } = await supabase.from("workers").insert([{
      name: newWorker.name,
      phone: newWorker.phone,
      employee_id: newWorker.employee_id,
      temp_password: tempPassword,
      password: null,
      is_first_login: true,
      must_change_password: true,
    }]);

    if (error) { setMessage(error.message); return; }

    setMessage(`${t.workerCreated} ${tempPassword}`);
    setShowAddWorker(false);
    setNewWorker({ name: "", phone: "", employee_id: "" });
    fetchData();
  };

  const openWorkerDetails = async (workerId) => {
    const { data: workerData, error: workerError } = await supabase
      .from("workers").select("*").eq("id", workerId).single();

    if (workerError) { setMessage(workerError.message); return; }

    const { data: assignedComplaints } = await supabase
      .from("complaints").select("status").eq("assigned_to", workerId);

    const totalAssigned = assignedComplaints?.length || 0;
    const solved = assignedComplaints?.filter((c) => c.status === "Resolved").length || 0;

    setShowWorkerDetails({ ...workerData, totalAssigned, solved, pending: totalAssigned - solved });
  };

  useEffect(() => { fetchData(); }, []);

  // In AdminDashboard.jsx
const getAssignedWorkerName = (complaint) => {
  if (complaint.assigned_worker?.name) return complaint.assigned_worker.name;
  if (complaint.assigned_to) {
    const w = workers.find((w) => String(w.id) === String(complaint.assigned_to));
    return w ? w.name : "Unknown worker";
  }
  return null;
};

  return (
    <div className="app-shell">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>{t.adminDashboard}</h1>
            <p className="dashboard-subtitle">{t.adminSubtitle}</p>
          </div>
          <div className="top-actions">
            <LogoutButton />
          </div>
        </div>

        {message && <p className="message">{message}</p>}

        {/* Add Worker Modal */}
        {showAddWorker && (
          <div className="modal-overlay" onClick={() => setShowAddWorker(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>{t.addWorkerTitle}</h3>
              <form onSubmit={createWorker}>
                <div>
                  <label className="label">{t.fullName} *</label>
                  <input className="input" value={newWorker.name}
                    onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })} required />
                </div>
                <div>
                  <label className="label">{t.phoneNumber} *</label>
                  <input className="input" type="tel" value={newWorker.phone}
                    onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })} required />
                </div>
                <div>
                  <label className="label">{t.employeeId} *</label>
                  <input className="input" value={newWorker.employee_id}
                    onChange={(e) => setNewWorker({ ...newWorker, employee_id: e.target.value })} required />
                </div>
                <div className="inline-row">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddWorker(false)}>
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn btn-primary">{t.createWorker}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Worker Details Modal */}
        {showWorkerDetails && (
          <div className="modal-overlay" onClick={() => setShowWorkerDetails(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="inline-row">
                <h3>{showWorkerDetails.name}</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowWorkerDetails(null)}>
                  {t.close}
                </button>
              </div>
              <div className="worker-stats-grid">
                <div className="stats-card"><p>{t.addedOn}</p>
                  <h4>{new Date(showWorkerDetails.created_at).toLocaleDateString()}</h4></div>
                <div className="stats-card"><p>{t.totalAssigned}</p><h4>{showWorkerDetails.totalAssigned}</h4></div>
                <div className="stats-card"><p>{t.solved}</p><h4>{showWorkerDetails.solved}</h4></div>
                <div className="stats-card"><p>{t.pending}</p><h4>{showWorkerDetails.pending}</h4></div>
              </div>
              <div className="worker-details">
                <p><strong>{t.phone}:</strong> {showWorkerDetails.phone}</p>
                <p><strong>{t.employeeId}:</strong> {showWorkerDetails.employee_id}</p>
                <p><strong>{t.firstLoginPending}:</strong> {showWorkerDetails.is_first_login ? t.yes : t.no}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stats-card"><p>{t.totalComplaints}</p><h3>{complaints.length}</h3></div>
          <div className="stats-card">
            <p>{t.pendingAssignment}</p>
            <h3>{complaints.filter((c) => !c.assigned_to).length}</h3>
          </div>
          <div className="stats-card"><p>{t.availableWorkers}</p><h3>{workers.length}</h3></div>
        </div>

        {/* Workers Panel */}
        <div className="panel">
          <h2 className="panel-title">{t.workers} ({workers.length})</h2>
          <div className="inline-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div className="stats-card stats-card-inline">
              <p>{t.totalWorkers}</p><h3>{workers.length}</h3>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddWorker(true)}>
              {t.addNewWorker}
            </button>
          </div>

          {workers.slice(0, 3).map((worker) => (
            <div key={worker.id} className="worker-preview" onClick={() => openWorkerDetails(worker.id)}>
              <div>
                <h4>{worker.name}</h4>
                <p className="text-muted">{worker.employee_id} • {worker.phone}</p>
              </div>
              <button className="btn btn-secondary btn-sm">{t.view}</button>
            </div>
          ))}

          {workers.length > 3 && (
            <button className="btn btn-link" onClick={() => setShowAllWorkers(!showAllWorkers)}>
              {showAllWorkers ? t.showLess : `${t.seeAll} (${workers.length - 3} more)`}
            </button>
          )}

          {showAllWorkers && (
            <div className="workers-full-list">
              {workers.slice(3).map((worker) => (
                <div key={worker.id} className="worker-preview" onClick={() => openWorkerDetails(worker.id)}>
                  <div>
                    <h4>{worker.name}</h4>
                    <p className="text-muted">{worker.employee_id} • {worker.phone}</p>
                  </div>
                  <button className="btn btn-secondary btn-sm">{t.view}</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complaints Panel */}
        <div className="panel">
          <h2 className="panel-title">{t.allComplaints} ({complaints.length})</h2>

          {complaints.length === 0 ? (
            <div className="empty-state">{t.noComplaintsYet}</div>
          ) : (
            <div className="complaints-list">
              {complaints.map((item) => {
                const assignedName = getAssignedWorkerName(item);
                return (
                  <div key={item.id} className="complaint-card">
                    <ComplaintCard complaint={item} />

                    <div style={{ marginTop: "12px" }}>
                      {assignedName ? (
                        // Already assigned — show who, allow unassign
                        <div className="inline-row" style={{ alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                          <span className="badge badge-success">
                            ✅ {t.assignedToWorker}: <strong>{assignedName}</strong>
                          </span>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => unassignWorker(item.id)}
                          >
                            Unassign
                          </button>
                        </div>
                      ) : (
                        // Not assigned — show dropdown + Save Changes button
                        <div className="inline-row" style={{ alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                          <label className="label" style={{ margin: 0 }}>{t.assignWorker}</label>
                          <select
                            className="select"
                            style={{ flex: 1, minWidth: "160px" }}
                            value={selectedWorkers[item.id] || ""}
                            onChange={(e) => handleSelectWorker(item.id, e.target.value)}
                          >
                            <option value="">{t.selectWorker}</option>
                            {workers.map((worker) => (
                              <option key={worker.id} value={worker.id}>
                                {worker.name} ({worker.employee_id})
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn btn-primary"
                            onClick={() => assignWorker(item.id)}
                            disabled={!selectedWorkers[item.id]}
                          >
                            💾 Save Changes
                          </button>
                        </div>
                      )}
                    </div>
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

export default AdminDashboard;
