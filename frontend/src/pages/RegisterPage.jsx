import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', role: 'candidate',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'At least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      e.password = 'Must have uppercase, lowercase & number';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const data = await register(form);
      const dest = data.user.role === 'recruiter' ? '/recruiter' : '/dashboard';
      navigate(dest);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.';
      toast.error(msg);
      if (err.response?.data?.errors) {
        const fieldErrors = {};
        err.response.data.errors.forEach(e => { fieldErrors[e.field] = e.message; });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" fill="currentColor" />
            </div>
            <span className="font-bold text-gray-50 text-xl tracking-tight">
              Prep<span className="text-green-400">Pilot</span>
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-50 mb-2">Create your account</h1>
          <p className="text-gray-500 mb-8">Start your AI-powered interview journey today.</p>

          {/* Role toggle */}
          <div className="flex gap-2 p-1 bg-gray-800 rounded-lg mb-8">
            {['candidate', 'recruiter'].map(role => (
              <button
                key={role}
                type="button"
                onClick={() => setForm(p => ({ ...p, role }))}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium capitalize transition-all
                  ${form.role === role
                    ? 'bg-green-500 text-black shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                  }`}
              >
                {role === 'candidate' ? '🎓 Candidate' : '🏢 Recruiter'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <input
                  name="firstName" value={form.firstName}
                  onChange={handleChange} placeholder="John"
                  className={`input ${errors.firstName ? 'input-error' : ''}`}
                />
                {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  name="lastName" value={form.lastName}
                  onChange={handleChange} placeholder="Doe"
                  className={`input ${errors.lastName ? 'input-error' : ''}`}
                />
                {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <input
                type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="john@example.com"
                className={`input ${errors.email ? 'input-error' : ''}`}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password" value={form.password}
                  onChange={handleChange} placeholder="Min 8 chars, 1 upper, 1 number"
                  className={`input pr-12 ${errors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Creating Account...</>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-green-400 hover:text-green-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Feature highlights */}
      <div className="hidden lg:flex w-[420px] bg-gray-900 border-l border-gray-800
                      flex-col justify-center px-12 py-16">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-50 mb-3">
              Land your{' '}
              <span className="text-gradient">dream job</span>
              {' '}faster.
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI-powered interview practice, smart resume analysis, and real-time feedback.
              Everything you need to ace your next interview.
            </p>
          </div>

          {[
            { emoji: '📊', title: 'ATS Resume Scoring', desc: 'See exactly why your resume gets filtered out' },
            { emoji: '🎤', title: 'AI Interview Practice', desc: 'Adaptive questions based on your resume' },
            { emoji: '📈', title: 'Performance Analytics', desc: 'Track your improvement over time' },
            { emoji: '🎯', title: 'Skill Gap Analysis', desc: 'Know exactly what to learn next' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 text-lg">
                {emoji}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-100">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}