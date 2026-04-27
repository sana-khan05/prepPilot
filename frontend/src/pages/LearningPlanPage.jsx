import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import api from '../api';
import toast from 'react-hot-toast';
import {
  BookOpen, Loader2, Sparkles, Youtube,
  ExternalLink, CheckCircle2, Clock, Target,
  ChevronRight, Zap,
} from 'lucide-react';

const typeColors = {
  video:    { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200',    icon: '🎥' },
  article:  { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200',   icon: '📄' },
  course:   { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', icon: '🎓' },
  practice: { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200',  icon: '💻' },
};

export default function LearningPlanPage() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState({
    targetRole: '',
    weaknesses: '',
  });

  const handleGenerate = async () => {
    if (!form.targetRole) { toast.error('Please enter your target role!'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/builder/learning-plan', {
        targetRole: form.targetRole,
        weaknesses: form.weaknesses.split(',').map(w => w.trim()).filter(Boolean),
      });
      setPlan(data.plan);
      toast.success('Learning plan generated! 📚');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-container animate-fade-in max-w-4xl">
        <div className="mb-8">
          <h1 className="page-title">📚 Learning Recommendations</h1>
          <p className="text-slate-500 text-sm mt-1">
            Get a personalized study plan based on your weak areas
          </p>
        </div>

        {/* Input form */}
        {!plan && (
          <div className="card p-8 max-w-xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Generate Your Study Plan</h2>
              <p className="text-slate-500 text-sm mt-1">AI will create a personalized 3-week roadmap</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Target Role *</label>
                <input value={form.targetRole}
                  onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))}
                  placeholder="e.g. Data Scientist, Full Stack Developer"
                  className="input" />
              </div>
              <div>
                <label className="label">Weak Areas (optional — comma separated)</label>
                <textarea value={form.weaknesses}
                  onChange={e => setForm(p => ({ ...p, weaknesses: e.target.value }))}
                  placeholder="e.g. System Design, SQL, Communication, STAR method..."
                  rows={3} className="input resize-none" />
                <p className="text-xs text-slate-400 mt-1">Leave empty for a general plan</p>
              </div>

              <button onClick={handleGenerate} disabled={loading} className="btn-primary btn-lg w-full">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Plan...</>
                  : <><Sparkles className="w-4 h-4" />Generate My Learning Plan</>
                }
              </button>
            </div>
          </div>
        )}

        {/* Plan display */}
        {plan && (
          <div className="space-y-6 animate-fade-in">

            {/* Header stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{plan.weeklyPlan?.length || 3}</p>
                <p className="text-xs text-slate-500 mt-1">Weeks Plan</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{plan.topicsToRevise?.length || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Topics to Cover</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-lg font-bold text-violet-600">{plan.estimatedTime || '3 weeks'}</p>
                <p className="text-xs text-slate-500 mt-1">Estimated Time</p>
              </div>
            </div>

            {/* Quick wins */}
            {plan.quickWins?.length > 0 && (
              <div className="card p-6 border-emerald-200 bg-emerald-50">
                <h2 className="section-heading text-emerald-700 flex items-center gap-2">
                  <Zap className="w-4 h-4" />Quick Wins — Do These First!
                </h2>
                <div className="space-y-2">
                  {plan.quickWins.map((tip, i) => (
                    <div key={i} className="flex gap-2.5 text-sm text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />{tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Topics to revise */}
            {plan.topicsToRevise?.length > 0 && (
              <div className="card p-6">
                <h2 className="section-heading flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />Topics to Revise
                </h2>
                <div className="flex flex-wrap gap-2">
                  {plan.topicsToRevise.map((t, i) => (
                    <span key={i} className="badge-blue badge">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly plan */}
            {plan.weeklyPlan?.map((week, i) => (
              <div key={i} className="card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-bold text-lg flex items-center justify-center">
                    {week.week}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">Week {week.week}</h2>
                    <p className="text-sm text-emerald-600">{week.focus}</p>
                  </div>
                </div>

                {/* Tasks */}
                <div className="mb-5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">📋 Tasks</p>
                  <div className="space-y-2">
                    {week.tasks?.map((task, j) => (
                      <div key={j} className="flex gap-2.5 text-sm text-slate-600">
                        <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />{task}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resources */}
                {week.resources?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">🔗 Resources</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {week.resources.map((res, j) => {
                        const tc = typeColors[res.type] || typeColors.article;
                        return (
                          <a key={j} href={res.url} target="_blank" rel="noopener noreferrer"
                            className={`flex items-center gap-3 p-3 rounded-xl border ${tc.border} ${tc.bg} hover:shadow-sm transition-all`}>
                            <span className="text-xl">{tc.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold ${tc.text} truncate`}>{res.title}</p>
                              <span className={`text-xs ${tc.text} opacity-70 capitalize`}>{res.type}</span>
                            </div>
                            <ExternalLink className={`w-3.5 h-3.5 ${tc.text} flex-shrink-0`} />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Generate new plan */}
            <button onClick={() => setPlan(null)} className="btn-secondary w-full">
              Generate New Plan
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}