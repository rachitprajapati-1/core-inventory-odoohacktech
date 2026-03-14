// Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [loading, setLoading] = useState(false);
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/dashboard');
      toast.success('Account created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"><Box size={16} className="text-white" /></div>
          <span className="font-bold text-white">CoreInventory</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
        <p className="text-slate-400 text-sm mb-8">Join your team on CoreInventory</p>

        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Full Name</label>
            <input name="name" value={form.name} onChange={handle} required className="input" placeholder="John Doe" /></div>
          <div><label className="label">Email</label>
            <input name="email" type="email" value={form.email} onChange={handle} required className="input" placeholder="you@company.com" /></div>
          <div><label className="label">Password</label>
            <input name="password" type="password" value={form.password} onChange={handle} required minLength={6} className="input" placeholder="Min 6 characters" /></div>
          <div><label className="label">Role</label>
            <select name="role" value={form.role} onChange={handle} className="input bg-surface-card">
              <option value="staff">Warehouse Staff</option>
              <option value="manager">Inventory Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus size={16} />}
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
