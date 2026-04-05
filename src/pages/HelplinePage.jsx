import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";

const BLOCK_WARDENS = {
  A: { name: "Mr. Ramesh Kumar",  phone: "+91 98000 11001" },
  B: { name: "Mrs. Sunita Verma", phone: "+91 98000 11002" },
  C: { name: "Mr. Arjun Singh",   phone: "+91 98000 11003" },
  D: { name: "Mrs. Priya Nair",   phone: "+91 98000 11004" },
  E: { name: "Mr. Deepak Rao",    phone: "+91 98000 11005" },
};

function HelplinePage() {
  const [selectedBlock, setSelectedBlock] = useState("");
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const warden = BLOCK_WARDENS[selectedBlock] || null;

  return (
    <div className="app-shell">
      <div className="dashboard-container">

        <button
          className="btn btn-secondary btn-sm"
          style={{ marginBottom: "24px", width: "fit-content" }}
          onClick={() => navigate(-1)}
        >
          ← {t.back || "Back"}
        </button>

        <div className="dashboard-header" style={{ marginBottom: "28px" }}>
          <div>
            <h1>📞 {t.helplineTitle || "Helpline Numbers"}</h1>
            <p className="dashboard-subtitle">
              {t.helplineSubtitle || "Reach the right person quickly — we're here when you need us."}
            </p>
          </div>
        </div>

        {/* ── BLOCK WARDEN ── */}
        <div className="panel" style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <span style={{ fontSize: "28px" }}>🏠</span>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px",
                textTransform: "uppercase", color: "#e07b00", marginBottom: "2px" }}>
                Hostel Staff
              </p>
              <h2 className="panel-title" style={{ margin: 0 }}>
                {t.blockWardenTitle || "Block Warden Contact"}
              </h2>
            </div>
          </div>

          <label className="label">
            {t.selectBlockLabel || "Select your block to view the warden's contact"}
          </label>
          <select
            className="select"
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            style={{ marginBottom: "14px" }}
          >
            <option value="">{t.selectBlock || "— Select your block —"}</option>
            {Object.keys(BLOCK_WARDENS).map((block) => (
              <option key={block} value={block}>Block {block}</option>
            ))}
          </select>

          {warden && (
            <div style={{
              background: "#fff8f0", border: "1.5px solid #ffd599",
              borderRadius: "10px", padding: "14px 16px",
            }}>
              <p style={{ fontWeight: 600, marginBottom: "4px" }}>👤 {warden.name}</p>
              <p className="complaint-meta">📞 {warden.phone}</p>
              
                <a href={`tel:${warden.phone.replace(/\s/g, "")}`}
                className="btn btn-primary"
                style={{ marginTop: "12px", display: "inline-flex", gap: "6px", textDecoration: "none" }}
              >
                📲 {t.callWarden || "Call Warden"}
              </a>
            </div>
          )}
        </div>

        {/* ── AMBULANCE ── */}
        <div className="panel" style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <span style={{ fontSize: "28px" }}>🚑</span>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px",
                textTransform: "uppercase", color: "#c62828", marginBottom: "2px" }}>
                Medical Emergency
              </p>
              <h2 className="panel-title" style={{ margin: 0 }}>
                {t.ambulanceTitle || "Need an Ambulance?"}
              </h2>
            </div>
          </div>

          <p className="complaint-meta" style={{ marginBottom: "16px" }}>
            {t.ambulanceDesc ||
              "In case of a medical emergency, call the hostel's on-call ambulance service immediately. Stay calm and keep the patient still until help arrives."}
          </p>

          
            <a href="tel:1800000001"
            className="btn btn-danger"
            style={{ display: "inline-flex", gap: "6px", textDecoration: "none" }}
          >
            🚨 {t.callAmbulance || "Call Ambulance — 1800-000-001"}
          </a>

          <p className="complaint-meta" style={{ marginTop: "12px" }}>
            {t.campusMedical || "Campus Medical Centre"} &nbsp;·&nbsp;
            <strong>+91 98000 00002</strong>
          </p>
        </div>

        {/* ── PSYCHOLOGIST ── */}
        <div className="panel">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <span style={{ fontSize: "28px" }}>🧠</span>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px",
                textTransform: "uppercase", color: "#2962ff", marginBottom: "2px" }}>
                Mental Wellness
              </p>
              <h2 className="panel-title" style={{ margin: 0 }}>
                {t.counsellorTitle || "Speak to a Counsellor"}
              </h2>
            </div>
          </div>

          <p className="complaint-meta" style={{ marginBottom: "16px" }}>
            {t.counsellorDesc ||
              "Feeling overwhelmed, anxious, or simply need someone to talk to? Our resident psychologist offers free, confidential sessions — no appointment needed for urgent matters."}
          </p>

          
            <a href="tel:1800000003"
            className="btn btn-primary"
            style={{ display: "inline-flex", gap: "6px", textDecoration: "none" }}
          >
            💬 {t.callCounsellor || "Contact Counsellor — 1800-000-003"}
          </a>

          <p className="complaint-meta" style={{ marginTop: "12px" }}>
            {t.counsellorHours || "Available Mon – Sat · 9:00 AM – 6:00 PM"}
          </p>
        </div>

      </div>
    </div>
  );
}

export default HelplinePage;