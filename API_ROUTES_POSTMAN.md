# Stream Flix - Complete Backend & Frontend Routes + Postman Local Testing Guide

This reference documents **every Backend REST endpoint (`sf_backend/routes.ts` mounted by `sf_backend/app.ts` & `server.ts`)**, **every Frontend route (`sf_frontend/App.tsx`)**, the **Frontend-to-Backend API mapping (`sf_frontend/lib/api/mockClient.ts`)**, and all required **headers, path parameters, query parameters, request payloads, enums, and expected responses** for local testing with **Postman**.

---

## 1. Quick Postman Setup (Local Development)

Start either the unified full-stack server (`PORT=3000`) OR the separated dual-service runner (`sf_backend` on `3100` + Vite `sf_frontend` proxy on `3000`):

```bash
# Unified single-port runtime (default: http://localhost:3000)
npm run dev

# OR Separated dual-service runtime (sf_backend on :3100, sf_frontend on :3000)
./dev.sh
```

Create a Postman Environment (e.g. **Stream Flix Local**) with the following variables:

| Postman Variable | Local Default Value (`.env`) | Description |
| :--- | :--- | :--- |
| `baseUrl` | `http://localhost:3000` | Express + Vite server URL (`PORT=3000`) |
| `adminEmail` | `admin@streamflix.local` | Seeded primary superadmin email (`ADMIN_EMAIL`) |
| `adminPassword` | `StreamFlixSuperAdmin2026!` | Frontend UI login test password (`ADMIN_PASSWORD`) |
| `adminSecret` | `super_admin_secret_token_streamflix_2026` | Secret key required by protected Admin RBAC endpoints (`ADMIN_SECRET_KEY`) |
| `authToken` | `jwt_token_usr_streamflix_superadmin_01_1794239200000` | Captured from `POST /api/auth/login` or `/register` (`data.token`) |
| `titleId` | `tmdb-movie-27205` | Sample stored title ID (Inception) |
| `tmdbMovieId` | `693134` | Raw TMDB numeric movie ID (Dune: Part Two) |
| `tmdbTvId` | `66732` | Raw TMDB numeric TV series ID (Stranger Things) |
| `tvmazeId` | `1` | TVMaze numeric show ID (Under the Dome) |
| `podcastId` | `pod-1` | Seeded podcast episode ID |
| `country` | `nl` | 2-letter ISO country code (`AVAILABILITY_DEFAULT_COUNTRY`) |

---

## 2. Global Middleware, Headers & Guardrails

Every request passing through Express (`sf_backend/app.ts`) is evaluated by three global middlewares:

### A. Security Hardening (`sf_backend/middleware/security.ts`)
- **Defensive Response Headers** attached to every response:
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Prototype Pollution & NoSQL Operator Blocking**:
  - Request JSON bodies containing keys named `__proto__`, `constructor`, `prototype`, or keys starting with `$` whose value is an object return `400 Bad Request`:
    ```json
    { "success": false, "error": { "message": "Malformed or forbidden input parameter detected" } }
    ```
- **Sensitive Path & Traversal Guard**:
  - Paths containing `/.env`, `/.git`, or `..` return `403 Forbidden` (note: in curl/Postman, disable path normalization or send raw URL `/.env` to test).

### B. Rate Limiting (`apiRateLimiter`)
- Applies to all `/api/*` endpoints **except** `GET /api/health`.
- Limit: **120 requests / 60 seconds** per client IP (`X-Forwarded-For` or socket IP).
- Exceeding returns `429 Too Many Requests` with header `Retry-After: 60`.

### C. Idempotency (`sf_backend/middleware/idempotency.ts`)
- Applies automatically to all state-mutating methods: `POST`, `PUT`, `DELETE`, `PATCH`.
- Include header **`Idempotency-Key`** (or **`X-Idempotency-Key`**) with a unique string (e.g. `{{$guid}}` in Postman):
  - First request executes normally and caches `2xx`-`4xx` JSON responses for **1 hour (3,600,000 ms)**.
  - Replaying the same request with the same key returns the cached status + body immediately along with response headers:
    - `X-Cache-Lookup: HIT`
    - `X-Idempotent-Replay: true`

### D. User Context Resolution (`getCurrentUser` in `sf_backend/middleware/auth.ts`)
- Endpoints under `/api/auth/me`, `/api/users/*`, and `/api/stream/progress` check:
  - Header: `Authorization: Bearer jwt_token_<userId>_<timestamp>`
  - If omitted or unrecognized, automatically falls back to `ADMIN_EMAIL` (`admin@streamflix.local`).
  > **Note**: Because `getCurrentUser()` splits the token string by `_` after stripping `Bearer jwt_token_`, passing the full `data.token` returned by `/api/auth/login` or `/api/auth/register` resolves cleanly when matching user ID prefixes (or uses the admin account if unauthenticated).

---

## 3. Backend REST API Routes (All 32 Endpoints)

### 3.1 System Health

