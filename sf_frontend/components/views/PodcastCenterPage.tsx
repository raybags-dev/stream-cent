import React, { useState, useEffect } from 'react';
import { PodcastEpisode } from '../../types';
import { streamFlixApi } from '../../lib/api/mockClient';
import { useAuth } from '../../lib/auth/authContext';
import { UploadMediaModal } from '../media/UploadMediaModal';
import {
  Headphones,
  Play,
  Upload,
  Sparkles,
  Clock,
  Radio,
  Flame,
  Calendar,
  Volume2,
  Mic2,
  Film,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface PodcastCenterPageProps {
  onPlayEpisode: (episode: PodcastEpisode) => void;
  activeEpisodeId?: string;
}

const PODCAST_CATEGORIES = [
  'All',
  'Film & Directing',
  'Sci-Fi & Tech',
  'Cinema Analysis',
  'Sound & Music',
  'Writing & Lore',
];

export const PodcastCenterPage: React.FC<PodcastCenterPageProps> = ({
  onPlayEpisode,
  activeEpisodeId,
}) => {
  const { navigate, addToast } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState<'movie' | 'podcast'>('podcast');

  const loadEpisodes = async () => {
    setIsLoading(true);
    try {
      const data = await streamFlixApi.getPodcasts(selectedCategory);
      setEpisodes(data);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEpisodes();
  }, [selectedCategory]);

  const featuredEpisode = episodes[0];

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    return `${mins} min`;
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white pt-20 sm:pt-24 pb-28 px-3.5 sm:px-8 md:px-12 selection:bg-[#e50914]">
      <div className="max-w-[1920px] mx-auto space-y-8">
        {/* Header & Studio Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#e50914] bg-[#e50914]/15 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Stream Flix Audio & Podcasts
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Podcast Center
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
              Listen to exclusive director talkbacks, deep sci-fi world-building lore, film scores, and indie creator audio series.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setUploadTab('movie');
                setIsUploadModalOpen(true);
              }}
              leftIcon={<Film className="w-4 h-4 text-emerald-400" />}
              className="text-xs"
            >
              Upload Video
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setUploadTab('podcast');
                setIsUploadModalOpen(true);
              }}
              leftIcon={<Upload className="w-4 h-4" />}
              className="text-xs"
            >
              Upload MP3 Podcast
            </Button>
          </div>
        </div>

        {/* Featured Spotlight Banner */}
        {featuredEpisode && (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1c1c28] via-[#14141e] to-[#0d0d12] border border-white/10 shadow-2xl p-5 sm:p-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#e50914]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              {/* Cover Art with Play Button */}
              <div
                onClick={() => onPlayEpisode(featuredEpisode)}
                className="relative aspect-square w-36 h-36 sm:w-48 sm:h-48 rounded-xl overflow-hidden shadow-2xl shrink-0 group cursor-pointer border border-white/20"
              >
                <img
                  src={featuredEpisode.coverUrl}
                  alt={featuredEpisode.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-[#e50914] text-white flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Episode Info */}
              <div className="flex-1 space-y-3 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="text-[11px] font-bold text-[#e50914] bg-[#e50914]/20 border border-[#e50914]/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Featured Talkback
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">
                    {featuredEpisode.showName}
                  </span>
                  <span className="text-neutral-500">·</span>
                  <span className="text-xs text-neutral-400">
                    Host: <span className="text-neutral-200">{featuredEpisode.hostName}</span>
                  </span>
                </div>

                <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  {featuredEpisode.title}
                </h2>

                <p className="text-xs sm:text-sm text-neutral-300 line-clamp-3 leading-relaxed max-w-3xl">
                  {featuredEpisode.description}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1">
                  <Button
                    size="md"
                    variant="primary"
                    onClick={() => onPlayEpisode(featuredEpisode)}
                    leftIcon={<Play className="w-4 h-4 fill-current" />}
                    className="px-6"
                  >
                    {activeEpisodeId === featuredEpisode.id ? 'Playing Now' : 'Listen Now'}
                  </Button>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      {formatDuration(featuredEpisode.durationSeconds)}
                    </span>
                    <span>·</span>
                    <span>{featuredEpisode.publishDate}</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-semibold">
                      {featuredEpisode.playsCount?.toLocaleString() || 140} plays
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Pills Selector */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          {PODCAST_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-md'
                    : 'bg-[#14141a] text-neutral-300 border-white/15 hover:border-white/40 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Podcast Episodes Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-[#e50914]" />
              <span>Episodes ({episodes.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {episodes.map((ep) => {
              const isActive = activeEpisodeId === ep.id;
              return (
                <div
                  key={ep.id}
                  className={`flex flex-col bg-[#14141e] border rounded-xl overflow-hidden hover:border-white/30 transition-all group ${
                    isActive ? 'border-[#e50914] shadow-lg shadow-[#e50914]/10' : 'border-white/10'
                  }`}
                >
                  {/* Cover Header */}
                  <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                    <img
                      src={ep.coverUrl}
                      alt={ep.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14141e] via-black/20 to-transparent" />

                    {/* Category pill */}
                    <span className="absolute top-3 left-3 text-[10px] font-bold bg-black/75 backdrop-blur-xs text-white px-2 py-0.5 rounded border border-white/20">
                      {ep.category}
                    </span>

                    {/* Play button overlay */}
                    <button
                      onClick={() => onPlayEpisode(ep)}
                      className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-[#e50914] hover:bg-[#b80710] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                      aria-label={`Play ${ep.title}`}
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-neutral-400 truncate">
                        {ep.showName} · {ep.hostName}
                      </p>
                      <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-white">
                        {ep.title}
                      </h4>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {ep.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-neutral-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        {formatDuration(ep.durationSeconds)}
                      </span>
                      <span>{ep.publishDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upload Media Modal */}
      <UploadMediaModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        defaultTab={uploadTab}
        onUploadedPodcast={(newPod) => {
          setEpisodes((prev) => [newPod, ...prev]);
        }}
        onUploadedMovie={(newMov) => {
          navigate('/browse');
        }}
      />
    </div>
  );
};
