import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Button } from './Button';
import { Cookie, X, ShieldCheck, ChevronRight, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const COOKIE_STORAGE_KEY = 'streamflix_cookie_consent_v1';

export const CookieConsentBanner: React.FC = () => {
  const { navigate } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsCookies, setAnalyticsCookies] = useState(true);
  const [marketingCookies, setMarketingCookies] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!stored) {
        // Small delay so it slides in gracefully after initial page paint
        const timer = setTimeout(() => setIsVisible(true), 900);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore storage error
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(
        COOKIE_STORAGE_KEY,
        JSON.stringify({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() })
      );
    } catch {
      // ignore
    }
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem(
        COOKIE_STORAGE_KEY,
        JSON.stringify({ necessary: true, analytics: false, marketing: false, timestamp: Date.now() })
      );
    } catch {
      // ignore
    }
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    try {
      localStorage.setItem(
        COOKIE_STORAGE_KEY,
        JSON.stringify({
          necessary: true,
          analytics: analyticsCookies,
          marketing: marketingCookies,
          timestamp: Date.now(),
        })
      );
    } catch {
      // ignore
    }
    setIsVisible(false);
    setShowPreferences(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none"
      >
        <div className="max-w-4xl mx-auto bg-[#14141a]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-5 sm:p-6 text-white pointer-events-auto">
          {!showPreferences ? (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center shrink-0 text-[#e50914] mt-0.5">
                  <Cookie className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>We value your streaming privacy</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
                    Stream Flix uses essential cookies to authenticate your account and ensure secure video playback. With your consent, we also use analytics and personalization cookies to deliver curated recommendations.{' '}
                    <button
                      onClick={() => navigate('/cookies')}
                      className="text-[#e50914] hover:underline font-semibold cursor-pointer"
                    >
                      Read Cookie Policy
                    </button>
                    .
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
                <button
                  onClick={() => setShowPreferences(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white rounded-md border border-white/15 hover:border-white/30 transition-colors cursor-pointer"
                >
                  Preferences
                </button>
                <button
                  onClick={handleAcceptEssential}
                  className="px-3.5 py-2 text-xs font-semibold text-white rounded-md bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  Essential Only
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAcceptAll}
                  className="font-bold shadow-md"
                >
                  Accept All
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#e50914]" />
                  <span>Customize Cookie Preferences</span>
                </h3>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="text-neutral-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>Essential Session</span>
                    <span className="text-[10px] bg-white/20 text-neutral-300 px-1.5 py-0.5 rounded">Required</span>
                  </div>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Necessary for video playback DRM handshakes, user authentication, and profile switcher.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>Playback Analytics</span>
                    <input
                      type="checkbox"
                      checked={analyticsCookies}
                      onChange={(e) => setAnalyticsCookies(e.target.checked)}
                      className="accent-[#e50914] w-4 h-4 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Helps us diagnose buffering, monitor bitrates, and optimize video CDN routing.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>Personalization</span>
                    <input
                      type="checkbox"
                      checked={marketingCookies}
                      onChange={(e) => setMarketingCookies(e.target.checked)}
                      className="accent-[#e50914] w-4 h-4 rounded cursor-pointer"
                    />
                  </div>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Customizes homepage billboard recommendations based on your favorite genres.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  onClick={() => setShowPreferences(false)}
                  className="px-4 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <Button variant="primary" size="sm" onClick={handleSavePreferences}>
                  Save Preferences
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
