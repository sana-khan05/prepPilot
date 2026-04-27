import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resumeAPI } from '../api';
import api from '../api';
import AppLayout from '../components/AppLayout';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Sparkles, Loader2, CheckCircle2,
  AlertCircle, Star, TrendingUp, Shield,
  ChevronRight, RefreshCw, FileText,
} from 'lucide-react';

// ── ATS Score Circle ───────────────────────────────────
const ScoreCircle = ({ score }) => {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Work';
  const circumference = 2 * Math.PI * 45;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
          <circle cx="50" cy="50" r="45" fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">{score}</span>
          <span className="text-xs text-slate-500">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  );
};

// ── Section Rating Stars ───────────────────────────────
const SectionRating = ({ label, score, feedback }) => {
  const stars = Math.round(score || 0);
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-700 capitalize">{label}</p>
        {feedback && <p className="text-xs text-slate-500 mt-1">{feedback}</p>}
      </div>
      <div className="flex gap-0.5 flex-shrink-0">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className={`w-4 h-4 ${i <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
        ))}
      </div>
    </div>
  );
};

export default function ResumeDetailPage() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [jobDesc, setJobDesc] = useState('');
  const [polling, setPolling] = useState(false);

  const fetchResume = useCallback(async () => {
    try {
      const { data } = await resumeAPI.getOne(id);
      setResume(data.resume);
    } catch {
      toast.error('Failed to load resume.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchResult = useCallback(async () => {
    try {
      const { data } = await api.get(`/analysis/${id}/result`);
      if (data.status === 'completed') {
        setResult(data.result);
        setPolling(false);
        await fetchResume();
      }
    } catch {
      setPolling(false);
    }
  }, [id, fetchResume]);

  useEffect(() => { fetchResume(); }, [fetchResume]);

  // Poll for results after analysis starts
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(fetchResult, 3000);
    return () => clearInterval(interval);
  }, [polling, fetchResult]);

  // Load existing result if already analyzed
  useEffect(() => {
    if (resume?.isAnalyzed) fetchResult();
  }, [resume?.isAnalyzed, fetchResult]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await api.post(`/analysis/${id}/analyze`, { jobDescription: jobDesc });
      toast.success('Analysis started! Results will appear in ~15 seconds ⚡');
      setPolling(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const aiFeedback = result?.aiFeedback || null;

  if (loading) {
    return (
      <AppLayout>
        <div className="page-container flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container animate-fade-in">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/resumes" className="btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex-1">
            <h1 className="page-title">{resume?.label || 'My Resume'}</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {resume?.versionLabel} · {resume?.fileType?.toUpperCase()} · {resume?.fileSizeKB}KB
            </p>
          </div>
          {resume?.isAnalyzed && (
            <button onClick={handleAnalyze} disabled={analyzing || polling}
              className="btn-secondary btn-sm">
              <RefreshCw className="w-3.5 h-3.5" />Re-analyze
            </button>
          )}
        </div>

        {/* Not analyzed yet */}
        {!resume?.isAnalyzed && !polling && (
          <div className="card p-8 mb-6 text-center border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Analyze with AI</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
              Get your ATS score, skill gap analysis, bias detection and AI-powered improvement suggestions.
            </p>
            <div className="max-w-lg mx-auto mb-6">
              <label className="label text-left">Job Description (Optional but recommended)</label>
              <textarea
                value={jobDesc} onChange={e => setJobDesc(e.target.value)}
                placeholder="Paste the job description here for better ATS matching..."
                rows={4} className="input resize-none text-left"
              />
            </div>
            <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary btn-lg">
              {analyzing
                ? <><Loader2 className="w-4 h-4 animate-spin" />Starting Analysis...</>
                : <><Sparkles className="w-4 h-4" />Analyze My Resume</>
              }
            </button>
          </div>
        )}

        {/* Analyzing / polling */}
        {polling && (
          <div className="card p-8 mb-6 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">AI is analyzing your resume...</h2>
            <p className="text-slate-500 text-sm">This takes about 15-20 seconds. Please wait!</p>
            <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto mt-4 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">

            {/* ATS Score + Overview */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="card p-6 flex flex-col items-center gap-4">
                <h2 className="section-heading mb-0">ATS Score</h2>
                <ScoreCircle score={result.atsScore || 0} />
                <p className="text-xs text-slate-500 text-center">
                  Based on keywords, formatting & completeness
                </p>
              </div>

              <div className="md:col-span-2 card p-6">
                <h2 className="section-heading">📋 Overall Feedback</h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {aiFeedback?.overall || 'Analysis complete.'}
                </p>

                {/* ATS Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  {result.atsBreakdown && Object.entries(result.atsBreakdown).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-sm font-bold text-emerald-600">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section Ratings */}
            {aiFeedback?.sectionRatings && (
              <div className="card p-6">
                <h2 className="section-heading">⭐ Section Ratings</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {Object.entries(aiFeedback.sectionRatings).map(([key, val]) => (
                    <SectionRating key={key} label={key} score={val?.score} feedback={val?.feedback} />
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h2 className="section-heading text-emerald-700">✅ Strengths</h2>
                <div className="space-y-2">
                  {aiFeedback?.strengths?.map((s, i) => (
                    <div key={i} className="flex gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="section-heading text-amber-700">🔧 Improvements</h2>
                <div className="space-y-2">
                  {aiFeedback?.improvements?.map((imp, i) => (
                    <div key={i} className="flex gap-2.5 text-sm text-slate-600">
                      <TrendingUp className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      {imp}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h2 className="section-heading">🎯 Skills Found</h2>
                <div className="flex flex-wrap gap-2">
                  {result.extractedSkills?.map((s, i) => (
                    <span key={i} className="badge-green badge">{s}</span>
                  ))}
                  {!result.extractedSkills?.length && (
                    <p className="text-slate-400 text-sm">No skills detected</p>
                  )}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="section-heading text-red-700">❌ Missing Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {aiFeedback?.missingSkills?.map((s, i) => (
                    <span key={i} className="badge-red badge">{s}</span>
                  ))}
                  {!aiFeedback?.missingSkills?.length && (
                    <p className="text-slate-400 text-sm">No missing skills detected</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bias Flags */}
            {result.biasFlags?.length > 0 && (
              <div className="card p-6 border-amber-200 bg-amber-50">
                <h2 className="section-heading text-amber-700 flex items-center gap-2">
                  <Shield className="w-4 h-4" />Bias Detection
                </h2>
                <div className="space-y-2">
                  {result.biasFlags.map((flag, i) => (
                    <div key={i} className="flex gap-2.5 text-sm text-amber-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {flag}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Rewritten Bullets */}
            {aiFeedback?.rewrittenBullets?.length > 0 && (
              <div className="card p-6 border-emerald-200 bg-emerald-50">
                <h2 className="section-heading text-emerald-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />AI-Improved Bullet Points
                </h2>
                <div className="space-y-2">
                  {aiFeedback.rewrittenBullets.map((b, i) => (
                    <div key={i} className="flex gap-2.5 text-sm text-emerald-800">
                      <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </AppLayout>
  );
}