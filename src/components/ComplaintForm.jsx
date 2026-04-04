import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../translations";

function ComplaintForm({ onSubmitComplaint }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const { language } = useLanguage();
  const t = translations[language];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitComplaint({ title, category, description });
    setTitle("");
    setCategory("");
    setDescription("");
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div>
        <label className="label" htmlFor="complaint-title">
          {t.complaintTitle}
        </label>
        <input
          id="complaint-title"
          className="input"
          type="text"
          placeholder={t.complaintTitlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="complaint-category">
          {t.categoryLabel}
        </label>
        <select
          id="complaint-category"
          className="select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">{t.selectCategory}</option>
          <option value="Electrical">{t.electrical}</option>
          <option value="Plumbing">{t.plumbing}</option>
          <option value="Cleaning">{t.cleaning}</option>
          <option value="Furniture">{t.furniture}</option>
          <option value="Internet">{t.internet}</option>
          <option value="Other">{t.other}</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="complaint-description">
          {t.description}
        </label>
        <textarea
          id="complaint-description"
          className="textarea"
          placeholder={t.descriptionPlaceholder}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <button className="btn btn-primary" type="submit">
        {t.submitComplaint}
      </button>
    </form>
  );
}

export default ComplaintForm;
