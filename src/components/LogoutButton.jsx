import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";

function LogoutButton() {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const t = translations[language];

  const handleLogout = () => {
    localStorage.removeItem("hostelUser");
    navigate("/");
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <button className="btn btn-secondary btn-sm" onClick={toggleLanguage}>
        {t.switchLanguage}
      </button>
      <button onClick={handleLogout}>{t.logout}</button>
    </div>
  );
}

export default LogoutButton;
