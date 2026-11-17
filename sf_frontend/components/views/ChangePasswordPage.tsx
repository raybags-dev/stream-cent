import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { Eye, EyeOff } from 'lucide-react';

export const ChangePasswordPage: React.FC = () => {
  const { navigate, addToast, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      addToast('Password Updated', 'Your password has been changed successfully.', 'success');
      navigate('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change password.');
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
          onClick={() => navigate('/account')}
          className="text-xs sm:text-sm font-semibold text-white hover:underline"
        >
          Back to Account
        </button>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-12 flex flex-col justify-center">
        <div className="bg-[#14141a] p-8 rounded-xl border border-white/10 shadow-2xl space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
              Change Password
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              Update the password used to sign in to your Stream Flix account.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded bg-[#e50914]/20 border border-[#e50914]/50 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Current Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#1f1f28] border border-white/20 rounded-md px-3.5 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white"
                placeholder="Current password"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">New Password</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#1f1f28] border border-white/20 rounded-md px-3.5 py-3 pr-10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white"
                  placeholder="At least 8 characters"
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
                className="w-full bg-[#1f1f28] border border-white/20 rounded-md px-3.5 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white"
                placeholder="Re-enter new password"
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
