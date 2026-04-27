import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, Mic, BarChart3,
  User, Settings, LogOut, Zap, Users, BookOpen
} from 'lucide-react';


const candidateLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resumes',   icon: FileText,         label: 'My Resumes' },
  { to: '/interview', icon: Mic,              label: 'Practice Interview', badge: 'AI' },
  { to: '/analytics', icon: BarChart3,        label: 'Analytics' },

  // ✅ Added new links
  { to: '/builder',   icon: FileText,         label: 'Resume Builder', badge: 'AI' },
  { to: '/learning',  icon: BookOpen,         label: 'Learning Plan',  badge: 'AI' },

  { to: '/profile',   icon: User,             label: 'Profile' },
];

const recruiterLinks = [
  { to: '/recruiter',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/candidates', icon: Users,           label: 'Candidates' },

  // ✅ Already added but kept correctly placed
  { to: '/builder',   icon: FileText, label: 'Resume Builder', badge: 'AI' },
  { to: '/learning',  icon: BookOpen, label: 'Learning Plan',  badge: 'AI' },

  { to: '/profile',    icon: User,            label: 'Profile' },
];

export default function Sidebar() {
  const { user, logout, isRecruiter } = useAuth();
  const navigate = useNavigate();
  const links = isRecruiter ? recruiterLinks : candidateLinks;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col shadow-sm">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">
            Prep<span className="text-emerald-500">Pilot</span>
          </span>
        </div>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500
                          flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Navigation
        </p>

        {links.map(({ to, icon: Icon, label, badge, disabled }) => (
          <NavLink
            key={to}
            to={disabled ? '#' : to}
            onClick={disabled ? (e) => e.preventDefault() : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
               transition-all duration-150 group
               ${disabled
                 ? 'text-slate-300 cursor-not-allowed'
                 : isActive
                   ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                   : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
               }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>

            {badge && (
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold
                ${badge === 'AI'   ? 'bg-emerald-100 text-emerald-600' : ''}
                ${badge === 'Soon' ? 'bg-slate-100 text-slate-400' : ''}`}>
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-slate-100 space-y-0.5">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                     text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all"
        >
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                     text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}