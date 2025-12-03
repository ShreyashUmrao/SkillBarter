import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import API from "../services/api";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const ChatPage = ({ currentUser }) => {
  const { requestId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [receiverId, setReceiverId] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("register", { token });
    });

    socket.on("register_success", (data) => {
      console.log("Registered on socket:", data);
    });

    socket.on("receive_message", (msg) => {
      console.log("Received message:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("message_sent", (msg) => {
      console.log("Message saved:", msg);
      setMessages((prev) =>
        prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]
      );
    });

    socket.on("message_error", (err) => {
      console.error("Message error:", err);
      alert(err?.error || "Message failed to send");
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    const loadChat = async () => {
      try {
        const res = await API.get(`/chat/${requestId}`);
        const data = Array.isArray(res.data) ? res.data : [];
        setMessages(data);

        const firstMsg = data.find((m) => m.sender_id !== currentUser?.id);
        if (firstMsg) setReceiverId(firstMsg.sender_id);
      } catch (err) {
        console.error("Failed to load chat:", err.message);
      }
    };
    if (requestId) loadChat();
  }, [requestId, currentUser]);

  useEffect(() => {
    const fetchReceiver = async () => {
      if (receiverId || !requestId) return;
      try {
        const res = await API.get("/trade/requests");
        const all = [...res.data.sent, ...res.data.received];
        const match = all.find((r) => r.id === Number(requestId));
        if (match) {
          const otherId =
            match.sender_id === currentUser?.id
              ? match.receiver_id
              : match.sender_id;
          setReceiverId(otherId);
        }
      } catch (err) {
        console.error("Could not find receiver:", err.message);
      }
    };
    fetchReceiver();
  }, [receiverId, requestId, currentUser]);

  const handleSend = () => {
    console.log("ReceiverID:", receiverId, "RequestID:", requestId);
    if (!input.trim()) return alert("Message cannot be empty.");
    if (!receiverId) return alert("Receiver not identified yet.");

    const msgData = {
      token,
      receiver_id: receiverId,
      request_id: Number(requestId),
      message: input.trim(),
    };

    console.log("Sending message:", msgData);
    socketRef.current.emit("send_message", msgData);
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gray-100">
      <header className="bg-blue-600 text-white p-4 text-center text-xl font-semibold shadow-md">
        Chat (Request #{requestId})
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id || Math.random()}
            className={`flex ${
              m.sender_id === currentUser?.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-2 px-4 rounded-2xl max-w-xs text-white ${
                m.sender_id === currentUser?.id
                  ? "bg-blue-500"
                  : "bg-gray-500"
              }`}
            >
              <p>{m.message}</p>
              <p className="text-xs opacity-70 text-right mt-1">
                {new Date(m.timestamp || Date.now()).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-3 bg-white flex items-center border-t shadow-sm">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 outline-none mr-2"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full"
        >
          Send
        </button>
      </footer>
    </div>
  );
};

export default ChatPage;
