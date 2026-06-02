import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Activity,
  Users,
  Bell,
  BarChart3,
  Settings,
  User,
  HeartPulse,
  UserPlus,
  X,
} from "lucide-react";

const navGroups = [
  {
    title: "Monitoring",
    links: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "doctor", "nurse"] },
      { to: "/live-monitoring", label: "Live Monitoring", icon: Activity, roles: ["admin", "doctor", "nurse"] },
    ],
  },
  {
    title: "Patients",
    links: [
      { to: "/patients", label: "Patients", icon: Users, roles: ["admin", "doctor"] },
      { to: "/add-patient", label: "Add Patient", icon: UserPlus, roles: ["admin", "doctor"] },
    ],
  },
  {
    title: "Alerts",
    links: [
      { to: "/alerts", label: "Alerts", icon: Bell, roles: ["admin", "doctor", "nurse"] },
    ],
  },
  {
    title: "Analytics",
    links: [
      { to: "/reports", label: "Reports", icon: BarChart3, roles: ["admin", "doctor", "nurse"] },
    ],
  },
  {
    title: "System",
    links: [
      { to: "/settings", label: "Settings", icon: Settings, roles: ["admin", "doctor"] },
    ],
  },
  {
    title: "User",
    links: [
      { to: "/profile", label: "Profile", icon: User, roles: ["admin", "doctor", "nurse"] },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => 
        !user || link.roles.includes(user.role)
      ),
    }))
    .filter((group) => group.links.length > 0);

  return (
    <aside className={`
      w-64 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col shadow-2xl
      fixed inset-y-0 left-0 z-50 transform md:static md:translate-x-0 transition-transform duration-300
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
    `}>
      {/* Logo + Branding */}
      <div className="p-5 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-2.5 rounded-xl shadow-lg">
            <HeartPulse className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">CardioAI</h1>
            <p className="text-xs text-slate-400">
              Cardiac Monitoring
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg md:hidden hover:bg-white/10 cursor-pointer"
          aria-label="Close Sidebar"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.title}>
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-slate-700/80 text-white shadow-lg"
                        : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom System Status */}
      <div className="p-4 border-t border-white/10">
        <div className="bg-slate-800/50 rounded-xl p-3">
          <p className="text-xs text-slate-400">
            System Status:
          </p>
          <p className="text-sm font-medium text-emerald-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
            Online
          </p>
        </div>
      </div>
    </aside>
  );
}
