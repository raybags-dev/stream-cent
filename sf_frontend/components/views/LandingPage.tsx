import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Button } from '../ui/Button';
import {
  Tv,
  Download,
  Film,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  ShieldCheck,
  Play,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HERO_IMAGE_ALIEN_ODYSSEY,
  HERO_IMAGE_NEON_SYNDICATE,
  HERO_IMAGE_VALORIA,
  HERO_IMAGE_MIDNIGHT_RUN,
} from '../../lib/api/mockData';

interface FeaturedMovieSlide {
  id: string;
  title: string;
  kicker: string;
  tagline: string;
  synopsis: string;
  backdropUrl: string;
  year: number;
  rating: string;
  matchScore: number;
  qualities: string[];
}

const FEATURED_SLIDES: FeaturedMovieSlide[] = [
  {
    id: 'tmdb-movie-693134',
    title: 'Dune: Part Two',
    kicker: 'STREAM FLIX BLOCKBUSTER',
    tagline: 'Long live the fighters.',
    synopsis:
      'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520QIq.jpg',
    year: 2024,
    rating: 'PG-13',
    matchScore: 99,
    qualities: ['4K Ultra HD', 'HDR10+', 'Spatial Audio'],
  },
  {
    id: 'tmdb-movie-27205',
    title: 'Inception',
    kicker: 'PRESTIGE SCI-FI MASTERPIECE',
    tagline: 'Your mind is the scene of the crime.',
    synopsis:
      'A thief who enters the dreams of others to steal corporate secrets gets a final chance to erase his criminal past by planting an idea.',
    backdropUrl: 'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    year: 2010,
    rating: 'PG-13',
    matchScore: 98,
    qualities: ['4K Ultra HD', 'Dolby Vision', 'Spatial Audio'],
  },
  {
    id: 'tmdb-movie-558449',
    title: 'Gladiator II',
    kicker: 'EPIC ACTION EVENT',
    tagline: 'What we do in life echoes in eternity.',
    synopsis:
      'Years after witnessing the death of Maximus at the hands of his uncle, Lucius must enter the Colosseum to restore Rome’s glory.',
    backdropUrl: 'https://image.tmdb.org/t/p/original/euYIwmwkmz95mnXvufEmbL69ovr.jpg',
    year: 2024,
    rating: 'R',
    matchScore: 96,
    qualities: ['4K Ultra HD', 'HDR10+', 'Spatial Audio'],
  },
  {
    id: 'tmdb-movie-157336',
    title: 'Interstellar',
    kicker: 'CRITICALLY ACCLAIMED',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    synopsis:
      'A team of explorers travel through a wormhole in space in an attempt to ensure humanity’s survival.',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    year: 2014,
    rating: 'PG-13',
    matchScore: 97,
    qualities: ['4K Ultra HD', 'Dolby Vision', 'Spatial Audio'],
  },
];

