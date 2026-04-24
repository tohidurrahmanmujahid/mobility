import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/context/AdminContext';
import { Lock, Eye, EyeOff } from 'lucide-react';

const AdminLogin = () => {
  const { login } = useAdmin();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400)); // brief delay for UX
    const ok = login(password);
    setLoading(false);
    if (ok) {
      navigate('/');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Lock size={28} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Admin Access
          </h1>
          <p className="text-slate-400 text-center text-sm mb-8">
            Enter your password to enable edit mode on the front page
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Admin password"
                required
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white/15 transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
            >
              {loading ? 'Verifying...' : 'Enter Admin Mode'}
            </button>
          </form>

          {/* Back link */}
          <div className="text-center mt-6">
            <a href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
              ← Back to website
            </a>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          MobilityPartner Admin Panel — Restricted Access
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
