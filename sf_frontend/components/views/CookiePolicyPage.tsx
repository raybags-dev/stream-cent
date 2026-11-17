import React from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Cookie, ArrowLeft, Settings, CheckCircle2, Shield } from 'lucide-react';

export const CookiePolicyPage: React.FC = () => {
  const { navigate, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white pt-24 pb-20 px-4 sm:px-8 md:px-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <button
            onClick={() => navigate(isAuthenticated ? '/browse' : '/')}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#e50914]">
              Tracking & Transparency
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-1">
              Stream Flix Cookie Policy
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              How we use browser cookies, session tokens, and HTML5 local storage
            </p>
          </div>
        </div>

        {/* Overview Box */}
        <div className="p-5 rounded-xl bg-[#14141a] border border-white/10 space-y-3 text-sm text-neutral-300 leading-relaxed">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#e50914]/20 flex items-center justify-center text-[#e50914]">
              <Cookie className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">What are Cookies?</h2>
          </div>
          <p>
            Cookies and local storage are small text files placed on your computer, smartphone, or smart TV when you access Stream Flix. They allow us to recognize your device, maintain your signed-in state, remember your volume preferences, and deliver uninterrupted 4K video playback.
          </p>
        </div>

        {/* Categories of Cookies */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight">Categories of Cookies We Use</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-[#14141a] border border-white/10 space-y-2">
              <div className="flex items-center justify-between font-bold text-white">
                <span className="text-sm">1. Strictly Essential Cookies</span>
                <span className="text-[10px] bg-[#e50914]/20 text-[#e50914] px-2 py-0.5 rounded font-mono">
                  Always Active
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Critical for security and core navigation. Enables profile switching, DRM playback authorization, CSRF protection, and account authentication tokens.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#14141a] border border-white/10 space-y-2">
              <div className="flex items-center justify-between font-bold text-white">
                <span className="text-sm">2. Preference & Functionality</span>
                <span className="text-[10px] bg-white/10 text-neutral-300 px-2 py-0.5 rounded font-mono">
                  Configurable
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Remembers your chosen audio language (e.g., English, Spanish), subtitle toggle settings, autoplay preferences, and last-watched progress timestamps.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#14141a] border border-white/10 space-y-2">
              <div className="flex items-center justify-between font-bold text-white">
                <span className="text-sm">3. Analytics & Diagnostics</span>
                <span className="text-[10px] bg-white/10 text-neutral-300 px-2 py-0.5 rounded font-mono">
                  Configurable
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Tracks server response times, video buffering rates, CDN edge routing, and crash logs to ensure high-bitrate streaming stability.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#14141a] border border-white/10 space-y-2">
              <div className="flex items-center justify-between font-bold text-white">
                <span className="text-sm">4. Recommendation Cookies</span>
                <span className="text-[10px] bg-white/10 text-neutral-300 px-2 py-0.5 rounded font-mono">
                  Configurable
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Assists our algorithms in ranking movies and series tailored to each profile’s genre affinity without exporting data to outside brokers.
              </p>
            </div>
          </div>
        </div>

        {/* Browser Control Instructions */}
        <div className="bg-[#14141a] rounded-xl border border-white/10 p-6 sm:p-8 space-y-4 text-sm text-neutral-300 leading-relaxed">
          <h2 className="text-base sm:text-lg font-bold text-white">How You Can Control Cookies</h2>
          <p>
            You can modify your preferences at any time by clicking "Preferences" on our on-site Cookie Consent Banner. In addition, all standard web browsers (Google Chrome, Apple Safari, Mozilla Firefox, and Microsoft Edge) provide settings allowing you to block or purge cookies. Note that disabling strictly essential cookies may cause playback session authentication to fail.
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-xs text-neutral-400">
          <div className="flex gap-4">
            <button onClick={() => navigate('/privacy')} className="hover:text-white underline">
              Privacy Policy
            </button>
            <button onClick={() => navigate('/terms')} className="hover:text-white underline">
              Terms of Service
            </button>
            <button onClick={() => navigate('/parental-controls')} className="hover:text-white underline">
              Parental Controls
            </button>
          </div>
          <p>&copy; {new Date().getFullYear()} Stream Flix Inc.</p>
        </div>
      </div>
    </div>
  );
};
