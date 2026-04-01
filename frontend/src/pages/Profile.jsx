import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { User, Mail, Shield, Calendar, Edit2, CheckCircle, XCircle } from "lucide-react";
import axiosInstance from "../api/api";

export default function Profile() {
  const { user, login } = useAuth();
  const { addToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, password: "" });
    }
  }, [user]);

  if (!user) {
    return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axiosInstance.put("/auth/profile", form);
      await login({ email: data.email, password: form.password || user.password });

      addToast("Profile updated successfully", "success");
      setIsEditing(false);
      setForm({ ...form, password: "" });
    } catch (error) {
      console.error(error);
      addToast(error.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition ${isEditing ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
        >
          {isEditing ? <><XCircle size={16} /> Cancel</> : <><Edit2 size={16} /> Edit Profile</>}
        </button>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-xl">
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
            <User size={40} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
            <p className="text-slate-500 text-sm capitalize">{user.role}</p>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password (Optional)</label>
              <input type="password" placeholder="Leave blank to keep current" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:bg-slate-800 disabled:opacity-70 flex justify-center items-center gap-2 transition-all transform hover:scale-[1.01]">
              <CheckCircle size={18} /> {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-slate-700">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Mail className="text-slate-500" size={20} />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Shield className="text-slate-500" size={20} />
              <span className="capitalize">{user.role}</span>
            </div>
            {user.createdAt && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Calendar className="text-slate-500" size={20} />
                <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
