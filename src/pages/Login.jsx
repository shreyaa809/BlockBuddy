import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";

function Login() {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];

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
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", employeeId: "", password: "", roomNumber: "" });
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

          const { error: profileError } = await supabase.from("profiles").insert([
            {
              name: formData.name,
              email: formData.email,
              room_number: formData.roomNumber,
              role: "student",
            },
          ]);
          if (profileError) console.error("Profile insert error:", profileError.message);

          alert("Student signup successful. Please login.");
          setIsSignup(false);
          resetForm();
          setLoading(false);
          return;
        }

        if (loginAs === "admin") {
          const { error } = await supabase.from("admins").insert([
            { name: formData.name, email: formData.email, password: formData.password },
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

          if (error || !student) { alert("Student not found"); setLoading(false); return; }
          if (student.password !== formData.password) { alert("Invalid student password"); setLoading(false); return; }

          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", formData.email)
            .eq("role", "student")
            .maybeSingle();

          localStorage.setItem("hostelUser", JSON.stringify({
            role: "student",
            id: profile?.id || student.id,
            name: student.name,
            email: student.email,
            room_number: student.room_number,
          }));

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

          if (error || !admin) { alert("Admin not found"); setLoading(false); return; }
          if (admin.password !== formData.password) { alert("Invalid admin password"); setLoading(false); return; }

          localStorage.setItem("hostelUser", JSON.stringify({
            role: "admin", id: admin.id, name: admin.name, email: admin.email,
          }));

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

          if (error || !worker) { alert("Worker not found"); setLoading(false); return; }

          const validPassword =
            worker.password === formData.password ||
            worker.temp_password === formData.password;

          if (!validPassword) { alert("Invalid worker credentials"); setLoading(false); return; }

          localStorage.setItem("hostelUser", JSON.stringify({
            role: "worker", id: worker.id, name: worker.name,
            phone: worker.phone, employee_id: worker.employee_id,
          }));

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>{t.appName}</h1>
          <button className="btn btn-secondary btn-sm" onClick={toggleLanguage}>
            {t.switchLanguage}
          </button>
        </div>

        <p>{isSignup ? t.createAccount : t.loginToContinue}</p>

        <div className="role-selector">
          <label>{t.loginAs}</label>
          <div className="role-buttons">
            <button
              type="button"
              className={loginAs === "student" ? "active" : ""}
              onClick={() => handleRoleChange("student")}
            >
              {t.student}
            </button>
            <button
              type="button"
              className={loginAs === "worker" ? "active" : ""}
              onClick={() => handleRoleChange("worker")}
            >
              {t.worker}
            </button>
            <button
              type="button"
              className={loginAs === "admin" ? "active" : ""}
              onClick={() => handleRoleChange("admin")}
            >
              {t.admin}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignup && loginAs !== "worker" && (
            <>
              <label>{t.name} *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t.namePlaceholder}
                required
              />

              {loginAs === "student" && (
                <>
                  <label>{t.roomNumber} *</label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder={t.roomNumberPlaceholder}
                    required
                  />
                </>
              )}
            </>
          )}

          {(loginAs === "student" || loginAs === "admin") && (
            <>
              <label>{t.email} *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t.emailPlaceholder}
                required
              />
            </>
          )}

          {loginAs === "worker" && (
            <>
              <label>{t.phoneNumber} *</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t.phoneNumberPlaceholder}
                required
              />

              <label>{t.employeeId} *</label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder={t.employeeIdPlaceholder}
                required
              />
            </>
          )}

          <label>{t.password} *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t.passwordPlaceholder}
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? isSignup ? t.signingUp : t.loggingIn
              : isSignup ? t.signUp : t.login}
          </button>
        </form>

        {loginAs !== "worker" && (
          <button
            type="button"
            className="toggle-auth-btn"
            onClick={() => { setIsSignup(!isSignup); resetForm(); }}
          >
            {isSignup ? t.alreadyHaveAccount : t.dontHaveAccount}
          </button>
        )}
      </div>
    </div>
  );
}

export default Login;
