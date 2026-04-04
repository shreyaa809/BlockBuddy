import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";

function ComplaintCard({ complaint, showAssignedWorker = true }) {
  const { language } = useLanguage();
  const t = translations[language];

  const getStatusClass = (status) => {
    if (status === "Pending") return "badge badge-pending";
    if (status === "In Progress") return "badge badge-progress";
    if (status === "Resolved") return "badge badge-resolved";
    return "badge";
  };

  const getStatusLabel = (status) => {
    if (status === "Pending") return t.statusPending;
    if (status === "In Progress") return t.statusInProgress;
    if (status === "Resolved") return t.statusResolved;
    return status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return t.notAvailable;
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Works whether assigned_worker comes from workers table or profiles table join
  const assignedWorkerName =
    complaint.assigned_worker?.name || null;

  return (
    <div className="complaint-card">
      <div className="complaint-top">
        <div>
          <h3 className="complaint-title">{complaint.title}</h3>
          <p className="complaint-meta">
            {t.category}: {complaint.category} • {t.room}: {complaint.room_number}
          </p>
        </div>

        <span className={getStatusClass(complaint.status)}>
          {getStatusLabel(complaint.status)}
        </span>
      </div>

      <p className="complaint-desc">{complaint.description}</p>

      <div className="complaint-extra">
        <p className="complaint-meta">
          <strong>{t.created}:</strong> {formatDate(complaint.created_at)}
        </p>

        {showAssignedWorker && (
          <p className="complaint-meta">
            <strong>{t.assignedWorker}:</strong>{" "}
            {assignedWorkerName || t.notAssigned}
          </p>
        )}
      </div>
    </div>
  );
}

export default ComplaintCard;
