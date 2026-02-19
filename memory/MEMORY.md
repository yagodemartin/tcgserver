# TCGServer - Pokémon TCG Companion App

## Project Overview
- **Goal**: Free MVP + scalable with hard cost limits, future Pro subscription model
- **Architecture**: iOS SwiftUI app + Cloudflare Worker backend + Limitless API integration + Firebase (future)
- **Key principle**: No surprise infrastructure costs, public data edge-cached, private data gated behind paywall

## Tech Stack
- **Frontend**: iOS (SwiftUI)
- **Public Backend**: Cloudflare Worker (BFF pattern)
- **Cache**: Cloudflare KV
- **Public API**: Limitless Tournament API
- **Future (Pro)**: Firebase (Auth, Firestore, Cloud Functions)

## Architecture Layers
1. **Public Layer (Cloudflare Worker)**
   - Acts as Backend-for-Frontend (BFF)
   - Caches/aggregates Limitless data
   - Protects from rate limits
   - No surprise costs guaranteed

2. **Firebase Layer (Future - Pro features)**
   - User authentication
   - Battle tracking (Firestore)
   - Cloud Functions for Pro logic

## Public API Endpoints (To Implement)
- `GET /v1/meta/top` - Top decks (7 days default, customizable)
- `GET /v1/tournaments/recent` - Recent tournaments

### Caching TTLs
- Meta Top: 6-12 hours
- Tournaments Recent: 3-6 hours
- Tournament Standings: 12-24 hours

### Rate Limiting
- 1 request per 15-30 seconds per IP → 429 response with Retry-After

## Next Steps
- Starting backend implementation step-by-step
- Building Cloudflare Worker first
- Then integrating Limitless API
