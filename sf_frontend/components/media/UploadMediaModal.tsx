import React, { useState, useRef } from 'react';
import { Title, PodcastEpisode, MaturityRating, QualityBadge } from '../../types';
import { streamFlixApi } from '../../lib/api/mockClient';
import { useAuth } from '../../lib/auth/authContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Film,
  Headphones,
  Image as ImageIcon,
  Music,
  CheckCircle2,
  Sparkles,
  Play,
  FileVideo,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface UploadMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'movie' | 'podcast';
  onUploadedMovie?: (movie: Title) => void;
  onUploadedPodcast?: (podcast: PodcastEpisode) => void;
}

const PRESET_THUMBNAILS = [
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1200&auto=format&fit=crop',
];

const PRESET_PODCAST_COVERS = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1485579149621-3123dd979885?q=80&w=600&auto=format&fit=crop',
];

const DEFAULT_SAMPLE_VIDEO =
  'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4';
const DEFAULT_SAMPLE_AUDIO =
  'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg';

export const UploadMediaModal: React.FC<UploadMediaModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'movie',
  onUploadedMovie,
  onUploadedPodcast,
}) => {
  const { addToast, navigate } = useAuth();
  const [mediaType, setMediaType] = useState<'movie' | 'podcast'>(defaultTab);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Movie Form State
  const [movieTitle, setMovieTitle] = useState('');
  const [movieTagline, setMovieTagline] = useState('');
  const [movieSynopsis, setMovieSynopsis] = useState('');
  const [movieGenre, setMovieGenre] = useState('Sci-Fi');
  const [movieYear, setMovieYear] = useState('2026');
  const [movieRating, setMovieRating] = useState<MaturityRating>('PG-13');
  const [movieDuration, setMovieDuration] = useState('114');
  const [movieThumbnail, setMovieThumbnail] = useState(PRESET_THUMBNAILS[0]);
  const [movieVideoUrl, setMovieVideoUrl] = useState(DEFAULT_SAMPLE_VIDEO);
  const [uploadedVideoName, setUploadedVideoName] = useState<string | null>(null);

  // Podcast Form State
  const [podcastTitle, setPodcastTitle] = useState('');
  const [podcastShowName, setPodcastShowName] = useState('Stream Flix Originals');
  const [podcastHost, setPodcastHost] = useState('Alex Vance & Creators');
  const [podcastCategory, setPodcastCategory] = useState('Film & Directing');
  const [podcastDescription, setPodcastDescription] = useState('');
  const [podcastDurationMin, setPodcastDurationMin] = useState('32');
  const [podcastCover, setPodcastCover] = useState(PRESET_PODCAST_COVERS[0]);
  const [podcastAudioUrl, setPodcastAudioUrl] = useState(DEFAULT_SAMPLE_AUDIO);
  const [uploadedAudioName, setUploadedAudioName] = useState<string | null>(null);

  const thumbInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Thumbnail File Upload
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setMovieThumbnail(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Video File Upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedVideoName(file.name);
      // For large video files in browser, create an Object URL
      const objectUrl = URL.createObjectURL(file);
      setMovieVideoUrl(objectUrl);
      addToast({
        title: 'Video Loaded',
        description: `Ready to publish "${file.name}"`,
        type: 'info',
      });
    }
  };

  // Handle Podcast Cover Upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPodcastCover(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Podcast MP3 Audio Upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedAudioName(file.name);
      const objectUrl = URL.createObjectURL(file);
      setPodcastAudioUrl(objectUrl);
      addToast({
        title: 'Audio File Selected',
        description: `Uploaded "${file.name}"`,
        type: 'info',
      });
    }
  };

  // Submit Movie
  const handleMovieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieTitle.trim() || !movieSynopsis.trim()) {
      addToast({
        title: 'Missing information',
        description: 'Please provide a title and synopsis for your movie.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await streamFlixApi.uploadMovie({
        title: movieTitle.trim(),
        tagline: movieTagline.trim() || 'A Stream Flix Community Production',
        synopsis: movieSynopsis.trim(),
        type: 'movie',
        releaseYear: parseInt(movieYear, 10) || 2026,
        maturityRating: movieRating,
        genres: [movieGenre, 'Independent'],
        backdropUrl: movieThumbnail,
        posterUrl: movieThumbnail,
        trailerVideoUrl: movieVideoUrl,
        durationMinutes: parseInt(movieDuration, 10) || 98,
        qualities: ['4K Ultra HD', 'Spatial Audio'],
        cast: [{ id: 'creator-cast', name: 'Community Cast', character: 'Protagonist', role: 'Lead' }],
        directors: ['Community Director'],
        audioLanguages: ['English (Original)'],
        subtitleLanguages: ['English [CC]'],
      });

      addToast({
        title: 'Movie Published Successfully!',
        description: `"${created.title}" is now added to your streaming library.`,
        type: 'success',
      });

      onUploadedMovie?.(created);
      onClose();
      navigate('/browse');
    } catch {
      addToast({
        title: 'Upload failed',
        description: 'An error occurred while uploading. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Podcast
  const handlePodcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podcastTitle.trim() || !podcastDescription.trim()) {
      addToast({
        title: 'Missing information',
        description: 'Please provide an episode title and description.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await streamFlixApi.uploadPodcast({
        title: podcastTitle.trim(),
        showName: podcastShowName.trim() || 'Stream Flix Studio',
        hostName: podcastHost.trim() || 'Alex Vance',
        coverUrl: podcastCover,
        audioUrl: podcastAudioUrl,
        durationSeconds: (parseInt(podcastDurationMin, 10) || 30) * 60,
        description: podcastDescription.trim(),
        category: podcastCategory,
        explicit: false,
      });

      addToast({
        title: 'Podcast Episode Published!',
        description: `"${created.title}" is now live in the Podcast Center.`,
        type: 'success',
      });

      onUploadedPodcast?.(created);
      onClose();
      navigate('/podcasts');
    } catch {
      addToast({
        title: 'Upload failed',
        description: 'An error occurred while publishing. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="relative w-full max-w-2xl bg-[#14141a] rounded-2xl overflow-hidden shadow-2xl border border-white/15 my-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-white/10 bg-[#0f0f14]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e50914]/20 border border-[#e50914]/40 flex items-center justify-center text-[#e50914]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Stream Flix Creator Studio
              </h2>
              <p className="text-[11px] text-neutral-400">
                Upload your independent movies or release podcasts to your library
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media Type Segmented Tabs */}
        <div className="p-4 sm:p-6 pb-2">
          <div className="grid grid-cols-2 p-1 bg-black/40 border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setMediaType('movie')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mediaType === 'movie'
                  ? 'bg-[#e50914] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Movie / Video Upload</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaType('podcast')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mediaType === 'podcast'
                  ? 'bg-[#e50914] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>Podcast Center (MP3)</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-7 pt-2 max-h-[72vh] overflow-y-auto space-y-5">
          {mediaType === 'movie' ? (
            /* Movie Form */
            <form onSubmit={handleMovieSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-semibold text-xs">Movie Title *</label>
                  <input
                    type="text"
                    required
                    value={movieTitle}
                    onChange={(e) => setMovieTitle(e.target.value)}
                    placeholder="e.g. Chronicles of Europa"
                    className="w-full bg-[#1c1c24] border border-white/15 focus:border-white rounded-lg px-3.5 py-2.5 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-semibold text-xs">Tagline</label>
                  <input
                    type="text"
                    value={movieTagline}
                    onChange={(e) => setMovieTagline(e.target.value)}
                    placeholder="e.g. Beyond the frozen oceans."
                    className="w-full bg-[#1c1c24] border border-white/15 focus:border-white rounded-lg px-3.5 py-2.5 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-300 font-semibold text-xs">Synopsis *</label>
                <textarea
                  required
                  rows={3}
                  value={movieSynopsis}
                  onChange={(e) => setMovieSynopsis(e.target.value)}
                  placeholder="A cinematic deep-space expedition reveals ancient life beneath the subterranean ice..."
                  className="w-full bg-[#1c1c24] border border-white/15 focus:border-white rounded-lg px-3.5 py-2.5 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 text-[11px] font-semibold">Primary Genre</label>
                  <select
                    value={movieGenre}
                    onChange={(e) => setMovieGenre(e.target.value)}
                    className="w-full bg-[#1c1c24] border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Action">Action</option>
                    <option value="Drama">Drama</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Documentary">Documentary</option>
                    <option value="Anime">Anime</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 text-[11px] font-semibold">Release Year</label>
                  <input
                    type="number"
                    value={movieYear}
                    onChange={(e) => setMovieYear(e.target.value)}
                    className="w-full bg-[#1c1c24] border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 text-[11px] font-semibold">Maturity Rating</label>
                  <select
                    value={movieRating}
                    onChange={(e) => setMovieRating(e.target.value as MaturityRating)}
                    className="w-full bg-[#1c1c24] border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="PG">PG</option>
                    <option value="PG-13">PG-13</option>
                    <option value="TV-14">TV-14</option>
                    <option value="TV-MA">TV-MA</option>
                    <option value="R">R</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 text-[11px] font-semibold">Duration (min)</label>
                  <input
                    type="number"
                    value={movieDuration}
                    onChange={(e) => setMovieDuration(e.target.value)}
                    className="w-full bg-[#1c1c24] border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Custom Thumbnail Upload with Live Preview */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-300 font-semibold text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>Custom Thumbnail / Poster</span>
                  </label>
                  <span className="text-[11px] text-neutral-400">JPG, PNG, WEBP</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  {/* Live Thumbnail Preview */}
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-white/20 bg-black/60 shadow-inner group">
                    <img
                      src={movieThumbnail}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-white font-mono bg-black/70 px-2 py-1 rounded">
                        Live Preview
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={thumbInputRef}
                        onChange={handleThumbnailUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => thumbInputRef.current?.click()}
                        leftIcon={<Upload className="w-3.5 h-3.5" />}
                        className="w-full"
                      >
                        Upload Local Image
                      </Button>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      <span className="text-[10px] text-neutral-500 whitespace-nowrap">Presets:</span>
                      {PRESET_THUMBNAILS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMovieThumbnail(preset)}
                          className={`w-7 h-7 rounded border shrink-0 overflow-hidden cursor-pointer ${
                            movieThumbnail === preset ? 'ring-2 ring-[#e50914] border-white' : 'border-white/20 opacity-70'
                          }`}
                        >
                          <img src={preset} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Video File / URL Upload */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-300 font-semibold text-xs flex items-center gap-1.5">
                    <FileVideo className="w-4 h-4 text-sky-400" />
                    <span>Video File (MP4, WebM)</span>
                  </label>
                  {uploadedVideoName && (
                    <span className="text-[11px] text-emerald-400 font-medium truncate max-w-xs">
                      Loaded: {uploadedVideoName}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleVideoUpload}
                    accept="video/mp4,video/webm"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                    className="shrink-0"
                  >
                    Select Video File
                  </Button>
                  <input
                    type="url"
                    value={movieVideoUrl}
                    onChange={(e) => setMovieVideoUrl(e.target.value)}
                    placeholder="Or enter direct video stream URL..."
                    className="flex-1 bg-[#1c1c24] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Movie to Library'}
                </Button>
              </div>
            </form>
          ) : (
            /* Podcast Form */
            <form onSubmit={handlePodcastSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-semibold text-xs">Episode Title *</label>
                  <input
                    type="text"
                    required
                    value={podcastTitle}
                    onChange={(e) => setPodcastTitle(e.target.value)}
                    placeholder="e.g. Ep. 42: Deconstructing Sci-Fi Soundscapes"
                    className="w-full bg-[#1c1c24] border border-white/15 focus:border-white rounded-lg px-3.5 py-2.5 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-semibold text-xs">Podcast Show Name</label>
                  <input
                    type="text"
                    value={podcastShowName}
                    onChange={(e) => setPodcastShowName(e.target.value)}
                    placeholder="e.g. Cinema Chronicles"
                    className="w-full bg-[#1c1c24] border border-white/15 focus:border-white rounded-lg px-3.5 py-2.5 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-400 text-[11px] font-semibold">Host / Presenter</label>
                  <input
                    type="text"
                    value={podcastHost}
                    onChange={(e) => setPodcastHost(e.target.value)}
                    className="w-full bg-[#1c1c24] border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 text-[11px] font-semibold">Category</label>
                  <select
                    value={podcastCategory}
                    onChange={(e) => setPodcastCategory(e.target.value)}
                    className="w-full bg-[#1c1c24] border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="Film & Directing">Film & Directing</option>
                    <option value="Sci-Fi & Tech">Sci-Fi & Tech</option>
                    <option value="Cinema Analysis">Cinema Analysis</option>
                    <option value="Sound & Music">Sound & Music</option>
                    <option value="Writing & Lore">Writing & Lore</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-400 text-[11px] font-semibold">Duration (minutes)</label>
                  <input
                    type="number"
                    value={podcastDurationMin}
                    onChange={(e) => setPodcastDurationMin(e.target.value)}
                    className="w-full bg-[#1c1c24] border border-white/15 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-300 font-semibold text-xs">Episode Notes & Description *</label>
                <textarea
                  required
                  rows={3}
                  value={podcastDescription}
                  onChange={(e) => setPodcastDescription(e.target.value)}
                  placeholder="In this episode, we break down how Foley artists and orchestral synthesizers create visceral worlds in modern cinema..."
                  className="w-full bg-[#1c1c24] border border-white/15 focus:border-white rounded-lg px-3.5 py-2.5 text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none leading-relaxed"
                />
              </div>

              {/* Custom Cover Art Thumbnail Upload */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-300 font-semibold text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <span>Square Podcast Cover Art</span>
                  </label>
                  <span className="text-[11px] text-neutral-400">1:1 Square</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                  <div className="relative aspect-square w-24 h-24 rounded-lg overflow-hidden border border-white/20 bg-black/60 shadow-inner group shrink-0">
                    <img
                      src={podcastCover}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-2">
                    <input
                      type="file"
                      ref={coverInputRef}
                      onChange={handleCoverUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => coverInputRef.current?.click()}
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                    >
                      Upload Cover Image
                    </Button>

                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      <span className="text-[10px] text-neutral-500 whitespace-nowrap">Presets:</span>
                      {PRESET_PODCAST_COVERS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPodcastCover(preset)}
                          className={`w-7 h-7 rounded border shrink-0 overflow-hidden cursor-pointer ${
                            podcastCover === preset ? 'ring-2 ring-[#e50914] border-white' : 'border-white/20 opacity-70'
                          }`}
                        >
                          <img src={preset} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* MP3 Audio File / URL Upload */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-300 font-semibold text-xs flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-emerald-400" />
                    <span>MP3 Audio File</span>
                  </label>
                  {uploadedAudioName && (
                    <span className="text-[11px] text-emerald-400 font-medium truncate max-w-xs">
                      Loaded: {uploadedAudioName}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    ref={audioInputRef}
                    onChange={handleAudioUpload}
                    accept="audio/mp3,audio/wav,audio/m4a,audio/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => audioInputRef.current?.click()}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                    className="shrink-0"
                  >
                    Upload MP3 File
                  </Button>
                  <input
                    type="url"
                    value={podcastAudioUrl}
                    onChange={(e) => setPodcastAudioUrl(e.target.value)}
                    placeholder="Or enter direct audio MP3 URL..."
                    className="flex-1 bg-[#1c1c24] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Publishing...' : 'Release Podcast Episode'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
