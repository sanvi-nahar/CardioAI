import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { HeartPulse, Eye, EyeOff, Activity } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import heartImage from "../assets/loginImage.png";

export default function Login() {

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { settings } = useSettings();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      await login(form);
      const landingPage = settings.defaultLandingPage || "dashboard";
      const redirectPath = landingPage === "dashboard" ? "/" : `/${landingPage}`;
      navigate(redirectPath);
    } catch (error) {
      setErr(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Login failed"
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

          <div className="text-center max-w-md">
            <h2 className="text-2xl font-semibold mb-2">AI-Powered Patient Monitoring</h2>
            <p className="text-slate-400">
              Get real-time alerts, predictive analytics, and comprehensive patient insights all in one platform.
            </p>
          </div>

          <div className="flex items-center gap-6 mt-12">
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

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-slate-50">
        
        <div className="w-full max-w-md">
          
          {/* MOBILE LOGO */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="bg-slate-900 p-2 rounded-xl">
              <HeartPulse size={24} className="text-rose-500" />
            </div>
            <span className="text-xl font-bold text-slate-800">CardioAI</span>
          </div>

          {/* LOGIN CARD */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-5 sm:p-8">
            
            {/* HEADER */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
              <p className="text-slate-500 mt-1">Sign in to access the monitoring dashboard</p>
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
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <input
                  type="email"
                  className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                  placeholder="you@hospital.org"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition pr-12"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
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

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" 
                  />
                  Remember me
                </label>

                <a href="#" className="text-slate-900 hover:underline font-medium">
                  Forgot password?
                </a>

              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Activity className="animate-spin" size={20} />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

            </form>

            <div className="text-center mt-8 text-slate-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-slate-900 font-semibold hover:underline">
                Create account
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
