import React from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { FileText, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
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
              Terms of Agreement
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-1">
              Stream Flix Terms of Service
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Effective Date: November 2026 · Governs all memberships and digital streaming
            </p>
          </div>
        </div>

        {/* Quick summary strip */}
        <div className="p-4 rounded-xl bg-[#14141a] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#46d369] shrink-0" />
            <span className="text-neutral-300">
              No long-term commitments. Cancel anytime in your Account settings with zero cancellation fees.
            </span>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="text-[#e50914] font-bold hover:underline shrink-0"
          >
            Review Plan Tiers
          </button>
        </div>

        {/* Legal Sections */}
        <div className="bg-[#14141a] rounded-xl border border-white/10 p-6 sm:p-8 space-y-6 text-sm text-neutral-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white">1. Membership & Continuous Billing</h2>
            <p>
              Your Stream Flix subscription continues on a month-to-month basis until cancelled. To use the streaming service you must have Internet access and provide a valid, accepted payment method. We charge your monthly subscription fee to your designated payment method on the calendar day corresponding to the commencement of your paying membership.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white">2. Cancellation Policy</h2>
            <p>
              You may cancel your Stream Flix membership at any time directly through the "Account" portal. You will continue to have full access to the streaming catalog until the end of your current monthly billing period. We do not provide prorated refunds for partially consumed monthly periods, except as set forth in our Refund Policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white">3. Streaming Quality & Hardware Compatibility</h2>
            <p>
              The display resolution and playback quality of Stream Flix titles can vary from device to device and may be affected by connection speed. 4K Ultra HD and HDR streams require an internet connection of at least 25 Megabits per second, a 4K-capable display monitor or television, and enrollment in our Premium subscription tier.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white">4. Intellectual Property & Digital Rights Management</h2>
            <p>
              All video content, audio files, proprietary graphics, software players, scripts, and original productions made available through Stream Flix are protected by international copyright, trademark, and trade secret laws. The license granted to you is personal, revocable, and non-commercial. Any attempt to record, scrape, reverse-engineer, or circumvent DRM playback protection is strictly prohibited and subject to immediate termination.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white">5. Account Access & Passwords</h2>
            <p>
              The member who created the Stream Flix account and whose Payment Method is charged maintains primary authority over the account and any connected profiles. You are responsible for safeguarding your password and for restricting access to your compatible streaming hardware.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-xs text-neutral-400">
          <div className="flex gap-4">
            <button onClick={() => navigate('/privacy')} className="hover:text-white underline">
              Privacy Policy
            </button>
            <button onClick={() => navigate('/refund')} className="hover:text-white underline">
              Refund Policy
            </button>
            <button onClick={() => navigate('/parental-controls')} className="hover:text-white underline">
              Parental Controls
            </button>
          </div>
          <p>&copy; {new Date().getFullYear()} Stream Flix Entertainment Network.</p>
        </div>
      </div>
    </div>
  );
};
