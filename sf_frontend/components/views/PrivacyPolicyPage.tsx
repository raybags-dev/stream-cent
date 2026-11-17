import React from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Button } from '../ui/Button';
import { Shield, Lock, Eye, FileText, ArrowLeft, Mail } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
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
              Legal & Transparency
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-1">
              Stream Flix Privacy Policy
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Effective Date: November 2026 · Last Updated: November 5, 2026
            </p>
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#14141a] border border-white/10 space-y-2">
            <Shield className="w-5 h-5 text-[#46d369]" />
            <h3 className="font-bold text-sm text-white">Zero Third-Party Ad Selling</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              We never sell your viewing habits, watch history, or private credentials to third-party data brokers.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#14141a] border border-white/10 space-y-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">End-to-End Encryption</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              All payment credentials and streaming session handshakes utilize TLS 1.3 and AES-256 standard encryption.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#14141a] border border-white/10 space-y-2">
            <Eye className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-white">Full User Control</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              You can export or permanently purge your profile watch history and ratings anytime with one click in Account.
            </p>
          </div>
        </div>

        {/* Policy Body */}
        <div className="bg-[#14141a] rounded-xl border border-white/10 p-6 sm:p-8 space-y-6 text-sm text-neutral-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white">1. Information We Collect</h2>
            <p>
              When you interact with Stream Flix, we collect information you provide directly to us (e.g., account email, payment billing token, profile names, avatar choices, and support communications), as well as automated diagnostic data generated during your streaming sessions (e.g., stream bitrate quality, IP addresses for geolocation compliance, device operating system, and playback pause timestamps).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white">2. How We Use Your Data</h2>
            <p>
              We process your data strictly to provide, maintain, and enhance the Stream Flix entertainment platform:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-neutral-300">
              <li>Delivering ultra-high-definition video and spatial audio streams tailored to your connection speed.</li>
              <li>Generating personalized "Because You Watched" rows and category recommendations for each household profile.</li>
              <li>Preventing unauthorized account sharing outside your declared subscription tier.</li>
              <li>Processing recurring monthly subscription renewals through accredited payment processors.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white">3. Children's Privacy & Kids Profiles</h2>
            <p>
              Stream Flix is committed to protecting the privacy of young viewers under age 13 (COPPA). Accounts configured with a "Kids Profile" only access titles rated G, PG, or TV-PG. We do not gather diagnostic behavioral telemetry from Kids profiles, nor do we present ad-supported tracking within children's entertainment spaces.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white">4. GDPR and CCPA Data Rights</h2>
            <p>
              Depending on your regional jurisdiction, you possess statutory rights including: the right to access the personal data we store; the right to rectify inaccurate profile details; and the "Right to be Forgotten" (complete account deletion). To submit a verifiable data privacy inquiry, contact our Data Privacy Office at <strong>privacy@streamflix.com</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-white">5. Security & Data Retention</h2>
            <p>
              We implement industry-grade technical and physical safeguards to protect your personal information against accidental loss, unauthorized access, and malicious breaches. Account data is retained only as long as your membership is active or as necessary to resolve billing disputes.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-xs text-neutral-400">
          <div className="flex gap-4">
            <button onClick={() => navigate('/terms')} className="hover:text-white underline">
              Terms of Service
            </button>
            <button onClick={() => navigate('/cookies')} className="hover:text-white underline">
              Cookie Policy
            </button>
            <button onClick={() => navigate('/refund')} className="hover:text-white underline">
              Refund Policy
            </button>
          </div>
          <p>&copy; {new Date().getFullYear()} Stream Flix Inc. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
