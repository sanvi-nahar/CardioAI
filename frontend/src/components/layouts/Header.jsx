import React, { useState } from "react";
import { Bell, LogOut, LogIn, UserPlus, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setOpenMenu(false);
    navigate("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex justify-between items-center px-6 shadow-sm">

      {/* PAGE TITLE */}
      <div>
        <h2 className="font-bold text-slate-800 text-lg">AI Cardiac Monitoring</h2>
        <p className="text-xs text-slate-500 -mt-0.5">Real-time clinical dashboard</p>
      </div>

      {/* RIGHT SIDE SECTION */}
      <div className="flex items-center gap-4 relative">

        {/* Notification Icon */}
        <Link to="/alerts" className="relative p-2 hover:bg-slate-100 rounded-lg transition">
          <Bell className="h-5 w-5 text-slate-600" />
        </Link>

        {/* IF USER IS NOT LOGGED IN → Show Login/Register */}
        {!user && (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>

            <Link
              to="/register"
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Register
            </Link>
          </div>
        )}

        {/* IF USER IS LOGGED IN → Show Profile */}
        {user && (
          <div
            className="cursor-pointer flex items-center gap-3 p-2 pr-3 rounded-xl hover:bg-slate-50 transition"
            onClick={() => setOpenMenu(!openMenu)}
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 text-white flex items-center justify-center text-sm font-semibold shadow">
              {user.name?.charAt(0).toUpperCase()}
            </div>

            <div className="text-sm">
              <p className="font-semibold text-slate-800 leading-none">{user.name}</p>
              <p className="text-slate-500 text-xs capitalize">{user.role}</p>
            </div>

            <ChevronDown className="h-4 w-4 text-slate-400" />

            {/* DROPDOWN */}
            {openMenu && (
              <div className="absolute right-0 top-14 bg-white rounded-2xl shadow-xl border border-slate-200 w-56 p-2 z-40">
                <div className="px-3 py-2 border-b border-slate-100 mb-2">
                  <p className="font-semibold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>

                <Link 
                  to="/profile" 
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition"
                  onClick={() => setOpenMenu(false)}
                >
                  Profile Settings
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition mt-1"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
