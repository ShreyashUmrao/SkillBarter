import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import { io } from "socket.io-client";

function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatWindow() {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const socketRef = useRef(null);
  const token = localStorage.getItem("token");
  const endRef = useRef(null);

  useEffect(() => {
    const container = document.getElementById("chat-scroll-container");
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }, [messages]);

  useEffect(() => {
    API.get("/users/me")
      .then((res) => setCurrentUser(res.data))
      .catch((err) => console.error("Error fetching current user:", err));
  }, []);

  useEffect(() => {
    API.get(`/users/${userId}`)
      .then((res) => setChatUser(res.data))
      .catch((err) => console.error("Error fetching chat user:", err));
  }, [userId]);

  useEffect(() => {
    API.get(`/chat/user/${userId}`)
      .then((res) => setMessages(res.data || []))
      .catch((err) => console.error("Error loading chat:", err));
  }, [userId]);

  useEffect(() => {
    socketRef.current = io("http://localhost:8000", { transports: ["websocket"] });

    socketRef.current.emit("register", { token });

    socketRef.current.on("receive_message", (msg) => {
      if (
        msg.sender_id === Number(userId) ||
        msg.receiver_id === Number(userId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socketRef.current.on("message_sent", (msg) => {
      setMessages((prev) => {
        const withoutTemp = prev.filter(
          (m) => !(m.temp && m.message === msg.message)
        );
        return [...withoutTemp, msg];
      });
    });

    socketRef.current.on("message_error", (err) => {
      console.error("Message error:", err);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [userId, token]);

  const sendMessage = () => {
    if (!text.trim() || !currentUser) return;

    const messageData = {
      token,
      receiver_id: Number(userId),
      message: text,
      request_id: null,
    };

    socketRef.current.emit("send_message", messageData);

    setMessages((prev) => [
      ...prev,
      {
        sender_id: currentUser.id,
        receiver_id: Number(userId),
        message: text,
        timestamp: new Date().toISOString(),
        temp: true,
      },
    ]);
    setText("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="p-4 bg-white shadow flex items-center gap-3">
        {chatUser ? (
          <img
            alt={chatUser.username}
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              chatUser.username
            )}&background=0D8ABC&color=fff&size=64`}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200" />
        )}

        <div className="text-lg font-semibold text-gray-800">
          {chatUser ? `@${chatUser.username}` : `Loading...`}
        </div>
      </header>

      <div
        id="chat-scroll-container"
        className="flex-1 overflow-y-auto p-4 space-y-3 pb-20"
      >
        {messages.map((m, i) => {
          const isMine = m.sender_id === currentUser?.id;
          return (
            <div
              key={`${i}-${m.timestamp}-${m.message?.slice(0, 6)}`}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-3 rounded-lg max-w-[70%] break-words ${
                  isMine ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                <div>{m.message}</div>
                <div className="text-xs text-black-600 mt-2 text-right">
                  {formatTime(m.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <footer className="p-3 bg-white border-t sticky bottom-0">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 border rounded-full px-4 py-2 shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
            placeholder={`Message @${chatUser?.username || userId}...`}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}
