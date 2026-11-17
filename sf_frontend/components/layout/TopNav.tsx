import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { ANIMATED_AVATARS } from '../../lib/avatars';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  HelpCircle,
  Users,
  Shield,
  Home,
  Tv,
  Film,
  Flame,
  Bookmark,
  Compass,
  Headphones,
  Upload,
  Download,
} from 'lucide-react';

export const TopNav: React.FC<{
  onSearchSubmit?: (query: string) => void;
  onOpenUpload?: () => void;
}> = ({ onOpenUpload }) => {
  const { isAuthenticated, activeProfile, user, switchProfile, logout, navigate, currentPath } =
    useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when full-page mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Scroll listener for sticky background transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim()) {
      navigate(`/search?q=${encodeURIComponent(val.trim())}`);
    }
  };

  const navItems = [
    {
      label: 'Home',
      path: isAuthenticated ? '/browse' : '/',
      icon: Home,
      desc: 'Top billboard & personalized rows',
    },
    {
      label: 'TV Shows',
      path: '/browse/series',
      icon: Tv,
      desc: 'Binge-worthy series & originals',
    },
    {
      label: 'Movies',
      path: '/browse/movies',
      icon: Film,
      desc: 'Blockbusters & 4K cinematic hits',
    },
    {
      label: 'New & Popular',
      path: '/browse/new',
      icon: Flame,
      desc: 'Top 10 daily & weekly debuts',
    },
    {
      label: 'My List',
      path: '/my-list',
      icon: Bookmark,
      desc: 'Your saved library queue',
    },
    {
      label: 'Browse by Genre',
      path: '/browse/genre',
      icon: Compass,
      desc: 'Sci-Fi, Action, Drama, Fantasy',
    },
    {
      label: 'Podcasts',
      path: '/podcasts',
      icon: Headphones,
      desc: 'Creator studio audio & cinematic podcasts',
    },
    {
      label: 'Downloads',
      path: '/downloads',
      icon: Download,
      desc: 'Offline movies & series on this device',
    },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${
        isScrolled
          ? 'bg-[#0b0b0f]/95 backdrop-blur-md shadow-lg border-b border-white/5'
          : 'bg-gradient-to-b from-[#0b0b0f]/90 via-[#0b0b0f]/40 to-transparent'
      }`}
    >
      <div className="max-w-[1920px] mx-auto flex items-center justify-between px-3 sm:px-6 md:px-12 h-14 sm:h-16 md:h-20">
        {/* Left: Brand and Desktop Navigation */}
        <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
          <button
            onClick={() => navigate(isAuthenticated ? '/browse' : '/')}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded p-0.5 flex items-center shrink-0 cursor-pointer"
            aria-label="Stream Flix Home"
          >
            <div className="sm:hidden">
              <Logo size="sm" showText={false} />
            </div>
            <div className="hidden sm:block">
              <Logo size="md" showText={true} />
            </div>
          </button>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-5 text-sm font-medium" aria-label="Main Navigation">
              {navItems.map((item) => {
                const isActive =
                  currentPath === item.path ||
                  (item.path === '/browse' && currentPath === '/browse');
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`transition-colors whitespace-nowrap cursor-pointer ${
                      isActive ? 'text-white font-bold' : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right: Actions optimized for both small and big screens */}
        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4">
          {isAuthenticated ? (
            <>
              {/* Search: Fixed-size button with absolute smoothly animated overlay that doesn't push sibling items */}
              <div className="relative flex items-center">
                {/* Desktop Search Trigger Icon (keeps width stable so right items never shift) */}
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={`hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-full items-center justify-center transition-colors cursor-pointer ${
                    isSearchOpen
                      ? 'text-white bg-white/20'
                      : 'text-neutral-300 hover:text-white hover:bg-white/10'
                  }`}
                  aria-label={isSearchOpen ? 'Close search' : 'Open search'}
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Mobile Search Button: Opens full-page mobile search */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="sm:hidden w-8 h-8 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Open search menu"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Desktop Absolute Animated Expandable Input (Extends to the left smoothly without pushing sibling icons!) */}
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0, scale: 0.95 }}
                      animate={{ width: 280, opacity: 1, scale: 1 }}
                      exit={{ width: 0, opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-40 items-center bg-[#14141a]/98 backdrop-blur-2xl border border-white/30 rounded-full px-3.5 py-1.5 shadow-2xl overflow-hidden"
                    >
                      <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Titles, people, genres..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="bg-transparent text-white text-xs sm:text-sm placeholder-neutral-400 focus:outline-none w-48 shrink-0"
                      />
                      <button
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/15 ml-auto cursor-pointer"
                        aria-label="Close search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notification Bell */}
              <div className="relative" ref={notifMenuRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-2 h-2 rounded-full bg-[#e50914] animate-pulse" />
                </button>

                {/* Mobile-Safe Notification Popover (Centered on mobile, docked right on sm+) */}
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                      className="fixed sm:absolute top-14 sm:top-full left-3 right-3 sm:left-auto sm:right-0 w-auto sm:w-88 max-w-sm sm:max-w-none mx-auto sm:mx-0 bg-[#14141a]/98 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden py-2 text-sm z-50"
                    >
                      <div className="px-4 py-2.5 border-b border-white/10 font-bold text-white flex items-center justify-between">
                        <span className="tracking-tight text-xs sm:text-sm">Notifications</span>
                        <span className="text-[10px] bg-[#e50914]/20 text-[#e50914] font-bold px-2 py-0.5 rounded-full">2 New</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
                        <motion.div
                          whileHover={{ x: 2, backgroundColor: 'rgba(255,255,255,0.06)' }}
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            navigate('/watch/tmdb-movie-693134');
                          }}
                          className="p-2.5 sm:p-3 rounded-lg cursor-pointer flex gap-3 items-start transition-colors bg-white/[0.02] border border-white/5"
                        >
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center shrink-0 text-[#e50914]">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-xs leading-snug">New Release: Dune: Part Two</p>
                            <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">Now streaming in 4K Ultra HD and Spatial Audio.</p>
                            <span className="text-[10px] text-neutral-500 mt-1 block font-mono">2 hours ago</span>
                          </div>
                        </motion.div>
                        <motion.div
                          whileHover={{ x: 2, backgroundColor: 'rgba(255,255,255,0.06)' }}
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            navigate('/watch/tmdb-tv-66732');
                          }}
                          className="p-2.5 sm:p-3 rounded-lg cursor-pointer flex gap-3 items-start transition-colors bg-white/[0.02] border border-white/5"
                        >
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-xs leading-snug">Stranger Things - Season 4 Remaster</p>
                            <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">Experience the Upside Down in Dolby Vision with immersive audio.</p>
                            <span className="text-[10px] text-neutral-500 mt-1 block font-mono">Yesterday</span>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile Avatar & Dropdown (Right before Download button; Vibrant Royal Blue, high-contrast, fully visible, non-animated) */}
              <div className="hidden sm:block relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded p-0.5"
                  aria-label="Profile Menu"
                >
                  <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-md bg-gradient-to-br from-[#0080ff] to-[#0052cc] border-2 border-white/70 group-hover:border-white shadow-md transition-colors flex items-center justify-center overflow-hidden shrink-0">
                    {activeProfile?.avatarUrl ? (
                      <img
                        src={activeProfile.avatarUrl}
                        alt={activeProfile.name || 'Active profile'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-white transition-transform duration-200 ${
                      isProfileMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Mobile-Safe Profile Popover */}
                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                      className="fixed sm:absolute top-14 sm:top-full left-3 right-3 sm:left-auto sm:right-0 w-auto sm:w-64 max-w-xs sm:max-w-none mx-auto sm:mx-0 bg-[#14141a]/98 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl py-2 text-sm z-50"
                    >
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-[11px] text-neutral-400">Signed in as</p>
                        <p className="text-xs sm:text-sm font-bold text-white truncate">{user?.email}</p>
                      </div>

                      {/* Switch profiles list */}
                      <div className="py-2 border-b border-white/10">
                        <p className="px-4 text-[10px] sm:text-[11px] text-neutral-400 uppercase tracking-wider mb-1 font-semibold">
                          Switch Profile
                        </p>
                        {user?.profiles.map((prof) => (
                          <button
                            key={prof.id}
                            onClick={() => {
                              switchProfile(prof.id);
                              setIsProfileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors text-left ${
                              prof.id === activeProfile?.id ? 'text-[#e50914] font-bold' : 'text-neutral-300'
                            }`}
                          >
                            <img
                              src={prof.avatarUrl}
                              alt=""
                              className="w-7 h-7 rounded object-cover border border-white/10"
                            />
                            <span className="truncate text-xs sm:text-sm">{prof.name}</span>
                            {prof.id === activeProfile?.id && (
                              <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white">Active</span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            navigate('/account/profiles');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-neutral-300 hover:text-white hover:bg-white/5 text-xs sm:text-sm transition-colors cursor-pointer"
                        >
                          <Users className="w-4 h-4 text-neutral-400" />
                          <span>Manage Profiles</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            navigate('/account');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-neutral-300 hover:text-white hover:bg-white/5 text-xs sm:text-sm transition-colors cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-neutral-400" />
                          <span>Account Settings</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            navigate('/parental-controls');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-neutral-300 hover:text-white hover:bg-white/5 text-xs sm:text-sm transition-colors cursor-pointer"
                        >
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <span>Parental Controls</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            navigate('/control-portal');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-[#e50914] hover:text-white hover:bg-white/5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                        >
                          <Shield className="w-4 h-4 text-[#e50914]" />
                          <span>Control Portal (Admin)</span>
                        </button>
                      </div>

                      <div className="pt-2 border-t border-white/10">
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-neutral-300 hover:text-[#e50914] hover:bg-white/5 text-xs sm:text-sm transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out of Stream Flix</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Offline Downloads Icon Button (Positioned right after Profile menu) */}
              <button
                onClick={() => navigate('/downloads')}
                className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors cursor-pointer ${
                  currentPath === '/downloads' ? 'text-white bg-white/15' : ''
                }`}
                title="Offline Downloads"
                aria-label="Offline Downloads"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/login')}
                className="text-xs sm:text-sm font-semibold text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate('/signup')}
                className="hidden sm:inline-flex"
              >
                Start Free Trial
              </Button>
            </div>
          )}

          {/* Mobile Menu Hamburger Button (visible on all mobile/tablet views < lg) */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer ml-1"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Netflix-Style Full-Page Slide-Out Mobile Menu (Slides out left to right) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="streamflix-mobile-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            className="fixed inset-0 w-full h-[100dvh] bg-[#0b0b0f] z-50 flex flex-col justify-between overflow-y-auto selection:bg-[#e50914] selection:text-white"
          >
            {/* Top Bar: Logo & Close Button */}
            <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 border-b border-white/10 shrink-0">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate(isAuthenticated ? '/browse' : '/');
                }}
                className="focus:outline-none cursor-pointer"
                aria-label="Stream Flix Home"
              >
                <Logo size="sm" />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Netflix-style Search Bar Spanning the Entire Mobile Menu Horizontally */}
            <div className="w-full px-4 sm:px-6 pt-3 pb-2 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (mobileSearchQuery.trim()) {
                    navigate(`/search?q=${encodeURIComponent(mobileSearchQuery.trim())}`);
                    setIsMobileMenuOpen(false);
                  }
                }}
                className="w-full"
              >
                <div className="w-full flex items-center bg-[#14141a] border border-white/20 focus-within:border-white focus-within:ring-2 focus-within:ring-white/40 rounded-xl px-4 py-2.5 sm:py-3 shadow-lg transition-all">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 mr-3 shrink-0" />
                  <input
                    type="text"
                    value={mobileSearchQuery}
                    onChange={(e) => setMobileSearchQuery(e.target.value)}
                    placeholder="Search movies, TV shows, genres..."
                    className="w-full bg-transparent text-white placeholder-neutral-400 text-xs sm:text-sm focus:outline-none"
                  />
                  {mobileSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMobileSearchQuery('')}
                      className="text-neutral-400 hover:text-white p-1 ml-1 cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Mobile Menu Content: Centered block layout with crisp LEFT-ALIGNED items and icons */}
            <div className="flex-1 w-full max-w-md mx-auto px-4 sm:px-6 py-4 flex flex-col justify-center my-auto space-y-3.5">
              {/* Active Profile Switcher Card (when authenticated) */}
              {isAuthenticated && activeProfile && (
                <div className="w-full bg-[#14141a] border border-white/10 rounded-xl p-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeProfile.avatarUrl}
                      alt={activeProfile.name}
                      className="w-9 h-9 rounded-lg object-cover border border-white/20"
                    />
                    <div className="text-left">
                      <p className="text-xs text-neutral-400">Watching as</p>
                      <p className="text-sm font-bold text-white leading-tight">{activeProfile.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/account/profiles');
                    }}
                    className="text-xs font-semibold text-[#e50914] hover:underline cursor-pointer px-2 py-1"
                  >
                    Switch
                  </button>
                </div>
              )}

              {/* Left-Aligned Navigation List with Icons in a centered container */}
              <nav className="w-full space-y-1.5" aria-label="Mobile Navigation">
                {navItems.map((item) => {
                  const isActive =
                    currentPath === item.path ||
                    (item.path === '/browse' && currentPath === '/browse');
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white/10 border border-white/20 text-white shadow-md'
                          : 'hover:bg-white/5 text-neutral-300 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 text-left">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? 'bg-[#e50914] text-white shadow-md'
                              : 'bg-white/5 text-neutral-300 border border-white/10'
                          }`}
                        >
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="font-bold text-sm sm:text-base leading-tight truncate flex items-center gap-2">
                            <span>{item.label}</span>
                            {isActive && (
                              <span className="text-[10px] bg-[#e50914]/20 text-[#e50914] font-bold px-1.5 py-0.2 rounded">
                                Active
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0 ml-2" />
                    </button>
                  );
                })}

                {/* Parental Controls Item */}
                <button
                  onClick={() => {
                    navigate('/parental-controls');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-white/5 text-neutral-300 hover:text-white transition-all cursor-pointer border border-transparent"
                >
                  <div className="flex items-center gap-3 min-w-0 text-left">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="font-bold text-sm sm:text-base text-white leading-tight">Parental Controls & PIN</p>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">Maturity limits & 4-digit PIN lock</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0 ml-2" />
                </button>

                {/* Account Settings or Sign-In CTAs */}
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      navigate('/account');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl hover:bg-white/5 text-neutral-300 hover:text-white transition-all cursor-pointer border border-transparent"
                  >
                    <div className="flex items-center gap-3 min-w-0 text-left">
                      <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-neutral-300 flex items-center justify-center shrink-0">
                        <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="font-bold text-sm sm:text-base text-white leading-tight">Account Settings</p>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">Membership, billing & plans</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0 ml-2" />
                  </button>
                ) : (
                  <div className="pt-3 space-y-2.5 w-full">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        navigate('/signup');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full font-bold shadow-lg h-11 text-sm"
                    >
                      Start 30-Day Free Trial
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        navigate('/login');
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full h-11 text-sm"
                    >
                      Sign In
                    </Button>
                  </div>
                )}

                {/* Sign Out (Authenticated only) */}
                {isAuthenticated && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-xl text-neutral-400 hover:text-[#e50914] hover:bg-white/5 transition-all cursor-pointer text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 text-[#e50914] flex items-center justify-center shrink-0">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm">Sign Out of Stream Flix</span>
                    </button>
                  </div>
                )}
              </nav>
            </div>

            {/* Footer of Open Menu spanning the whole width: "@ 2026 steamflix       cookie preferences" */}
            <div className="w-full shrink-0 border-t border-white/10 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between text-xs sm:text-sm text-neutral-400 font-medium bg-[#0b0b0f]">
              <span>@ 2026 steamflix</span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/cookies');
                }}
                className="text-neutral-400 hover:text-white underline cursor-pointer transition-colors"
              >
                cookie preferences
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
