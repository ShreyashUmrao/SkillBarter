import React from "react";
import { deleteSkill } from "../services/api";

export default function SkillCard({ skill, onDeleted, onEdit }) {
  const handleDelete = async () => {
    if (!window.confirm("Delete this skill?")) return;
    try {
      await deleteSkill(skill.id);
      onDeleted?.();
    } catch (err) {
      alert("Could not delete skill");
      console.error(err);
    }
  };

  return (
    <div className="border rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full bg-white">
      <div>
        <h3 className="font-semibold text-lg text-gray-800">{skill.name}</h3>
        <p className="text-sm text-gray-700 mt-2">{skill.description}</p>
        <p className="text-xs text-gray-500 mt-3">{skill.category}</p>
      </div>

      <div className="mt-4 flex gap-2 justify-end">
        <button
          onClick={() => onEdit?.(skill)}
          className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500 transition"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
