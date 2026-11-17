import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Profile, MaturityRating } from '../../types';
import { MOCK_AVATARS } from '../../lib/api/mockData';
import { Button } from '../ui/Button';
import { ArrowLeft, Trash2, Check, Shield } from 'lucide-react';

export const ManageProfilesPage: React.FC = () => {
  const { user, updateProfile, deleteProfile, navigate } = useAuth();

  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    user?.profiles[0]?.id || ''
  );

  const activeProfile =
    user?.profiles.find((p) => p.id === selectedProfileId) || user?.profiles[0];

  const [name, setName] = useState(activeProfile?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(activeProfile?.avatarUrl || '');
  const [isKids, setIsKids] = useState(activeProfile?.isKids || false);
  const [maturityLimit, setMaturityLimit] = useState<MaturityRating>(
    activeProfile?.maturityLimit || 'TV-MA'
  );
  const [language, setLanguage] = useState(activeProfile?.language || 'English');

  // Handle switching selected profile to edit
  const handleSelectToEdit = (prof: Profile) => {
    setSelectedProfileId(prof.id);
    setName(prof.name);
    setAvatarUrl(prof.avatarUrl);
    setIsKids(prof.isKids);
    setMaturityLimit(prof.maturityLimit);
    setLanguage(prof.language);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeProfile && name.trim()) {
      updateProfile({
        ...activeProfile,
        name: name.trim(),
        avatarUrl,
        isKids,
        maturityLimit,
        language,
      });
    }
  };

  const handleDelete = () => {
    if (activeProfile) {
      if (confirm(`Are you sure you want to permanently delete profile "${activeProfile.name}"?`)) {
        deleteProfile(activeProfile.id);
        if (user && user.profiles.length > 1) {
          const remaining = user.profiles.filter((p) => p.id !== activeProfile.id);
          handleSelectToEdit(remaining[0]!);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white pt-24 pb-20 px-4 sm:px-8 md:px-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/account')}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Back to Account"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Manage Profiles
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Edit avatar, name, and parental control limits.
            </p>
          </div>
        </div>

        {/* Profile Selector Chips */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
          {user?.profiles.map((prof) => {
            const isCurrent = prof.id === selectedProfileId;
            return (
              <button
                key={prof.id}
                onClick={() => handleSelectToEdit(prof)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg border transition-all cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-[#1f1f28] border-white text-white shadow-lg'
                    : 'bg-[#14141a] border-white/10 text-neutral-400 hover:text-white hover:border-white/30'
                }`}
              >
                <img
                  src={prof.avatarUrl}
                  alt=""
                  className="w-7 h-7 rounded object-cover"
                />
                <span className="text-xs sm:text-sm font-semibold">{prof.name}</span>
              </button>
            );
          })}
        </div>

        {/* Edit Form */}
        {activeProfile && (
          <form
            onSubmit={handleSave}
            className="bg-[#14141a] rounded-xl border border-white/10 p-6 sm:p-8 space-y-8"
          >
            {/* Top row: Avatar & Name */}
            <div className="flex flex-col sm:flex-row items-start gap-6 pb-6 border-b border-white/10">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-white/20 shrink-0 shadow-lg">
                <img
                  src={avatarUrl}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Profile Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1f1f28] border border-white/20 rounded-md px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-neutral-300">
                      Choose from Animated Avatar Gallery
                    </label>
                    <span className="text-[11px] text-[#e50914] font-medium">
                      {MOCK_AVATARS.find((a) => a.url === avatarUrl)?.name || 'Selected'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 py-1">
                    {MOCK_AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setAvatarUrl(av.url)}
                        className={`group relative rounded-xl overflow-hidden aspect-square border-2 transition-all p-1 cursor-pointer bg-[#1f1f28] ${
                          avatarUrl === av.url
                            ? 'border-[#e50914] scale-105 ring-2 ring-[#e50914]/50 shadow-xl'
                            : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                        }`}
                        title={av.name}
                      >
                        <img src={av.url} alt={av.name} className="w-full h-full object-cover rounded-lg" />
                        {avatarUrl === av.url && (
                          <div className="absolute top-1 right-1 bg-[#e50914] rounded-full p-0.5 shadow">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <span className="sr-only">{av.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Maturity Ratings & Kids Mode */}
            <div className="space-y-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#e50914]" />
                <h3 className="text-sm font-bold text-white">Maturity & Content Restrictions</h3>
              </div>

              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={isKids}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsKids(checked);
                    if (checked) setMaturityLimit('PG');
                  }}
                  className="rounded bg-[#1f1f28] border-white/20 text-[#e50914] focus:ring-[#e50914] w-4 h-4"
                />
                <div>
                  <p className="text-xs font-bold text-white">Stream Flix Kids Profile</p>
                  <p className="text-[11px] text-neutral-400">
                    Filter content to titles appropriate for children with simplified browsing.
                  </p>
                </div>
              </label>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Allowed Maximum Maturity Rating
                </label>
                <select
                  value={maturityLimit}
                  onChange={(e) => setMaturityLimit(e.target.value as MaturityRating)}
                  disabled={isKids}
                  className="bg-[#1f1f28] border border-white/20 rounded-md px-3 py-2 text-xs text-white focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  <option value="G">G - All Audiences</option>
                  <option value="PG">PG - Parental Guidance</option>
                  <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                  <option value="TV-14">TV-14 - Parents Strongly Cautioned</option>
                  <option value="TV-MA">TV-MA - Mature Audiences Only (No Restrictions)</option>
                </select>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-3">
                <Button type="submit" variant="primary" size="md" className="font-bold">
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => navigate('/browse')}
                >
                  Done
                </Button>
              </div>

              {user && user.profiles.length > 1 && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Delete Profile
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
