# Arquitectura del Sistema - TCGServer

## 🏗️ Visión General

TCGServer es una plataforma multi-game para jugadores competitivos de Trading Card Games, construida con arquitectura serverless Edge Computing.

---

## 🎨 Diseño Multi-Game

**CRÍTICO**: Todo el sistema está diseñado desde el inicio para soportar múltiples juegos (Pokémon, Magic, Riftbound, etc.), aunque el MVP solo tiene Pokémon funcional.

### Principios de Diseño

1. **Game-Agnostic Core** - La lógica central no conoce reglas específicas de juegos
2. **Adapter Pattern** - Cada juego tiene su propio adapter para APIs externas
3. **Unified Data Model** - Firestore collections con campo `game` discriminator
4. **Progressive Enhancement** - UI muestra selector de juegos desde día 1 (otros disabled)

### Estructura de Endpoints

```
/v1/:game/meta/top              # ✅ Pokémon funcional
/v1/:game/tournaments/recent    # ✅ Pokémon funcional
/v1/:game/meta/deck/:name       # ✅ Pokémon funcional

/v1/meta/top                    # ⚠️ Backward compat → redirige a /v1/pokemon/meta/top
```

**Ejemplos:**
- `/v1/pokemon/meta/top` → ✅ Funciona (Limitless API)
- `/v1/magic/meta/top` → 🚧 501 Not Implemented (Fase 2)
- `/v1/riftbound/meta/top` → 🚧 501 Not Implemented (Fase 2)

---

## 🔧 Stack Tecnológico

### Backend (Cloudflare Workers)

**¿Por qué Cloudflare Workers?**
- ✅ Free tier generoso (100K req/día)
- ✅ Edge compute (baja latencia global)
- ✅ KV storage incluido (caching gratis)
- ✅ Deploy instantáneo sin downtime
- ✅ Escalabilidad automática

**Limitaciones:**
- ❌ No soporta Firebase Admin SDK nativo (requiere workaround)
- ❌ 10ms CPU time limit (optimizar código crítico)
- ❌ No persistent filesystem (usar KV para cache)

### Cache (Cloudflare KV Store)

**Strategy:**
- **Meta endpoints**: 12h TTL (baja volatilidad)
- **Tournament lists**: 6h TTL (cambios moderados)
- **Deck details**: 12h TTL (estable)
- **User data**: NO cacheable (privado, siempre fresh)

**Cache Keys Pattern:**
```
{game}:meta:top:{format}:{days}:{limit}
{game}:tournaments:recent:{format}:{days}:{limit}
{game}:deck:{deckName}:{format}:{days}
```

**Ejemplo:**
```
pokemon:meta:top:standard:7:10
magic:meta:top:modern:14:20
```

### Auth & Database (Firebase)

**Firebase Auth:**
- Google Sign-In (flujo web + mobile)
- JWT token verification en Workers (usando `firebase-auth-cloudflare-workers`)
- No cookies, solo Authorization header

**Firestore:**
- REST API (no Admin SDK en Workers)
- Security Rules estrictas (solo owner puede leer/escribir)
- Collections: `user_tournaments`, `user_matches`

**¿Por qué Firebase y no D1/Durable Objects?**
- ✅ Free tier más generoso (50K reads/día vs 5M reads/mes D1)
- ✅ Auth integrado (Google Sign-In out-of-the-box)
- ✅ SDKs web/mobile maduros
- ✅ Realtime sync (Fase 2)
- ✅ Analytics gratuito
- ❌ Vendor lock-in (aceptable para MVP)

### External APIs

#### Limitless TCG API
- **Base URL**: `https://play.limitlesstcg.com/api`
- **Rate Limits**: No documentados oficialmente (observamos ~100 req/min safe)
- **Endpoints públicos**: tournaments, standings, details
- **API Key requerida**: Solo para `/decks` endpoint (Fase 2)

**Endpoints usados:**
```
GET /tournaments?game=PTCG&format=STANDARD&limit=50
GET /tournaments/{id}/standings
GET /tournaments/{id}/details
```

**Response caching:** AGRESIVO (12h) para minimizar hits

#### Card Images
- **Source**: Limitless CDN (DigitalOcean Spaces)
- **Pattern**: `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/{SET}/{SET}_{NUMBER}_R_EN_{SIZE}.png`
- **Sizes**: SM (small), MD (medium), LG (large)
- **Fallback**: Hide image si falla (onerror handler)

**Ejemplo:**
```
PAL-006 → PAL_006_R_EN_LG.png
TWM-123 → TWM_123_R_EN_LG.png
```

---

## 📊 Data Flow

### Meta Tracking (Read-only)

```
User Request
  ↓
Cloudflare Worker (check KV cache)
  ↓ [MISS]
Limitless API (fetch tournaments → standings)
  ↓
Aggregate deck frequency
  ↓
Store in KV (12h TTL)
  ↓
Return JSON response
```

