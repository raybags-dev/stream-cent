export type ContentType = 'movie' | 'series';

export type MaturityRating = 'G' | 'PG' | 'PG-13' | 'TV-14' | 'TV-MA' | 'R';

export type QualityBadge =
  | '4K Ultra HD'
  | 'HD'
  | 'HDR10+'
  | 'Dolby Vision'
  | 'Dolby Atmos'
  | 'Spatial Audio'
  | '5.1 Surround';

export interface CastMember {
  id: string;
  name: string;
  role: string;
  character: string;
  profileUrl?: string;
}

export interface Episode {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  synopsis: string;
  duration: number;
  thumbnail: string;
  videoUrl?: string;
}

export interface Title {
  id: string;
  title: string;
  originalTitle?: string;
  type: ContentType;
  tagline: string;
  synopsis: string;
  releaseYear: number;
  maturityRating: MaturityRating;
  matchScore: number;
  durationMinutes?: number;
  totalSeasons?: number;
  genres: string[];
  backdropUrl: string;
  posterUrl: string;
  trailerVideoUrl?: string;
  trailerUrl?: string;
  videoStreamUrl?: string;
  isTrending?: boolean;
  isTop10?: boolean;
  top10Rank?: number;
  isNewRelease?: boolean;
  isOriginal?: boolean;
  qualities: QualityBadge[];
  cast: CastMember[];
  directors: string[];
  creators?: string[];
  audioLanguages: string[];
  subtitleLanguages: string[];
  episodes?: Episode[];
  userUploaded?: boolean;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  showName: string;
  hostName: string;
  coverUrl: string;
  audioUrl: string;
  durationSeconds: number;
  publishDate: string;
  description: string;
  category: string;
  explicit?: boolean;
  playsCount?: number;
}

export interface WatchProgress {
  titleId: string;
  progressPercent: number;
  lastWatchedSeconds: number;
  totalDurationSeconds: number;
  lastWatchedAt: string;
  episodeId?: string;
}

export interface Profile {
  id: string;
  name: string;
  avatarUrl: string;
  isKids: boolean;
  language: string;
  maturityLimit: MaturityRating;
  autoplayNext: boolean;
  autoplayPreviews: boolean;
}

export interface Plan {
  id: 'standard-ads' | 'standard' | 'premium';
  name: string;
  monthlyPrice: number;
  currency: string;
  videoQuality: string;
  resolution: string;
  spatialAudio: boolean;
  supportedDevicesCount: number;
  downloadDevicesCount: number;
  adSupported: boolean;
}

export interface User {
  id: string;
  email: string;
  planId: Plan['id'];
  billingDate: string;
  cardLastFour: string;
  cardBrand: string;
  profiles: Profile[];
  currentProfileId: string;
  myList: string[];
  likedTitles: string[];
  dislikedTitles: string[];
  watchHistory: WatchProgress[];
}

export type MediaAssetKind = 'video' | 'audio' | 'image' | 'hls';

export type MediaAssetStatus = 'pending' | 'uploaded' | 'failed' | 'deleted';

export interface MediaAsset {
  assetId: string;
  ownerId: string;
  key: string;
  fileName: string;
  contentType: string;
  size: number;
  kind: MediaAssetKind;
  status: MediaAssetStatus;
  createdAt: string;
  updatedAt: string;
  uploadedAt?: string;
  metadata?: Record<string, string | number | boolean>;
}
