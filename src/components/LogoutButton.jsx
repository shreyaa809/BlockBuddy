import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return <button onClick={handleLogout}>Logout</button>;
}

export default LogoutButton;