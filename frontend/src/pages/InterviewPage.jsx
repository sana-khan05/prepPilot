import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resumeAPI, interviewAPI } from '../api';
import AppLayout from '../components/AppLayout';
import toast from 'react-hot-toast';
import {
  Mic, MicOff, ChevronRight, Loader2, CheckCircle2,
  Clock, Star, TrendingUp, AlertCircle, Sparkles,
  RotateCcw, Trophy, Target, MessageSquare,
} from 'lucide-react';

// ── Interview type cards ───────────────────────────────
const InterviewTypeCard = ({ type, emoji, title, desc, selected, onClick }) => (
  <button onClick={() => onClick(type)}
    className={`p-4 rounded-xl border-2 text-left transition-all w-full
      ${selected
        ? 'border-emerald-400 bg-emerald-50 shadow-sm'
        : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30'
      }`}>
    <div className="text-2xl mb-2">{emoji}</div>
    <p className={`text-sm font-bold ${selected ? 'text-emerald-700' : 'text-slate-700'}`}>{title}</p>
    <p className="text-xs text-slate-500 mt-1">{desc}</p>
  </button>
);

// ── Score badge ────────────────────────────────────────
const ScoreBadge = ({ score }) => {
  const color = score >= 7 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : score >= 5 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-600 bg-red-50 border-red-200';
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold border ${color}`}>
      <Star className="w-3.5 h-3.5" />{score}/10
    </span>
  );
};

export default function InterviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Setup state
  const [phase, setPhase] = useState('setup'); // setup | interview | result
  const [interviewType, setInterviewType] = useState('technical');
  const [targetRole, setTargetRole] = useState('');
  const [difficulty, setDifficulty] = useState('adaptive');
  const [selectedResume, setSelectedResume] = useState('');
  const [resumes, setResumes] = useState([]);

  // Interview state
  const [session, setSession] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [showEval, setShowEval] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerActive, setTimerActive] = useState(false);
  const [report, setReport] = useState(null);
  const timerRef = useRef(null);

  // Load resumes
  useEffect(() => {
    resumeAPI.getAll().then(r => setResumes(r.data.resumes || []));
  }, []);

  // Timer
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      clearInterval(timerRef.current);
      toast('Time up! Moving to next question.', { icon: '⏱️' });
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, timeLeft]);

  const formatTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  // Start interview
  const handleStart = async () => {
    setLoading(true);
    try {
      const { data } = await interviewAPI.start({
        interviewType,
        targetRole: targetRole || user?.targetRole || 'Software Developer',
        difficulty,
        resumeId: selectedResume || undefined,
      });
      setSession(data.session);
      setCurrentIndex(0);
      setPhase('interview');
      setTimeLeft(120);
      setTimerActive(true);
      toast.success('Interview started! 🎤 Good luck!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start interview.');
    } finally {
      setLoading(false);
    }
  };

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (!answer.trim()) { toast.error('Please write your answer!'); return; }
    setLoading(true);
    clearInterval(timerRef.current);
    setTimerActive(false);

    try {
      const { data } = await interviewAPI.submitAnswer(session.id, {
        questionIndex: currentIndex,
        answer,
      });
      setEvaluation(data.evaluation);
      setShowEval(true);
    } catch (err) {
      toast.error('Failed to evaluate answer.');
    } finally {
      setLoading(false);
    }
  };

  // Next question
  const handleNext = async () => {
    const isLast = currentIndex + 1 >= session.questions.length;

    if (isLast) {
      // Complete interview
      setLoading(true);
      try {
        const { data } = await interviewAPI.complete(session.id);
        setReport(data.report);
        setPhase('result');
        toast.success('Interview complete! 🎉');
      } catch (err) {
        toast.error('Failed to generate report.');
      } finally {
        setLoading(false);
      }
    } else {
      setCurrentIndex(i => i + 1);
      setAnswer('');
      setEvaluation(null);
      setShowEval(false);
      setTimeLeft(120);
      setTimerActive(true);
    }
  };

  const currentQuestion = session?.questions?.[currentIndex];
  const progress = session ? Math.round(((currentIndex) / session.questions.length) * 100) : 0;

  // ── SETUP PHASE ────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <AppLayout>
        <div className="page-container animate-fade-in max-w-4xl">
          <div className="mb-8">
            <h1 className="page-title">🎤 AI Mock Interview</h1>
            <p className="text-slate-500 text-sm mt-1">
              Practice with our adaptive AI interviewer. Questions generated from your resume!
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              {/* Interview Type */}
              <div className="card p-6">
                <h2 className="section-heading">1️⃣ Choose Interview Type</h2>
                <div className="grid grid-cols-2 gap-3">
                  <InterviewTypeCard type="technical" emoji="💻" title="Technical" desc="DSA, system design, coding concepts" selected={interviewType==='technical'} onClick={setInterviewType} />
                  <InterviewTypeCard type="hr" emoji="🤝" title="HR Round" desc="Company fit, career goals, salary" selected={interviewType==='hr'} onClick={setInterviewType} />
                  <InterviewTypeCard type="behavioral" emoji="🎯" title="Behavioral" desc="STAR method, past experiences" selected={interviewType==='behavioral'} onClick={setInterviewType} />
                  <InterviewTypeCard type="mixed" emoji="🔀" title="Mixed" desc="Combination of all types" selected={interviewType==='mixed'} onClick={setInterviewType} />
                </div>
              </div>

              {/* Target Role */}
              <div className="card p-6">
                <h2 className="section-heading">2️⃣ Target Role & Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Target Role</label>
                    <input value={targetRole} onChange={e => setTargetRole(e.target.value)}
                      placeholder="e.g. Data Scientist, Full Stack Developer"
                      className="input" />
                  </div>
                  <div>
                    <label className="label">Difficulty</label>
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input">
                      <option value="adaptive">Adaptive (Recommended)</option>
                      <option value="easy">Easy — Fresher level</option>
                      <option value="medium">Medium — 1-2 years exp</option>
                      <option value="hard">Hard — Senior level</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Resume (Optional — for personalized questions)</label>
                    <select value={selectedResume} onChange={e => setSelectedResume(e.target.value)} className="input">
                      <option value="">No resume — use general questions</option>
                      {resumes.map(r => (
                        <option key={r._id} value={r._id}>{r.label} ({r.versionLabel})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side info */}
            <div className="space-y-4">
              <div className="card p-5 border-emerald-200 bg-emerald-50">
                <h3 className="text-sm font-bold text-emerald-700 mb-3">📋 How it works</h3>
                <div className="space-y-2 text-xs text-emerald-700">
                  {['8 AI-generated questions', '2 minutes per question', 'Real-time AI evaluation', 'Detailed performance report', 'Improvement suggestions'].map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-3">💡 Tips</h3>
                <div className="space-y-2 text-xs text-slate-500">
                  <p>✅ Use STAR method for behavioral questions</p>
                  <p>✅ Be specific with examples</p>
                  <p>✅ Avoid filler words (um, uh, like)</p>
                  <p>✅ Structure your answers clearly</p>
                </div>
              </div>

              <button onClick={handleStart} disabled={loading}
                className="btn-primary btn-lg w-full">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Questions...</>
                  : <><Sparkles className="w-4 h-4" />Start Interview</>
                }
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── INTERVIEW PHASE ────────────────────────────────────
  if (phase === 'interview') {
    return (
      <AppLayout>
        <div className="page-container animate-fade-in max-w-3xl">

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-600">
                Question {currentIndex + 1} of {session.questions.length}
              </span>
              <div className={`flex items-center gap-1.5 text-sm font-bold
                ${timeLeft <= 30 ? 'text-red-500' : 'text-slate-600'}`}>
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-emerald-400 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Question card */}
          <div className="card p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge-blue badge capitalize">{currentQuestion?.topic || interviewType}</span>
              <span className={`badge capitalize
                ${currentQuestion?.difficulty === 'hard' ? 'badge-red'
                  : currentQuestion?.difficulty === 'easy' ? 'badge-green'
                  : 'badge-amber'}`}>
                {currentQuestion?.difficulty || 'medium'}
              </span>
            </div>

            <h2 className="text-lg font-semibold text-slate-900 leading-relaxed">
              {currentQuestion?.questionText}
            </h2>
          </div>

          {/* Answer area */}
          {!showEval ? (
            <div className="card p-6">
              <label className="label">Your Answer</label>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here... Be specific and structured. Use STAR method for behavioral questions."
                rows={6}
                className="input resize-none mb-4"
                disabled={loading}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{answer.length} characters</span>
                <button onClick={handleSubmitAnswer} disabled={loading || !answer.trim()}
                  className="btn-primary">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Evaluating...</>
                    : <>Submit Answer <ChevronRight className="w-4 h-4" /></>
                  }
                </button>
              </div>
            </div>
          ) : (
            /* Evaluation result */
            <div className="space-y-4 animate-fade-in">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800">AI Feedback</h3>
                  <ScoreBadge score={evaluation?.score || 0} />
                </div>

                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {evaluation?.feedback}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {evaluation?.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-emerald-700 mb-2">✅ Strengths</p>
                      {evaluation.strengths.map((s, i) => (
                        <p key={i} className="text-xs text-slate-600 flex gap-1.5 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />{s}
                        </p>
                      ))}
                    </div>
                  )}
                  {evaluation?.improvements?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-amber-700 mb-2">🔧 Improvements</p>
                      {evaluation.improvements.map((imp, i) => (
                        <p key={i} className="text-xs text-slate-600 flex gap-1.5 mb-1">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />{imp}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {evaluation?.fillerWords?.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs font-bold text-amber-700">
                      ⚠️ Filler words detected: {evaluation.fillerWords.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              <button onClick={handleNext} disabled={loading}
                className="btn-primary btn-lg w-full">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Report...</>
                  : currentIndex + 1 >= session.questions.length
                    ? <><Trophy className="w-4 h-4" />Finish & Get Report</>
                    : <>Next Question <ChevronRight className="w-4 h-4" /></>
                }
              </button>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // ── RESULT PHASE ───────────────────────────────────────
  if (phase === 'result' && report) {
    const scoreColor = report.overallScore >= 75 ? 'text-emerald-600'
      : report.overallScore >= 50 ? 'text-amber-600' : 'text-red-600';

    return (
      <AppLayout>
        <div className="page-container animate-fade-in max-w-3xl">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="page-title">Interview Complete!</h1>
            <p className="text-slate-500 text-sm mt-1">Here's your performance report</p>
          </div>

          {/* Overall score */}
          <div className="card p-8 text-center mb-6 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
            <p className={`text-7xl font-bold ${scoreColor} mb-2`}>{report.overallScore}</p>
            <p className="text-slate-500 text-sm">/100 Overall Score</p>
            <p className="text-slate-600 text-sm mt-4 max-w-lg mx-auto leading-relaxed">
              {report.summary}
            </p>
            <div className="flex justify-center gap-4 mt-4 text-sm text-slate-500">
              <span>⏱️ {report.durationMinutes} mins</span>
              <span>💬 {report.fillerWordCount || 0} filler words</span>
            </div>
          </div>

          {/* Score breakdown */}
          {report.scores && (
            <div className="card p-6 mb-6">
              <h2 className="section-heading">📊 Score Breakdown</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(report.scores).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-sm text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className={`text-sm font-bold ${val >= 75 ? 'text-emerald-600' : val >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {val}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="card p-6">
              <h2 className="section-heading text-emerald-700">✅ Strengths</h2>
              {report.strengths?.map((s, i) => (
                <div key={i} className="flex gap-2.5 text-sm text-slate-600 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />{s}
                </div>
              ))}
            </div>
            <div className="card p-6">
              <h2 className="section-heading text-amber-700">🔧 Areas to Improve</h2>
              {report.weaknesses?.map((w, i) => (
                <div key={i} className="flex gap-2.5 text-sm text-slate-600 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />{w}
                </div>
              ))}
            </div>
          </div>

          {/* Improvement plan */}
          <div className="card p-6 mb-6">
            <h2 className="section-heading">🎯 Your Improvement Plan</h2>
            {report.improvementPlan?.map((plan, i) => (
              <div key={i} className="flex gap-3 mb-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i+1}
                </div>
                <p className="text-sm text-slate-600">{plan}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={() => { setPhase('setup'); setSession(null); setReport(null); setCurrentIndex(0); setAnswer(''); setEvaluation(null); setShowEval(false); }}
              className="btn-secondary flex-1">
              <RotateCcw className="w-4 h-4" />Practice Again
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-primary flex-1">
              <Target className="w-4 h-4" />Go to Dashboard
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return null;
}
