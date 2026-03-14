import { useState } from 'react';
import { User, Lock, Save, Shield } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault(); setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/update-profile', profile);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSavingProfile(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    setSavingPass(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed!');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSavingPass(false); }
  };

  const roleColors = { admin: 'text-red-400 bg-red-500/10 border-red-500/30', manager: 'text-blue-400 bg-blue-500/10 border-blue-500/30', staff: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="My Profile" subtitle="Manage your account settings" />

      {/* Profile info card */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center flex-shrink-0">
          {user?.avatar ? <img src={user.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
            : <User size={28} className="text-primary-400" />}
        </div>
        <div>
          <p className="font-bold text-white text-lg">{user?.name}</p>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border mt-1 inline-flex items-center gap-1 ${roleColors[user?.role]}`}>
            <Shield size={10} />{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
          </span>
        </div>
      </div>

      {/* Edit profile */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-white text-sm border-b border-surface-border pb-3 flex items-center gap-2"><User size={15} className="text-primary-400" /> Edit Profile</h3>
        <form onSubmit={saveProfile} className="space-y-4">
          <div><label className="label">Full Name</label>
            <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required className="input" /></div>
          <div><label className="label">Avatar URL</label>
            <input value={profile.avatar} onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))} className="input" placeholder="https://..." /></div>
          <div><label className="label">Email (cannot change)</label>
            <input value={user?.email} disabled className="input opacity-50 cursor-not-allowed" /></div>
          <div className="flex justify-end">
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-white text-sm border-b border-surface-border pb-3 flex items-center gap-2"><Lock size={15} className="text-primary-400" /> Change Password</h3>
        <form onSubmit={changePassword} className="space-y-4">
          <div><label className="label">Current Password</label>
            <input type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} required className="input" /></div>
          <div><label className="label">New Password</label>
            <input type="password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} required minLength={6} className="input" /></div>
          <div><label className="label">Confirm New Password</label>
            <input type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} required className="input" /></div>
          <div className="flex justify-end">
            <button type="submit" disabled={savingPass} className="btn-primary">
              {savingPass ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock size={15} />}
              {savingPass ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
