import React, { useState } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { Plus, Edit2, Check, Lock, X } from 'lucide-react';
import { MOCK_AVATARS } from '../../lib/api/mockData';

export const ProfilesPage: React.FC = () => {
  const { user, switchProfile, addProfile, navigate } = useAuth();
  const [isManaging, setIsManaging] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileIsKids, setNewProfileIsKids] = useState(false);
  const [newProfileAvatar, setNewProfileAvatar] = useState(MOCK_AVATARS[0]!.url);

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProfileName.trim()) {
      addProfile(newProfileName.trim(), newProfileAvatar, newProfileIsKids);
      setNewProfileName('');
      setNewProfileIsKids(false);
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white flex flex-col justify-between items-center px-4 py-8">
      {/* Top Header */}
      <header className="w-full max-w-6xl flex justify-between items-center">
        <button
          onClick={() => navigate('/browse')}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded p-1"
          aria-label="Stream Flix Home"
        >
          <Logo size="md" />
        </button>
      </header>

      {/* Center "Who's watching?" Gallery */}
      <main className="max-w-4xl w-full text-center my-auto py-12">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-8 sm:mb-12">
          {isManaging ? 'Manage Profiles' : "Who's watching?"}
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {user?.profiles.map((profile) => {
            return (
              <div
                key={profile.id}
                onClick={() => {
                  if (isManaging) {
                    navigate('/account/profiles');
                  } else {
                    switchProfile(profile.id);
                  }
                }}
                className="group flex flex-col items-center cursor-pointer focus-visible:outline-none"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    if (isManaging) navigate('/account/profiles');
                    else switchProfile(profile.id);
                  }
                }}
              >
                <div className="relative w-24 h-24 sm:w-36 sm:h-36 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-white transition-all group-hover:scale-105 shadow-xl">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                  {isManaging && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="p-2 rounded-full border border-white bg-black/50 text-white">
                        <Edit2 className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                  {profile.isKids && (
                    <div className="absolute bottom-1 right-1 bg-[#e50914] text-[10px] font-bold px-1.5 py-0.2 rounded text-white uppercase">
                      Kids
                    </div>
                  )}
                </div>
                <span className="mt-3 text-sm sm:text-base text-neutral-400 group-hover:text-white font-medium transition-colors">
                  {profile.name}
                </span>
              </div>
            );
          })}

          {/* Add Profile Tile */}
          {user && user.profiles.length < 5 && (
            <div
              onClick={() => setIsAddModalOpen(true)}
              className="group flex flex-col items-center cursor-pointer"
              role="button"
              tabIndex={0}
            >
              <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-lg border-2 border-white/20 group-hover:border-white group-hover:bg-white/10 flex items-center justify-center transition-all group-hover:scale-105">
                <Plus className="w-10 h-10 text-neutral-400 group-hover:text-white transition-colors" />
              </div>
              <span className="mt-3 text-sm sm:text-base text-neutral-400 group-hover:text-white font-medium transition-colors">
                Add Profile
              </span>
            </div>
          )}
        </div>

        {/* Manage / Done button */}
        <div className="mt-12 sm:mt-16">
          <Button
            variant={isManaging ? 'primary' : 'outline'}
            size="md"
            onClick={() => setIsManaging(!isManaging)}
            className="tracking-wider uppercase text-xs sm:text-sm px-6 py-2.5"
          >
            {isManaging ? 'Done' : 'Manage Profiles'}
          </Button>
        </div>
      </main>

      {/* Add Profile Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#14141a] rounded-xl border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Add Profile</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Add a profile for another person watching Stream Flix.
              </p>
            </div>

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={newProfileAvatar}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-md object-cover border border-white/20"
                />
                <div className="flex-1">
                  <label className="text-xs font-semibold text-neutral-300">Name</label>
                  <input
                    type="text"
                    required
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Profile Name"
                    className="w-full bg-[#1f1f28] border border-white/20 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              {/* Animated Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Select Animated Avatar
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 py-1">
                  {MOCK_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setNewProfileAvatar(av.url)}
                      className={`group relative rounded-lg overflow-hidden aspect-square border-2 transition-all p-0.5 cursor-pointer bg-[#1f1f28] ${
                        newProfileAvatar === av.url
                          ? 'border-[#e50914] scale-105 shadow-md'
                          : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/30'
                      }`}
                      title={av.name}
                    >
                      <img src={av.url} alt={av.name} className="w-full h-full object-cover rounded" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Kids Profile Toggle */}
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-md cursor-pointer">
                <input
                  type="checkbox"
                  checked={newProfileIsKids}
                  onChange={(e) => setNewProfileIsKids(e.target.checked)}
                  className="rounded bg-[#1f1f28] border-white/20 text-[#e50914] focus:ring-[#e50914] w-4 h-4"
                />
                <div>
                  <p className="text-xs font-bold text-white">Kid?</p>
                  <p className="text-[11px] text-neutral-400">
                    Only titles rated PG or TV-PG and below will be accessible.
                  </p>
                </div>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="font-bold">
                  Save Profile
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom info */}
      <footer className="text-xs text-neutral-500 py-4">
        Stream Flix Profile Switcher &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};
