import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { MOCK_PLANS } from '../../lib/api/mockData';
import { Button } from '../ui/Button';
import {
  CreditCard,
  Tv,
  Shield,
  Sliders,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Users,
  Check,
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils/formatters';

export const AccountPage: React.FC = () => {
  const { user, activeProfile, changePlan, cancelMembership, updateProfile, navigate } = useAuth();

  const currentPlan = MOCK_PLANS.find((p) => p.id === user?.planId) || MOCK_PLANS[2]!;

  const [autoplayNext, setAutoplayNext] = useState(activeProfile?.autoplayNext ?? true);
  const [autoplayPreviews, setAutoplayPreviews] = useState(
    activeProfile?.autoplayPreviews ?? true
  );

  const handleSavePlaybackSettings = () => {
    if (activeProfile) {
      updateProfile({
        ...activeProfile,
        autoplayNext,
        autoplayPreviews,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white pt-24 pb-20 px-4 sm:px-8 md:px-12">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Account</h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Manage your membership, billing information, and device preferences.
          </p>
        </div>

        {/* Section 1: Membership & Billing */}
        <div className="bg-[#14141a] rounded-xl border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#e50914]">
                Membership & Billing
              </span>
              <p className="text-lg font-bold text-white mt-1">{user?.email}</p>
              <p className="text-xs text-neutral-400">Password: ********</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/change-password')}
              >
                Change Password
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={cancelMembership}
              >
                Cancel Membership
              </Button>
            </div>
          </div>

          {/* Billing card details */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 rounded bg-neutral-800 border border-white/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-neutral-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {user?.cardBrand} ending in <span className="font-mono">{user?.cardLastFour}</span>
                </p>
                <p className="text-xs text-neutral-400">
                  Next billing date: <span className="text-neutral-200">{user?.billingDate}</span>
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert('Billing details simulated.')}
            >
              Update Payment Info
            </Button>
          </div>
        </div>

        {/* Section 2: Plan Details */}
        <div className="bg-[#14141a] rounded-xl border border-white/10 p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Plan Details
              </span>
              <h3 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                <span>{currentPlan.name}</span>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-neutral-300 font-mono">
                  {currentPlan.resolution}
                </span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                {formatCurrency(currentPlan.monthlyPrice)} / month · {currentPlan.supportedDevicesCount} screens at once
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/pricing')}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Change Plan
            </Button>
          </div>

          <div className="text-xs text-neutral-400 flex items-center justify-between pt-2">
            <span>Spatial Audio with Dolby Atmos</span>
            <span className="text-white font-medium">
              {currentPlan.spatialAudio ? 'Enabled' : 'Standard Stereo'}
            </span>
          </div>
        </div>

        {/* Section 3: Profile & Playback Settings */}
        <div className="bg-[#14141a] rounded-xl border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Profile & Parental Controls
              </span>
              <p className="text-sm font-bold text-white mt-1">
                Active Profile: {activeProfile?.name}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/parental-controls')}
                leftIcon={<Shield className="w-4 h-4 text-emerald-400" />}
              >
                Parental Controls & PIN
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/account/profiles')}
                leftIcon={<Users className="w-4 h-4" />}
              >
                Manage All Profiles
              </Button>
            </div>
          </div>

          {/* Autoplay toggles */}
          <div className="space-y-4 text-xs sm:text-sm">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoplayNext}
                onChange={(e) => setAutoplayNext(e.target.checked)}
                className="mt-0.5 rounded bg-[#1f1f28] border-white/20 text-[#e50914] focus:ring-[#e50914] w-4 h-4"
              />
              <div>
                <p className="font-semibold text-white">Autoplay next episode in a series</p>
                <p className="text-xs text-neutral-400">
                  Automatically start the next episode when the current one finishes.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoplayPreviews}
                onChange={(e) => setAutoplayPreviews(e.target.checked)}
                className="mt-0.5 rounded bg-[#1f1f28] border-white/20 text-[#e50914] focus:ring-[#e50914] w-4 h-4"
              />
              <div>
                <p className="font-semibold text-white">Autoplay video previews while browsing</p>
                <p className="text-xs text-neutral-400">
                  Preview trailers automatically when pausing over cards on your devices.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSavePlaybackSettings}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Save Playback Preferences
            </Button>
          </div>
        </div>

        {/* Section 4: Security & Sign Out All Devices */}
        <div className="bg-[#14141a] rounded-xl border border-white/10 p-6 sm:p-8 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Sign out of all devices</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Force logout on Smart TVs, tablets, and computers logged into this account.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert('Signed out of all other devices.')}
          >
            Sign Out Devices
          </Button>
        </div>
      </div>
    </div>
  );
};
