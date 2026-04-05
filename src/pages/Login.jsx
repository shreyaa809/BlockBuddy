import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";

// ✅ NEW: Email domain rules
const ALLOWED_ADMIN_EMAILS = ["shreyashukla218@gmail.com"];
const ADMIN_DOMAIN = "@vit.ac.in";
const STUDENT_DOMAIN = "@vitstudent.ac.in";

const isValidAdminEmail = (email) => {
  const lower = email.toLowerCase().trim();
  return lower.endsWith(ADMIN_DOMAIN) || ALLOWED_ADMIN_EMAILS.includes(lower);
};

const isValidStudentEmail = (email) => {
  return email.toLowerCase().trim().endsWith(STUDENT_DOMAIN);
};

function Login() {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];

  const [loginAs, setLoginAs] = useState("student");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ NEW: OTP flow state
  const [otpStep, setOtpStep] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [pendingSignupData, setPendingSignupData] = useState(null);

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
    // ✅ NEW: also reset OTP state
    setOtpStep(false);
    setOtpValue("");
    setPendingSignupData(null);
  };

  const handleRoleChange = (role) => {
    setLoginAs(role);
    setIsSignup(false);
    resetForm();
  };

  // ✅ NEW: Step 1 of signup — validate domain and send OTP
  const handleSignupRequest = async (e) => {
    e.preventDefault();
    setLoading(true);

    const email = formData.email.toLowerCase().trim();

    // Domain validation
    if (loginAs === "student" && !isValidStudentEmail(email)) {
      alert("Only @vitstudent.ac.in email addresses can sign up as a student.");
      setLoading(false);
      return;
    }
    if (loginAs === "admin" && !isValidAdminEmail(email)) {
      alert("Only @vit.ac.in email addresses (or approved emails) can sign up as an admin.");
      setLoading(false);
      return;
    }

    // Check if email already exists
    if (loginAs === "student") {
      const { data: existing } = await supabase
        .from("students").select("id").eq("email", email).maybeSingle();
      if (existing) { alert("This email is already registered."); setLoading(false); return; }
    }
    if (loginAs === "admin") {
      const { data: existing } = await supabase
        .from("admins").select("id").eq("email", email).maybeSingle();
      if (existing) { alert("This email is already registered."); setLoading(false); return; }
    }

    // Send OTP
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      alert(`Failed to send OTP: ${error.message}`);
      setLoading(false);
      return;
    }

    setPendingSignupData({ ...formData, email });
    setOtpStep(true);
    setLoading(false);
    alert(`A 6-digit verification code has been sent to ${email}. Please check your inbox.`);
  };

  // ✅ NEW: Step 2 — verify OTP then complete signup (same logic as before, just gated behind OTP)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    const email = pendingSignupData.email;

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otpValue.trim(),
      type: "email",
    });

    if (verifyError) {
      alert(`Invalid or expired OTP: ${verifyError.message}`);
      setLoading(false);
      return;
    }

    // ✅ OTP verified — now run the EXACT SAME signup logic as before
    try {
      if (loginAs === "student") {
        const { error } = await supabase.from("students").insert([{
          name: pendingSignupData.name,
          email,
          password: pendingSignupData.password,
          room_number: pendingSignupData.roomNumber,
        }]);
        if (error) throw error;

        const { error: profileError } = await supabase.from("profiles").insert([{
          name: pendingSignupData.name,
          email,
          room_number: pendingSignupData.roomNumber,
          role: "student",
        }]);
        if (profileError) console.error("Profile insert error:", profileError.message);

        alert("✅ Email verified! Student signup successful. Please login.");
        setIsSignup(false);
        resetForm();
        setLoading(false);
        return;
      }

      if (loginAs === "admin") {
        const { error } = await supabase.from("admins").insert([{
          name: pendingSignupData.name,
          email,
          password: pendingSignupData.password,
        }]);
        if (error) throw error;

        alert("✅ Email verified! Admin signup successful. Please login.");
        setIsSignup(false);
        resetForm();
        setLoading(false);
        return;
      }
    } catch (err) {
      alert(err.message || "Signup failed after OTP verification.");
      setLoading(false);
    }
  };

  // ✅ UNCHANGED: Login logic — exactly as before
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (loginAs === "student") {
        const { data: student, error } = await supabase
          .from("students").select("*").eq("email", formData.email).maybeSingle();
        if (error || !student) { alert("Student not found"); setLoading(false); return; }
        if (student.password !== formData.password) { alert("Invalid student password"); setLoading(false); return; }

        const { data: profile } = await supabase
          .from("profiles").select("*")
          .eq("email", formData.email).eq("role", "student").maybeSingle();

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
          .from("admins").select("*").eq("email", formData.email).maybeSingle();
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
          .from("workers").select("*")
          .eq("employee_id", formData.employeeId)
          .eq("phone", formData.phone).maybeSingle();
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
    } catch (error) {
      console.error(error);
      alert(error.message || "Something went wrong");
      setLoading(false);
    }
  };

  // ✅ NEW: OTP screen — shown instead of main screen when otpStep is true
  if (otpStep) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Verify Your Email</h1>
          <p style={{ marginBottom: "16px", color: "#64748b" }}>
            We sent a 8-digit code to <strong>{pendingSignupData?.email}</strong>.
            Enter it below to complete your signup.
          </p>
          <form onSubmit={handleVerifyOtp} className="login-form">
            <label>Verification Code *</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="Enter 8-digit code"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value)}
              required
              style={{ letterSpacing: "6px", fontSize: "22px", textAlign: "center" }}
            />
            <button type="submit" disabled={loading || otpValue.length <6}>
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
          </form>
          <button
            type="button"
            className="toggle-auth-btn"
            onClick={() => { setOtpStep(false); setOtpValue(""); }}
          >
            ← Back to signup
          </button>
        </div>
      </div>
    );
  }

  // ✅ UNCHANGED: Main login/signup screen — exactly as before, just form onSubmit split by isSignup
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

        {/* ✅ NEW: Domain hint shown during signup */}
        {isSignup && loginAs === "student" && (
          <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
            📧 Only <strong>@vitstudent.ac.in</strong> emails are accepted.
          </p>
        )}
        {isSignup && loginAs === "admin" && (
          <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
            📧 Only <strong>@vit.ac.in</strong> emails are accepted.
          </p>
        )}

        {/* ✅ onSubmit now routes to handleSignupRequest (signup) or handleLogin (login) */}
        <form onSubmit={isSignup ? handleSignupRequest : handleLogin} className="login-form">
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
              ? isSignup ? "Sending OTP..." : t.loggingIn
              : isSignup ? "Send Verification Code" : t.login}
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