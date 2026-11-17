import React, { useState, useEffect } from 'react';
import { Title, DownloadedTitle } from '../../types';
import { streamFlixApi } from '../../lib/api/mockClient';
import { useAuth } from '../../lib/auth/authContext';
import {
  Download,
  Play,
  Trash2,
  HardDrive,
  CheckCircle2,
  Sparkles,
  Wifi,
  Settings2,
  ChevronRight,
  Film,
  Tv,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { MoviePosterImage } from '../ui/MoviePosterImage';

const STORED_DOWNLOADS_KEY = 'streamflix_offline_downloads_v1';

const INITIAL_OFFLINE_DOWNLOADS: DownloadedTitle[] = [
  {
    id: 'dl-1',
    titleId: 'tmdb-movie-27205',
    title: 'Inception',
    posterUrl: 'https://image.tmdb.org/t/p/w780/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    quality: '4K Ultra HD · Dolby Vision',
    sizeBytes: 2840000000,
    downloadedAt: 'Downloaded 2 days ago',
    durationMinutes: 148,
    maturityRating: 'PG-13',
    type: 'movie',
    synopsis: 'Cobb steals information from targets by entering their dreams. He is offered a chance to have his criminal history erased.',
  },
  {
    id: 'dl-2',
    titleId: 'tmdb-movie-693134',
    title: 'Dune: Part Two',
    posterUrl: 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520QIq.jpg',
    quality: '4K Ultra HD · Spatial Audio',
    sizeBytes: 3420000000,
    downloadedAt: 'Downloaded yesterday',
    durationMinutes: 166,
    maturityRating: 'PG-13',
    type: 'movie',
    synopsis: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while seeking revenge.',
  },
  {
    id: 'dl-3',
    titleId: 'tmdb-tv-66732',
    title: 'Stranger Things',
    posterUrl: 'https://image.tmdb.org/t/p/w780/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    quality: '4K Ultra HD · HDR10+',
    sizeBytes: 2150000000,
    downloadedAt: 'Downloaded 3 hours ago',
    durationMinutes: 50,
    maturityRating: 'TV-14',
    type: 'series',
    synopsis: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments and supernatural forces.',
  },
];

export const DownloadsPage: React.FC = () => {
  const { navigate, addToast } = useAuth();
  const [downloads, setDownloads] = useState<DownloadedTitle[]>([]);
  const [smartDownloads, setSmartDownloads] = useState(true);
  const [downloadsForYou, setDownloadsForYou] = useState(true);

  // Load downloads from local storage or defaults
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORED_DOWNLOADS_KEY);
        if (stored) {
          setDownloads(JSON.parse(stored));
        } else {
          setDownloads(INITIAL_OFFLINE_DOWNLOADS);
          localStorage.setItem(STORED_DOWNLOADS_KEY, JSON.stringify(INITIAL_OFFLINE_DOWNLOADS));
        }
      }
    } catch {
      setDownloads(INITIAL_OFFLINE_DOWNLOADS);
    }
  }, []);

  const saveDownloads = (list: DownloadedTitle[]) => {
    setDownloads(list);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORED_DOWNLOADS_KEY, JSON.stringify(list));
      }
    } catch {
      // ignore
    }
  };

  const removeDownload = (id: string, titleName: string) => {
    const updated = downloads.filter((d) => d.id !== id);
    saveDownloads(updated);
    addToast({
      title: 'Download Removed',
      description: `Removed "${titleName}" from offline device storage.`,
      type: 'info',
    });
  };

  const clearAllDownloads = () => {
    saveDownloads([]);
    addToast({
      title: 'Storage Cleared',
      description: 'All offline downloaded titles have been deleted.',
      type: 'info',
    });
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const totalBytes = downloads.reduce((acc, curr) => acc + curr.sizeBytes, 0);

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white pt-20 sm:pt-24 pb-28 px-3.5 sm:px-8 md:px-12 selection:bg-[#e50914]">
      <div className="max-w-[1920px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-sky-400 bg-sky-500/15 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Offline Storage & Device Downloads
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Downloads
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
              Watch your favorite blockbusters and series offline with zero Wi-Fi or data connection required.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {downloads.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearAllDownloads}
                className="text-neutral-400 hover:text-[#e50914] text-xs"
              >
                Clear All Downloads
              </Button>
            )}
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate('/browse')}
              leftIcon={<Film className="w-4 h-4" />}
              className="text-xs"
            >
              Find More to Download
            </Button>
          </div>
        </div>

        {/* Device Storage Status Bar (Netflix style) */}
        <div className="bg-[#14141e] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-white">
              <HardDrive className="w-4 h-4 text-sky-400" />
              <span>Device Storage (Web Cache & Local Media)</span>
            </div>
            <div className="text-neutral-400 font-mono">
              <span className="text-white font-bold">{formatBytes(totalBytes)}</span> used by Stream Flix · 42.8 GB free
            </div>
          </div>

          {/* Visual Storage Bar */}
          <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden flex border border-white/10">
            {/* Stream Flix Downloads */}
            <div
              className="bg-[#e50914] h-full transition-all duration-500"
              style={{ width: `${Math.min(60, (totalBytes / (50 * 1024 * 1024 * 1024)) * 100 + 15)}%` }}
              title="Stream Flix Downloads"
            />
            {/* Other device storage */}
            <div className="bg-neutral-600 h-full w-[25%]" title="Other Apps & System" />
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] text-neutral-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e50914]" /> Stream Flix Downloads ({formatBytes(totalBytes)})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-600" /> Other Apps (16.4 GB)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-white/20" /> Free Space (42.8 GB)
            </span>
          </div>
        </div>

        {/* Netflix-Style Smart Downloads Configuration Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#14141e] border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-[#e50914]" />
                <span>Smart Downloads</span>
              </p>
              <p className="text-[11px] text-neutral-400">
                Automatically deletes watched episodes and downloads the next one when on Wi-Fi.
              </p>
            </div>
            <button
              onClick={() => setSmartDownloads(!smartDownloads)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ml-4 ${
                smartDownloads ? 'bg-[#e50914]' : 'bg-neutral-700'
              }`}
              aria-label="Toggle Smart Downloads"
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  smartDownloads ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="bg-[#14141e] border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Downloads for You</span>
              </p>
              <p className="text-[11px] text-neutral-400">
                We'll automatically download movies you might love so you always have something to watch.
              </p>
            </div>
            <button
              onClick={() => setDownloadsForYou(!downloadsForYou)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ml-4 ${
                downloadsForYou ? 'bg-[#e50914]' : 'bg-neutral-700'
              }`}
              aria-label="Toggle Downloads for You"
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  downloadsForYou ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Downloaded Titles List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Downloaded Titles ({downloads.length})</span>
            </h3>
          </div>

          {downloads.length > 0 ? (
            <div className="space-y-3">
              {downloads.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#14141e] border border-white/10 hover:border-white/25 transition-all group"
                >
                  {/* Thumbnail & Title Details */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div
                      onClick={() => navigate(`/watch/${item.titleId}`)}
                      className="relative aspect-video w-32 sm:w-44 rounded-lg overflow-hidden bg-black shrink-0 border border-white/15 cursor-pointer shadow-md group/thumb"
                    >
                      <MoviePosterImage
                        src={item.backdropUrl || item.posterUrl}
                        alt={item.title}
                        aspect="landscape"
                        className="w-full h-full group-hover/thumb:scale-105 transition-transform duration-300"
                        objectFit="cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-black/80 px-1.5 py-0.5 rounded text-white flex items-center gap-1 border border-white/15">
                        <CheckCircle2 className="w-3 h-3 text-[#46d369]" />
                        <span>Offline</span>
                      </span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 font-medium">
                        <span className="border border-white/30 px-1 py-0.2 rounded text-[10px] text-white font-bold">
                          {item.maturityRating}
                        </span>
                        <span>{item.quality}</span>
                        <span>·</span>
                        <span>{item.durationMinutes}m</span>
                      </div>

                      <h4
                        onClick={() => navigate(`/watch/${item.titleId}`)}
                        className="font-bold text-sm sm:text-base text-white hover:text-[#e50914] transition-colors cursor-pointer truncate"
                      >
                        {item.title}
                      </h4>

                      <p className="text-xs text-neutral-400 line-clamp-1 max-w-xl">
                        {item.synopsis}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono pt-1">
                        <span className="text-sky-400 font-semibold">{formatBytes(item.sizeBytes)}</span>
                        <span>·</span>
                        <span>{item.downloadedAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Play Offline & Delete */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => navigate(`/watch/${item.titleId}`)}
                      leftIcon={<Play className="w-4 h-4 fill-current" />}
                      className="text-xs px-4"
                    >
                      Play Offline
                    </Button>
                    <button
                      onClick={() => removeDownload(item.id, item.title)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 hover:text-[#e50914] text-neutral-400 transition-colors cursor-pointer border border-white/10"
                      title="Delete Download"
                      aria-label={`Delete ${item.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#14141e] border border-white/10 rounded-2xl p-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/15 flex items-center justify-center mx-auto text-neutral-400">
                <Download className="w-6 h-6 text-sky-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">No Downloads Available</h4>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
                  Browse our cinematic library and download your favorite movies and series to watch anywhere without internet.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/browse')}
                leftIcon={<Film className="w-4 h-4" />}
                className="mt-2"
              >
                Browse Popular Movies
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
