import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Login() {
  const navigate = useNavigate();

  const [loginAs, setLoginAs] = useState("student");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    employeeId: "",
    password: "",
    roomNumber: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      employeeId: "",
      password: "",
      roomNumber: "",
    });
  };

  const handleRoleChange = (role) => {
    setLoginAs(role);
    setIsSignup(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        if (loginAs === "student") {
          const { error } = await supabase.from("students").insert([
            {
              name: formData.name,
              email: formData.email,
              password: formData.password,
              room_number: formData.roomNumber,
            },
          ]);

          if (error) throw error;

          // Also insert into profiles so complaints can reference room_number
          const { error: profileError } = await supabase
            .from("profiles")
            .insert([
              {
                name: formData.name,
                email: formData.email,
                room_number: formData.roomNumber,
                role: "student",
              },
            ]);

          if (profileError) {
            console.error("Profile insert error:", profileError.message);
          }

          alert("Student signup successful. Please login.");
          setIsSignup(false);
          resetForm();
          setLoading(false);
          return;
        }

        if (loginAs === "admin") {
          const { error } = await supabase.from("admins").insert([
            {
              name: formData.name,
              email: formData.email,
              password: formData.password,
            },
          ]);

          if (error) throw error;

          alert("Admin signup successful. Please login.");
          setIsSignup(false);
          resetForm();
          setLoading(false);
          return;
        }
      } else {
        if (loginAs === "student") {
          const { data: student, error } = await supabase
            .from("students")
            .select("*")
            .eq("email", formData.email)
            .maybeSingle();

          if (error || !student) {
            alert("Student not found");
            setLoading(false);
            return;
          }

          if (student.password !== formData.password) {
            alert("Invalid student password");
            setLoading(false);
            return;
          }

          // Fetch matching profile row to get the profile id (used as created_by in complaints)
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", formData.email)
            .eq("role", "student")
            .maybeSingle();

          localStorage.setItem(
            "hostelUser",
            JSON.stringify({
              role: "student",
              id: profile?.id || student.id,
              name: student.name,
              email: student.email,
              room_number: student.room_number,
            })
          );

          navigate("/student");
          setLoading(false);
          return;
        }

        if (loginAs === "admin") {
          const { data: admin, error } = await supabase
            .from("admins")
            .select("*")
            .eq("email", formData.email)
            .maybeSingle();

          if (error || !admin) {
            alert("Admin not found");
            setLoading(false);
            return;
          }

          if (admin.password !== formData.password) {
            alert("Invalid admin password");
            setLoading(false);
            return;
          }

          localStorage.setItem(
            "hostelUser",
            JSON.stringify({
              role: "admin",
              id: admin.id,
              name: admin.name,
              email: admin.email,
            })
          );

          navigate("/admin");
          setLoading(false);
          return;
        }

        if (loginAs === "worker") {
          const { data: worker, error } = await supabase
            .from("workers")
            .select("*")
            .eq("employee_id", formData.employeeId)
            .eq("phone", formData.phone)
            .maybeSingle();

          if (error || !worker) {
            alert("Worker not found");
            setLoading(false);
            return;
          }

          const validPassword =
            worker.password === formData.password ||
            worker.temp_password === formData.password;

          if (!validPassword) {
            alert("Invalid worker credentials");
            setLoading(false);
            return;
          }

          localStorage.setItem(
            "hostelUser",
            JSON.stringify({
              role: "worker",
              id: worker.id,
              name: worker.name,
              phone: worker.phone,
              employee_id: worker.employee_id,
            })
          );

          if (worker.is_first_login || worker.must_change_password) {
            navigate(`/worker-signup/${worker.id}`);
            setLoading(false);
            return;
          }

          navigate("/worker");
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>HostelFix</h1>
        <p>{isSignup ? "Create your account" : "Login to continue"}</p>

        <div className="role-selector">
          <label>Login As</label>
          <div className="role-buttons">
            <button
              type="button"
              className={loginAs === "student" ? "active" : ""}
              onClick={() => handleRoleChange("student")}
            >
              Student
            </button>
            <button
              type="button"
              className={loginAs === "worker" ? "active" : ""}
              onClick={() => handleRoleChange("worker")}
            >
              Worker
            </button>
            <button
              type="button"
              className={loginAs === "admin" ? "active" : ""}
              onClick={() => handleRoleChange("admin")}
            >
              Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignup && loginAs !== "worker" && (
            <>
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />

              {loginAs === "student" && (
                <>
                  <label>Room Number *</label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder="e.g. E-017"
                    required
                  />
                </>
              )}
            </>
          )}

          {(loginAs === "student" || loginAs === "admin") && (
            <>
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                required
              />
            </>
          )}

          {loginAs === "worker" && (
            <>
              <label>Phone Number *</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
              />

              <label>Employee ID *</label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="Enter employee ID"
                required
              />
            </>
          )}

          <label>Password *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? isSignup
                ? "Signing up..."
                : "Logging in..."
              : isSignup
              ? "Sign Up"
              : "Login"}
          </button>
        </form>

        {loginAs !== "worker" && (
          <button
            type="button"
            className="toggle-auth-btn"
            onClick={() => {
              setIsSignup(!isSignup);
              resetForm();
            }}
          >
            {isSignup
              ? "Already have an account? Login"
              : "Don't have an account? Sign Up"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Login;
