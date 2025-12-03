import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";

export default function UserProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState({ sent: [] });

  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        const res = await API.get("/users/me");
        setCurrentUserId(res.data.id);
      } catch (err) {
        console.error("Failed to fetch my profile:", err);
      }
    };
    fetchMyProfile();
  }, []);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await API.get("/trade/requests");
        console.log("Trade requests (UserProfile):", res.data);
        if (res.data?.sent) setRequests({ sent: res.data.sent });
      } catch (err) {
        console.error("Error fetching requests:", err);
      }
    };
    fetchRequests();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/users/${id}`);
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUserProfile();
  }, [id]);

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
      console.error("Failed to send request:", err);
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
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
      <p className="text-center mt-10 text-gray-600">User not found.</p>
    );

  const isMyProfile = currentUserId === user.id;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6 flex justify-center">
      <div className="max-w-2xl w-full bg-white shadow-lg rounded-2xl p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          @{user.username}
        </h1>

        <h2 className="text-2xl font-semibold mb-4 text-gray-700 text-center">
          Skills
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

                {!isMyProfile && (
                  <button
                    disabled={isRequestPending(user.id, skill.name)}
                    onClick={() => handleSendRequest(user.id, skill.id)}
                    className={`mt-3 px-4 py-2 rounded-lg transition ${
                      isRequestPending(user.id, skill.name)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {isRequestPending(user.id, skill.name)
                      ? "Request Sent"
                      : "Send Request"}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No skills found.</p>
        )}
      </div>
    </div>
  );
}
