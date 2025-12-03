import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function MessagesList() {
  const [conversations, setConversations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/chat/conversations")
      .then((res) => setConversations(res.data.conversations || []))
      .catch((err) => console.error("Error loading conversations:", err));
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Messages
      </h1>

      {conversations.length === 0 ? (
        <p className="text-gray-500 text-center">No conversations yet.</p>
      ) : (
        <div className="space-y-3 max-w-2xl mx-auto">
          {conversations.map((c) => (
            <div
              key={c.conversation_key}
              onClick={() => navigate(`/messages/${c.partner_id}`)}
              className="flex justify-between items-center bg-white border rounded-xl p-4 shadow-sm hover:bg-gray-100 cursor-pointer transition"
            >
              <div>
                <p className="font-semibold text-lg">@{c.partner_username}</p>
                <p className="text-gray-600 text-sm truncate w-64">
                  {c.latest_message || "No messages yet"}
                </p>
              </div>
              <p className="text-xs text-gray-400">
                {c.timestamp
                  ? new Date(c.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