#### 1. `GET {{baseUrl}}/api/health`
Check backend availability and external integration configuration flags.
- **Frontend Caller**: None (used by monitoring, CI/CD, and `./admin_manager/security_audit.sh`)
- **Headers**: None required
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "status": "healthy",
    "timestamp": "2026-11-09T21:00:00.000Z",
    "services": {
      "tmdb": { "configured": false, "baseUrl": "https://api.themoviedb.org/3" },
      "tvmaze": { "configured": true, "baseUrl": "https://api.tvmaze.com" },
      "watchmode": { "configured": false, "baseUrl": "https://api.watchmode.com/v1" },
      "movieOfTheNight": { "configured": false, "baseUrl": "https://streaming-availability.p.rapidapi.com/v4" }
    }
  }
  ```

---

### 3.2 Titles & Catalog (`/api/titles*`)

> **Important Caching Note**: `catalogStore.getTitles()` searches local/MongoDB storage first (24-hour TTL) and returns **only titles with a non-empty `posterUrl`**. If `search` is at least 2 characters and fewer than 3 local matches exist (and TMDB is configured), it queries TMDB and persists new results. When Admin Maintenance Mode (`DUMMY_MAINTENANCE`) is enabled, these endpoints serve `DUMMY_PLACEHOLDER_TITLES`.

#### 2. `GET {{baseUrl}}/api/titles`
Query the movie & series catalog with filters and sorting.
- **Frontend Caller**: `streamFlixApi.getTitles(options)` -> `BrowsePage`, `GenrePage`, `SearchPage`, `MyListPage`
- **Query Parameters** (all optional):

  | Param | Type | Allowed Values / Example | Description |
  | :--- | :--- | :--- | :--- |
  | `type` | `string` | `movie` \| `series` | Filter by movies or TV series |
  | `genre` | `string` | `Sci-Fi`, `Horror`, `Romantic Comedy`, `Action`, `Crime`, `Fantasy`, `Drama`, `Comedy`, `Documentary`, `Anime`, `all` | Case-insensitive substring genre match |
  | `search` | `string` | `Inception`, `Christopher Nolan`, `Cyberpunk` | Matches title, synopsis, genres, cast names, directors |
  | `year` | `number` | `2010`, `2024` | Exact `releaseYear` match |
  | `isTrending` | `string` | `true` \| `false` | Only `true` filters for trending titles |
  | `isTop10` | `string` | `true` \| `false` | Filters top 10 & sorts by `top10Rank` ascending |
  | `isNewRelease` | `string` | `true` \| `false` | Filters new releases |
  | `profileKidsLimit` | `string` | `true` \| `false` | Filters `maturityRating` to `G` or `PG` |
  | `sortBy` | `string` | `popularity` \| `match` \| `year` \| `title` | Sort order (`matchScore` desc, `releaseYear` desc, or alphabetical) |
  | `limit` | `number` | `12` | Max number of items returned |

- **Postman Example**:
  `GET {{baseUrl}}/api/titles?type=movie&genre=Sci-Fi&year=2010&sortBy=popularity&limit=10`
- **Response (`200 OK`)**: `{ "success": true, "count": 1, "data": [ /* Title[] */ ] }`

#### 3. `GET {{baseUrl}}/api/titles/billboard`
Fetch the hero billboard featured title (prioritizing items with backdrop, poster, and trailer/stream URL).
- **Frontend Caller**: `streamFlixApi.getFeaturedBillboard()` -> `BrowsePage`, `App.tsx` (fallback)
- **Params / Body**: None
- **Response (`200 OK`)**: `{ "success": true, "data": { /* Title */ } }`

#### 4. `GET {{baseUrl}}/api/titles/:id`
Fetch full metadata, episodes, and cast roster for a single title (checks local DB/Mongo, then TMDB `tmdb-movie-<id>` / `tmdb-tv-<id>`, then TVMaze `tvmaze-series-<id>`, then initial catalog).
- **Frontend Caller**: `streamFlixApi.getTitleById(id)` -> `WatchPlayerContainer`, `App.tsx` (`/title/:id`)
- **Path Parameters**:
  - `id` (`string`, **required**): e.g. `tmdb-movie-27205`, `tmdb-movie-693134`, `tmdb-tv-66732`, `tvmaze-series-1`, `placeholder-alien-odyssey`
- **Response (`200 OK` / `404 Not Found`)**: `{ "success": true, "data": { /* Title */ } }`

#### 5. `GET {{baseUrl}}/api/titles/:id/related`
Return genre/type/rating-matched "More Like This" title recommendations.
- **Frontend Caller**: `streamFlixApi.getMoreLikeThis(id, limit)` -> `TitleDetailModal`
- **Path Parameters**:
  - `id` (`string`, **required**): Reference title ID (e.g. `tmdb-movie-27205`)
- **Query Parameters**:
  - `limit` (`number`, optional, default `6`)
- **Response (`200 OK`)**: `{ "success": true, "data": [ /* Title[] */ ] }`

#### 6. `POST {{baseUrl}}/api/titles/upload`
Publish a user-uploaded / community movie into catalog storage.
- **Frontend Caller**: `streamFlixApi.uploadMovie(movie)` -> `UploadMediaModal`
- **Headers**:
  - `Content-Type: application/json`
  - `Idempotency-Key: upload-movie-001` *(recommended)*
- **Body Fields**:

  | Field | Type | Required | Notes / Default |
  | :--- | :--- | :--- | :--- |
  | `title` | `string` | Recommended | Movie title |
  | `synopsis` | `string` | Recommended | Description |
  | `type` | `'movie' \| 'series'` | Recommended | Usually `'movie'` |
  | `posterUrl` | `string` | **Required to persist** | `saveTitles()` skips titles missing `posterUrl` |
  | `backdropUrl` | `string` | Recommended | Landscape backdrop image URL |
  | `tagline` | `string` | Optional | Defaults in UI to `"A Stream Flix Community Production"` |
  | `releaseYear` | `number` | Optional | e.g. `2026` |
  | `maturityRating` | `MaturityRating` | Optional | `'G' \| 'PG' \| 'PG-13' \| 'TV-14' \| 'TV-MA' \| 'R'` |
  | `genres` | `string[]` | Optional | e.g. `["Sci-Fi", "Independent"]` |
  | `trailerVideoUrl` | `string` | Optional | MP4 or YouTube URL |
  | `videoStreamUrl` | `string` | Optional | MP4 stream URL |
  | `durationMinutes` | `number` | Optional | e.g. `114` |
  | `qualities` | `QualityBadge[]` | Optional | Defaults to `["4K Ultra HD", "Spatial Audio"]` |
  | `cast` | `CastMember[]` | Optional | Defaults to 1 `"Community Creator"` entry |
  | `directors` | `string[]` | Optional | Defaults to `["Independent Director"]` |

- **Sample Postman Body**:
  ```json
  {
    "title": "Orbital Horizon",
    "tagline": "No signal. No return.",
    "synopsis": "An independent sci-fi short following a deep-space relay engineer.",
    "type": "movie",
    "releaseYear": 2026,
    "maturityRating": "PG-13",
    "genres": ["Sci-Fi", "Independent"],
    "posterUrl": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop",
    "backdropUrl": "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop",
    "trailerVideoUrl": "https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4",
    "videoStreamUrl": "https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4",
    "durationMinutes": 114,
    "qualities": ["4K Ultra HD", "Spatial Audio"],
    "cast": [{ "id": "c-1", "name": "Maya Reed", "character": "Elena", "role": "Lead" }],
    "directors": ["Jordan Lee"]
  }
  ```
- **Response (`201 Created`)**: `{ "success": true, "data": { /* Title with custom-movie-<ts> id */ } }`

---

### 3.3 External Provider Proxy Endpoints (`/api/tmdb/*`, `/api/tvmaze/*`, `/api/availability/*`)

#### 7. `GET {{baseUrl}}/api/tmdb/trending`
Fetch trending titles directly from TMDB (requires `TMDB_API_KEY` or `TMDB_API_TOKEN` in `.env`, returns empty array `[]` if unconfigured).
- **Frontend Caller**: None directly (Backend / Postman testing)
- **Query Params**: `timeWindow` (`'day' | 'week'`, optional, default `'week'`)
- **Response (`200 OK`)**: `{ "success": true, "count": number, "data": Title[] }`

#### 8. `GET {{baseUrl}}/api/tmdb/movie/:id`
Fetch TMDB movie details + cast/credits by numeric TMDB ID.
- **Frontend Caller**: Backend / Postman testing
- **Path Params**: `id` (`string`, raw TMDB movie ID, e.g. `27205`)
- **Response (`200 OK` / `404 Not Found`)**: `{ "success": true, "data": Title }`

#### 9. `GET {{baseUrl}}/api/tmdb/tv/:id`
Fetch TMDB TV series details + seasons/cast by numeric TMDB ID.
- **Frontend Caller**: Backend / Postman testing
- **Path Params**: `id` (`string`, raw TMDB TV ID, e.g. `66732`)
- **Response (`200 OK` / `404 Not Found`)**: `{ "success": true, "data": Title }`

#### 10. `GET {{baseUrl}}/api/tmdb/search`
Search TMDB movies and TV shows directly.
- **Frontend Caller**: Backend / Postman testing
- **Query Params**: `q` (`string`, required for non-empty result; e.g. `Dune`)
- **Response (`200 OK`)**: `{ "success": true, "count": number, "data": Title[] }`

#### 11. `GET {{baseUrl}}/api/tvmaze/shows`
Fetch paginated TV shows from the public TVMaze API (always enabled without requiring an API key).
- **Frontend Caller**: Backend / Postman testing
- **Query Params**: `page` (`number`, optional, default `0`)
- **Response (`200 OK`)**: `{ "success": true, "count": number, "data": Title[] }`

#### 12. `GET {{baseUrl}}/api/tvmaze/shows/:id`
Fetch full TVMaze show details, episodes, and cast headshots.
- **Frontend Caller**: Backend / Postman testing
- **Path Params**: `id` (`string`, TVMaze numeric show ID, e.g. `1` or `82`)
- **Response (`200 OK` / `404 Not Found`)**: `{ "success": true, "data": Title }`

#### 13. `GET {{baseUrl}}/api/availability/:titleId`
Lookup streaming platform availability across Watchmode & MovieOfTheNight.
- **Frontend Caller**: `streamFlixApi.getAvailability(titleId)`
- **Path Params**: `titleId` (`string`, e.g. `tmdb-movie-27205`)
- **Query Params**: `country` (`string`, ISO 2-letter code, optional, defaults to `AVAILABILITY_DEFAULT_COUNTRY || 'nl'`)
- **Response (`200 OK`)**: `{ "success": true, "data": { "titleId": "...", "country": "nl", "watchmodeSources": [...], "movieOfTheNight": {...} } }`

---

### 3.4 Podcast Center (`/api/podcasts*`)

#### 14. `GET {{baseUrl}}/api/podcasts`
List podcast episodes, optionally filtered by category.
- **Frontend Caller**: `streamFlixApi.getPodcasts(category)` -> `PodcastCenterPage`
- **Query Params**: `category` (`string`, optional; e.g. `all`, `Film & Directing`, `Sci-Fi & Tech`, `Cinema Analysis`, `Sound & Music`, `Writing & Lore`, `Music & Scores`)
- **Response (`200 OK`)**: `{ "success": true, "count": number, "data": PodcastEpisode[] }`

#### 15. `POST {{baseUrl}}/api/podcasts/upload`
Publish a new audio podcast episode.
- **Frontend Caller**: `streamFlixApi.uploadPodcast(episode)` -> `UploadMediaModal`
- **Headers**:
  - `Content-Type: application/json`
  - `Idempotency-Key: upload-pod-001` *(recommended)*
- **Body Fields**:

  | Field | Type | Required | Notes |
  | :--- | :--- | :--- | :--- |
  | `title` | `string` | Recommended | Episode title |
  | `showName` | `string` | Recommended | Podcast series name |
  | `hostName` | `string` | Recommended | Host(s) |
  | `coverUrl` | `string` | Recommended | 1:1 artwork image URL |
  | `audioUrl` | `string` | Recommended | Audio file/stream URL (`.mp3` / `.ogg`) |
  | `durationSeconds` | `number` | Recommended | Total length in seconds (e.g. `1920`) |
  | `description` | `string` | Recommended | Episode show notes |
  | `category` | `string` | Recommended | e.g. `"Film & Directing"` |
  | `explicit` | `boolean` | Optional | Default `false` |

- **Sample Postman Body**:
  ```json
  {
    "title": "Ep. 42: Deconstructing Sci-Fi Soundscapes",
    "showName": "Stream Flix Originals",
    "hostName": "Super Admin",
    "coverUrl": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop",
    "audioUrl": "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    "durationSeconds": 1920,
    "description": "How modular synthesizers and spatial audio elevate cinema immersion.",
    "category": "Sci-Fi & Tech",
    "explicit": false
  }
  ```
- **Response (`201 Created`)**: `{ "success": true, "data": { /* PodcastEpisode */ } }`

#### 16. `POST {{baseUrl}}/api/podcasts/:id/play`
Increment play telemetry count for a podcast episode.
- **Frontend Caller**: Backend / Postman testing
- **Path Params**: `id` (`string`, e.g. `pod-1`)
- **Headers**: Optional `Idempotency-Key`
- **Response (`200 OK`)**: `{ "success": true, "playsCount": number }`

---

### 3.5 Authentication & Sessions (`/api/auth/*`)

#### 17. `POST {{baseUrl}}/api/auth/register`
Create a user account in server memory and trigger asynchronous **Resend** welcome email.
- **Frontend Caller**: Backend / Postman / `./admin_manager/test_resend_email.sh` (Note: Frontend `SignupPage` currently uses local `AuthProvider.signup`)
- **Headers**: `Content-Type: application/json`, optional `Idempotency-Key`
- **Body Fields**:
  - `email` (`string`, **required**)
  - `planId` (`'standard-ads' | 'standard' | 'premium'`, optional, default `'premium'`)
  - `profileName` (`string`, optional, default `'Primary Profile'`)
  - `avatarUrl` (`string`, optional, default `''`)
- **Sample Postman Body**:
  ```json
  {
    "email": "new.viewer@streamflix.local",
    "planId": "premium",
    "profileName": "Cinema Buff",
    "avatarUrl": ""
  }
  ```
- **Response (`201 Created` / `400 Bad Request`)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "jwt_token_usr_1794239200000_1794239200001",
      "user": { "id": "usr_...", "email": "new.viewer@streamflix.local", "planId": "premium", "profiles": [...] }
    }
  }
  ```

#### 18. `POST {{baseUrl}}/api/auth/login`
Authenticate (or auto-provision if absent in server memory) a user and issue a bearer token.
- **Frontend Caller**: Backend / Postman (Note: Frontend `LoginPage` uses local `AuthProvider.login`)
- **Headers**: `Content-Type: application/json`, optional `Idempotency-Key`
- **Body Fields**:
  - `email` (`string`, **required** - e.g. `{{adminEmail}}`)
- **Sample Postman Body**:
  ```json
  {
    "email": "admin@streamflix.local"
  }
  ```
- **Response (`200 OK` / `400 Bad Request`)**: `{ "success": true, "data": { "token": "jwt_token_...", "user": { /* User */ } } }`

#### 19. `GET {{baseUrl}}/api/auth/me`
Fetch the current user object.
- **Frontend Caller**: Backend / Postman
- **Headers**: Optional `Authorization: Bearer {{authToken}}` (falls back to `admin@streamflix.local`)
- **Response (`200 OK`)**: `{ "success": true, "data": { /* User */ } }`

#### 20. `POST {{baseUrl}}/api/auth/logout`
Stateless session logout acknowledgment.
- **Frontend Caller**: Backend / Postman
- **Response (`200 OK`)**: `{ "success": true, "message": "Successfully logged out" }`

---

### 3.6 User Profiles, Queue, Ratings, Watch Progress & Billing

#### 21. `POST {{baseUrl}}/api/users/profiles`
Add a viewer profile (max 5 per user).
- **Frontend Caller**: Backend / Postman (Frontend `ManageProfilesPage` updates local `AuthContext` state)
- **Headers**:
  - `Content-Type: application/json`
  - Optional `Authorization: Bearer {{authToken}}`
  - Optional `Idempotency-Key`
- **Body Fields**:
  - `name` (`string`, optional, default `'New Profile'`)
  - `avatarUrl` (`string`, optional)
  - `isKids` (`boolean`, optional, default `false` - sets `maturityLimit` to `'PG'` if `true`, `'TV-MA'` if `false`)
- **Sample Postman Body**:
  ```json
  {
    "name": "Movie Night",
    "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    "isKids": false
  }
  ```
- **Response (`201 Created` / `400 Maximum 5 profiles` / `404`)**: `{ "success": true, "data": { /* Profile */ }, "user": { /* User */ } }`

#### 22. `POST {{baseUrl}}/api/users/my-list/toggle`
Add or remove a title from the user's My List queue.
- **Frontend Caller**: Backend / Postman (Frontend `TitleDetailModal` / `PosterCard` update local `AuthContext`)
- **Headers**: `Content-Type: application/json`, optional `Authorization: Bearer {{authToken}}`, optional `Idempotency-Key`
- **Body Fields**:
  - `titleId` (`string`, **required**, e.g. `tmdb-movie-27205`)
- **Sample Postman Body**:
  ```json
  {
    "titleId": "tmdb-movie-27205"
  }
  ```
- **Response (`200 OK` / `400 Bad Request`)**: `{ "success": true, "inList": true, "myList": ["..."] }`

#### 23. `POST {{baseUrl}}/api/users/rate`
Set or clear a user's like/dislike rating on a title.
- **Frontend Caller**: Backend / Postman
- **Headers**: `Content-Type: application/json`, optional `Authorization: Bearer {{authToken}}`, optional `Idempotency-Key`
- **Body Fields**:
  - `titleId` (`string`, **required**)
  - `rating` (`'like' | 'dislike' | 'none'`, optional - anything other than `'like'` or `'dislike'` removes both)
- **Sample Postman Body**:
  ```json
  {
    "titleId": "tmdb-movie-693134",
    "rating": "like"
  }
  ```
- **Response (`200 OK` / `400 Bad Request`)**: `{ "success": true, "likedTitles": ["..."], "dislikedTitles": [] }`

#### 24. `PUT {{baseUrl}}/api/stream/progress`
Record watch-time heartbeat progress for a movie or episode.
- **Frontend Caller**: Backend / Postman
- **Headers**: `Content-Type: application/json`, optional `Authorization: Bearer {{authToken}}`, optional `Idempotency-Key`
- **Body Fields**:
  - `titleId` (`string`, **required** for persistence)
  - `progressPercent` (`number`, e.g. `55`)
  - `seconds` (`number`, current position in seconds, e.g. `4880`)
  - `totalSeconds` (`number`, total duration in seconds, e.g. `8880`)
  - `episodeId` (`string`, optional, for series e.g. `"ns-s1e1"`)
- **Sample Postman Body**:
  ```json
  {
    "titleId": "tmdb-movie-27205",
    "progressPercent": 62,
    "seconds": 5500,
    "totalSeconds": 8880,
    "episodeId": null
  }
  ```
- **Response (`200 OK`)**: `{ "success": true }`

#### 25. `GET {{baseUrl}}/api/billing/plans`
Retrieve subscription tiers (`standard-ads`, `standard`, `premium`).
- **Frontend Caller**: `streamFlixApi.getPlans()`
- **Response (`200 OK`)**: `{ "success": true, "data": [ /* Plan[] */ ] }`

---

### 3.7 Admin Controller & Superuser Management (`/api/admin/*`)

#### 26. `GET {{baseUrl}}/api/admin/status`
Inspect live vs. dummy maintenance mode, catalog totals, and third-party service health.
- **Frontend Caller**: `streamFlixApi.getAdminStatus()` -> `AdminDashboardPage` (`/control-portal`)
- **Headers**: None required
- **Response (`200 OK`)**: `{ "success": true, "data": { "liveMoviesEnabled": true, "serviceMode": "LIVE_SERVICES", "catalogCount": 106, "plansCount": 3, "podcastsCount": 4, "services": {...}, "lastSync": "..." } }`

#### 27. `POST {{baseUrl}}/api/admin/toggle-live-movies`
Switch the entire application between `LIVE_SERVICES` and `DUMMY_MAINTENANCE` (dummy placeholder titles).
- **Frontend Caller**: `streamFlixApi.toggleLiveMovies(enabled)` -> `AdminDashboardPage` & `./admin_manager/toggle_maintenance_mode.sh`
- **Headers**: `Content-Type: application/json`, optional `Idempotency-Key`
- **Body Fields**:
  - `enabled` (`boolean`, optional - omit `{}` to invert current state; pass `false` for Dummy Mode, `true` for Live Movies)
- **Sample Postman Body**:
  ```json
  {
    "enabled": true
  }
  ```
- **Response (`200 OK`)**: `{ "success": true, "liveMoviesEnabled": true, "mode": "LIVE_SERVICES", "message": "..." }`

#### 28. `POST {{baseUrl}}/api/admin/sync-catalog`
Trigger immediate synchronization from TMDB & TVMaze into local/MongoDB 24-hour cache.
- **Frontend Caller**: `streamFlixApi.syncCatalog()` -> `AdminDashboardPage` & `./admin_manager/sync_catalogs.sh`
- **Headers**: Optional `Idempotency-Key`
- **Body**: None
- **Response (`200 OK`)**: `{ "success": true, "message": "...", "timestamp": "..." }`

#### 29. `GET {{baseUrl}}/api/admin/users` *(Protected)*
List all registered users/admins with role classification (`superuser` if matching `ADMIN_EMAIL`, else `admin`).
- **Frontend Caller**: Backend / CLI (`./admin_manager/list_superusers.sh` & `list_admins.sh`)
- **Required Auth Header** *(any one of these)*:
  - `X-Admin-Secret: {{adminSecret}}`
  - `X-Admin-Key: {{adminSecret}}`
  - `Authorization: Bearer {{adminSecret}}`
- **Response (`200 OK` / `401 Unauthorized`)**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "id": "usr_streamflix_superadmin_01",
        "email": "admin@streamflix.local",
        "role": "superuser",
        "planId": "premium",
        "profilesCount": 1,
        "profiles": [...],
        "status": "active"
      }
    ]
  }
  ```

#### 30. `POST {{baseUrl}}/api/admin/users/create` *(Protected)*
Provision a new admin or superuser account and dispatch **Resend** welcome + security audit alert emails.
- **Frontend Caller**: Backend / CLI (`./admin_manager/create_superuser.sh` & `create_admin.sh`)
- **Headers**:
  - `X-Admin-Secret: {{adminSecret}}` **(required)**
  - `Content-Type: application/json`
  - `Idempotency-Key: create-admin-001` *(recommended)*
- **Body Fields**:
  - `email` (`string`, **required**, valid email containing `@`)
  - `role` (`'superuser' | 'admin'`, optional, default `'admin'`)
  - `profileName` (`string`, optional, default `'Admin'`)
  - `planId` (`'standard-ads' | 'standard' | 'premium'`, optional, default `'premium'`)
- **Sample Postman Body**:
  ```json
  {
    "email": "ops@streamflix.local",
    "role": "admin",
    "profileName": "Operations Lead",
    "planId": "premium"
  }
  ```
- **Response (`201 Created` / `400` / `401` / `409 Conflict`)**: `{ "success": true, "message": "...", "data": { "id", "email", "role", "planId", "profiles" } }`

#### 31. `POST {{baseUrl}}/api/admin/users/delete` *(Protected)*
Delete an admin user account and send a **Resend** security alert. Cannot delete primary root `ADMIN_EMAIL` (`403 Forbidden`).
- **Frontend Caller**: Backend / CLI (`./admin_manager/delete_superuser.sh` & `delete_admin.sh`)
- **Headers**:
  - `X-Admin-Secret: {{adminSecret}}` **(required)**
  - `Content-Type: application/json`
  - `Idempotency-Key: delete-admin-001` *(recommended)*
- **Body Fields**:
  - `email` (`string`, **required**)
- **Sample Postman Body**:
  ```json
  {
    "email": "ops@streamflix.local"
  }
  ```
- **Response (`200 OK` / `400` / `401` / `403` / `404 Not Found`)**: `{ "success": true, "message": "Account ops@streamflix.local has been permanently deleted." }`

#### 32. `POST {{baseUrl}}/api/admin/users/reset-password` *(Protected)*
Generate a temporary password and tokenized reset link for a user, dispatching **Resend** password reset & security alert emails.
- **Frontend Caller**: Backend / CLI (`./admin_manager/reset_superuser.sh` & `reset_admin.sh`)
- **Headers**:
  - `X-Admin-Secret: {{adminSecret}}` **(required)**
  - `Content-Type: application/json`
  - `Idempotency-Key: reset-pass-001` *(recommended)*
- **Body Fields**:
  - `email` (`string`, **required**)
- **Sample Postman Body**:
  ```json
  {
    "email": "admin@streamflix.local"
  }
  ```
- **Response (`200 OK` / `400` / `401` / `404 Not Found`)**:
  ```json
  {
    "success": true,
    "message": "Temporary password generated and email dispatched to admin@streamflix.local.",
    "temporaryPassword": "StreamFlixReset_...",
    "resetToken": "rst_..."
  }
  ```

---

## 4. Frontend Client Routes & Data Points (`sf_frontend/App.tsx`)

The React SPA reads routes from **`window.location.hash`** (`http://localhost:3000/#<route>`) with pathname fallback (`http://localhost:3000<route>`).
Because Vite serves `index.html` on non-API GET routes in dev mode (`express.static` / SPA catch-all in production), Postman `GET` requests to frontend paths return the HTML shell unless hitting `/api/*`.

### 4.1 Public Frontend Routes (Unauthenticated Access Allowed)

| Route Path | Page Component | URL Params / Storage / Form Data Points | Backend APIs Called |
| :--- | :--- | :--- | :--- |
| `/` or `''` | `LandingPage` (or `BrowsePage` if signed in) | Email CTA stores `sessionStorage.streamflix_signup_email` before navigating to `/signup` | None directly |
| `/login` | `LoginPage` | Form inputs: `email` (default `admin@streamflix.local`), `password` (min 6 chars; default `StreamFlixSuperAdmin2026!`), `rememberMe` (`boolean`). Sets `localStorage.streamflix_auth_session_v2` (and `sessionStorage.streamflix_ephemeral_session` if `!rememberMe`). | Uses local `AuthContext.login()` *(use `POST /api/auth/login` to test backend auth in Postman)* |
| `/signup` | `SignupPage` | 3-step form: `selectedPlanId` (`'standard-ads' \| 'standard' \| 'premium'`), `email`, `password` (min 6 chars), `profileName`, `selectedAvatarUrl`. Reads `sessionStorage.streamflix_signup_email`. | Uses local `AuthContext.signup()` *(use `POST /api/auth/register` in Postman)* |
| `/forgot-password` | `ForgotPasswordPage` | Form input: `email` (`string`, valid email) | Client toast confirmation |
| `/reset-password` | `ResetPasswordPage` | Form inputs: `password` (>= 6 chars), `confirmPassword` (must match) | Client toast confirmation & redirect to `/login` |
| `/pricing` | `PricingPage` | Reads `MOCK_PLANS`; triggers `changePlan(planId)` on active user | *(Backend equivalent: `GET /api/billing/plans`)* |
| `/privacy` | `PrivacyPolicyPage` | None | None |
| `/terms` | `TermsOfServicePage` | None | None |
| `/refund` | `RefundPolicyPage` | None | None |
| `/cookies` | `CookiePolicyPage` | Reads/writes `localStorage.streamflix_cookie_consent_v1` | None |
| `/parental-controls` | `ParentalControlsPage` | Inputs: `selectedProfileId`, `pin`, `isPinEnabled`, `maturityLimit` (`MaturityRating`), `isKids`, `dailyLimitHours`. Updates `AuthContext` profile. | None directly |

### 4.2 Guarded / Authenticated Frontend Routes
*(Requires `user !== null` in `AuthContext`; automatically initializes with `admin@streamflix.local` unless logged out, otherwise renders `LoginPage`)*

| Route Path | Page Component | Query / Path Params & UI Inputs | Backend APIs Called |
| :--- | :--- | :--- | :--- |
| `/browse` | `BrowsePage` | Uses `activeProfile.isKids` -> `profileKidsLimit` | `GET /api/titles?profileKidsLimit=...`<br>`GET /api/titles/billboard` |
| `/browse/movies` | `BrowsePage (movie)` | Fixed filter `type="movie"` | `GET /api/titles?type=movie&profileKidsLimit=...`<br>`GET /api/titles/billboard` |
| `/browse/series` | `BrowsePage (series)` | Fixed filter `type="series"` | `GET /api/titles?type=series&profileKidsLimit=...`<br>`GET /api/titles/billboard` |
| `/browse/new` | `BrowsePage (new)` | Highlights `isNewRelease` / `isTop10` rows | `GET /api/titles?profileKidsLimit=...`<br>`GET /api/titles/billboard` |
| `/browse/genre`<br>`/browse/genre/*` | `GenrePage` | **Query `?id=`**: `all`, `horror`, `romantic-comedy`, `sci-fi`, `action`, `crime`, `fantasy`, `drama`, `comedy`, `documentary`, `anime`<br>**UI Filters**: `type` (`all\|movie\|series`), `year` (`all\|2026\|2025\|...\|2010`), `sortBy` (`popularity\|year\|match\|title`) | `GET /api/titles?genre=...&type=...&year=...&profileKidsLimit=...&sortBy=...` |
| `/search` | `SearchPage` | **Query `?q=`**: search term (debounced 300ms)<br>**UI Filters**: `type`, `genre`, `year`, `only4k` (client filter for `'4K Ultra HD'`) | `GET /api/titles?search=...&type=...&genre=...&year=...&profileKidsLimit=...` |
| `/my-list` | `MyListPage` | Reads `user.myList`, UI filter `selectedType`, `sortBy` (`recent\|title\|match`) | `GET /api/titles` |
| `/profiles` | `ProfilesPage` | Select active profile (`switchProfile(profileId)`) -> redirects to `/browse` | Updates `localStorage.streamflix_auth_session_v2` |
| `/account` | `AccountPage` | Plan change, playback toggles (`autoplayNext`, `autoplayPreviews`), password reset link | Updates `AuthContext` & `localStorage` |
| `/account/profiles` | `ManageProfilesPage` | Create/edit/delete profiles (`name`, `avatarUrl`, `isKids`, `maturityLimit`) | *(Backend equivalent: `POST /api/users/profiles`)* |
| `/downloads` | `DownloadsPage` | Reads/writes `localStorage.streamflix_offline_downloads_v1` | None directly |
| `/podcasts` | `PodcastCenterPage` | Filter category (`All`, `Film & Directing`, `Sci-Fi & Tech`, `Cinema Analysis`, `Sound & Music`, `Writing & Lore`) | `GET /api/podcasts?category=...`<br>*(Modal upload: `POST /api/podcasts/upload` or `POST /api/titles/upload`)* |
| `/control-portal`<br>`/admin-settings`<br>`/controller` | `AdminDashboardPage` | Isolated Admin Control Portal UI (`ADMIN_PORTAL_PATH=/control-portal`) | `GET /api/admin/status`<br>`POST /api/admin/toggle-live-movies`<br>`POST /api/admin/sync-catalog` |
| `/admin` | *(Redirect)* | Automatically redirects via `navigate('/control-portal')` | Same as `/control-portal` |
| `/watch/:titleId` | `WatchPlayerContainer` (`PlayerShell`) | **Path `:titleId`**: e.g. `/watch/tmdb-movie-27205`. Tracks playback progress every 5s. | `GET /api/titles/:id`<br>Fallback: `GET /api/titles/billboard` |
| `/title/:id` | `BrowsePage` + `TitleDetailModal` | **Path `:id`**: Opens modal directly for title ID; loads similar titles & downloads to localStorage | `GET /api/titles/:id`<br>`GET /api/titles/:id/related?limit=6` |
| `*` (any unknown) | `ErrorPage (404)` | Fallback 404 screen | None |

---

## 5. Frontend API Client Mapping (`sf_frontend/lib/api/mockClient.ts`)

| Frontend Method (`streamFlixApi.*`) | HTTP Method & Path | Arguments / Data Points Passed | Offline / Fallback Behavior |
| :--- | :--- | :--- | :--- |
| `getTitles(options?)` | `GET /api/titles?...` | `{ type, genre, search, year, isTrending, isTop10, isNewRelease, profileKidsLimit, sortBy, limit }` | Filters `MOCK_TITLES` client-side (only with non-empty `posterUrl`) |
| `getTitleById(id)` | `GET /api/titles/:id` | `id: string` | Looks up `MOCK_TITLES` |
| `getMoreLikeThis(id, limit=6)` | `GET /api/titles/:id/related?limit=6` | `id: string`, `limit?: number` | Scores similarity across `MOCK_TITLES` |
| `getFeaturedBillboard()` | `GET /api/titles/billboard` | None | Returns `MOCK_TITLES[0]` |
| `uploadMovie(movie)` | `POST /api/titles/upload` | `Omit<Title, 'id' \| 'matchScore'> & { id?, matchScore? }` | Pushes to in-memory `this.titles` |
| `getPlans()` | `GET /api/billing/plans` | None | Returns `MOCK_PLANS` |
| `getDefaultProfiles()` | *(Local only)* | None | Returns `[MOCK_DEFAULT_PROFILES]` |
| `getPodcasts(category?)` | `GET /api/podcasts?category=...` | `category?: string` | Filters `MOCK_PODCASTS` |
| `uploadPodcast(episode)` | `POST /api/podcasts/upload` | `Omit<PodcastEpisode, 'id' \| 'publishDate'> & { id?, publishDate? }` | Constructs episode object client-side |
| `getAvailability(titleId)` | `GET /api/availability/:titleId` | `titleId: string` | Returns `null` |
| `getAdminStatus()` | `GET /api/admin/status` | None | UI uses default initial dashboard state |
| `toggleLiveMovies(enabled?)` | `POST /api/admin/toggle-live-movies` | `{ enabled?: boolean }` | Optimistic toggle in component state |
| `syncCatalog()` | `POST /api/admin/sync-catalog` | None | Shows fallback info toast |

---

## 6. Types & Allowed Enum Values (`sf_frontend/types/index.ts`)

- **`ContentType`**: `'movie' | 'series'`
- **`MaturityRating`**: `'G' | 'PG' | 'PG-13' | 'TV-14' | 'TV-MA' | 'R'` *(Kids mode restricts to `'G' | 'PG'`)*
- **`QualityBadge`**: `'4K Ultra HD' | 'HD' | 'HDR10+' | 'Dolby Vision' | 'Dolby Atmos' | 'Spatial Audio' | '5.1 Surround'`
- **`Plan['id']`**: `'standard-ads' | 'standard' | 'premium'`
- **Genre Filter Values (`GENRE_CATEGORIES`)**:
  `all`, `Horror` (`id=horror`), `Romantic Comedy` (`id=romantic-comedy`), `Sci-Fi` (`id=sci-fi`), `Action` (`id=action`), `Crime` (`id=crime`), `Fantasy` (`id=fantasy`), `Drama` (`id=drama`), `Comedy` (`id=comedy`), `Documentary` (`id=documentary`), `Anime` (`id=anime`)
- **Sort Values (`sortBy`)**: `'popularity' | 'match' | 'year' | 'title'`
- **Rating Values (`rating`)**: `'like' | 'dislike' | 'none'`

---

## 7. Recommended Postman Verification Flow

1. **System & Health**: Run `GET {{baseUrl}}/api/health` -> verify `status: "healthy"` and inspect defensive headers.
2. **Catalog & Filters**:
   - `GET {{baseUrl}}/api/titles`
   - `GET {{baseUrl}}/api/titles?genre=Horror&year=2024`
   - `GET {{baseUrl}}/api/titles/{{titleId}}/related?limit=4`
3. **Authentication & Session**:
   - `POST {{baseUrl}}/api/auth/login` with `{"email": "{{adminEmail}}"}` -> save `data.token` to `{{authToken}}`.
   - `GET {{baseUrl}}/api/auth/me` with `Authorization: Bearer {{authToken}}`.
4. **User Interactions (with Idempotency)**:
   - `POST {{baseUrl}}/api/users/my-list/toggle` with `Idempotency-Key: test-mylist-1` -> replay the request once and confirm `X-Idempotent-Replay: true` header.
   - `POST {{baseUrl}}/api/users/rate` & `PUT {{baseUrl}}/api/stream/progress`.
5. **Uploads**:
   - `POST {{baseUrl}}/api/titles/upload` (include valid `posterUrl`) and `POST {{baseUrl}}/api/podcasts/upload`.
6. **Admin RBAC & Controls**:
   - Confirm `GET {{baseUrl}}/api/admin/users` without header returns `401`.
   - Re-run with `X-Admin-Secret: {{adminSecret}}` -> returns active superuser list (`200`).
   - Test `POST {{baseUrl}}/api/admin/users/create`, `reset-password`, and `delete` (verifying `403` when targeting `admin@streamflix.local`).
   - Toggle `POST {{baseUrl}}/api/admin/toggle-live-movies` (`{"enabled": false}` -> re-query `GET /api/titles` to see dummy maintenance titles -> set back to `{"enabled": true}`).
7. **Security Checks**:
   - `GET {{baseUrl}}/.env` (expect `403`).
   - `POST {{baseUrl}}/api/auth/register` with `{"__proto__": {"admin": true}, "email": "x@y.com"}` (expect `400`).
