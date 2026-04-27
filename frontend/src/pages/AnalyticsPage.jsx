import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import AppLayout from '../components/AppLayout';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, Mic, FileText, Target, Award,
  MessageSquare, Zap, ChevronRight, Loader2,
  CheckCircle2, AlertCircle, Clock,
} from 'lucide-react';

// ── Stat card ──────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'emerald', trend }) => {
  const colors = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100'    },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100'   },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-100'  },
    red:     { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-100'     },
  };
  const c = colors[color];
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 font-mono">
        {value ?? <span className="text-slate-300">—</span>}
        {sub && <span className="text-sm text-slate-400 font-sans ml-1">{sub}</span>}
      </p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
};

// ── Custom tooltip ─────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-mono">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

const statusBadge = (status) => {
  const map = {
    completed:   { cls: 'badge-green', label: 'Completed' },
    in_progress: { cls: 'badge-amber', label: 'In Progress' },
    abandoned:   { cls: 'badge-red',   label: 'Abandoned' },
    not_started: { cls: 'badge-gray',  label: 'Not Started' },
  };
  const { cls, label } = map[status] || map.not_started;
  return <span className={`${cls} badge`}>{label}</span>;
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics')
      .then(r => setAnalytics(r.data.analytics))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="page-container flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </AppLayout>
    );
  }

  const ov = analytics?.overview || {};

  // Radar chart data
  const radarData = [
    { skill: 'Technical',     score: ov.avgTechnical || 0 },
    { skill: 'Communication', score: ov.avgCommunication || 0 },
    { skill: 'Confidence',    score: ov.avgConfidence || 0 },
    { skill: 'Avg Score',     score: ov.avgScore || 0 },
  ];

  return (
    <AppLayout>
      <div className="page-container animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="page-title">📊 Analytics Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Track your interview performance and improvement</p>
          </div>
          <Link to="/interview" className="btn-primary">
            <Mic className="w-4 h-4" />Practice Now
          </Link>
        </div>

        {/* No data state */}
        {ov.completedInterviews === 0 && (
          <div className="card p-12 text-center mb-8 border-emerald-200 bg-emerald-50">
            <div className="text-5xl mb-4">🎤</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No interview data yet!</h2>
            <p className="text-slate-500 text-sm mb-6">Complete at least one interview to see your analytics.</p>
            <Link to="/interview" className="btn-primary btn-lg">
              <Zap className="w-4 h-4" />Start Your First Interview
            </Link>
          </div>
        )}

        {/* Stats overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Mic}         label="Total Interviews"   value={ov.totalInterviews}    color="blue"   />
          <StatCard icon={Award}       label="Avg Score"          value={ov.avgScore}    sub="/100"     color="emerald" trend={ov.improvement} />
          <StatCard icon={TrendingUp}  label="Best Score"         value={ov.bestScore}   sub="/100"     color="violet" />
          <StatCard icon={MessageSquare} label="Filler Words Used" value={ov.totalFillerWords}  color="amber"  />
        </div>

        {/* Charts row 1 */}
        {analytics?.scoreProgress?.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6 mb-6">

            {/* Score progress line chart */}
            <div className="lg:col-span-2 card p-6">
              <h2 className="section-heading">📈 Score Progress Over Time</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={analytics.scoreProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone" dataKey="score" name="Score"
                    stroke="#10b981" strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Skill radar */}
            <div className="card p-6">
              <h2 className="section-heading">🎯 Skill Breakdown</h2>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Charts row 2 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">

          {/* Interview type breakdown */}
          {analytics?.typeStats?.length > 0 && (
            <div className="card p-6">
              <h2 className="section-heading">🗂️ Interview Type Performance</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.typeStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avgScore" name="Avg Score" radius={[6, 6, 0, 0]}>
                    {analytics.typeStats.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ATS score progress */}
          {analytics?.atsProgress?.length > 0 && (
            <div className="card p-6">
              <h2 className="section-heading">📄 ATS Score Progress</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.atsProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="version" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" name="ATS Score" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Skill scores */}
        {ov.completedInterviews > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="section-heading">💡 Average Skill Scores</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Technical', value: ov.avgTechnical, color: 'bg-emerald-400' },
                { label: 'Communication', value: ov.avgCommunication, color: 'bg-blue-400' },
                { label: 'Confidence', value: ov.avgConfidence, color: 'bg-violet-400' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">{label}</span>
                    <span className="text-sm font-bold text-slate-800">{value || 0}/100</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`${color} h-2 rounded-full transition-all`}
                      style={{ width: `${value || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent sessions */}
        {analytics?.recentSessions?.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-heading mb-0">🕐 Recent Interviews</h2>
              <Link to="/interview" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
                New Interview <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {analytics.recentSessions.map((s) => (
                <div key={s._id}
                  className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Mic className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 capitalize">
                      {s.interviewType} Interview
                      {s.targetRole && <span className="text-slate-400 font-normal"> — {s.targetRole}</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {statusBadge(s.status)}
                      {s.durationMinutes && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{s.durationMinutes} mins
                        </span>
                      )}
                    </div>
                  </div>
                  {s.overallScore !== null && s.overallScore !== undefined && (
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-bold ${s.overallScore >= 75 ? 'text-emerald-600' : s.overallScore >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                        {s.overallScore}
                      </p>
                      <p className="text-xs text-slate-400">/100</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
        )}

      </div>
    </AppLayout>
  );
}