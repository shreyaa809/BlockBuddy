function ComplaintCard({ complaint, showAssignedWorker = true }) {
  const getStatusClass = (status) => {
    if (status === "Pending") return "badge badge-pending";
    if (status === "In Progress") return "badge badge-progress";
    if (status === "Resolved") return "badge badge-resolved";
    return "badge";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";

    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="complaint-card">
      <div className="complaint-top">
        <div>
          <h3 className="complaint-title">{complaint.title}</h3>
          <p className="complaint-meta">
            Category: {complaint.category} • Room: {complaint.room_number}
          </p>
        </div>

        <span className={getStatusClass(complaint.status)}>
          {complaint.status}
        </span>
      </div>

      <p className="complaint-desc">{complaint.description}</p>

      <div className="complaint-extra">
        <p className="complaint-meta">
          <strong>Created:</strong> {formatDate(complaint.created_at)}
        </p>

        {showAssignedWorker && (
          <p className="complaint-meta">
            <strong>Assigned Worker:</strong>{" "}
            {complaint.assigned_worker?.name || "Not assigned yet"}
          </p>
        )}
      </div>
    </div>
  );
}

export default ComplaintCard;