export const LandingPage: React.FC = () => {
  const { navigate } = useAuth();
  const [email, setEmail] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-slide right to left every 5.5 seconds
  useEffect(() => {
    if (isPaused) return;

    autoSlideTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % FEATURED_SLIDES.length);
    }, 5500);

    return () => {
      if (autoSlideTimerRef.current) clearInterval(autoSlideTimerRef.current);
    };
  }, [isPaused]);

  const handleNextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % FEATURED_SLIDES.length);
  };

  const handlePrevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + FEATURED_SLIDES.length) % FEATURED_SLIDES.length);
  };

  const handleStartSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      sessionStorage.setItem('streamflix_signup_email', email.trim());
    }
    navigate('/signup');
  };

  const currentSlide = FEATURED_SLIDES[currentIndex]!;

  const faqs = [
    {
      q: 'What is Stream Flix?',
      a: 'Stream Flix is a premier streaming service offering thousands of blockbuster movies, award-winning original series, documentaries, and anime in stunning 4K HDR and immersive Spatial Audio. Watch as much as you want, anytime you want, without a single commercial on our Standard and Premium plans.',
    },
    {
      q: 'How much does Stream Flix cost?',
      a: 'Watch Stream Flix on your smartphone, tablet, Smart TV, laptop, or streaming device, all for one fixed monthly fee. Plans range from $6.99 to $22.99 a month. No extra costs, no contracts.',
    },
    {
      q: 'Where can I watch?',
      a: 'Watch anywhere, anytime. Sign in with your Stream Flix account to watch instantly on the web at streamflix.com from your personal computer or on any internet-connected device with the Stream Flix app, including smart TVs, smartphones, tablets, streaming media players and game consoles.',
    },
    {
      q: 'How do I cancel?',
      a: 'Stream Flix is flexible. There are no annoying contracts and no commitments. You can easily cancel your account online in two clicks from your Account settings. There are no cancellation fees - start or stop your account anytime.',
    },
    {
      q: 'What can I watch on Stream Flix?',
      a: 'Stream Flix has an extensive library of feature films, documentaries, TV shows, anime, award-winning originals, and more. Watch as much as you want, whenever you want.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white overflow-x-hidden">
      {/* FEATURED MOVIES AUTO SLIDING SHOWCASE (Right-to-Left Slide with Animated Details) */}
      <section
        className="relative min-h-[85vh] sm:min-h-[95vh] flex flex-col justify-end pt-20 sm:pt-24 pb-12 sm:pb-20 px-4 sm:px-8 md:px-12 overflow-hidden select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        aria-label="Featured Movies Carousel"
      >
        {/* Sliding Background Image with Motion */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, x: 120 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -120 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 32,
              duration: 0.8,
            }}
            className="absolute inset-0 z-0"
          >
            <img
              src={currentSlide.backdropUrl}
              alt={currentSlide.title}
              className="w-full h-full object-cover filter brightness-[0.42] scale-105"
            />
            {/* Cinematic Scrims */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-[#0b0b0f]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0f] via-[#0b0b0f]/60 to-transparent w-full md:w-3/4" />
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0b0b0f]/80 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Slide Carousel Arrow Controls - Hidden on small mobile screens to prevent text overlap */}
        <button
          onClick={handlePrevSlide}
          className="hidden sm:flex absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white items-center justify-center border border-white/20 transition-all hover:scale-110 cursor-pointer backdrop-blur-xs"
          aria-label="Previous Featured Movie"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNextSlide}
          className="hidden sm:flex absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white items-center justify-center border border-white/20 transition-all hover:scale-110 cursor-pointer backdrop-blur-xs"
          aria-label="Next Featured Movie"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Animated Details & Title Section */}
        <div className="relative z-20 max-w-3xl space-y-3 sm:space-y-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-2.5 sm:space-y-4"
            >
              {/* Animated Kicker */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/10 border border-white/20 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#e50914]"
              >
                <Flame className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>{currentSlide.kicker}</span>
              </motion.div>

              {/* Animated Title */}
              <motion.h1
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-white drop-shadow-lg text-balance break-words"
              >
                {currentSlide.title}
              </motion.h1>

              {/* Animated Metadata Line */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs sm:text-sm text-neutral-300 font-medium"
              >
                <span className="text-[#46d369] font-bold">{currentSlide.matchScore}% Match</span>
                <span aria-hidden="true">·</span>
                <span>{currentSlide.year}</span>
                <span aria-hidden="true">·</span>
                <span className="border border-white/40 px-1 py-0.2 rounded text-[10px] sm:text-[11px] font-semibold text-white">
                  {currentSlide.rating}
                </span>
                <span aria-hidden="true">·</span>
                <span className="border border-white/30 px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] text-neutral-300">
                  {currentSlide.qualities[0]}
                </span>
              </motion.div>

              {/* Animated Synopsis */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.28 }}
                className="text-xs sm:text-base md:text-lg text-neutral-300 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow max-w-2xl"
              >
                {currentSlide.synopsis}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          {/* Quick email lead form & CTAs */}
          <div className="pt-1 sm:pt-2 max-w-xl space-y-2 sm:space-y-3">
            <p className="text-xs sm:text-sm text-neutral-300 font-medium">
              Ready to watch? Enter your email to start your 30-day trial.
            </p>
            <form
              onSubmit={handleStartSignup}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full"
            >
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full sm:flex-1 h-11 sm:h-12 px-4 rounded-md bg-[#14141a]/90 border border-white/30 text-white placeholder-neutral-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white text-xs sm:text-sm"
              />
              <Button
                type="submit"
                size="md"
                variant="primary"
                className="w-full sm:w-auto h-11 sm:h-12 px-6 font-bold shadow-xl text-sm"
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Get Started
              </Button>
            </form>
          </div>

          {/* Carousel Slide Indicators with Timer Fill Animation */}
          <div className="flex items-center gap-2 pt-4">
            {FEATURED_SLIDES.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  onClick={() => setCurrentIndex(idx)}
                  className="relative h-1.5 rounded-full overflow-hidden bg-white/25 transition-all cursor-pointer"
                  style={{ width: isActive ? '48px' : '16px' }}
                  aria-label={`Slide ${idx + 1}: ${slide.title}`}
                >
                  {isActive && (
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 5.5, ease: 'linear' }}
                      className="h-full bg-[#e50914]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Value Props Section */}
      <div className="py-24 border-t border-white/10 max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 space-y-24">
        {/* Value Prop 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">
          <div className="space-y-4 text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-[#e50914]">
              Living Room Experience
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Enjoy on your TV.
            </h2>
            <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
              Watch on Smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players, and more.
              Featuring 4K HDR10+ and Dolby Atmos Spatial Audio.
            </p>
          </div>
          <div className="relative rounded-2xl overflow-hidden bg-[#14141a] border border-white/10 p-8 flex items-center justify-center aspect-video shadow-2xl">
            <Tv className="w-24 h-24 text-[#e50914]/80 animate-pulse" />
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs text-neutral-400 border-t border-white/10 pt-3">
              <span>Smart TV & Console Ready</span>
              <span className="text-white font-mono font-bold">4K UHD · 60 FPS</span>
            </div>
          </div>
        </div>

        {/* Value Prop 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">
          <div className="order-2 md:order-1 relative rounded-2xl overflow-hidden bg-[#14141a] border border-white/10 p-8 flex items-center justify-center aspect-video shadow-2xl">
            <Download className="w-24 h-24 text-cyan-400/80" />
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs text-neutral-400 border-t border-white/10 pt-3">
              <span>Offline Download Vault</span>
              <span className="text-[#46d369] font-mono font-bold">Ready to Watch Offline</span>
            </div>
          </div>
          <div className="order-1 md:order-2 space-y-4 text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Watch Anywhere
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Download your shows to watch offline.
            </h2>
            <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
              Save your favorites easily and always have something to watch on airplanes, road trips, or the subway.
            </p>
          </div>
        </div>

        {/* Value Prop 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">
          <div className="space-y-4 text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Personalized Profiles
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Create profiles for kids.
            </h2>
            <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
              Send kids on adventures with their favorite characters in a space made just for them-free with your membership.
              PIN protected with custom maturity rating controls.
            </p>
          </div>
          <div className="relative rounded-2xl overflow-hidden bg-[#14141a] border border-white/10 p-8 flex items-center justify-center aspect-video shadow-2xl">
            <ShieldCheck className="w-24 h-24 text-amber-400/80" />
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs text-neutral-400 border-t border-white/10 pt-3">
              <span>Parental Locks & Kids Zone</span>
              <span className="text-white font-mono font-bold">Safe & Filtered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Preview Banner */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-16 text-center border-t border-white/10">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
          A plan for every movie lover.
        </h2>
        <p className="text-neutral-400 mb-8 max-w-xl mx-auto text-sm sm:text-base">
          From budget-friendly HD streaming to ultra-crisp 4K HDR with Dolby Atmos on up to 4 screens at once.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="primary" size="lg" onClick={() => navigate('/pricing')}>
            Compare All Plans
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/browse')}>
            Explore Browse Demo
          </Button>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16 border-t border-white/10">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-center mb-10">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                className="bg-[#14141a] rounded-lg border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between font-bold text-base sm:text-lg hover:bg-white/5 transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <Minus className="w-5 h-5 text-[#e50914] shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-neutral-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-neutral-300 text-sm sm:text-base leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Second email CTA */}
        <div className="text-center mt-12 space-y-4">
          <p className="text-sm text-neutral-400">
            Ready to watch? Enter your email to create your Stream Flix membership.
          </p>
          <form
            onSubmit={handleStartSignup}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto"
          >
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full sm:flex-1 h-12 px-4 rounded-md bg-[#14141a] border border-white/30 text-white placeholder-neutral-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white text-sm"
            />
            <Button
              type="submit"
              size="md"
              variant="primary"
              className="w-full sm:w-auto h-12 px-6"
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Get Started
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