**Performance:**
- Cached: 4-9ms (KV read)
- Uncached: 2-3s (15 tournaments × standings)
- Optimization: Limit to 5 tournaments (500ms)

### Tournament Tracker (Authenticated)

```
User Login (Google Sign-In)
  ↓
Firebase Auth (get JWT token)
  ↓
Request with Authorization: Bearer {token}
  ↓
Cloudflare Worker (verify JWT)
  ↓ [valid]
Firestore REST API (read/write)
  ↓
Return JSON response
```

**Security:**
- JWT verification en Worker (no confiar en client)
- Firestore Security Rules validan `userId` match
- Rate limiting por IP (100 req/hora)

---

## 🗂️ Estructura de Código (Actual)

### Fase Actual (Monolítico)

```
src/
  index.js  (1071 líneas - TODO: refactor)
```

**Problemas:**
- ❌ Todo en un archivo (difícil de mantener)
- ❌ Acoplamiento alto (meta logic + routing + cache)
- ❌ No modular (imposible agregar Magic sin refactor)

### Fase Target (Modular)

```
src/
├── index.js                    # Router principal (200-250 líneas)
│
├── middleware/
│   ├── auth.js                # JWT verification
│   ├── rateLimit.js           # IP-based rate limiting
│   └── cors.js                # CORS headers
│
├── core/
│   ├── cache.js               # KV wrapper (get/set/delete)
│   ├── errors.js              # Error handling utilities
│   └── response.js            # JSON response helpers
│
├── games/
│   ├── registry.js            # Game router (pokemon → adapter)
│   ├── pokemon/
│   │   ├── adapter.js         # Implementa IGameAdapter
│   │   ├── limitless.js       # Limitless API client
│   │   ├── enhancers.js       # Agregar imágenes, enriquecer data
│   │   └── constants.js       # STANDARD, EXPANDED, sets
│   └── magic/                 # Fase 2
│       ├── adapter.js
│       ├── mtggoldfish.js
│       └── constants.js
│
├── routes/
│   ├── meta.js                # GET /:game/meta/top
│   ├── tournaments.js         # GET /:game/tournaments/recent
│   ├── deck.js                # GET /:game/meta/deck/:name
│   ├── userTournaments.js     # POST/GET/PUT/DELETE /user/tournaments
│   ├── userMatches.js         # POST/GET /user/matches
│   └── demo.js                # GET /demo (HTML page)
│
└── services/
    ├── firebase.js            # Firebase init
    ├── firestore.js           # Firestore REST client
    └── auth.js                # Auth helpers
```

**Benefits:**
- ✅ Separación de responsabilidades
- ✅ Fácil agregar nuevos juegos (crear adapter)
- ✅ Testing independiente por módulo
- ✅ Reutilización de código (core, middleware)

---

## 🔌 Game Adapter Interface

Cada juego implementa esta interfaz:

```javascript
interface IGameAdapter {
  /**
   * Fetch top meta decks for this game
   * @param {Object} params - {format, days, limit}
   * @returns {Promise<Array<Deck>>}
   */
  async fetchMetaDecks(params);

  /**
   * Fetch recent tournaments for this game
   * @param {Object} params - {format, days, limit}
   * @returns {Promise<Array<Tournament>>}
   */
  async fetchTournaments(params);

  /**
   * Fetch detailed deck info
   * @param {string} deckName
   * @param {Object} params - {format, days}
   * @returns {Promise<DeckDetails>}
   */
  async fetchDeckDetails(deckName, params);

  /**
   * Get supported formats for this game
   * @returns {Array<string>}
   */
  getSupportedFormats();
}
```

**Implementaciones:**
- `PokemonAdapter` → Usa Limitless API
- `MagicAdapter` (Fase 2) → Usa MTGGoldfish API
- `RiftboundAdapter` (Fase 2) → TBD

**Ejemplo de uso:**
```javascript
import { gameRegistry } from './games/registry.js';

const adapter = gameRegistry.get('pokemon'); // PokemonAdapter
const decks = await adapter.fetchMetaDecks({ format: 'standard', days: 7, limit: 10 });
```

---

## 🔒 Seguridad

