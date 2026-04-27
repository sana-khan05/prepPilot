import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import toast from 'react-hot-toast';
import { Loader2, Save, User, Link as LinkIcon, Briefcase } from 'lucide-react';
import { authAPI } from '../api';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    linkedinUrl: user?.linkedinUrl || '',
    githubUrl: user?.githubUrl || '',
    targetRole: user?.targetRole || '',
    experienceLevel: user?.experienceLevel || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast.error('Both fields required.'); return;
    }
    setSavingPw(true);
    try {
      await authAPI.changePassword(pwForm);
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-container animate-fade-in max-w-3xl">
        <h1 className="page-title mb-8">My Profile</h1>

        {/* Avatar + name header */}
        <div className="card p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 
                          flex items-center justify-center text-black font-bold text-2xl flex-shrink-0">
            {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-50">{user?.firstName} {user?.lastName}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="badge-green badge mt-1.5 capitalize">{user?.role}</span>
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={handleSave} className="card p-6 mb-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-green-400" />
            <h3 className="font-semibold text-gray-100">Personal Information</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9999999999" className="input" />
            </div>
            <div>
              <label className="label">Location</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="Bangalore, India" className="input" />
            </div>
          </div>

          <div>
            <label className="label">Bio</label>
            <textarea
              name="bio" value={form.bio} onChange={handleChange}
              placeholder="Tell us about yourself..."
              rows={3} className="input resize-none"
            />
          </div>

          <div className="divider" />

          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-green-400" />
            <h3 className="font-semibold text-gray-100">Career Info</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Target Role</label>
              <select name="targetRole" value={form.targetRole} onChange={handleChange} className="input">
                <option value="">Select role</option>
                <option value="software-engineer">Software Engineer</option>
                <option value="data-analyst">Data Analyst</option>
                <option value="ml-engineer">ML Engineer</option>
                <option value="product-manager">Product Manager</option>
                <option value="devops">DevOps</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Experience Level</label>
              <select name="experienceLevel" value={form.experienceLevel} onChange={handleChange} className="input">
                <option value="">Select level</option>
                <option value="fresher">Fresher</option>
                <option value="junior">Junior (1-2 yrs)</option>
                <option value="mid">Mid (3-5 yrs)</option>
                <option value="senior">Senior (5+ yrs)</option>
              </select>
            </div>
          </div>

          <div className="divider" />

          <div className="flex items-center gap-2 mb-2">
            <LinkIcon className="w-4 h-4 text-green-400" />
            <h3 className="font-semibold text-gray-100">Social Links</h3>
          </div>

          <div>
            <label className="label">LinkedIn URL</label>
            <input name="linkedinUrl" value={form.linkedinUrl} onChange={handleChange} placeholder="https://linkedin.com/in/yourname" className="input" />
          </div>
          <div>
            <label className="label">GitHub URL</label>
            <input name="githubUrl" value={form.githubUrl} onChange={handleChange} placeholder="https://github.com/yourname" className="input" />
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Profile</>}
          </button>
        </form>

        {/* Change password */}
        <form onSubmit={handlePasswordChange} className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-100">🔒 Change Password</h3>
          <div>
            <label className="label">Current Password</label>
            <input type="password" value={pwForm.currentPassword}
              onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
              className="input" placeholder="Current password" />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" value={pwForm.newPassword}
              onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
              className="input" placeholder="New password (min 8 chars)" />
          </div>
          <button type="submit" disabled={savingPw} className="btn-secondary">
            {savingPw ? <><Loader2 className="w-4 h-4 animate-spin" />Updating...</> : 'Update Password'}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
