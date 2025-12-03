import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Requests() {
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);


  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: "http://localhost:8000",
    headers: { Authorization: `Bearer ${token}` },
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/trade/requests");
      console.log("Trade requests fetched:", res.data);
      if (res.data && typeof res.data === "object") {
        setRequests({
          received: Array.isArray(res.data.received)
            ? res.data.received
            : [],
          sent: Array.isArray(res.data.sent) ? res.data.sent : [],
        });
      }
    } catch (err) {
      console.error(
        "Error fetching requests:",
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reqId, action) => {
    try {
      const res = await api.put(`/trade/requests/${reqId}/${action}`);
      console.log(`Request ${action}:`, res.data);
      fetchRequests();
    } catch (err) {
      console.error(
        `Error updating request:`,
        err.response?.data || err.message
      );
      alert(`Failed to ${action} request.`);
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await api.get("/users/me");
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };
    
    fetchCurrentUser();
    fetchRequests();
  }, []);

  if (loading)
    return <p className="text-center text-gray-500">Loading...</p>;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        Trade Requests
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 text-center">
            Received Requests
          </h2>

          {requests.received.length === 0 ? (
            <p className="text-gray-500 text-center">No received requests.</p>
          ) : (
            <div className="space-y-3">
              {requests.received.reverse().map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-gray-50 shadow-sm rounded-xl border border-gray-200"
                >
                  <p className="text-gray-700">
                    <strong>From:</strong>{" "}
                    <Link
                      to={`/profile/${req.sender_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      @{req.sender}
                    </Link>
                  </p>
                  <p className="text-gray-700">
                    <strong>Skill:</strong>{" "}
                    <span className="text-blue-600">{req.skill}</span>
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong>Status:</strong>{" "}
                    <span
                      className={`capitalize ${
                        req.status === "accepted"
                          ? "text-green-600"
                          : req.status === "rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {req.status}
                    </span>
                  </p>

                  {req.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(req.id, "accept")}
                        className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleAction(req.id, "reject")}
                        className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 transition"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {req.status === "accepted" && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          const partnerId =
                            req.sender_id === currentUser.id ? req.receiver_id : req.sender_id;
                          navigate(`/messages/${partnerId}`);
                        }}
                        className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition"
                      >
                        Message
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 text-center">
            Sent Requests
          </h2>

          {requests.sent.length === 0 ? (
            <p className="text-gray-500 text-center">No sent requests.</p>
          ) : (
            <div className="space-y-3">
              {requests.sent.reverse().map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-gray-50 shadow-sm rounded-xl border border-gray-200"
                >
                  <p className="text-gray-700">
                    <strong>To:</strong>{" "}
                    <Link
                      to={`/profile/${req.receiver_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      @{req.receiver}
                    </Link>
                  </p>
                  <p className="text-gray-700">
                    <strong>Skill:</strong>{" "}
                    <span className="text-blue-600">{req.skill}</span>
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong>Status:</strong>{" "}
                    <span
                      className={`capitalize ${
                        req.status === "accepted"
                          ? "text-green-600"
                          : req.status === "rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {req.status}
                    </span>
                  </p>

                  {req.status === "accepted" && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          const partnerId =
                            req.sender_id === currentUser.id ? req.receiver_id : req.sender_id;
                          navigate(`/messages/${partnerId}`);
                        }}
                        className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 transition"
                      >
                        Message
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Requests;
