import { Plan, Profile, Title } from '../../types';

export const HERO_IMAGE_ALIEN_ODYSSEY = '/assets/images/hero_alien_odyssey_1793873452424.jpg';
export const HERO_IMAGE_NEON_SYNDICATE = '/assets/images/hero_neon_syndicate_1793873453576.jpg';
export const HERO_IMAGE_VALORIA = '/assets/images/hero_chronicles_valoria_1793873454603.jpg';
export const HERO_IMAGE_MIDNIGHT_RUN = '/assets/images/hero_midnight_run_1793873455251.jpg';

// Cinematic fallback artwork used whenever a poster/backdrop is missing or fails to load.
export const DEFAULT_POSTER_IMAGE = HERO_IMAGE_NEON_SYNDICATE;

export const NO_POSTER_IMAGE_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900"><rect width="600" height="900" fill="%2314141c"/><rect x="30" y="30" width="540" height="840" rx="16" fill="none" stroke="%233a3a4c" stroke-width="3" stroke-dasharray="12 8"/><circle cx="300" cy="380" r="70" fill="%231e1e2c"/><path d="M272 355 L328 355 L328 405 L272 405 Z M262 345 L338 345 L328 330 L272 330 Z" fill="%23e50914"/><text x="300" y="495" fill="%23ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="900" text-anchor="middle" letter-spacing="4">NO POSTER</text><text x="300" y="535" fill="%23888899" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" text-anchor="middle" letter-spacing="2">OFFICIAL ARTWORK PENDING</text><text x="300" y="800" fill="%23e50914" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" text-anchor="middle" letter-spacing="3">STREAM FLIX ARCHIVES</text></svg>`;

// Helper to create reliable thematic SVG backdrops and posters with typography and gradients
export function createCinematicSvg(
  title: string,
  category: string,
  gradientStart: string,
  gradientEnd: string,
  accentColor: string,
  width = 600,
  height = 900
): string {
  const isPoster = height > width;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${gradientStart}"/>
        <stop offset="50%" stop-color="${gradientEnd}"/>
        <stop offset="100%" stop-color="#07070a"/>
      </linearGradient>
      <linearGradient id="scrim" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="60%" stop-color="rgba(0,0,0,0.3)"/>
        <stop offset="100%" stop-color="rgba(7,7,10,0.95)"/>
      </linearGradient>
      <pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="1.5" fill="rgba(255,255,255,0.04)"/>
        <circle cx="80" cy="40" r="1" fill="rgba(255,255,255,0.03)"/>
        <circle cx="50" cy="70" r="1.2" fill="rgba(255,255,255,0.04)"/>
      </pattern>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#g)"/>
    <rect width="${width}" height="${height}" fill="url(#grain)"/>
    
    <!-- Stylized ambient lighting circle -->
    <circle cx="${width * 0.7}" cy="${height * 0.35}" r="${Math.min(width, height) * 0.45}" fill="${accentColor}" opacity="0.22" filter="blur(40px)"/>
    <circle cx="${width * 0.3}" cy="${height * 0.6}" r="${Math.min(width, height) * 0.35}" fill="${gradientStart}" opacity="0.3" filter="blur(30px)"/>
    
    <!-- Scrim -->
    <rect width="${width}" height="${height}" fill="url(#scrim)"/>
    
    <!-- Title watermark / typography -->
    <g transform="translate(${width * 0.08}, ${height * (isPoster ? 0.75 : 0.65)})">
      <text x="0" y="0" fill="${accentColor}" font-family="Plus Jakarta Sans, sans-serif" font-size="${Math.max(12, Math.floor(width * 0.024))}" font-weight="700" letter-spacing="3" text-transform="uppercase">${category}</text>
      <text x="0" y="${Math.floor(width * 0.065)}" fill="#ffffff" font-family="Plus Jakarta Sans, sans-serif" font-size="${Math.max(20, Math.floor(width * 0.06))}" font-weight="800" letter-spacing="-0.5">${title.length > 20 ? title.slice(0, 19) + '…' : title}</text>
      <text x="0" y="${Math.floor(width * 0.105)}" fill="rgba(255,255,255,0.55)" font-family="Plus Jakarta Sans, sans-serif" font-size="${Math.max(10, Math.floor(width * 0.024))}" font-weight="500">STREAM FLIX ORIGINAL</text>
    </g>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const MOCK_PLANS: Plan[] = [
  {
    id: 'standard-ads',
    name: 'Standard with Ads',
    monthlyPrice: 6.99,
    currency: 'USD',
    videoQuality: 'Great',
    resolution: '1080p (Full HD)',
    spatialAudio: false,
    supportedDevicesCount: 2,
    downloadDevicesCount: 0,
    adSupported: true,
  },
  {
    id: 'standard',
    name: 'Standard',
    monthlyPrice: 15.49,
    currency: 'USD',
    videoQuality: 'Great',
    resolution: '1080p (Full HD)',
    spatialAudio: false,
    supportedDevicesCount: 2,
    downloadDevicesCount: 2,
    adSupported: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 22.99,
    currency: 'USD',
    videoQuality: 'Best',
    resolution: '4K (Ultra HD) + HDR',
    spatialAudio: true,
    supportedDevicesCount: 4,
    downloadDevicesCount: 6,
    adSupported: false,
  },
];

import { ANIMATED_AVATARS } from '../avatars';

export const MOCK_AVATARS = ANIMATED_AVATARS;

export const MOCK_DEFAULT_PROFILES: Profile[] = [
  {
    id: 'prof-primary-admin',
    name: 'Super Admin',
    avatarUrl: ANIMATED_AVATARS[0]!.url,
    isKids: false,
    language: 'English',
    maturityLimit: 'TV-MA',
    autoplayNext: true,
    autoplayPreviews: true,
  },
];

export const MOCK_TITLES: Title[] = [
  {
    id: "tmdb-movie-27205",
    title: "Inception",
    type: "movie",
    tagline: "Your mind is the scene of the crime.",
    synopsis: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life as payment for a task considered impossible: inception, the implantation of another person's idea into a target's subconscious.",
    releaseYear: 2010,
    maturityRating: "PG-13",
    matchScore: 99,
    durationMinutes: 148,
    genres: ["Sci-Fi", "Action", "Adventure"],
    backdropUrl: "https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w780/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    trailerVideoUrl: "https://www.youtube.com/watch?v=YoHD9XEInc0",
    videoStreamUrl: "https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4",
    isTrending: true,
    isTop10: true,
    top10Rank: 1,
    isNewRelease: false,
    qualities: ["4K Ultra HD", "HDR10+", "Spatial Audio"],
    directors: ["Christopher Nolan"],
    cast: [
      { id: "c-leo", name: "Leonardo DiCaprio", character: "Dom Cobb", role: "Lead" },
      { id: "c-joseph", name: "Joseph Gordon-Levitt", character: "Arthur", role: "Lead" },
      { id: "c-elliot", name: "Elliot Page", character: "Ariadne", role: "Supporting" }
    ],
    audioLanguages: ["English (Original)", "Spanish", "French", "German"],
    subtitleLanguages: ["English [CC]", "Spanish", "French", "German"]
  },
  {
    id: "tmdb-movie-693134",
    title: "Dune: Part Two",
    type: "movie",
    tagline: "Long live the fighters.",
    synopsis: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
    releaseYear: 2024,
    maturityRating: "PG-13",
    matchScore: 98,
    durationMinutes: 166,
    genres: ["Sci-Fi", "Adventure", "Action"],
    backdropUrl: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520Wio.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    trailerVideoUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
    videoStreamUrl: "https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4",
    isTrending: true,
    isTop10: true,
    top10Rank: 2,
    isNewRelease: true,
    qualities: ["4K Ultra HD", "Dolby Vision", "Spatial Audio"],
    directors: ["Denis Villeneuve"],
    cast: [
      { id: "c-timmy", name: "Timothée Chalamet", character: "Paul Atreides", role: "Lead" },
      { id: "c-zendaya", name: "Zendaya", character: "Chani", role: "Lead" }
    ],
    audioLanguages: ["English (Original)", "Spanish", "German"],
    subtitleLanguages: ["English [CC]", "Spanish", "German"]
  },
  {
    id: "tmdb-movie-933260",
    title: "The Substance",
    type: "movie",
    tagline: "If you respect the balance, what could possibly go wrong?",
    synopsis: "A fading celebrity decides to use a black market drug, a cell-replicating substance that temporarily creates a younger, better version of herself, leading to a grotesque spiral of body transformation.",
    releaseYear: 2024,
    maturityRating: "R",
    matchScore: 97,
    durationMinutes: 141,
    genres: ["Horror", "Sci-Fi", "Drama"],
    backdropUrl: "https://image.tmdb.org/t/p/original/7h65MWooySNpnHJP95GVVHpEl0Z.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w780/lQYXgYd4eDkFm443s2iW5H9OkmU.jpg",
    trailerVideoUrl: "https://www.youtube.com/watch?v=LNlrGhPdn68",
    videoStreamUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4",
    isTrending: true,
    isTop10: true,
    top10Rank: 3,
    isNewRelease: true,
    qualities: ["4K Ultra HD", "Dolby Atmos"],
    directors: ["Coralie Fargeat"],
    cast: [
      { id: "c-demi", name: "Demi Moore", character: "Elisabeth Sparkle", role: "Lead" },
      { id: "c-margaret", name: "Margaret Qualley", character: "Sue", role: "Lead" }
    ],
    audioLanguages: ["English (Original)", "French", "Spanish"],
    subtitleLanguages: ["English [CC]", "French", "Spanish"]
  },
  {
    id: "tmdb-movie-1072790",
    title: "Anyone But You",
    type: "movie",
    tagline: "They hate each other. Let the wedding games begin.",
    synopsis: "After an amazing first date, Bea and Ben's initial attraction turns sour until they unexpectedly find themselves reunited at a destination wedding in Australia.",
    releaseYear: 2023,
    maturityRating: "R",
    matchScore: 96,
    durationMinutes: 103,
    genres: ["Romantic Comedy", "Romance", "Comedy"],
    backdropUrl: "https://image.tmdb.org/t/p/original/nTPFkYKOk5L79EWERWII8OUTIK5.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w780/yRt7MGBElkLQOYRvLllAh0uBTIV.jpg",
    trailerVideoUrl: "https://www.youtube.com/watch?v=0qHZZXspD64",
    videoStreamUrl: "https://media.w3.org/2010/05/bunny/trailer.mp4",
    isTrending: true,
    isTop10: true,
    top10Rank: 4,
    qualities: ["4K Ultra HD", "HDR10+"],
    directors: ["Will Gluck"],
    cast: [
      { id: "c-sydney", name: "Sydney Sweeney", character: "Bea", role: "Lead" },
      { id: "c-glen", name: "Glen Powell", character: "Ben", role: "Lead" }
    ],
    audioLanguages: ["English (Original)", "Spanish", "German"],
    subtitleLanguages: ["English [CC]", "Spanish"]
  },
  {
    id: "tmdb-tv-66732",
    title: "Stranger Things",
    type: "series",
    tagline: "Every ending has a beginning.",
    synopsis: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
    releaseYear: 2022,
    maturityRating: "TV-14",
    matchScore: 99,
    totalSeasons: 4,
    genres: ["Sci-Fi", "Horror", "Drama"],
    backdropUrl: "https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w780/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    trailerVideoUrl: "https://www.youtube.com/watch?v=b9EkMc79ZSU",
    videoStreamUrl: "https://vjs.zencdn.net/v/oceans.mp4",
    isTrending: true,
    isTop10: true,
    top10Rank: 5,
    isOriginal: true,
    qualities: ["4K Ultra HD", "Dolby Vision", "Spatial Audio"],
    directors: ["The Duffer Brothers", "Shawn Levy"],
    cast: [
      { id: "c-millie", name: "Millie Bobby Brown", character: "Eleven", role: "Lead" },
      { id: "c-winona", name: "Winona Ryder", character: "Joyce Byers", role: "Lead" }
    ],
    audioLanguages: ["English (Original)", "Spanish", "French"],
    subtitleLanguages: ["English [CC]", "Spanish", "French"]
  },
  {
    id: "tmdb-movie-945961",
    title: "Gladiator II",
    type: "movie",
    tagline: "What we do in life echoes in eternity.",
    synopsis: "Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors.",
    releaseYear: 2024,
    maturityRating: "R",
    matchScore: 97,
    durationMinutes: 148,
    genres: ["Action", "Adventure", "Drama"],
    backdropUrl: "https://image.tmdb.org/t/p/original/euYIwmwkmz95mnEx7vBMasxDwna.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w780/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
    trailerVideoUrl: "https://www.youtube.com/watch?v=4rgYUipGJNo",
    videoStreamUrl: "https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4",
    isTrending: true,
    isTop10: true,
    top10Rank: 6,
    isNewRelease: true,
    qualities: ["4K Ultra HD", "HDR10+", "Spatial Audio"],
    directors: ["Ridley Scott"],
    cast: [
      { id: "c-paul", name: "Paul Mescal", character: "Lucius", role: "Lead" },
      { id: "c-pedro", name: "Pedro Pascal", character: "Marcus Acacius", role: "Lead" }
    ],
    audioLanguages: ["English (Original)", "Spanish", "Italian"],
    subtitleLanguages: ["English [CC]", "Spanish", "Italian"]
  },
  {
    id: "tmdb-movie-157336",
    title: "Interstellar",
    type: "movie",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    synopsis: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival across distant star systems.",
    releaseYear: 2014,
    maturityRating: "PG-13",
    matchScore: 99,
    durationMinutes: 169,
    genres: ["Sci-Fi", "Drama", "Adventure"],
    backdropUrl: "https://image.tmdb.org/t/p/original/rAiYTsqBk79zqZFCFh1UptmE90S.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    trailerVideoUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
    videoStreamUrl: "https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4",
    isTrending: true,
    isTop10: true,
    top10Rank: 7,
    qualities: ["4K Ultra HD", "HDR10+", "Spatial Audio"],
    directors: ["Christopher Nolan"],
    cast: [
      { id: "c-matthew", name: "Matthew McConaughey", character: "Cooper", role: "Lead" },
      { id: "c-anne", name: "Anne Hathaway", character: "Brand", role: "Lead" }
    ],
    audioLanguages: ["English (Original)", "Spanish", "German"],
    subtitleLanguages: ["English [CC]", "Spanish", "German"]
  },
  {
    id: "tmdb-movie-155",
    title: "The Dark Knight",
    type: "movie",
    tagline: "Welcome to a world without rules.",
    synopsis: "Batman raises the stakes in his war on crime as a rising criminal mastermind known to Gotham as the Joker unleashes catastrophic chaos.",
    releaseYear: 2008,
    maturityRating: "PG-13",
    matchScore: 99,
    durationMinutes: 152,
    genres: ["Crime", "Action", "Drama"],
    backdropUrl: "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w780/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    trailerVideoUrl: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
    videoStreamUrl: "https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4",
    isTrending: true,
    isTop10: true,
    top10Rank: 8,
    qualities: ["4K Ultra HD", "5.1 Surround"],
    directors: ["Christopher Nolan"],
    cast: [
      { id: "c-bale", name: "Christian Bale", character: "Bruce Wayne / Batman", role: "Lead" },
      { id: "c-heath", name: "Heath Ledger", character: "Joker", role: "Lead" }
    ],
    audioLanguages: ["English (Original)", "Spanish", "German"],
    subtitleLanguages: ["English [CC]", "Spanish"]
  },
  {
    id: "tmdb-movie-138843",
    title: "The Conjuring",
    type: "movie",
    tagline: "Based on the true case files of the Warrens.",
    synopsis: "Paranormal investigators Ed and Lorraine Warren work to help a family terrorized by a dark presence in their farmhouse.",
    releaseYear: 2013,
    maturityRating: "R",
    matchScore: 96,
    durationMinutes: 112,
    genres: ["Horror", "Thriller", "Mystery"],
    backdropUrl: "https://image.tmdb.org/t/p/original/111818.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w780/wVYREut69EVv4TFnflx68bZg5jB.jpg",
    trailerVideoUrl: "https://www.youtube.com/watch?v=k10ETZ41q5o",
    videoStreamUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4",
    isTrending: true,
    qualities: ["4K Ultra HD", "Dolby Atmos"],
    directors: ["James Wan"],
    cast: [
      { id: "c-vera", name: "Vera Farmiga", character: "Lorraine Warren", role: "Lead" },
      { id: "c-pat", name: "Patrick Wilson", character: "Ed Warren", role: "Lead" }
    ],
    audioLanguages: ["English (Original)", "Spanish", "French"],
    subtitleLanguages: ["English [CC]", "Spanish"]
  },
  {
    id: "tmdb-movie-313369",
    title: "La La Land",
    type: "movie",
    tagline: "Here's to the fools who dream.",
    synopsis: "Mia, an aspiring actress, and Sebastian, a dedicated jazz musician, are struggling to make ends meet in modern day Los Angeles as their paths cross and love blossoms.",
    releaseYear: 2016,
    maturityRating: "PG-13",
    matchScore: 98,
    durationMinutes: 128,
    genres: ["Romantic Comedy", "Romance", "Comedy", "Drama"],
    backdropUrl: "https://image.tmdb.org/t/p/original/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w780/uDO8zWDhfWwoFdKS4fzkVJt0Rf0.jpg",
    trailerVideoUrl: "https://www.youtube.com/watch?v=0pdqf4P9MB8",
    videoStreamUrl: "https://media.w3.org/2010/05/bunny/trailer.mp4",
    isTrending: true,
    qualities: ["4K Ultra HD", "Spatial Audio"],
    directors: ["Damien Chazelle"],
    cast: [
      { id: "c-ryan", name: "Ryan Gosling", character: "Sebastian Wilder", role: "Lead" },
      { id: "c-emma", name: "Emma Stone", character: "Mia Dolan", role: "Lead" }
    ],
    audioLanguages: ["English (Original)", "French", "Spanish"],
    subtitleLanguages: ["English [CC]", "French", "Spanish"]
  },
  {
    id: "tmdb-movie-569094",
    title: "Spider-Man: Across the Spider-Verse",
    type: "movie",
    tagline: "It's how you wear the mask that matters.",
    synopsis: "Miles Morales is catapulted across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
    releaseYear: 2023,
    maturityRating: "PG",
    matchScore: 99,
    durationMinutes: 140,
    genres: ["Animation", "Action", "Adventure", "Sci-Fi"],
    backdropUrl: "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    trailerVideoUrl: "https://www.youtube.com/watch?v=cqGjhVJWtEg",
    videoStreamUrl: "https://vjs.zencdn.net/v/oceans.mp4",
    isTrending: true,
    qualities: ["4K Ultra HD", "Dolby Vision", "Spatial Audio"],
    directors: ["Joaquim Dos Santos", "Kemp Powers", "Justin K. Thompson"],
    cast: [
      { id: "c-shameik", name: "Shameik Moore", character: "Miles Morales (voice)", role: "Lead" },
      { id: "c-hailee", name: "Hailee Steinfeld", character: "Gwen Stacy (voice)", role: "Lead" }
    ],
    audioLanguages: ["English (Original)", "Spanish", "French"],
    subtitleLanguages: ["English [CC]", "Spanish", "French"]
  },
  {
    id: "tmdb-movie-496243",
    title: "Parasite",
    type: "movie",
    tagline: "Act like you own the place.",
    synopsis: "All unemployed, Ki-taek's family takes peculiar interest in the wealthy and glamorous Parks for their livelihood until they get entangled in an unexpected incident.",
    releaseYear: 2019,
    maturityRating: "R",
    matchScore: 99,
    durationMinutes: 132,
    genres: ["Drama", "Thriller", "Comedy"],
    backdropUrl: "https://image.tmdb.org/t/p/original/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg",
    posterUrl: "https://image.tmdb.org/t/p/w780/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    trailerVideoUrl: "https://www.youtube.com/watch?v=5xH0RZEhtnj",
    videoStreamUrl: "https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4",
    isTrending: true,
    qualities: ["4K Ultra HD", "5.1 Surround"],
    directors: ["Bong Joon-ho"],
    cast: [
      { id: "c-song", name: "Song Kang-ho", character: "Kim Ki-taek", role: "Lead" },
      { id: "c-lee", name: "Lee Sun-kyun", character: "Park Dong-ik", role: "Lead" }
    ],
    audioLanguages: ["Korean (Original)", "English", "Spanish"],
    subtitleLanguages: ["English [CC]", "Spanish", "French"]
  }
];

export const GENRE_CATEGORIES = [
  { id: 'all', label: 'All Titles' },
  { id: 'horror', label: 'Horror & Suspense', genre: 'Horror' },
  { id: 'romantic-comedy', label: 'Romantic Comedy', genre: 'Romantic Comedy' },
  { id: 'sci-fi', label: 'Sci-Fi & Cyberpunk', genre: 'Sci-Fi' },
  { id: 'action', label: 'Action & Adventure', genre: 'Action' },
  { id: 'crime', label: 'Crime & Noir', genre: 'Crime' },
  { id: 'fantasy', label: 'Epic Fantasy', genre: 'Fantasy' },
  { id: 'drama', label: 'Award Dramas', genre: 'Drama' },
  { id: 'comedy', label: 'Comedies', genre: 'Comedy' },
  { id: 'documentary', label: 'Documentaries', genre: 'Documentary' },
  { id: 'anime', label: 'Anime & Animation', genre: 'Anime' },
];

export const MOCK_PODCASTS = [
  {
    id: 'pod-1',
    title: 'The Director’s Chair: Crafting Alien Odyssey in 4K HDR',
    showName: 'Cinema Spotlight',
    hostName: 'Marcus Miller & Elena Rostova',
    coverUrl: createCinematicSvg('Cinema Spotlight', 'Director Series', '#1A2980', '#26D0CE', '#e50914', 600, 600),
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
    durationSeconds: 2460,
    publishDate: 'Nov 4, 2026',
    description: 'A deep-dive conversation with the visual effects director and cinematographer behind Kepler 452b, breaking down 65mm practical lenses and alien creature design.',
    category: 'Film & Directing',
    playsCount: 48200,
  },
  {
    id: 'pod-2',
    title: 'Neon Underground: Cyberpunk Worlds & Neural Sound Design',
    showName: 'Sci-Fi Frequency',
    hostName: 'Dr. Aaron Chen',
    coverUrl: createCinematicSvg('Sci-Fi Frequency', 'Audio Showcase', '#8A2387', '#E94057', '#00F2FE', 600, 600),
    audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/scifi_laser_hum.ogg',
    durationSeconds: 1980,
    publishDate: 'Nov 2, 2026',
    description: 'Exploring the synthesizers, sub-bass design, and architectural dystopias that make Tokyo 2088 resonate with millions of fans worldwide.',
    category: 'Sci-Fi & Tech',
    playsCount: 31900,
  },
  {
    id: 'pod-3',
    title: 'Writing the Obsidian Bastion: Fantasy Worldbuilding Masterclass',
    showName: 'Screenplay Breakdown',
    hostName: 'Sarah Jenkins',
    coverUrl: createCinematicSvg('Screenplay', 'Writer Studio', '#1e3c72', '#2a5298', '#ffb347', 600, 600),
    audioUrl: 'https://actions.google.com/sounds/v1/weather/thunder_crack.ogg',
    durationSeconds: 3120,
    publishDate: 'Oct 29, 2026',
    description: 'How the showrunners forged rival noble houses, ancient dialects, and unpredictable betrayal arcs in the world of Valoria.',
    category: 'Writing & Lore',
    playsCount: 27400,
  },
  {
    id: 'pod-4',
    title: 'Orchestrating Tension: The Sound of Modern Crime Noir',
    showName: 'Score & Symphony',
    hostName: 'Matteo Vivaldi',
    coverUrl: createCinematicSvg('Score & Symphony', 'Music Podcast', '#000000', '#434343', '#e50914', 600, 600),
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
    durationSeconds: 1840,
    publishDate: 'Oct 26, 2026',
    description: 'Deconstructing the modular synthesizers, solo cellos, and acoustic reverb chambers behind the haunting soundtrack of Midnight Coast.',
    category: 'Music & Scores',
    playsCount: 19800,
  },
];
