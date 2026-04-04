import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!error) {
        setSession(data.session);
      }

      setLoading(false);
    };

    checkSession();
  }, []);

  if (loading) return <p>Loading...</p>;

  return session ? children : <Navigate to="/" replace />;
}

export default ProtectedRoute;