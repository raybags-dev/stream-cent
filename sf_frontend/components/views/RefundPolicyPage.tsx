import React from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { ArrowLeft, RefreshCw, CheckCircle2, Clock, ShieldCheck, Mail } from 'lucide-react';

export const RefundPolicyPage: React.FC = () => {
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
            <span className="text-xs font-bold uppercase tracking-widest text-[#46d369]">
              Customer Guarantee
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-1">
              Stream Flix Refund Policy
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Transparent rules, fair billing resolutions, and satisfaction guarantees
            </p>
          </div>
        </div>

        {/* 3 Pillars of Fair Billing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#14141a] border border-white/10 space-y-2">
            <Clock className="w-5 h-5 text-[#e50914]" />
            <h3 className="font-bold text-sm text-white">7-Day Accidental Window</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Renewed unintentionally without streaming? Full refunds granted within 7 days of recurring charge.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#14141a] border border-white/10 space-y-2">
            <ShieldCheck className="w-5 h-5 text-[#46d369]" />
            <h3 className="font-bold text-sm text-white">Duplicate Charge Protection</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Instant automatic credit reversal if multiple charges occur on your statement due to network latency.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#14141a] border border-white/10 space-y-2">
            <RefreshCw className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">Prorated Plan Upgrades</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              When upgrading from Standard to Premium 4K, previous days are credited toward your new tier instantly.
            </p>
          </div>
        </div>

        {/* Policy Details */}
        <div className="bg-[#14141a] rounded-xl border border-white/10 p-6 sm:p-8 space-y-6 text-sm text-neutral-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white">1. General Refund Principles</h2>
            <p>
              Stream Flix is a prepaid digital subscription service. In general, payments are non-refundable and there are no refunds or credits for partially used billing periods. However, we believe in fair, customer-first resolutions and provide exceptions under specific conditions outlined below.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white">2. Eligible Refund Scenarios</h2>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Unused Subscription Renewals:</strong> If your monthly subscription automatically renewed and you have not streamed any video content during the current billing period, you are eligible for a 100% full refund if requested within 7 calendar days of the transaction date.
              </li>
              <li>
                <strong>Billing Errors & Technical Failures:</strong> If you experienced persistent technical playback failure preventing access to Stream Flix across all compatible devices for longer than 72 consecutive hours, you may request a billing credit or monetary refund.
              </li>
              <li>
                <strong>Unauthorized Charges:</strong> If an unauthorized person charged your card without your consent, notify customer care within 30 days. We immediately suspend the rogue account and reverse the unauthorized transactions upon verification.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white">3. How to Request a Refund</h2>
            <p>
              To initiate a refund request, navigate to your <strong>Account &gt; Billing</strong> settings or email our 24/7 billing team at <strong>billing@streamflix.com</strong> with your account email and transaction date. Most electronic refunds settle to your original card within 3-5 business days.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-xs text-neutral-400">
          <div className="flex gap-4">
            <button onClick={() => navigate('/terms')} className="hover:text-white underline">
              Terms of Service
            </button>
            <button onClick={() => navigate('/privacy')} className="hover:text-white underline">
              Privacy Policy
            </button>
            <button onClick={() => navigate('/account')} className="hover:text-white underline">
              Account Billing
            </button>
          </div>
          <p>&copy; {new Date().getFullYear()} Stream Flix Inc.</p>
        </div>
      </div>
    </div>
  );
};
