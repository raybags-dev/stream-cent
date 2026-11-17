import React from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { Film, Home, RefreshCw } from 'lucide-react';

interface ErrorPageProps {
  code?: 404 | 500;
  message?: string;
  onRetry?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  code = 404,
  message,
  onRetry,
}) => {
  const { navigate, isAuthenticated } = useAuth();

  const is404 = code === 404;

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white flex flex-col justify-between items-center px-4 py-8 text-center">
      <header className="w-full max-w-6xl flex justify-between items-center">
        <button
          onClick={() => navigate(isAuthenticated ? '/browse' : '/')}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded p-1"
          aria-label="Stream Flix Home"
        >
          <Logo size="md" />
        </button>
      </header>

      <main className="max-w-md w-full my-auto space-y-6">
        <div className="text-8xl sm:text-9xl font-black font-mono tracking-tighter text-[#1f1f28] select-none">
          <span
            style={{
              WebkitTextStroke: '2px #e50914',
              color: '#0b0b0f',
            }}
          >
            {code}
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {is404 ? 'Lost in the streaming cosmos?' : 'System Hiccup Detected'}
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {message ||
              (is404
                ? "Sorry, we can't find that title or page. You'll find plenty more to explore on our home page."
                : 'Our stream server encountered an unexpected glitch. Please try refreshing or return home.')}
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          {onRetry ? (
            <Button
              variant="outline"
              size="md"
              onClick={onRetry}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </Button>
          ) : null}
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(isAuthenticated ? '/browse' : '/')}
            leftIcon={<Home className="w-4 h-4" />}
            className="font-bold px-6"
          >
            Stream Flix Home
          </Button>
        </div>
      </main>

      <footer className="text-xs text-neutral-500 py-4 font-mono">
        Error Code: SF-{code} · Stream Flix Network
      </footer>
    </div>
  );
};
