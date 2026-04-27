import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please enter email and password.'); return; }
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      const dest = from || (data.user.role === 'recruiter' ? '/recruiter' : '/dashboard');
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Left: branding panel */}
      <div className="hidden lg:flex w-[480px] bg-gradient-to-br from-emerald-500 to-teal-600
                      flex-col justify-between px-12 py-14 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="font-bold text-white text-xl tracking-tight">PrepPilot</span>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Your AI-powered<br />interview coach
            </h2>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Practice interviews, analyze your resume, and land your dream job with personalized AI feedback.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { emoji: '📊', title: 'ATS Resume Scoring', desc: 'Know exactly why you get filtered out' },
              { emoji: '🎤', title: 'AI Mock Interviews', desc: 'Adaptive questions from your resume' },
              { emoji: '📈', title: 'Progress Analytics', desc: 'Track improvement over every session' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 text-base">
                  {emoji}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-emerald-200 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-emerald-200 text-xs relative">© 2024 PrepPilot. All rights reserved.</p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-slate-800 text-xl">Prep<span className="text-emerald-500">Pilot</span></span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back!</h1>
          <p className="text-slate-500 text-sm mb-8">Sign in to continue your interview prep.</p>

          {from && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-sm text-amber-700">
              Please log in to access that page.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="you@example.com"
                autoComplete="email" className="input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password" value={form.password}
                  onChange={handleChange} placeholder="Your password"
                  autoComplete="current-password" className="input pr-12"
                />
                <button
                  type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
                : <>Sign In <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
