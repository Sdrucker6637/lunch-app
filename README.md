# Lunch Radius

Find lunch, not more than a 20-minute walk from the office. A shared,
no-login ranking app for a team: explore real restaurants near the office,
add the good ones to a shared list, rate them across four subjective
categories plus an automatic fifth — Distance — and settle ties with quick
head-to-head "Taste-Off" picks.

Built as a sibling to (not a fork of) the
[bar-rating](https://github.com/Sdrucker6637/bar-rating) app: same
collaborative philosophy (one shared Firestore document, realtime sync, no
accounts) and the same proven score→tiebreak ranking engine, but a fresh
bright/energetic design, a lunch-specific scoring model, and real
walking-route filtering instead of a fixed city-wide search radius.

---

## What's different from the bar app

| | Bar app | Lunch Radius |
|---|---|---|
| Scoring categories | Vibe, Value, Service, Food, **Drinks** | Vibe, Value, Service, Food, **Distance** (auto-computed, not rated) |
| Search anchor | Fixed NYC-wide center | Your office's exact coordinates |
| Radius | ~12km search bias, no hard cutoff | Real Google-Routes walking time, hard 20-minute cutoff |
| Tiebreak name | "Bar Battle" | "Taste-Off" |
| Extra features | Crawl planner, bill split, achievements | Map, AI-written descriptions (no crawl/split/achievements — out of scope by request) |
| Design | Dark, "walnut & brass" editorial theme | Bright, coral/cream, rounded "energetic" theme |
| Firebase/Google Cloud project | `bar-rating` | Your own new project (see setup) |

**Distance scoring**: unlike the other four categories, Distance is never
typed in by a user. Every spot's real walking time from the office
(OpenRouteService's foot-walking routing, chosen specifically because it's
free forever and never needs a Google Cloud billing account — see
[Cost expectations](#cost-expectations)) is converted to a 0–10 score — 10 at
the office's doorstep, 0 at the 20-minute edge — by `distanceScore()` in
`src/lib/scoring.ts`. Anything over 20 minutes never even shows up in
Explore results.

---

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript 5.5 · Tailwind CSS ·
Firebase Firestore (client + admin SDKs + REST) · Leaflet + leaflet.heat ·
Google Places API (New) · OpenRouteService (free, walking directions) ·
OpenStreetMap Nominatim (free, one-time office geocode) · Google Gemini ·
Vercel · Vitest.

**Deliberately not used**: Google Routes API and Google Geocoding API. Both
were in an earlier version of this app; they were replaced with free,
no-billing-account alternatives (OpenRouteService and Nominatim,
respectively) so that Google Places is the *only* API in this app that ever
needs a Google Cloud billing account attached. See
[Cost expectations](#cost-expectations).

## Project structure

```
src/
├── app/
│   ├── layout.tsx, globals.css        Root shell, fonts, theme
│   ├── page.tsx                       Redirects to /rank
│   ├── rank/page.tsx                  Rankings (leaderboard)
│   ├── explore/page.tsx               Discovery + Want-to-Try list
│   ├── map/page.tsx                   Heat map around the office
│   └── api/
│       ├── restaurants/route.ts       Places search + 20-min walk filter + cache
│       ├── gemini/route.ts            AI-written descriptions
│       └── office/route.ts            Read-only office location for the client
├── components/                        Views, cards, modals, icons
└── lib/
    ├── lunch-context.tsx              ★ Firestore sync + all app state/actions
    ├── firebase.ts                    Client SDK init (from NEXT_PUBLIC_* env vars)
    ├── office.ts                      Resolves office lat/lng (env → geocode → cache)
    ├── routes.ts                      Google Routes API walk-time lookup + cache
    ├── constants.ts, types.ts, scoring.ts, ranking.ts   Pure domain logic
    ├── places.ts, gemini.ts           Client wrappers for the API routes
    └── enrichment.ts, parse.ts        Gemini prompt/response helpers
```

## Data model (Firestore)

One shared document, same pattern as the bar app:

```
lunchRadius/sharedList
{
  spots: Spot[],
  rankingDuels: RankingDuel[]
}
```

Plus three supporting collections, all created lazily by the app:
- `placesSearchCache` — 24h shared cache of Google Places results
- `walkTimeCache` — 30-day shared cache of office→restaurant walk times (keyed by Google `placeId`)
- `config/office` — the geocoded office location, cached after the first lookup

See `src/lib/types.ts` for the full `Spot` shape.

## Ranking logic

Identical philosophy to the bar app (`src/lib/ranking.ts`, ported almost
byte-for-byte): sort by average score, break exact ties with recorded
Taste-Off duels (Copeland-style win/loss count within the tied group), fall
back to a deterministic name/id order when a duel can't fully decide (e.g. a
cycle). Duels never change scores — they only reorder exact ties. Covered by
`src/lib/ranking.test.ts` and `src/lib/scoring.test.ts` (`npm test`).

---

## Manual setup (required before this app works)

I built and pushed the full application, but I don't have access to create
Google/Firebase accounts or cloud projects on your behalf — you'll need to
do the following once:

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project** → name it (e.g. `lunch-radius`).
2. **Build → Firestore Database → Create database** → start in **production mode** (the app ships its own `firestore.rules`, applied in step 4) → pick a region close to your office (e.g. `us-east1` for NYC).
3. **Project settings → General → Your apps → Add app → Web**. Copy the `firebaseConfig` values into your env vars:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.
   - These are not secret (Firebase web config is meant to be public), but there's nothing to hardcode until you've created the project — see `.env.example`.
4. **Project settings → Service accounts → Generate new private key** — downloads a JSON file. From it, set:
   - `FIREBASE_PROJECT_ID` (same as `NEXT_PUBLIC_FIREBASE_PROJECT_ID`)
   - `FIREBASE_CLIENT_EMAIL` (the `client_email` field)
   - `FIREBASE_PRIVATE_KEY` (the `private_key` field, keep the `\n` sequences literal)
   - **Treat this JSON file as a secret — never commit it.**
5. Deploy the included security rules: `npx firebase-tools login`, then `npx firebase-tools use --add` (pick your project), then `npx firebase-tools deploy --only firestore:rules`. (Or paste `firestore.rules` into Firebase Console → Firestore → Rules.)

### 2. Enable Google Places API (the only billed API this app uses)

This app deliberately does **not** use Google's Routes API or Geocoding API
— see steps 3 and 5 for the free replacements — so Places is the only
Google Maps Platform API you need, and the only thing in this whole setup
that requires a Google Cloud billing account at all.

1. In [Google Cloud Console](https://console.cloud.google.com/), select the same project Firebase created for you (Firebase projects are Google Cloud projects).
2. **APIs & Services → Enable APIs** → enable **Places API (New)** only.
3. **APIs & Services → Credentials → Create credentials → API key.** Restrict it (Application restrictions → None/HTTP referrers as appropriate for server-side use; API restrictions → Places API (New) only).
4. Set `GOOGLE_MAPS_API_KEY` to this key.
5. **Billing**: enabling any Google Maps Platform API requires a payment method attached to the project, even for a single API. Real-world cost should stay near $0 for a single-office team (results are cached 24h, and Places is the only billed call in the app), but that's not a hard guarantee — set a budget alert: Cloud Console → **Billing → Budgets & alerts → Create budget**, scope it to this project, e.g. $10/month, so you're emailed before anything surprising happens.

### 3. Get a free OpenRouteService API key (walking-route times)

Real walking-route times use [OpenRouteService](https://openrouteservice.org) instead of Google's Routes API — free forever (2,000 requests/day), no credit card, no Google Cloud billing account involved.

1. [openrouteservice.org/dev/#/signup](https://openrouteservice.org/dev/#/signup) → sign up with an email + password.
2. On your dashboard, **Create a token** (the default free "Standard" token is fine).
3. Set `OPENROUTESERVICE_API_KEY` to that token.

### 4. Get a Gemini API key

1. [Google AI Studio](https://aistudio.google.com/apikey) → **Create API key**.
2. Set `GEMINI_API_KEY`. (Free tier, no billing account needed at this app's volume.)

### 5. Set your office location

Set `OFFICE_LAT` / `OFFICE_LNG` (already filled in `.env.example` for 10
Hudson Yards, NY — **verify these are accurate for your actual office**, e.g.
via Google Maps "what's my coordinates" or right-click → coordinates) and
`OFFICE_ADDRESS` for the human-readable label. If you leave lat/lng blank,
the app geocodes `OFFICE_ADDRESS` automatically via the free OpenStreetMap
Nominatim geocoder (no API key, no billing) and caches the result
permanently — either approach costs nothing, exact coordinates are just
faster since they skip the one-time geocode call.

### 6. Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → import the `lunch-app` GitHub repo.
2. Framework preset: Next.js (auto-detected via `vercel.json`).
3. **Environment Variables** — paste in everything from `.env.example` with your real values (all of them, for both Production and Preview).
4. Deploy. Every push to the connected branch will auto-deploy.

### 7. Local development

```bash
cp .env.example .env.local   # fill in your real values
npm install
npm run dev                  # http://localhost:3000
npm run typecheck
npm test
npm run build
```

---

## Secrets handling

- `.env.local` and any `*serviceAccount*.json` / `*firebase-adminsdk*.json` are gitignored — nothing in this repo's history contains real credentials.
- Every secret (`FIREBASE_PRIVATE_KEY`, `GOOGLE_MAPS_API_KEY`, `OPENROUTESERVICE_API_KEY`, `GEMINI_API_KEY`) is read **server-side only**, in API routes — never sent to the browser.
- The only client-visible config is the Firebase web config (`NEXT_PUBLIC_*`), which is not secret by Firebase's own design — security comes from `firestore.rules`, not from hiding the API key.
- `firestore.rules` scopes public read/write to exactly the four collections this app uses (`lunchRadius`, `placesSearchCache`, `walkTimeCache`, `config`) and denies everything else in the project by default.

## Cost expectations

This app is deliberately architected so that **Google Places API (New) is
the only billed API it uses at all** — walking-route times use
OpenRouteService's free tier and office geocoding uses OpenStreetMap
Nominatim, neither of which ever requires a Google Cloud billing account.
That's a real architectural choice, not just aggressive caching: earlier
versions used Google's Routes API and Geocoding API too, and both were
deliberately replaced to remove any billing-account dependency beyond
Places itself.

- **Firestore**: Spark (free) tier comfortably covers a single-office team.
- **Places API (New)**: the one API in this app that needs a Google Cloud billing account. Still usage-based, not free — but results are cached 24h server-side, so a team doing a few dozen searches a day generates a small fraction of that in actual billable calls. This is the one place cost isn't a hard $0 guarantee, which is why the setup steps above recommend a budget alert.
- **OpenRouteService** (walking times): free tier, 2,000 requests/day, no credit card ever. Walk times are also cached 30 days per restaurant (geography doesn't move), so a given restaurant is looked up essentially once.
- **Nominatim** (office geocode): free, no API key, and only ever called once — the result is cached in Firestore permanently.
- **Gemini**: `gemini-3.5-flash-lite`, free tier, no billing account needed at this volume — cached per-restaurant after first enrichment.
- **Vercel**: Hobby tier ($0) is sufficient unless traffic is unusually high.

**If you want an even harder guarantee than "Places is cached and cheap":**
you could disable the AI-written descriptions (skip setting `GEMINI_API_KEY`
— the app degrades gracefully, spots just won't get auto-generated blurbs)
or ask me to add a daily cap on searches per session. The one API surface
that can't be made literally free without changing what the app does is
discovery search itself, since that's the one place real-time data from a
live restaurant database is genuinely valuable — OpenStreetMap's free
Overpass API was considered as a zero-billing alternative for this too, but
was intentionally not used here to keep restaurant data quality/freshness
closer to Google's.

## Known limitations

- No authentication — same open-link model as the bar app, by explicit choice. Anyone with the URL can view and edit.
- Office-anchored only — moving offices means updating `OFFICE_LAT`/`OFFICE_LNG` (or `OFFICE_ADDRESS`) and redeploying; there's no in-app office picker.
- No crawl planner, bill-splitting, or achievements — deliberately out of scope for this build (see feature-scope decision above); the architecture doesn't block adding them later.
- OpenRouteService's free tier (2,000 requests/day) is a third-party service with its own uptime/rate-limit terms, not something this project controls — if it's ever down or your usage genuinely exceeds 2,000 walk-time lookups a day (very unlikely given 30-day caching), walk times for uncached restaurants would fail closed (excluded from discovery results) rather than silently falling back to a less accurate estimate.
- I could not create the actual Firebase/Google Cloud/OpenRouteService/Vercel resources or verify against live APIs from this environment (no account credentials, and this sandbox's network proxy blocks most external domains including Google's and OpenRouteService's own) — the app is built, typechecked, unit-tested, and production-built successfully, but the end-to-end Firestore/Places/OpenRouteService/Gemini flows need to be smoke-tested by you once real credentials are in place (steps above).
