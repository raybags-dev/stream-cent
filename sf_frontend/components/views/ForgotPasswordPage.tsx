import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { authApi } from '../../lib/api/authClient';

export const ForgotPasswordPage: React.FC = () => {
  const { navigate, addToast } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const token = await authApi.forgotPassword(email);
      setResetToken(token);
      if (token) sessionStorage.setItem('streamflix_reset_token', token);
      setIsSubmitted(true);
      addToast('Email Sent', 'Check your inbox for password reset instructions.', 'info');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request a password reset.');
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
          {!isSubmitted ? (
            <>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
                  Forgot Password?
                </h1>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Enter your email address and we will send you a secure link to reset your password.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded bg-[#e50914]/20 border border-[#e50914]/50 text-xs text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Email Address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#1f1f28] border border-white/20 rounded-md px-3.5 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  variant="primary"
                  isLoading={isLoading}
                  className="w-full font-bold shadow-lg"
                >
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#46d369]/20 text-[#46d369] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">Reset Link Sent</h2>
              <p className="text-xs text-neutral-300">
                We've sent an email to <span className="text-white font-bold">{email}</span> with instructions to reset your password.
              </p>
              <div className="pt-4 space-y-2">
                {resetToken && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate('/reset-password')}
                    className="w-full"
                  >
                    Continue to Reset Password
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-6 border-t border-white/10 text-center text-xs text-neutral-500">
        Stream Flix Customer Support &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};
