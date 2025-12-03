import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get("/users/me");
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err?.response?.data?.detail || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-500 text-lg">Loading profile...</p>
    );

  if (error)
    return (
      <p className="text-center mt-10 text-red-600 font-semibold">{error}</p>
    );

  if (!user)
    return (
      <p className="text-center mt-10 text-gray-600">
        No profile data available.
      </p>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6 flex justify-center">
      <div className="max-w-2xl w-full bg-white shadow-lg rounded-2xl p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          @{user.username}
        </h1>
        {user.email && (
          <p className="text-gray-500 text-center mb-6">{user.email}</p>
        )}

        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          My Skills
        </h2>

        {user.skills?.length ? (
          <div className="grid grid-cols-1 gap-3">
            {user.skills.map((skill) => (
              <div
                key={skill.id}
                className="p-4 border border-gray-200 rounded-xl bg-gray-50 shadow-sm hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-blue-600">
                  {skill.name}
                </h3>
                <p className="text-sm text-gray-700 mt-1">
                  {skill.description || "No description"}
                </p>
                <p className="text-xs text-gray-500 mt-1 italic">
                  Category: {skill.category}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No skills added yet.</p>
        )}
      </div>
    </div>
  );
}
