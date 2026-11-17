import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { Plan } from '../../types';
import { MOCK_AVATARS, MOCK_PLANS } from '../../lib/api/mockData';
import { Check, ChevronRight, Sparkles } from 'lucide-react';
import { formatCurrency } from '../../lib/utils/formatters';

export const SignupPage: React.FC = () => {
  const { signup, navigate } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlanId, setSelectedPlanId] = useState<Plan['id']>('premium');
  const [email, setEmail] = useState(() => {
    return sessionStorage.getItem('streamflix_signup_email') || '';
  });
  const [password, setPassword] = useState('');
  const [profileName, setProfileName] = useState('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(MOCK_AVATARS[0]!.url);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    setStep(3);
  };

  const finishSignup = async (name: string, avatar: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await signup(email, password, selectedPlanId, name, avatar);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishSignup = () => finishSignup(profileName, selectedAvatarUrl);

  // Lets users skip optional profile customization; backend falls back to a
  // default "Primary Profile" name and avatar.
  const handleSkipProfileSetup = () => finishSignup('', '');

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-6 sm:px-12 py-6 border-b border-white/10 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded p-1"
          aria-label="Stream Flix Home"
        >
          <Logo size="md" />
        </button>
        <button
          onClick={() => navigate('/login')}
          className="text-xs sm:text-sm font-semibold text-white hover:underline"
        >
          Sign In
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-12">
        {/* Step Counter */}
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#e50914]">
            STEP {step} OF 3
          </span>
          <div className="flex justify-center items-center gap-2 mt-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-12 rounded-full transition-colors ${
                  s <= step ? 'bg-[#e50914]' : 'bg-neutral-800'
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded bg-[#e50914]/20 border border-[#e50914]/50 text-xs text-red-200 text-center max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* STEP 1: CHOOSE PLAN */}
        {step === 1 && (
          <div className="space-y-8 max-w-3xl mx-auto text-center">
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
                Choose the plan that's right for you.
              </h1>
              <p className="text-neutral-400 text-sm sm:text-base">
                Watch all you want. Recommendations tailored to you. Change or cancel anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {MOCK_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative p-6 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1f1f28] border-[#e50914] shadow-xl ring-2 ring-[#e50914]'
                        : 'bg-[#14141a] border-white/10 hover:border-white/30'
                    }`}
                  >
                    {plan.id === 'premium' && (
                      <div className="absolute -top-3 right-4 bg-[#e50914] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Most Popular
                      </div>
                    )}
                    <h3 className="font-bold text-lg text-white mb-1">{plan.name}</h3>
                    <p className="text-2xl font-black text-white mb-4">
                      {formatCurrency(plan.monthlyPrice)}
                      <span className="text-xs font-normal text-neutral-400"> /mo</span>
                    </p>

                    <div className="space-y-2 text-xs text-neutral-300 border-t border-white/10 pt-4">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#46d369] shrink-0" />
                        <span>Resolution: <strong>{plan.resolution}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#46d369] shrink-0" />
                        <span>Screens at once: <strong>{plan.supportedDevicesCount}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#46d369] shrink-0" />
                        <span>Downloads: <strong>{plan.downloadDevicesCount > 0 ? `${plan.downloadDevicesCount} devices` : 'None'}</strong></span>
                      </div>
                      {plan.spatialAudio && (
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#46d369] shrink-0" />
                          <span>Spatial Audio (Dolby Atmos)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              size="lg"
              variant="primary"
              onClick={handleNextStep1}
              className="w-full sm:w-64 font-bold mx-auto"
              rightIcon={<ChevronRight className="w-5 h-5" />}
            >
              Continue to Step 2
            </Button>
          </div>
        )}

        {/* STEP 2: CREATE EMAIL & PASSWORD */}
        {step === 2 && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                Create a password to start your membership.
              </h1>
              <p className="text-neutral-400 text-xs sm:text-sm">
                Just a few more steps and you're done! We hate paperwork, too.
              </p>
            </div>

            <form onSubmit={handleNextStep2} className="space-y-4 bg-[#14141a] p-6 sm:p-8 rounded-xl border border-white/10">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Email Address</label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#1f1f28] border border-white/20 rounded-md px-3.5 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Create Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Add a password"
                  className="w-full bg-[#1f1f28] border border-white/20 rounded-md px-3.5 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-2 focus:ring-white"
                />
                <p className="text-[11px] text-neutral-500">Minimum 8 characters.</p>
              </div>

              <div className="pt-2">
                <Button type="submit" size="lg" variant="primary" className="w-full font-bold">
                  Next: Setup Profile
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: SETUP PROFILE */}
        {step === 3 && (
          <div className="max-w-md mx-auto space-y-6 text-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                Customize your profile.
              </h1>
              <p className="text-neutral-400 text-xs sm:text-sm">
                Pick a display name and an avatar for personalized recommendations.
              </p>
            </div>

            <div className="bg-[#14141a] p-6 sm:p-8 rounded-xl border border-white/10 space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300">Profile Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full bg-[#1f1f28] border border-white/20 rounded-md px-3.5 py-3 text-sm text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Choose an Animated Avatar
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {MOCK_AVATARS.map((av) => {
                    const isSelected = selectedAvatarUrl === av.url;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setSelectedAvatarUrl(av.url)}
                        className={`group relative rounded-xl overflow-hidden aspect-square border-2 transition-all p-1 cursor-pointer bg-[#1f1f28] ${
                          isSelected
                            ? 'border-[#e50914] scale-105 ring-2 ring-[#e50914]/50 shadow-xl'
                            : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                        }`}
                        title={av.name}
                      >
                        <img src={av.url} alt={av.name} className="w-full h-full object-cover rounded-lg" />
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-[#e50914] rounded-full p-0.5 shadow">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <span className="sr-only">{av.name}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-neutral-400 mt-2 text-center font-medium">
                  {MOCK_AVATARS.find((a) => a.url === selectedAvatarUrl)?.name} ({MOCK_AVATARS.find((a) => a.url === selectedAvatarUrl)?.category})
                </p>
              </div>

              <div className="pt-2">
                <Button
                  size="lg"
                  variant="primary"
                  isLoading={isLoading}
                  onClick={handleFinishSignup}
                  className="w-full font-bold shadow-xl"
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Start Watching Stream Flix
                </Button>
                <button
                  type="button"
                  onClick={handleSkipProfileSetup}
                  disabled={isLoading}
                  className="w-full text-center text-xs text-neutral-400 hover:text-white transition-colors pt-1 disabled:opacity-50"
                >
                  Skip for now — set up my profile later
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/10 text-center text-xs text-neutral-500">
        Stream Flix Membership &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};
