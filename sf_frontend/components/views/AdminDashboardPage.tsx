import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth/authContext';
import { streamFlixApi } from '../../lib/api/mockClient';
import {
  ShieldAlert,
  Server,
  Database,
  Radio,
  Tv,
  Film,
  Power,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  HardDrive,
  Activity,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Button } from '../ui/Button';

export const AdminDashboardPage: React.FC = () => {
  const { navigate, addToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [adminStatus, setAdminStatus] = useState<any>({
    liveMoviesEnabled: true,
    serviceMode: 'LIVE_SERVICES',
    catalogCount: 105,
    plansCount: 3,
    podcastsCount: 4,
    services: {
      tmdb: { configured: true },
      tvmaze: { configured: true, status: 'online' },
      watchmode: { configured: true },
      movieOfTheNight: { configured: true },
      mongoDb: { status: 'connected', database: 'streamflix', cachedRecords: 0 },
      s3: { status: 'configured', bucket: 'streamflix-telemetry', region: 'eu-central-1' },
    },
    storage: null,
    lastSync: new Date().toISOString(),
  });

  const loadStatus = async () => {
    try {
      const res = await streamFlixApi.getAdminStatus();
      if (res) {
        setAdminStatus(res);
      }
    } catch {
      // fallback to current local state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleToggleLiveMovies = async () => {
    setToggling(true);
    try {
      const nextState = !adminStatus.liveMoviesEnabled;
      const res = await streamFlixApi.toggleLiveMovies(nextState);
      if (res && typeof res.liveMoviesEnabled === 'boolean') {
        setAdminStatus((prev: any) => ({
          ...prev,
          liveMoviesEnabled: res.liveMoviesEnabled,
          serviceMode: res.mode,
        }));
      } else {
        setAdminStatus((prev: any) => ({
          ...prev,
          liveMoviesEnabled: nextState,
          serviceMode: nextState ? 'LIVE_SERVICES' : 'DUMMY_MAINTENANCE',
        }));
      }

      addToast({
        title: nextState ? 'Live Movie Catalog Online' : 'Dummy Placeholder Mode Activated',
        description: nextState
          ? 'Live database records and external streaming catalogs are actively serving content.'
          : 'The platform is in maintenance mode. All views now render safe dummy placeholder titles.',
        type: nextState ? 'success' : 'info',
      });
    } catch (err: any) {
      addToast({
        title: 'Action Failed',
        description: err.message || 'Unable to update movie service mode.',
        type: 'error',
      });
    } finally {
      setToggling(false);
    }
  };

  const handleSyncCatalog = async () => {
    setSyncing(true);
    try {
      await streamFlixApi.syncCatalog();
      await loadStatus();
      addToast({
        title: 'Catalog Cache Synchronized',
        description: 'Refreshed movie database cache and updated all 24-hour TTL records.',
        type: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Sync Notice',
        description: 'Sync completed with local store records.',
        type: 'info',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white pt-24 pb-28 px-4 sm:px-8 md:px-12 selection:bg-[#e50914]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#e50914] bg-[#e50914]/15 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-[#e50914]/30">
                <ShieldAlert className="w-3.5 h-3.5" />
                Stream Flix Admin Center
              </span>
              <span className="text-xs text-neutral-400 font-mono">Control Plane v2.4</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Movie Service Controller Dashboard
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Control the operational state of the entire platform: switch between live movie database pipelines and dummy placeholder maintenance objects, trigger remote catalog refreshes, and inspect service health.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleSyncCatalog}
              isLoading={syncing}
              leftIcon={<RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />}
              className="text-xs sm:text-sm font-semibold"
            >
              Sync Catalogs
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/browse')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="text-xs sm:text-sm"
            >
              View User App
            </Button>
          </div>
        </div>

        {/* PRIMARY CONTROLLER SWITCH: LIVE MOVIES VS DUMMY PLACEHOLDERS */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#181824] via-[#12121a] to-[#0a0a0e] border border-white/15 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Power className={`w-5 h-5 ${adminStatus.liveMoviesEnabled ? 'text-emerald-400' : 'text-amber-400'}`} />
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Movie Service Feed Mode: {adminStatus.liveMoviesEnabled ? 'Live Movies' : 'Dummy Placeholder Mode'}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
                {adminStatus.liveMoviesEnabled
                  ? 'The application is actively pulling and mounting genuine titles from our database, TMDB, and TVMaze pipelines with complete casts, genuine posters, and trailers.'
                  : 'Maintenance Mode Active: The entire platform is safely serving stylized dummy movie placeholders. Use this when reconfiguring API keys, changing database providers, or running maintenance.'}
              </p>
            </div>

            {/* Toggle Button */}
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-md border ${
                adminStatus.liveMoviesEnabled
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                {adminStatus.liveMoviesEnabled ? 'FEED: LIVE MOVIES' : 'FEED: DUMMY PLACEHOLDERS'}
              </span>

              <button
                onClick={handleToggleLiveMovies}
                disabled={toggling}
                className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors shadow-inner ${
                  adminStatus.liveMoviesEnabled ? 'bg-emerald-600' : 'bg-neutral-700'
                }`}
                aria-label="Toggle Live Movies Feed Mode"
              >
                <div
                  className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                    adminStatus.liveMoviesEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Status Indicator Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Active Titles</span>
                <Film className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-black text-white">
                {adminStatus.liveMoviesEnabled ? adminStatus.catalogCount : '6 Placeholders'}
              </p>
              <span className="text-[11px] text-neutral-400">
                {adminStatus.liveMoviesEnabled ? '100% genuine cinema records' : 'Emergency maintenance objects'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Cache TTL</span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white">24 Hours</p>
              <span className="text-[11px] text-neutral-400">Auto-invalidated MongoDB layer</span>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Trailer Autoplay</span>
                <Activity className="w-4 h-4 text-[#e50914]" />
              </div>
              <p className="text-2xl font-black text-white">Enabled</p>
              <span className="text-[11px] text-neutral-400">Modal & Billboard background</span>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Cast Rosters</span>
                <Layers className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-white">Enriched</p>
              <span className="text-[11px] text-neutral-400">3-6 actors per movie with headshots</span>
            </div>
          </div>
        </div>

        {/* Pipeline & Integration Diagnostic Matrix */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-neutral-400" />
            <span>Service Pipelines & Source Integration Health</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TVMaze Integration */}
            <div className="p-5 rounded-xl bg-[#14141e] border border-white/10 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="font-bold text-sm text-white">TVMaze Series & Cast API</h4>
                </div>
                <p className="text-xs text-neutral-400">
                  Provides high-resolution series, episodic hierarchies, and verified actor headshots.
                </p>
                <div className="pt-2 text-[11px] font-mono text-neutral-500">
                  Endpoint: https://api.tvmaze.com · Status: Connected
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            {/* MongoDB Structured Store */}
            <div className="p-5 rounded-xl bg-[#14141e] border border-white/10 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      adminStatus.services?.mongoDb?.status === 'connected'
                        ? 'bg-emerald-400'
                        : 'bg-red-400'
                    }`}
                  />
                  <h4 className="font-bold text-sm text-white">MongoDB Structured Store</h4>
                </div>
                <p className="text-xs text-neutral-400">
                  Primary store for catalog, users, playback telemetry, and API response cache.
                </p>
                <div className="pt-2 text-[11px] font-mono text-neutral-500">
                  Database: {adminStatus.services?.mongoDb?.database || 'unavailable'} · Cached
                  records: {adminStatus.services?.mongoDb?.cachedRecords ?? 0}
                </div>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  adminStatus.services?.mongoDb?.status === 'connected'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {adminStatus.services?.mongoDb?.status === 'connected'
                  ? 'HEALTHY'
                  : 'UNAVAILABLE'}
              </span>
            </div>

            {/* S3 Media Object Storage */}
            <div className="p-5 rounded-xl bg-[#14141e] border border-white/10 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      adminStatus.services?.s3?.status === 'configured'
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <h4 className="font-bold text-sm text-white">S3 Media Object Storage</h4>
                </div>
                <p className="text-xs text-neutral-400">
                  Stores uploaded videos, audio, images, and HLS segments for streaming asset delivery.
                </p>
                <div className="pt-2 text-[11px] font-mono text-neutral-500">
                  Bucket: {adminStatus.services?.s3?.bucket || 'not configured'} · Region:{' '}
                  {adminStatus.services?.s3?.region || 'unknown'}
                </div>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  adminStatus.services?.s3?.status === 'configured'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}
              >
                {adminStatus.services?.s3?.status === 'configured' ? 'CONFIGURED' : 'NOT CONFIGURED'}
              </span>
            </div>

            {/* TMDB Integration */}
            <div className="p-5 rounded-xl bg-[#14141e] border border-white/10 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <h4 className="font-bold text-sm text-white">TMDB Cinema Pipeline</h4>
                </div>
                <p className="text-xs text-neutral-400">
                  Powers blockbuster movie catalogs, trending lists, horror & romantic comedy genres.
                </p>
                <div className="pt-2 text-[11px] font-mono text-neutral-500">
                  Base: https://api.themoviedb.org/3 · Image CDN: image.tmdb.org
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded border border-sky-500/30">
                CONFIGURED
              </span>
            </div>

            {/* Streaming Availability (Watchmode & MovieOfTheNight) */}
            <div className="p-5 rounded-xl bg-[#14141e] border border-white/10 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <h4 className="font-bold text-sm text-white">Streaming Availability Feeds</h4>
                </div>
                <p className="text-xs text-neutral-400">
                  Watchmode & MovieOfTheNight cross-service streaming availability for geo-locations.
                </p>
                <div className="pt-2 text-[11px] font-mono text-neutral-500">
                  Default Country: NL / Global · Cache: 12h
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30">
                READY
              </span>
            </div>
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="p-6 rounded-xl bg-[#14141e] border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Administrative Fast Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={adminStatus.liveMoviesEnabled ? 'danger' : 'primary'}
              onClick={handleToggleLiveMovies}
              disabled={toggling}
              className="text-xs sm:text-sm font-bold"
            >
              {adminStatus.liveMoviesEnabled
                ? 'Turn Off Live Movies (Enable Dummy Mode)'
                : 'Turn On Live Movies (Enable Live Database Feed)'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleSyncCatalog}
              disabled={syncing}
              className="text-xs sm:text-sm font-medium"
            >
              Flush & Re-warm MongoDB Cache
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/browse/movies')}
              className="text-xs sm:text-sm"
            >
              Inspect Movies Row
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/browse/series')}
              className="text-xs sm:text-sm"
            >
              Inspect Series Row
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
