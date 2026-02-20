# TCGServer - Pokémon TCG Meta Analytics Backend

A fast, free, and scalable backend for Pokémon TCG meta analysis and tournament tracking. Built on **Cloudflare Workers** with zero surprise infrastructure costs.

## 🎯 Overview

TCGServer provides real-time Pokémon TCG meta data, tournament information, and deck analytics. It aggregates tournament results from the Limitless API and serves them through a blazing-fast, edge-cached API.

**Features:**
- ⚡ Sub-100ms responses (Cloudflare edge caching)
- 🔄 12-hour cache for meta data, 6-hour for tournaments
- 🎨 Interactive demo dashboard
- 📊 Deck popularity metrics
- 🏆 Top placements tracking
- 🎴 Full card lists with images
- 💰 Free tier forever (no surprise costs)

## 🏗️ Architecture

```
┌─────────────────┐
│   iOS App       │ (SwiftUI - future)
│  (Frontend)     │
└────────┬────────┘
         │
    HTTPS API
         │
┌────────▼────────────────────────┐
│   Cloudflare Worker             │ ← Edge-cached responses
│   (BFF Pattern)                 │
└────────┬────────────────────────┘
         │
    ┌────┴────┬─────────────────┐
    │          │                 │
    ▼          ▼                 ▼
┌─────────┐ ┌──────────┐ ┌──────────────┐
│ KV      │ │ Limitless│ │ Pokemon TCG  │
│ Cache   │ │ API      │ │ Images CDN   │
└─────────┘ └──────────┘ └──────────────┘
```

## 📂 Project Structure

```
tcgserver/
├── src/
│   └── index.js           # Main Cloudflare Worker (all endpoints)
├── wrangler.toml          # Cloudflare configuration
├── package.json           # Node dependencies
├── memory/
│   └── MEMORY.md          # Development notes
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account (free tier works)

### Local Development

```bash
# Clone and install
git clone https://github.com/yagodemartin/tcgserver.git
cd tcgserver
npm install

# Start local dev server (http://127.0.0.1:8788)
npm run dev

# Visit demo page
# Open http://127.0.0.1:8787 in your browser
```

### Deploy to Cloudflare

```bash
# Requires Cloudflare account
npm run deploy

# Your Worker URL will be printed
# Visit https://your-worker.your-name.workers.dev/
```

## 📡 API Endpoints

### 1. Demo Dashboard
**`GET /` or `GET /demo`**

Interactive web dashboard with:
- Top meta decks (with images)
- Recent tournaments
- Deck details modal
- Filter controls

**Browser:** `http://127.0.0.1:8788/`

---

### 2. Health Check
**`GET /health`**

```bash
curl http://127.0.0.1:8788/health
# Response: OK
```

---

### 3. Top Meta Decks
**`GET /v1/meta/top`**

Returns the most popular decks from recent tournaments.

**Query Parameters:**
- `days` (int, default: 7) - Time range: 3, 7, 14, 30
- `format` (string, default: "standard") - "standard" or "expanded"
- `limit` (int, default: 10) - Max results: 5-20

**Example:**
```bash
curl "http://127.0.0.1:8788/v1/meta/top?days=7&format=standard&limit=10"
```

**Response:**
```json
{
  "updated_at": "2026-02-20T22:22:32.848Z",
  "format": "standard",
  "days": 7,
  "decks": [
    {
      "name": "Dragapult Dusknoir",
      "count": 64,
      "mainCard": {
        "name": "Dragapult ex",
        "set": "TWM",
        "number": "130"
      },
      "image": "https://images.pokemontcg.io/TWM/130.png"
    }
  ]
}
```

**Cache:** 12 hours | **Header:** `X-Cache: HIT/MISS`

---

### 4. Recent Tournaments
**`GET /v1/tournaments/recent`**

Lists recent tournaments.

**Query Parameters:**
- `days` (int, default: 7) - Time range
- `format` (string, default: "standard") - Tournament format
- `limit` (int, default: 50) - Max results

**Example:**
```bash
curl "http://127.0.0.1:8788/v1/tournaments/recent?days=7&limit=10"
```

**Response:**
```json
{
  "updated_at": "2026-02-20T22:22:32.848Z",
  "format": "standard",
  "days": 7,
  "count": 48,
  "tournaments": [
    {
      "id": "69725099b1294bfab720361e",
      "name": "Turtwig Den Revival Series Challenge 24",
      "date": "2026-02-20T17:05:00.000Z",
      "players": 41,
      "format": "STANDARD"
    }
  ]
}
```

**Cache:** 6 hours | **Header:** `X-Cache: HIT/MISS`

---

### 5. Deck Details
**`GET /v1/meta/deck/:deckName`**

Get comprehensive information about a specific deck.

**URL Parameters:**
- `deckName` (string) - URL-encoded deck name (e.g., `Dragapult%20Dusknoir`)

**Query Parameters:**
- `days` (int, default: 7)
- `format` (string, default: "standard")

