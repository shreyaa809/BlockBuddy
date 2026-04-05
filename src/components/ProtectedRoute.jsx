
import { Navigate } from "react-router-dom";

// Pass requiredRole="student"|"worker"|"admin" to each route
function ProtectedRoute({ children, requiredRole }) {
  const data = localStorage.getItem("hostelUser");

  if (!data) return <Navigate to="/" replace />;

  const user = JSON.parse(data);

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to their correct dashboard
    if (user.role === "student") return <Navigate to="/student" replace />;
    if (user.role === "worker") return <Navigate to="/worker" replace />;
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