### Firebase Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User tournaments - solo owner puede leer/escribir
    match /user_tournaments/{tournamentId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;
    }

    // User matches - solo owner puede leer/escribir
    match /user_matches/{matchId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Rate Limiting

**Estrategia:**
- IP-based (header `CF-Connecting-IP`)
- 100 requests/hora por IP en endpoints autenticados
- Sin límite en endpoints públicos (KV cache protege)

**Implementación:**
```javascript
const rateLimitKey = `ratelimit:${ip}:${Date.now()}`;
const count = await KV.get(rateLimitKey);
if (count > 100) {
  return new Response('Too Many Requests', {
    status: 429,
    headers: { 'Retry-After': '3600' }
  });
}
```

### CORS

**Configuración:**
```javascript
headers: {
  'Access-Control-Allow-Origin': '*',  // Producción: restringir a dominios específicos
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

---

## 📱 Frontend Architecture

### Vanilla JS (No Frameworks)

**¿Por qué no React/Vue/Svelte?**
- ✅ Simplicidad (proyecto pequeño, 1 página)
- ✅ Zero build step (deploy instantáneo)
- ✅ Performance (sin overhead de framework)
- ✅ Aprende fundamentos primero
- ❌ Escalabilidad limitada (si crece, migrar a framework)

### UI Components (Modulares)

```javascript
// Componentes funcionales inline
function DeckGrid(decks) { ... }
function DeckModal(deck) { ... }
function TournamentForm() { ... }
function MatchQuickAdd(tournament) { ... }
```

### State Management

**Sin Redux/Vuex, solo:**
- `localStorage` para tokens de auth
- Variables globales para state temporal
- Event listeners para updates

```javascript
let currentUser = null;
let metaDecks = [];

function login(user) {
  currentUser = user;
  localStorage.setItem('idToken', user.token);
  renderApp();
}
```

### Styling

**Approach:**
- CSS inline en `<style>` tag (single-page app)
- CSS Grid para layouts
- Responsive con media queries
- Color palette: Purple gradient (brand)

```css
.deck-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

@media (max-width: 600px) {
  .deck-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
```

---

## 🚀 Deployment Strategy

### Development

```bash
npm run dev
# Cloudflare Workers local emulator
# KV = in-memory store (dev-kvdb-preview)
# Port: 8787 (o siguiente disponible)
```

### Staging (Opcional)

```bash
npm run deploy:staging
# Deploy to staging.tcgserver.dev
# Uses staging Firebase project
```

### Production

```bash
npm run deploy
# Deploy to api.tcgserver.dev
# Uses production Firebase project
# KV = production namespace
```

**Zero Downtime:**
- Cloudflare Workers hace blue-green deployment automático
- Rollback instantáneo si falla

---

## 📊 Monitoring & Analytics

### Cloudflare Analytics
- Request count, errors, latency
- Geographic distribution
- Cache hit rate

### Firebase Analytics
- User events (login, create tournament, add match)
- Retention metrics
- Feature usage

### Custom Metrics (Fase 2)
- Average win rate por deck
- Most tracked decks
- Tournament frequency

---

## 💾 Backup & Recovery

### Firestore Backups
- Auto backups diarios (Firebase console)
- Export a Google Cloud Storage (manual)

### KV Cache
- No backups necesarios (cache regenerable)
- Si falla KV → fetch directo de Limitless API

### Disaster Recovery
- Código en GitHub (versionado)
- Secrets en 1Password (secure)
- Deploy desde cualquier máquina (`npx wrangler deploy`)

---

## 🔮 Escalabilidad

### Límites Actuales (Free Tier)

**Cloudflare:**
- 100K requests/día
- 1GB KV storage
- 10ms CPU time/request

**Firebase:**
- 50K reads/día
- 20K writes/día
- 1GB storage

**Estimado de uso (MVP):**
- 2,500 requests/día (2.5% de límite) ✅
- 500 Firestore reads/día (1% de límite) ✅
- 100 KV writes/día (cache updates) ✅

**Crecimiento 10x (25K users/día):**
- Cloudflare: 25K requests (25% de límite) ✅
- Firebase: 5K reads/día (10% de límite) ✅
- **Still free tier** ✅

**Crecimiento 100x (250K users/día):**
- Cloudflare: 250K requests → **Necesita plan Paid ($5/mes + $0.50/million)** ❌
- Firebase: 50K reads/día → **Límite alcanzado, Blaze plan (pay-as-you-go)** ❌

**Estimado de costo con 100x growth:**
- Cloudflare: ~$10/mes
- Firebase: ~$5/mes (50K adicionales × $0.06/100K)
- **Total: ~$15/mes** (aceptable para producto validado)

---

## 🎯 Next Steps (Refactor)

1. **Día 1-2**: Crear estructura modular (games/, routes/, core/)
2. **Día 3**: Migrar código existente a módulos
3. **Día 4**: Testing de regresión (verificar endpoints funcionan)
4. **Día 5-7**: Firebase Auth + Firestore
5. **Día 8-13**: Tournament Tracker UI
6. **Día 14**: Deploy production

**Criterio de éxito:**
- ✅ Tests passing (curl scripts)
- ✅ UI funcional (login, crear torneo, agregar match)
- ✅ Cero downtime en migration
- ✅ Performance igual o mejor (caching optimizado)

---

**Última actualización**: Feb 21, 2026
**Versión**: 0.1.0 (MVP en progreso)
