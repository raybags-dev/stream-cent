import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../lib/api/authClient';

export const ResetPasswordPage: React.FC = () => {
  const { navigate, addToast, refreshSession } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readResetToken = (): string | undefined => {
    if (typeof window === 'undefined') return undefined;
    const hashQueryIndex = window.location.hash.indexOf('?');
    if (hashQueryIndex >= 0) {
      const params = new URLSearchParams(window.location.hash.slice(hashQueryIndex + 1));
      const fromHash = params.get('token');
      if (fromHash) return fromHash;
    }
    return sessionStorage.getItem('streamflix_reset_token') || undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const token = readResetToken();
    if (!token) {
      setError('Reset link is missing or expired. Please request a new password reset.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      sessionStorage.removeItem('streamflix_reset_token');
      await refreshSession();
      addToast('Password Updated', 'Your password has been changed successfully.', 'success');
      navigate('/browse');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white flex flex-col justify-between">
      <header className="px-6 sm:px-12 py-6 border-b border-white/10 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded p-1"
          aria-label="Stream Flix Home"
        >
          <Logo size="md" />
        </button>
        <button
          onClick={() => navigate('/login')}
          className="text-xs sm:text-sm font-semibold text-white hover:underline"
        >
          Sign In
        </button>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-12 flex flex-col justify-center">
        <div className="bg-[#14141a] p-8 rounded-xl border border-white/10 shadow-2xl space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
              Reset Your Password
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              Create a new secure password for your Stream Flix account.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded bg-[#e50914]/20 border border-[#e50914]/50 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">New Password</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-[#1f1f28] border border-white/20 rounded-md px-3.5 py-3 pr-10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-neutral-400 hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-[#1f1f28] border border-white/20 rounded-md px-3.5 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              variant="primary"
              isLoading={isLoading}
              className="w-full font-bold shadow-lg mt-2"
            >
              Update Password
            </Button>
          </form>
        </div>
      </main>

      <footer className="py-6 border-t border-white/10 text-center text-xs text-neutral-500">
        Stream Flix &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};
