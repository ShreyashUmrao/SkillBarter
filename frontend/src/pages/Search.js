import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

export default function Search() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState({ sent: [] });

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/search?q=${query}&category=${category}`);
      setSkills(res.data || []);
    } catch (err) {
      console.error("Error searching skills:", err);
      setError("Failed to fetch skills. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await API.get("/trade/requests");
        console.log("Trade requests:", res.data);
        if (res.data?.sent) setRequests({ sent: res.data.sent });
      } catch (err) {
        console.error("Error fetching requests:", err);
      }
    };

    fetchRequests();
    fetchResults();
  }, []);

  const handleSendRequest = async (receiverId, skillId) => {
    try {
      await API.post("/trade/request", {
        receiver_id: receiverId,
        skill_id: skillId,
      });
      alert("Trade request sent successfully!");

      const res = await API.get("/trade/requests");
      if (res.data?.sent) setRequests({ sent: res.data.sent });
    } catch (err) {
      console.error("Trade request failed:", err);
      const msg =
        err?.response?.data?.detail ||
        err.message ||
        "Failed to send trade request.";
      alert(msg);
    }
  };

  const isRequestPending = (receiverId, skillName) => {
    return requests.sent.some(
      (r) =>
        r.receiver_id === receiverId &&
        r.skill === skillName &&
        r.status === "pending"
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
        Search Skills
      </h1>

      <div className="flex flex-col md:flex-row justify-center items-center gap-3 mb-8">
        <input
          type="text"
          placeholder="Search by skill name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border px-4 py-2 rounded w-full md:w-1/3 shadow-sm focus:ring focus:ring-blue-200"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border px-4 py-2 rounded shadow-sm w-full md:w-1/5"
        >
          <option value="">All Categories</option>
          <option value="Programming">Programming</option>
          <option value="Design">Design</option>
          <option value="Marketing">Marketing</option>
          <option value="Writing">Writing</option>
          <option value="Business">Business</option>
        </select>

        <button
          onClick={fetchResults}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded transition"
        >
          Search
        </button>
      </div>

      {loading && (
        <p className="text-center text-gray-500 text-lg">Searching...</p>
      )}

      {error && (
        <p className="text-center text-red-600 font-semibold mb-4">{error}</p>
      )}

      {!loading && !error && skills.length === 0 && (
        <p className="text-center text-gray-500">No skills found.</p>
      )}

      {!loading && skills.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="bg-white rounded-2xl shadow p-5 border border-gray-200 hover:shadow-md transition"
            >
              <p className="text-sm text-gray-500 mb-1">
                Posted by{" "}
                <Link
                  to={`/profile/${skill.owner.id}`}
                  className="text-blue-600 hover:underline"
                >
                  @{skill.owner.username}
                </Link>
              </p>

              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {skill.name}
              </h2>
              <p className="text-gray-600 mb-2">
                {skill.description || "No description provided."}
              </p>
              <p className="text-sm text-gray-500 mb-3">
                Category:{" "}
                <span className="text-blue-600 font-medium">
                  {skill.category}
                </span>
              </p>

              <button
                disabled={isRequestPending(skill.owner.id, skill.name)}
                onClick={() => handleSendRequest(skill.owner.id, skill.id)}
                className={`px-4 py-2 rounded transition ${
                  isRequestPending(skill.owner.id, skill.name)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isRequestPending(skill.owner.id, skill.name)
                  ? "Request Sent"
                  : "Send Request"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
