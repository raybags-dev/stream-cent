import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Profile, MaturityRating } from '../../types';
import { Button } from '../ui/Button';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  Clock,
  ArrowLeft,
  Check,
  AlertCircle,
  Users,
} from 'lucide-react';

export const ParentalControlsPage: React.FC = () => {
  const { user, activeProfile, updateProfile, addToast, navigate, isAuthenticated } = useAuth();

  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    activeProfile?.id || user?.profiles[0]?.id || ''
  );

  const profile =
    user?.profiles.find((p) => p.id === selectedProfileId) || activeProfile || user?.profiles[0];

  const [pin, setPin] = useState('1234');
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [maturityLimit, setMaturityLimit] = useState<MaturityRating>(
    profile?.maturityLimit || 'TV-14'
  );
  const [isKids, setIsKids] = useState(profile?.isKids || false);
  const [dailyLimitHours, setDailyLimitHours] = useState('2');

  const ratingsOrder: MaturityRating[] = ['G', 'PG', 'PG-13', 'TV-14', 'TV-MA'];

  const handleSaveControls = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
      updateProfile({
        ...profile,
        maturityLimit,
        isKids,
      });
      addToast(
        'Parental Controls Saved',
        `Protections updated for profile "${profile.name}".`,
        'success'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white pt-24 pb-20 px-4 sm:px-8 md:px-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <button
            onClick={() => navigate(isAuthenticated ? '/account' : '/')}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Family Safety & Protection
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-1">
              Parental Controls & PIN Protection
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Set maturity ratings, profile lock PINs, and screen time restrictions.
            </p>
          </div>
        </div>

        {/* Profile Selector Tabs */}
        {user && user.profiles.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-400">Select Profile to Protect:</label>
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
              {user.profiles.map((p) => {
                const isSelected = p.id === selectedProfileId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProfileId(p.id);
                      setMaturityLimit(p.maturityLimit);
                      setIsKids(p.isKids);
                    }}
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-[#1f1f28] border-amber-400 text-white shadow-lg ring-1 ring-amber-400/50'
                        : 'bg-[#14141a] border-white/10 text-neutral-400 hover:text-white hover:border-white/30'
                    }`}
                  >
                    <img src={p.avatarUrl} alt="" className="w-6 h-6 rounded-md object-cover" />
                    <span className="text-xs sm:text-sm font-semibold">{p.name}</span>
                    {p.isKids && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded">
                        Kids
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSaveControls} className="space-y-6">
          {/* Section 1: Maturity Rating Slider / Limits */}
          <div className="bg-[#14141a] rounded-xl border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Viewing Restrictions for {profile?.name}
                </h2>
                <p className="text-xs text-neutral-400">
                  Titles with maturity ratings higher than your selection will be hidden.
                </p>
              </div>
            </div>

            {/* Kids Profile Quick Toggle */}
            <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={isKids}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsKids(checked);
                  if (checked) setMaturityLimit('PG');
                }}
                className="rounded bg-[#1f1f28] border-white/20 text-[#e50914] focus:ring-[#e50914] w-5 h-5"
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Stream Flix Kids Experience</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Activates a safe, colorful interface designed exclusively for young viewers, showing only titles rated PG and below.
                </p>
              </div>
            </label>

            {/* Maturity Scale Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-neutral-300">
                Allowed Maturity Rating: <span className="text-amber-400 font-bold">{maturityLimit}</span>
              </label>
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {ratingsOrder.map((rating) => {
                  const isSelected = maturityLimit === rating;
                  const isDisabled = isKids && (rating === 'TV-14' || rating === 'TV-MA' || rating === 'PG-13');
                  return (
                    <button
                      key={rating}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setMaturityLimit(rating)}
                      className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-lg'
                          : 'bg-[#1f1f28] border-white/10 text-neutral-300 hover:border-white/30'
                      } ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                      <span className="block text-xs sm:text-sm">{rating}</span>
                      <span className="block text-[10px] text-neutral-400 mt-0.5">
                        {rating === 'G'
                          ? 'All Ages'
                          : rating === 'PG'
                          ? 'Kids 7+'
                          : rating === 'PG-13'
                          ? 'Teens 13+'
                          : rating === 'TV-14'
                          ? 'Teens 14+'
                          : 'Mature 18+'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Profile Lock PIN */}
          <div className="bg-[#14141a] rounded-xl border border-white/10 p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">Profile Lock PIN</h2>
                  <p className="text-xs text-neutral-400">
                    Require a 4-digit security PIN to access {profile?.name}'s profile.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinEnabled}
                  onChange={(e) => setIsPinEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e50914]"></div>
              </label>
            </div>

            {isPinEnabled && (
              <div className="flex items-center gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Set 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-32 bg-[#1f1f28] border border-white/20 rounded-md px-3 py-2 text-center text-lg tracking-widest font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <p className="text-xs text-neutral-400 max-w-sm">
                  This PIN must be entered whenever someone selects {profile?.name} on the profile switcher screen.
                </p>
              </div>
            )}
          </div>

          {/* Section 3: Screen Time Limits */}
          <div className="bg-[#14141a] rounded-xl border border-white/10 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-[#46d369] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Daily Screen Time Limit</h2>
                <p className="text-xs text-neutral-400">
                  Automatically pause playback when daily viewing duration reaches the threshold.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={dailyLimitHours}
                onChange={(e) => setDailyLimitHours(e.target.value)}
                className="bg-[#1f1f28] border border-white/20 rounded-md px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="1">1 Hour per day</option>
                <option value="2">2 Hours per day</option>
                <option value="3">3 Hours per day</option>
                <option value="4">4 Hours per day</option>
                <option value="unlimited">No Daily Limit (Unlimited)</option>
              </select>
              <span className="text-xs text-neutral-400">Applies across all household devices.</span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => navigate('/account')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="font-bold px-6 shadow-xl"
              leftIcon={<Check className="w-4 h-4" />}
            >
              Save Parental Controls
            </Button>
          </div>
        </form>

        {/* Footer Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-xs text-neutral-400">
          <div className="flex gap-4">
            <button onClick={() => navigate('/privacy')} className="hover:text-white underline">
              Privacy Policy
            </button>
            <button onClick={() => navigate('/terms')} className="hover:text-white underline">
              Terms of Service
            </button>
            <button onClick={() => navigate('/account/profiles')} className="hover:text-white underline">
              Manage Profiles
            </button>
          </div>
          <p>&copy; {new Date().getFullYear()} Stream Flix Family Safety.</p>
        </div>
      </div>
    </div>
  );
};
