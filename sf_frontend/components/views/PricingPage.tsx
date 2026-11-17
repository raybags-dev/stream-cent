import React from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Button } from '../ui/Button';
import { MOCK_PLANS } from '../../lib/api/mockData';
import { Check, X, Sparkles, HelpCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils/formatters';

export const PricingPage: React.FC = () => {
  const { isAuthenticated, user, changePlan, navigate } = useAuth();

  const currentPlanId = user?.planId || 'premium';

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white pt-24 pb-16 px-4 sm:px-8 md:px-12">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Title & Subtitle */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#e50914] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Choose the plan that fits your screen.
          </h1>
          <p className="text-neutral-400 max-w-xl mx-auto text-sm sm:text-base">
            Upgrade, downgrade, or cancel anytime. All plans include unlimited access to our full movie and series library.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_PLANS.map((plan) => {
            const isCurrent = isAuthenticated && currentPlanId === plan.id;
            const isPremium = plan.id === 'premium';

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between transition-all ${
                  isPremium
                    ? 'bg-gradient-to-b from-[#1c1c28] to-[#14141a] border-2 border-[#e50914] shadow-2xl scale-102'
                    : 'bg-[#14141a] border border-white/10 hover:border-white/30'
                }`}
              >
                {isPremium && (
                  <div className="absolute top-0 right-0 bg-[#e50914] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg">
                    Best Value
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black text-white">
                      {formatCurrency(plan.monthlyPrice)}
                    </span>
                    <span className="text-xs text-neutral-400">/month</span>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm text-neutral-300 border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Video Quality</span>
                      <span className="font-semibold text-white">{plan.videoQuality}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Resolution</span>
                      <span className="font-semibold text-white">{plan.resolution}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Spatial Audio</span>
                      <span>
                        {plan.spatialAudio ? (
                          <Check className="w-4 h-4 text-[#46d369]" />
                        ) : (
                          <X className="w-4 h-4 text-neutral-600" />
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Simultaneous Screens</span>
                      <span className="font-semibold text-white font-mono">
                        {plan.supportedDevicesCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Download Devices</span>
                      <span className="font-semibold text-white font-mono">
                        {plan.downloadDevicesCount > 0 ? plan.downloadDevicesCount : 'None'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Advertisements</span>
                      <span className="font-semibold text-white">
                        {plan.adSupported ? 'With Ads' : 'Commercial-Free'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  {isAuthenticated ? (
                    <Button
                      variant={isCurrent ? 'secondary' : 'primary'}
                      size="lg"
                      className="w-full font-bold"
                      disabled={isCurrent}
                      onClick={() => changePlan(plan.id)}
                    >
                      {isCurrent ? 'Current Plan' : 'Switch to this Plan'}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full font-bold"
                      onClick={() => navigate('/signup')}
                    >
                      Choose {plan.name}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Matrix Table */}
        <div className="bg-[#14141a] rounded-xl border border-white/10 p-6 sm:p-8 overflow-x-auto">
          <h2 className="text-xl font-bold text-white mb-6">Detailed Comparison</h2>
          <table className="w-full text-xs sm:text-sm text-left">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400">
                <th className="py-3 pr-4 font-normal">Plan Feature</th>
                <th className="py-3 px-4 font-bold text-white">Standard with Ads</th>
                <th className="py-3 px-4 font-bold text-white">Standard</th>
                <th className="py-3 px-4 font-bold text-[#e50914]">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-neutral-300">
              <tr>
                <td className="py-3.5 pr-4 text-white font-medium">Monthly Price</td>
                <td className="py-3.5 px-4 font-mono">$6.99</td>
                <td className="py-3.5 px-4 font-mono">$15.49</td>
                <td className="py-3.5 px-4 font-mono font-bold text-white">$22.99</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 text-white font-medium">Ad-Free Streaming</td>
                <td className="py-3.5 px-4 text-neutral-500">No (Limited Ads)</td>
                <td className="py-3.5 px-4 text-[#46d369]">Yes</td>
                <td className="py-3.5 px-4 text-[#46d369] font-bold">Yes</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 text-white font-medium">Video Quality</td>
                <td className="py-3.5 px-4">1080p Full HD</td>
                <td className="py-3.5 px-4">1080p Full HD</td>
                <td className="py-3.5 px-4 text-white font-bold">4K Ultra HD + HDR</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 text-white font-medium">Dolby Atmos Spatial Audio</td>
                <td className="py-3.5 px-4 text-neutral-500">-</td>
                <td className="py-3.5 px-4 text-neutral-500">-</td>
                <td className="py-3.5 px-4 text-[#46d369] font-bold">Included</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 text-white font-medium">Simultaneous Household Devices</td>
                <td className="py-3.5 px-4 font-mono">2</td>
                <td className="py-3.5 px-4 font-mono">2</td>
                <td className="py-3.5 px-4 font-mono font-bold text-white">4</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 text-white font-medium">Offline Download Devices</td>
                <td className="py-3.5 px-4 text-neutral-500">0</td>
                <td className="py-3.5 px-4 font-mono">2</td>
                <td className="py-3.5 px-4 font-mono font-bold text-white">6</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