**Example:**
```bash
curl "http://127.0.0.1:8788/v1/meta/deck/Dragapult%20Dusknoir?days=7&format=standard"
```

**Response:**
```json
{
  "updated_at": "2026-02-20T22:22:48.174Z",
  "format": "standard",
  "days": 7,
  "deck": {
    "name": "Dragapult Dusknoir",
    "appearances": 64,
    "image": "https://images.pokemontcg.io/TWM/130.png",
    "topPlacements": [
      {
        "placing": 2,
        "player": "Maxi1",
        "tournament": "Turtwig Den Revival Series Challenge 24",
        "date": "2026-02-20T17:05:00.000Z",
        "record": {
          "wins": 5,
          "losses": 1,
          "ties": 0
        }
      }
    ],
    "cardList": {
      "pokemon": [
        {"count": 2, "set": "TWM", "number": "130", "name": "Dragapult ex"}
      ],
      "trainer": [
        {"count": 4, "set": "PFL", "number": "87", "name": "Dawn"}
      ],
      "energy": [
        {"count": 5, "set": "MEE", "number": "2", "name": "Fire Energy"}
      ]
    }
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Deck not found in recent tournaments
- `500` - Server error

**Cache:** 12 hours | **Header:** `X-Cache: HIT/MISS`

---

## 🔄 Caching Strategy

All endpoints implement intelligent caching:

| Endpoint | TTL | Cache Key Pattern |
|----------|-----|-------------------|
| `/v1/meta/top` | 12h | `meta:top:{format}:{days}:{limit}` |
| `/v1/tournaments/recent` | 6h | `tournaments:recent:{format}:{days}:{limit}` |
| `/v1/meta/deck/:name` | 12h | `deck:{name}:{format}:{days}` |

**Cache Headers:**
- `X-Cache: HIT` - Served from cache
- `X-Cache: MISS` - Fresh fetch from Limitless API

---

## 🛡️ Rate Limiting

Respects Limitless API rate limits automatically:
- Max 15 tournaments processed per request (prevents overload)
- 500ms delays between tournament fetches
- Automatic retries with exponential backoff for 429 errors

---

## 🎨 Technologies

- **Runtime:** Cloudflare Workers (V8 Engine)
- **Cache:** Cloudflare KV
- **Language:** JavaScript (ES6+)
- **External APIs:** Limitless TCG API, Pokemon TCG Images CDN
- **Frontend Demo:** Vanilla HTML/CSS/JavaScript (no dependencies)

---

## 📊 Development

### File Structure
```
src/index.js          # Main worker file (~900 lines)
  ├── fetchTournaments()      # Get tournaments from Limitless
  ├── fetchStandings()        # Get tournament standings (with retry)
  ├── extractMainCard()       # Extract main Pokemon from deck
  ├── getCardImageUrl()       # Fetch card images (with timeout)
  ├── aggregateDecks()        # Count and sort decks by popularity
  ├── handleMetaTop()         # /v1/meta/top endpoint
  ├── handleTournamentsRecent()  # /v1/tournaments/recent endpoint
  ├── fetchDeckDetails()      # Aggregate deck data across tournaments
  ├── handleDeckDetails()     # /v1/meta/deck/:name endpoint
  ├── generateDemoHTML()      # Interactive dashboard HTML
  ├── handleDemo()            # / and /demo endpoint
  └── export default fetch()  # Main router
```

### Key Functions

**Rate Limit Handling:**
```javascript
// Automatic retry with exponential backoff
if (res.status === 429) {
  const delay = parseInt(retryAfter) || (1000 * Math.pow(2, retryCount));
  await new Promise(r => setTimeout(r, delay));
}
```

**KV Caching Pattern:**
```javascript
const cached = await env.KVDB.get(cacheKey);
if (cached) return new Response(cached, { headers: { 'X-Cache': 'HIT' } });
// ... fetch data ...
ctx.waitUntil(env.KVDB.put(cacheKey, data, { expirationTtl: 43200 }));
```

---

## 🚧 Future Enhancements

- [ ] User authentication (JWT)
- [ ] Deck builder integration
- [ ] Matchup analytics
- [ ] Player profiles
- [ ] Win rate statistics
- [ ] Deck favoriting / saved lists
- [ ] Push notifications for new tournaments
- [ ] Export deck to TCGPlayer / Pokellector
- [ ] iOS/Android native apps
- [ ] Pro subscription features (advanced analytics)

---

## 📝 Contributing

This is an open source project. Feel free to:
- Report bugs
- Suggest features
- Submit PRs
- Improve documentation

---

## 📄 License

MIT - Free to use and modify

---

## 🔗 Links

- **GitHub:** https://github.com/yagodemartin/tcgserver
- **Limitless API:** https://play.limitlesstcg.com/
- **Cloudflare Workers:** https://workers.cloudflare.com/

---

## 💬 Questions?

- Open an issue on GitHub
- Check memory/MEMORY.md for development notes
- Review src/index.js for implementation details

**Happy deck building! 🎴**
