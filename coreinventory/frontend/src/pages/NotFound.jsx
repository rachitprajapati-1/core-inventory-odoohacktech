import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-20 h-20 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center mb-6">
        <AlertCircle size={36} className="text-slate-600" />
      </div>
      <h1 className="text-5xl font-bold text-slate-700 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-slate-300 mb-2">Page not found</h2>
      <p className="text-slate-500 text-sm mb-6 max-w-xs">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard" className="btn-primary">
        <Home size={15} /> Go to Dashboard
      </Link>
    </div>
  );
}
