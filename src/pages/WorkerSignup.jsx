import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function WorkerSignup() {
  const { workerId } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordSetup = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const { error } = await supabase
      .from("workers")
      .update({
        password: password,
        temp_password: null,
        is_first_login: false,
        must_change_password: false,
      })
      .eq("id", workerId);

    if (error) {
      console.error(error);
      alert("Failed to save password");
      return;
    }

    alert("Password set successfully. Please login again.");
    navigate("/");
  };

  return (
    <div className="worker-signup-container">
      <h2>Create Your Password</h2>
      <form onSubmit={handlePasswordSetup}>
        <label>New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
        />

        <label>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />

        <button type="submit">Save Password</button>
      </form>
    </div>
  );
}