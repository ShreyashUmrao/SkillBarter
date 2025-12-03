import React, { useEffect, useState } from "react";
import { getSkills, addSkill, updateSkill } from "../services/api";
import SkillCard from "../components/SkillCard";

export default function Dashboard() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ name: "", description: "", category: "" });
  const [editing, setEditing] = useState(null);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await getSkills();
      setSkills(res.data || res);
    } catch (err) {
      console.error(err);
      alert("Could not fetch skills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateSkill(editing.id, form);
        setEditing(null);
      } else {
        await addSkill(form);
      }
      setForm({ name: "", description: "", category: "" });
      fetchSkills();
    } catch (err) {
      alert("Action failed");
      console.error(err);
    }
  };

  const startEdit = (skill) => {
    setEditing(skill);
    setForm({
      name: skill.name,
      description: skill.description,
      category: skill.category,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">My Skills</h2>

        <form onSubmit={submit} className="mb-6 bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">
            {editing ? "Edit Skill" : "Add Skill"}
          </h3>

          <input
            className="w-full border px-3 py-2 rounded mb-2"
            placeholder="Skill name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <select
            className="w-full border px-3 py-2 rounded mb-2 bg-white text-gray-700 focus:ring focus:ring-blue-200"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          >
            <option value="">Select a Category</option>
            <option value="Programming">Programming</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Writing">Writing</option>
            <option value="Business">Business</option>
          </select>

          <textarea
            className="w-full border px-3 py-2 rounded mb-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded">
              {editing ? "Save" : "Add Skill"}
            </button>

            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm({ name: "", description: "", category: "" });
                }}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((s) => (
              <SkillCard
                key={s.id}
                skill={s}
                onDeleted={fetchSkills}
                onEdit={startEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
