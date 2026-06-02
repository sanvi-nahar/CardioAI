import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { HeartPulse, Eye, EyeOff, UserPlus, Activity } from "lucide-react";
import heartImage from "../assets/loginImage.png";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "doctor",
  });

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      await register(form);
      navigate("/login");
    } catch (error) {
      console.error("REGISTER ERROR:", error.response?.data || error.message || error);
      setErr(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Registration failed"
      );
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      
      {/* LEFT SIDE - BRANDING */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-rose-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/20">
              <HeartPulse size={40} className="text-rose-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">CardioAI</h1>
              <p className="text-slate-400 text-sm">Real-Time Heart Monitoring</p>
            </div>
          </div>
  
          <img
            src={heartImage}
            alt="AI Heart Monitoring"
            className="rounded-2xl shadow-2xl max-w-md mb-8 border-4 border-white/10"
          />

          <div className="text-center max-w-md mb-8">
            <h2 className="text-2xl font-semibold mb-2">Join Our Monitoring System</h2>
            <p className="text-slate-400">
              Create an account to access AI-powered patient monitoring, real-time alerts, and predictive analytics.
            </p>
          </div>

          <div className="flex items-center gap-6 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-rose-400">24/7</div>
              <div className="text-xs text-slate-400">Live Monitoring</div>
            </div>
            <div className="w-px h-10 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">AI</div>
              <div className="text-xs text-slate-400">Predictions</div>
            </div>
            <div className="w-px h-10 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">NEWS2</div>
              <div className="text-xs text-slate-400">Scoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - REGISTER FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        
        <div className="w-full max-w-md">
          
          {/* MOBILE LOGO */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="bg-slate-900 p-2 rounded-xl">
              <HeartPulse size={24} className="text-rose-500" />
            </div>
            <span className="text-xl font-bold text-slate-800">CardioAI</span>
          </div>

          {/* REGISTER CARD */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
            
            {/* HEADER */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Create Account</h2>
              <p className="text-slate-500 mt-1">Join the cardiac monitoring system</p>
            </div>

            {/* ERROR */}
            {err && (
              <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                {err}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <input
                  type="email"
                  className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                  placeholder="you@hospital.org"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition pr-12"
                    placeholder="Create a password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Role</label>
                <select
                  className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Activity className="animate-spin" size={20} />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    Create Account
                  </>
                )}
              </button>

            </form>

            <div className="text-center mt-8 text-slate-600">
              Already have an account?{" "}
              <Link to="/login" className="text-slate-900 font-semibold hover:underline">
                Sign in
              </Link>
            </div>

          </div>

          {/* FOOTER */}
          <div className="text-center mt-6">
            <p className="text-xs text-slate-400">
              Protected by enterprise-grade security
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
