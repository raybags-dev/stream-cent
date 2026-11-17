import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { Eye, EyeOff } from 'lucide-react';
import { HERO_IMAGE_NEON_SYNDICATE } from '../../lib/api/mockData';

export const LoginPage: React.FC = () => {
  const { login, navigate } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password, rememberMe);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#0b0b0f] text-white">
      {/* Background Graphic with Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_IMAGE_NEON_SYNDICATE}
          alt="Cinema Background"
          className="w-full h-full object-cover filter brightness-[0.25]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-transparent to-[#0b0b0f]/80" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 px-6 sm:px-12 py-6">
        <button
          onClick={() => navigate('/')}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded p-1"
          aria-label="Stream Flix Home"
        >
          <Logo size="md" />
        </button>
      </div>

      {/* Card Form */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        <div className="bg-[#14141a]/95 backdrop-blur-xl p-8 sm:p-10 rounded-xl border border-white/10 shadow-2xl space-y-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign In
          </h1>

          {error && (
            <div className="p-3 rounded bg-[#e50914]/20 border border-[#e50914]/50 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-300">
                Email or phone number
              </label>
              <div className="relative flex items-center">
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
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-neutral-300">Password</label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-[#1f1f28] border-white/20 text-[#e50914] focus:ring-[#e50914] w-4 h-4"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="hover:underline"
              >
                Help?
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full font-bold shadow-lg mt-2"
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Sign In */}
          {/* New to Stream Flix */}
          <div className="text-xs text-neutral-400 pt-2 text-center">
            New to Stream Flix?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-white font-bold hover:underline"
            >
              Sign up now.
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 py-6 text-center text-xs text-neutral-500">
        This page is protected by Google reCAPTCHA to ensure you're not a bot.
      </div>
    </div>
  );
};
