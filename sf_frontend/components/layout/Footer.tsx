import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Logo } from '../ui/Logo';
import {
  Globe,
  Film,
  Download,
  Headphones,
  ShieldCheck,
  Tv,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate, isAuthenticated } = useAuth();
  const [language, setLanguage] = useState('en');
  const [showServiceCode, setShowServiceCode] = useState(false);

  const column1 = [
    { label: 'Browse All Titles', path: '/browse' },
    { label: 'TV Shows & Series', path: '/browse/series' },
    { label: 'Blockbuster Movies', path: '/browse/movies' },
    { label: 'Top 10 Daily Hits', path: '/browse/new' },
    { label: 'Browse by Genre', path: '/browse/genre' },
  ];

  const column2 = [
    { label: 'Podcast Center', path: '/podcasts' },
    { label: 'Director Talkbacks', path: '/podcasts' },
    { label: 'Creator Studio & Uploads', path: '/podcasts' },
    { label: 'Original Soundtracks', path: '/podcasts' },
    { label: 'Audio Descriptions', path: '/browse' },
  ];

  const column3 = [
    { label: 'Offline Downloads', path: '/downloads' },
    { label: 'Smart Downloads', path: '/downloads' },
    { label: 'My Saved List', path: '/my-list' },
    { label: 'Ways to Watch', path: '/pricing' },
    { label: 'Broadband Speed Test', path: '/pricing' },
  ];

  const column4 = [
    { label: 'Plans & Pricing', path: '/pricing' },
    { label: 'Account Settings', path: '/account' },
    { label: 'Manage Profiles', path: '/account/profiles' },
    { label: 'Parental Controls & PIN', path: '/parental-controls' },
    { label: 'Help & Support Center', path: '/pricing' },
  ];

  const column5 = [
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Service', path: '/terms' },
    { label: 'Cookie Preferences', path: '/cookies' },
    { label: 'Refund Policy', path: '/refund' },
    { label: 'Legal Notices & DRM', path: '/terms' },
  ];

  return (
    <footer className="w-full bg-[#08080c] border-t border-white/10 pt-14 pb-12 px-4 sm:px-8 md:px-12 lg:px-16 text-neutral-400 text-xs sm:text-sm selection:bg-[#e50914] selection:text-white">
      <div className="max-w-[1920px] mx-auto space-y-10">
        {/* Top Header Row: Logo, Brand Statement, and Badges */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 pb-8 border-b border-white/10 text-center md:text-left">
          <div className="space-y-2">
            <button
              onClick={() => navigate(isAuthenticated ? '/browse' : '/')}
              className="inline-flex items-center focus:outline-none cursor-pointer"
              aria-label="Stream Flix Home"
            >
              <Logo size="md" showText={true} />
            </button>
            <p className="text-xs text-neutral-400 max-w-md">
              The premier streaming destination for 4K Ultra HD blockbusters, award-winning original series, spatial audio, and cinematic podcasts.
            </p>
          </div>

          {/* Platform Capability Badges */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 text-[11px] font-semibold text-neutral-300">
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-[#e50914]" /> 4K Ultra HD & HDR10+
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-sky-400" /> Offline Downloads
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-purple-400" /> Podcast Center
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Parental PIN
            </span>
          </div>
        </div>

        {/* Distributed 5-Column Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 text-xs">
          {/* Column 1 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs tracking-wider uppercase flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-[#e50914]" />
              <span>Catalog</span>
            </h4>
            <ul className="space-y-2">
              {column1.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="hover:text-white transition-colors cursor-pointer text-left py-0.5"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs tracking-wider uppercase flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-purple-400" />
              <span>Audio & Talk</span>
            </h4>
            <ul className="space-y-2">
              {column2.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="hover:text-white transition-colors cursor-pointer text-left py-0.5"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs tracking-wider uppercase flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Offline & Queue</span>
            </h4>
            <ul className="space-y-2">
              {column3.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="hover:text-white transition-colors cursor-pointer text-left py-0.5"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Membership</span>
            </h4>
            <ul className="space-y-2">
              {column4.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="hover:text-white transition-colors cursor-pointer text-left py-0.5"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5 */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs tracking-wider uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Legal & Privacy</span>
            </h4>
            <ul className="space-y-2">
              {column5.map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="hover:text-white transition-colors cursor-pointer text-left py-0.5"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Hotline & Language & Service Code Row */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Language Selector */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/20 rounded-md bg-[#14141a] text-xs text-white">
              <Globe className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
                aria-label="Select Language"
              >
                <option value="en" className="bg-[#14141a]">English</option>
                <option value="es" className="bg-[#14141a]">Español</option>
                <option value="fr" className="bg-[#14141a]">Français</option>
                <option value="de" className="bg-[#14141a]">Deutsch</option>
                <option value="ja" className="bg-[#14141a]">日本語</option>
              </select>
            </div>

            {/* Service Code Button (Netflix style) */}
            <button
              onClick={() => setShowServiceCode(!showServiceCode)}
              className="px-3 py-1.5 border border-white/20 rounded-md text-neutral-400 hover:text-white hover:border-white/40 transition-colors cursor-pointer font-mono text-xs"
            >
              {showServiceCode ? 'Service Code: 839-204-SF' : 'Service Code'}
            </button>

            <span className="text-neutral-400">
              Questions? Call <span className="text-white font-medium">1-800-STREAM-FLIX</span>
            </span>
          </div>

          <div className="text-center md:text-right text-[11px] text-neutral-500">
            Stream Flix Inc. &copy; {new Date().getFullYear()}. All original cinematic productions and trademark rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
