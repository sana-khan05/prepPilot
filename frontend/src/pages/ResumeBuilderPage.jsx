import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import api from '../api';
import toast from 'react-hot-toast';
import {
  Sparkles, Loader2, Plus, Trash2, ChevronDown,
  ChevronUp, Download, Copy, CheckCircle2, Star,
  TrendingUp, FileText, User, Briefcase, GraduationCap,
  Code, Award,
} from 'lucide-react';

// ── Section wrapper ────────────────────────────────────
const Section = ({ icon: Icon, title, children, color = 'emerald' }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-${color}-50 border border-${color}-100 flex items-center justify-center`}>
            <Icon className={`w-4 h-4 text-${color}-600`} />
          </div>
          <span className="font-semibold text-slate-800">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-100">{children}</div>}
    </div>
  );
};

// ── Generated resume display ───────────────────────────
const ResumePreview = ({ resume, userInfo }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `${userInfo.name}
${userInfo.email} | ${userInfo.phone} | ${userInfo.location}
${userInfo.linkedin || ''} | ${userInfo.github || ''}

SUMMARY
${resume.summary}

SKILLS
Technical: ${resume.skills?.technical?.join(', ')}
Tools: ${resume.skills?.tools?.join(', ')}
Soft Skills: ${resume.skills?.soft?.join(', ')}

EXPERIENCE
${resume.experience?.map(e => `${e.title} at ${e.company} (${e.duration})\n${e.bullets?.map(b => `• ${b}`).join('\n')}`).join('\n\n')}

PROJECTS
${resume.projects?.map(p => `${p.name}\n${p.bullets?.map(b => `• ${b}`).join('\n')}\nTech: ${p.tech?.join(', ')}`).join('\n\n')}

EDUCATION
${resume.education?.map(e => `${e.degree} — ${e.institution} (${e.duration})`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Resume text copied! Paste into Word/Google Docs');
  };

  return (
    <div className="space-y-4">
      {/* ATS Score */}
      <div className="card p-5 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Predicted ATS Score</p>
            <p className="text-3xl font-bold text-emerald-600 font-mono">{resume.atsScore}<span className="text-lg text-emerald-400">/100</span></p>
          </div>
          <button onClick={handleCopy} className="btn-primary btn-sm">
            {copied ? <><CheckCircle2 className="w-3.5 h-3.5" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy Text</>}
          </button>
        </div>
      </div>

      {/* Resume content */}
      <div className="card p-6 space-y-5">
        {/* Header */}
        <div className="text-center pb-4 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900">{userInfo.name}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {userInfo.email} · {userInfo.phone} · {userInfo.location}
          </p>
          {(userInfo.linkedin || userInfo.github) && (
            <p className="text-xs text-emerald-600 mt-1">
              {userInfo.linkedin} {userInfo.github && `· ${userInfo.github}`}
            </p>
          )}
        </div>

        {/* Summary */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Summary</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{resume.summary}</p>
        </div>

        {/* Skills */}
        {resume.skills && (
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Skills</h3>
            <div className="space-y-2">
              {resume.skills.technical?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-600 w-20 flex-shrink-0">Technical:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.skills.technical.map((s, i) => <span key={i} className="badge-green badge">{s}</span>)}
                  </div>
                </div>
              )}
              {resume.skills.tools?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-600 w-20 flex-shrink-0">Tools:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.skills.tools.map((s, i) => <span key={i} className="badge-blue badge">{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Experience */}
        {resume.experience?.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Experience</h3>
            {resume.experience.map((exp, i) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-bold text-slate-800">{exp.title}</p>
                  <span className="text-xs text-slate-400">{exp.duration}</span>
                </div>
                <p className="text-xs text-emerald-600 font-medium mb-2">{exp.company}</p>
                <ul className="space-y-1">
                  {exp.bullets?.map((b, j) => (
                    <li key={j} className="text-xs text-slate-600 flex gap-2">
                      <span className="text-emerald-500 flex-shrink-0">•</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {resume.projects?.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Projects</h3>
            {resume.projects.map((proj, i) => (
              <div key={i} className="mb-4">
                <p className="text-sm font-bold text-slate-800">{proj.name}</p>
                <p className="text-xs text-slate-500 mb-1">{proj.description}</p>
                <ul className="space-y-1 mb-2">
                  {proj.bullets?.map((b, j) => (
                    <li key={j} className="text-xs text-slate-600 flex gap-2">
                      <span className="text-emerald-500 flex-shrink-0">•</span>{b}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-1">
                  {proj.tech?.map((t, j) => <span key={j} className="badge-gray badge text-xs">{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {resume.education?.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Education</h3>
            {resume.education.map((edu, i) => (
              <div key={i} className="flex justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{edu.degree}</p>
                  <p className="text-xs text-slate-500">{edu.institution}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{edu.duration}</p>
                  {edu.gpa && <p className="text-xs text-emerald-600 font-medium">GPA: {edu.gpa}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Improvements */}
      {resume.improvements?.length > 0 && (
        <div className="card p-5 border-amber-200 bg-amber-50">
          <h3 className="text-sm font-bold text-amber-700 mb-3">💡 AI Suggestions</h3>
          {resume.improvements.map((imp, i) => (
            <div key={i} className="flex gap-2 text-xs text-amber-700 mb-2">
              <TrendingUp className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{imp}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ResumeBuilderPage() {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: '', email: '', phone: '', location: '',
    linkedin: '', github: '', targetRole: '',
    experienceLevel: 'fresher', summary: '', skills: '',
    certifications: '',
  });

  const [experience, setExperience] = useState([
    { title: '', company: '', duration: '', description: '' }
  ]);

  const [education, setEducation] = useState([
    { degree: '', institution: '', duration: '', gpa: '' }
  ]);

  const [projects, setProjects] = useState([
    { name: '', description: '', tech: '' }
  ]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const updateExp = (i, field, val) => {
    const updated = [...experience];
    updated[i][field] = val;
    setExperience(updated);
  };

  const updateEdu = (i, field, val) => {
    const updated = [...education];
    updated[i][field] = val;
    setEducation(updated);
  };

  const updateProj = (i, field, val) => {
    const updated = [...projects];
    updated[i][field] = val;
    setProjects(updated);
  };

  const handleGenerate = async () => {
    if (!form.name || !form.email || !form.targetRole) {
      toast.error('Please fill Name, Email and Target Role!');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/builder/generate', {
        ...form,
        experience,
        education,
        projects,
      });
      setGenerated(data.resume);
      setUserInfo(data.userInfo);
      toast.success('Resume generated! 🎉');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-container animate-fade-in">
        <div className="mb-8">
          <h1 className="page-title">🏗️ AI Resume Builder</h1>
          <p className="text-slate-500 text-sm mt-1">
            Fill in your details — AI will generate a professional, ATS-optimized resume!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-4">

            {/* Personal Info */}
            <Section icon={User} title="Personal Information">
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="col-span-2">
                  <label className="label">Full Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Sana Khan" className="input" />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input name="email" value={form.email} onChange={handleChange} placeholder="sana@email.com" className="input" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9999999999" className="input" />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input name="location" value={form.location} onChange={handleChange} placeholder="Noida, India" className="input" />
                </div>
                <div>
                  <label className="label">Target Role *</label>
                  <input name="targetRole" value={form.targetRole} onChange={handleChange} placeholder="Data Scientist" className="input" />
                </div>
                <div>
                  <label className="label">LinkedIn</label>
                  <input name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="linkedin.com/in/username" className="input" />
                </div>
                <div>
                  <label className="label">GitHub</label>
                  <input name="github" value={form.github} onChange={handleChange} placeholder="github.com/username" className="input" />
                </div>
                <div>
                  <label className="label">Experience Level</label>
                  <select name="experienceLevel" value={form.experienceLevel} onChange={handleChange} className="input">
                    <option value="fresher">Fresher</option>
                    <option value="junior">Junior (1-2 yrs)</option>
                    <option value="mid">Mid (3-5 yrs)</option>
                    <option value="senior">Senior (5+ yrs)</option>
                  </select>
                </div>
              </div>
            </Section>

            {/* Skills */}
            <Section icon={Code} title="Skills">
              <div className="mt-4 space-y-3">
                <div>
                  <label className="label">All Skills (comma separated)</label>
                  <textarea name="skills" value={form.skills} onChange={handleChange}
                    placeholder="Python, React, Node.js, MongoDB, Machine Learning, SQL, Git..."
                    rows={3} className="input resize-none" />
                </div>
                <div>
                  <label className="label">Summary (optional — AI will generate if empty)</label>
                  <textarea name="summary" value={form.summary} onChange={handleChange}
                    placeholder="Brief professional summary..."
                    rows={3} className="input resize-none" />
                </div>
              </div>
            </Section>

            {/* Experience */}
            <Section icon={Briefcase} title="Experience">
              <div className="mt-4 space-y-4">
                {experience.map((exp, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">Experience {i + 1}</span>
                      {experience.length > 1 && (
                        <button onClick={() => setExperience(experience.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input value={exp.title} onChange={e => updateExp(i, 'title', e.target.value)}
                      placeholder="Job Title / Internship" className="input text-sm" />
                    <input value={exp.company} onChange={e => updateExp(i, 'company', e.target.value)}
                      placeholder="Company Name" className="input text-sm" />
                    <input value={exp.duration} onChange={e => updateExp(i, 'duration', e.target.value)}
                      placeholder="Jan 2024 - Jun 2024" className="input text-sm" />
                    <textarea value={exp.description} onChange={e => updateExp(i, 'description', e.target.value)}
                      placeholder="Describe what you did... AI will convert to bullet points"
                      rows={2} className="input resize-none text-sm" />
                  </div>
                ))}
                <button onClick={() => setExperience([...experience, { title: '', company: '', duration: '', description: '' }])}
                  className="btn-secondary btn-sm w-full">
                  <Plus className="w-3.5 h-3.5" />Add Experience
                </button>
              </div>
            </Section>

            {/* Education */}
            <Section icon={GraduationCap} title="Education">
              <div className="mt-4 space-y-4">
                {education.map((edu, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <input value={edu.degree} onChange={e => updateEdu(i, 'degree', e.target.value)}
                      placeholder="B.Tech in AI & Data Science" className="input text-sm" />
                    <input value={edu.institution} onChange={e => updateEdu(i, 'institution', e.target.value)}
                      placeholder="Galgotias University" className="input text-sm" />
                    <div className="grid grid-cols-2 gap-3">
                      <input value={edu.duration} onChange={e => updateEdu(i, 'duration', e.target.value)}
                        placeholder="2023 - 2027" className="input text-sm" />
                      <input value={edu.gpa} onChange={e => updateEdu(i, 'gpa', e.target.value)}
                        placeholder="GPA: 8.5" className="input text-sm" />
                    </div>
                  </div>
                ))}
                <button onClick={() => setEducation([...education, { degree: '', institution: '', duration: '', gpa: '' }])}
                  className="btn-secondary btn-sm w-full">
                  <Plus className="w-3.5 h-3.5" />Add Education
                </button>
              </div>
            </Section>

            {/* Projects */}
            <Section icon={FileText} title="Projects">
              <div className="mt-4 space-y-4">
                {projects.map((proj, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">Project {i + 1}</span>
                      {projects.length > 1 && (
                        <button onClick={() => setProjects(projects.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <input value={proj.name} onChange={e => updateProj(i, 'name', e.target.value)}
                      placeholder="Project Name" className="input text-sm" />
                    <textarea value={proj.description} onChange={e => updateProj(i, 'description', e.target.value)}
                      placeholder="What did you build? What problem did it solve?"
                      rows={2} className="input resize-none text-sm" />
                    <input value={proj.tech} onChange={e => updateProj(i, 'tech', e.target.value)}
                      placeholder="Tech Stack: React, Node.js, MongoDB" className="input text-sm" />
                  </div>
                ))}
                <button onClick={() => setProjects([...projects, { name: '', description: '', tech: '' }])}
                  className="btn-secondary btn-sm w-full">
                  <Plus className="w-3.5 h-3.5" />Add Project
                </button>
              </div>
            </Section>

            {/* Certifications */}
            <Section icon={Award} title="Certifications">
              <div className="mt-4">
                <textarea name="certifications" value={form.certifications} onChange={handleChange}
                  placeholder="Python - Meta, Data Analytics - IBM, Oracle SQL..."
                  rows={3} className="input resize-none" />
              </div>
            </Section>

            {/* Generate button */}
            <button onClick={handleGenerate} disabled={loading} className="btn-primary btn-lg w-full">
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" />AI is generating your resume...</>
                : <><Sparkles className="w-5 h-5" />Generate My Resume with AI</>
              }
            </button>
          </div>

          {/* Right: Preview */}
          <div>
            {generated ? (
              <ResumePreview resume={generated} userInfo={userInfo} />
            ) : (
              <div className="card p-10 text-center sticky top-8 border-dashed border-2 border-slate-200">
                <div className="text-5xl mb-4">📄</div>
                <h3 className="font-bold text-slate-700 mb-2">Your Resume Preview</h3>
                <p className="text-slate-400 text-sm">
                  Fill in the form and click "Generate" — AI will create a professional resume for you!
                </p>
                <div className="mt-6 space-y-2 text-left">
                  {['ATS-optimized content', 'Power verbs & action words', 'Quantified achievements', 'Professional summary', 'Predicted ATS score'].map((f, i) => (
                    <div key={i} className="flex gap-2 text-xs text-slate-500">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />{f}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}