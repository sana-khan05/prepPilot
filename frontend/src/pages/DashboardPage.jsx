import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../api';
import AppLayout from '../components/AppLayout';
import {
  FileText, Mic, TrendingUp, Target,
  ArrowRight, Clock, CheckCircle2, AlertCircle,
  Sparkles, ChevronRight, Upload,
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, sub, color = 'green', loading }) => {
  const colors = {
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    blue:   { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100'    },
    amber:  { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100'   },
    purple: { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-100'  },
  };
  const c = colors[color];
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        {sub && <span className="text-xs text-slate-400 font-medium">{sub}</span>}
      </div>
      {loading
        ? <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse mt-1" />
        : <p className="text-3xl font-bold text-slate-900 font-mono">
            {value ?? <span className="text-slate-300">—</span>}
          </p>
      }
      <p className="text-sm text-slate-500 font-medium">{label}</p>
    </div>
  );
};

const statusBadge = (status) => {
  const map = {
    completed:   { cls: 'badge-green', icon: CheckCircle2, label: 'Completed'   },
    in_progress: { cls: 'badge-amber', icon: Clock,        label: 'In Progress' },
    abandoned:   { cls: 'badge-red',   icon: AlertCircle,  label: 'Abandoned'   },
    not_started: { cls: 'badge-gray',  icon: Clock,        label: 'Not Started' },
  };
  const { cls, icon: Icon, label } = map[status] || map.not_started;
  return (
    <span className={`${cls} badge`}>
      <Icon className="w-3 h-3" />{label}
    </span>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get()
      .then(r => setDashboard(r.data.dashboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const s = dashboard?.stats || {};

  return (
    <AppLayout>
      <div className="page-container animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="page-title">
              Good to see you, {user?.firstName}! 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {user?.targetRole
                ? `Preparing for ${user.targetRole.replace(/-/g, ' ')} roles`
                : 'Ready to ace your next interview?'}
            </p>
          </div>
          <Link to="/resumes" className="btn-primary">
            <Upload className="w-4 h-4" />
            Upload Resume
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={FileText}   label="Resumes Uploaded"    value={s.totalResumes}     color="blue"   loading={loading} />
          <StatCard icon={Target}     label="Latest ATS Score"    value={s.latestAtsScore}   sub="/100"     color="green"  loading={loading} />
          <StatCard icon={Mic}        label="Interviews Taken"    value={s.totalInterviews}  color="purple" loading={loading} />
          <StatCard icon={TrendingUp} label="Avg Interview Score" value={s.avgInterviewScore} sub="/100"    color="amber"  loading={loading} />
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Recent resumes */}
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-heading mb-0">📄 Recent Resumes</h2>
              <Link to="/resumes" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : dashboard?.recentResumes?.length ? (
              <div className="space-y-2">
                {dashboard.recentResumes.map(r => (
                  <Link key={r._id} to={`/resumes/${r._id}`}
                    className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100
                               hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{r.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{r.versionLabel} · {r.fileType?.toUpperCase()}</p>
                    </div>
                    {r.isAnalyzed && r.atsScore !== null
                      ? <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-emerald-600">{r.atsScore}</p>
                          <p className="text-xs text-slate-400">ATS</p>
                        </div>
                      : <span className="badge-amber badge text-xs">Pending</span>
                    }
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-slate-500 text-sm font-medium">No resumes yet</p>
                <Link to="/resumes" className="btn-primary btn-sm">Upload Your First Resume</Link>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Quick actions */}
            <div className="card p-5">
              <h2 className="section-heading">⚡ Quick Actions</h2>
              <div className="space-y-2">
                {[
                  { to: '/resumes',   icon: '📄', label: 'Upload & Analyze Resume', hover: 'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700' },
                  { to: '/interview', icon: '🎤', label: 'Start AI Interview',       hover: 'hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700' },
                  { to: '/profile',   icon: '👤', label: 'Complete Your Profile',    hover: 'hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700' },
                ].map(({ to, icon, label, hover }) => (
                  <Link key={to} to={to}
                    className={`flex items-center gap-3 p-3 rounded-xl border border-slate-100
                               bg-slate-50 text-slate-600 text-sm font-medium transition-all group ${hover}`}>
                    <span>{icon}</span>
                    <span className="flex-1">{label}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent interviews */}
            <div className="card p-5">
              <h2 className="section-heading">🎤 Recent Interviews</h2>
              {loading ? (
                <div className="space-y-2">
                  {[1,2].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
              ) : dashboard?.recentInterviews?.length ? (
                <div className="space-y-2">
                  {dashboard.recentInterviews.slice(0, 3).map(iv => (
                    <div key={iv._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 capitalize">{iv.interviewType}</p>
                        <div className="mt-0.5">{statusBadge(iv.status)}</div>
                      </div>
                      {iv.overallScore && (
                        <p className="text-sm font-bold text-emerald-600">{iv.overallScore}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-xs mb-3">No interviews yet</p>
                  <Link to="/interview" className="btn-primary btn-sm">
                    <Sparkles className="w-3 h-3" />Practice Now
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Phase 2 teaser */}
        <div className="mt-6 card p-5 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-700">AI Resume Analysis — Coming in Phase 2</p>
              <p className="text-xs text-emerald-600/70 mt-0.5">
                ATS scoring, skill gap analysis, bias detection & AI-powered bullet point rewriting
              </p>
            </div>
            <span className="badge-green badge">Next Up</span>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}