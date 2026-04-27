import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { resumeAPI } from '../api';
import AppLayout from '../components/AppLayout';
import toast from 'react-hot-toast';
import {
  Upload, FileText, Trash2, Download, Eye,
  Loader2, CheckCircle2, AlertCircle, Clock,
  ChevronRight, X, FilePlus,
} from 'lucide-react';

const DropZone = ({ onFile, uploading, progress }) => {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  const handleInput = (e) => {
    const file = e.target.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all
        ${dragging ? 'border-green-400 bg-green-500/5' : 'border-gray-700 hover:border-gray-600'}
        ${uploading ? 'pointer-events-none opacity-70' : 'cursor-pointer'}`}
      onClick={() => !uploading && document.getElementById('resume-input').click()}
    >
      <input
        id="resume-input" type="file"
        accept=".pdf,.doc,.docx" className="hidden"
        onChange={handleInput}
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
          <p className="text-sm text-gray-400">Uploading... {progress}%</p>
          <div className="w-48 bg-gray-800 rounded-full h-1.5">
            <div
              className="bg-green-400 h-1.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-200 font-medium mb-1">
            {dragging ? 'Drop it here!' : 'Drop your resume or click to browse'}
          </p>
          <p className="text-gray-600 text-sm">PDF, DOC, DOCX · Max 5MB</p>
        </>
      )}
    </div>
  );
};

const ResumeCard = ({ resume, onDelete, onDownload }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!confirm('Delete this resume? This cannot be undone.')) return;
    setDeleting(true);
    await onDelete(resume._id);
    setDeleting(false);
  };

  return (
    <div className="card-hover p-5 flex gap-4 group">
      {/* Icon */}
      <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-blue-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-100 truncate">{resume.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {resume.versionLabel} · {resume.fileType?.toUpperCase()} · {resume.fileSizeKB}KB
            </p>
          </div>
          {resume.isLatest && (
            <span className="badge-green badge flex-shrink-0">Latest</span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3">
          {resume.isAnalyzed ? (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-green-400 font-medium">ATS: {resume.atsScore}/100</span>
              </div>
              <span className="badge-green badge"><CheckCircle2 className="w-3 h-3" />Analyzed</span>
            </>
          ) : (
            <span className="badge-amber badge">
              <Clock className="w-3 h-3" />Pending Analysis
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onDownload(resume._id, resume.originalName)}
          className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center 
                     justify-center text-gray-400 hover:text-gray-200 transition-colors"
          title="Download"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <Link
          to={`/resumes/${resume._id}`}
          className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center 
                     justify-center text-gray-400 hover:text-gray-200 transition-colors"
          title="View Details"
        >
          <Eye className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center 
                     justify-center text-red-400 hover:text-red-300 transition-colors"
          title="Delete"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadForm, setUploadForm] = useState({ label: '', targetRole: '', versionLabel: '' });

  const fetchResumes = useCallback(async () => {
    try {
      const { data } = await resumeAPI.getAll();
      setResumes(data.resumes);
    } catch {
      toast.error('Failed to load resumes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResumes(); }, [fetchResumes]);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    if (uploadForm.label) formData.append('label', uploadForm.label);
    if (uploadForm.targetRole) formData.append('targetRole', uploadForm.targetRole);
    if (uploadForm.versionLabel) formData.append('versionLabel', uploadForm.versionLabel);

    setUploading(true);
    setUploadProgress(0);

    try {
      await resumeAPI.upload(formData, (e) => {
        setUploadProgress(Math.round((e.loaded * 100) / e.total));
      });
      toast.success('Resume uploaded! 🎉');
      setUploadForm({ label: '', targetRole: '', versionLabel: '' });
      await fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    try {
      await resumeAPI.delete(id);
      setResumes(prev => prev.filter(r => r._id !== id));
      toast.success('Resume deleted.');
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const handleDownload = async (id, name) => {
    try {
      const { data } = await resumeAPI.download(id);
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed.');
    }
  };

  return (
    <AppLayout>
      <div className="page-container animate-fade-in">
        <div className="mb-8">
          <h1 className="page-title">My Resumes</h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload and manage your resumes. AI analysis coming in Phase 2.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Upload section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-6">
              <h2 className="section-heading flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-green-400" />
                Upload Resume
              </h2>

              {/* Optional label */}
              <div className="space-y-3 mb-4">
                <input
                  value={uploadForm.label}
                  onChange={e => setUploadForm(p => ({ ...p, label: e.target.value }))}
                  placeholder='Label (e.g. "Google SDE Application")'
                  className="input text-sm"
                />
                <select
                  value={uploadForm.targetRole}
                  onChange={e => setUploadForm(p => ({ ...p, targetRole: e.target.value }))}
                  className="input text-sm text-gray-500"
                >
                  <option value="">Target Role (optional)</option>
                  <option value="software-engineer">Software Engineer</option>
                  <option value="data-analyst">Data Analyst</option>
                  <option value="ml-engineer">ML Engineer</option>
                  <option value="product-manager">Product Manager</option>
                  <option value="devops">DevOps</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <DropZone onFile={handleUpload} uploading={uploading} progress={uploadProgress} />

              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  AI analysis (ATS score, skill gap) activates in Phase 2
                </p>
              </div>
            </div>
          </div>

          {/* Resumes list */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-heading mb-0">
                All Resumes
                {resumes.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-600">({resumes.length})</span>
                )}
              </h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : resumes.length ? (
              <div className="space-y-3">
                {resumes.map(r => (
                  <ResumeCard
                    key={r._id}
                    resume={r}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                  />
                ))}
              </div>
            ) : (
              <div className="card flex flex-col items-center py-16 gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
                <div className="text-center">
                  <p className="text-gray-300 font-medium">No resumes uploaded yet</p>
                  <p className="text-gray-600 text-sm mt-1">Upload your first resume to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
