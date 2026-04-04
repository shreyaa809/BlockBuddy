import { useState } from "react";

function ComplaintForm({ onSubmitComplaint }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmitComplaint({
      title,
      category,
      description,
    });

    setTitle("");
    setCategory("");
    setDescription("");
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div>
        <label className="label" htmlFor="complaint-title">
          Complaint Title
        </label>
        <input
          id="complaint-title"
          className="input"
          type="text"
          placeholder="Enter a short title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="complaint-category">
          Category
        </label>
        <select
          id="complaint-category"
          className="select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">Select category</option>
          <option value="Electrical">Electrical</option>
          <option value="Plumbing">Plumbing</option>
          <option value="Cleaning">Cleaning</option>
          <option value="Furniture">Furniture</option>
          <option value="Internet">Internet</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="complaint-description">
          Description
        </label>
        <textarea
          id="complaint-description"
          className="textarea"
          placeholder="Describe the issue clearly"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <button className="btn btn-primary" type="submit">
        Submit Complaint
      </button>
    </form>
  );
}

export default ComplaintForm;