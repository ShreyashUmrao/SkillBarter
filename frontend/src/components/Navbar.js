import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow p-3">
      <div className="container flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bold text-xl text-gray-800">SkillBarter</Link>
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-600">
            {token && <Link to="/dashboard" className="hover:text-gray-900">Dashboard</Link>}
            {token && <Link to="/requests" className="hover:text-gray-900">Requests</Link>}
            {token && <Link to="/search" className="hover:text-gray-900">Search</Link>}
            {token && <Link to="/profile" className="hover:text-gray-900">Profile</Link>}
            {token && <Link to="/messages" className="hover:text-gray-900">Messages</Link>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => setOpen((s) => !s)}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={open ? "M6 18L18 6M6 6l12 12" : "M3 12h18M3 6h18M3 18h18"} />
            </svg>
          </button>

          <div className="hidden md:block">
            {!token ? (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-700">Login</Link>
                <Link to="/register" className="bg-blue-600 text-white px-3 py-1 rounded">Register</Link>
              </div>
            ) : (
              <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded">Logout</button>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="p-3 flex flex-col gap-2">
            {token && <Link to="/dashboard" className="py-1 px-2 rounded hover:bg-gray-50">Dashboard</Link>}
            {token && <Link to="/requests" className="py-1 px-2 rounded hover:bg-gray-50">Requests</Link>}
            {token && <Link to="/search" className="py-1 px-2 rounded hover:bg-gray-50">Search</Link>}
            {token && <Link to="/profile" className="py-1 px-2 rounded hover:bg-gray-50">Profile</Link>}
            {token && <Link to="/messages" className="py-1 px-2 rounded hover:bg-gray-50">Messages</Link>}

            {!token ? (
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="flex-1 text-center py-2 rounded">Login</Link>
                <Link to="/register" className="flex-1 bg-blue-600 text-white py-2 rounded text-center">Register</Link>
              </div>
            ) : (
              <button onClick={logout} className="w-full bg-red-500 text-white py-2 rounded mt-2">Logout</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
