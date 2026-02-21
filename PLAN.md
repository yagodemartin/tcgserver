# Plan de Implementación - TCGServer MVP

**Timeline**: 14 días
**Objetivo**: MVP funcional con Tournament Tracker
**Fecha inicio**: Feb 21, 2026

---

## 🎯 Objetivos del MVP

### Must-Have (Bloqueantes)
- ✅ Meta top decks con imágenes (COMPLETADO)
- ✅ Demo UI interactiva (COMPLETADO)
- ⏳ Google Sign-In funcional
- ⏳ Tournament Tracker: crear torneos
- ⏳ Tournament Tracker: registrar matches con colores (verde/rojo/amarillo)
- ⏳ Stats básicas (récord, win rate)
- ⏳ Multi-game architecture (Pokemon funcional, otros stubs)

### Nice-to-Have (Opcionales)
- ⏳ Rate limiting en producción
- ⏳ Error handling user-friendly
- ⏳ Loading states en UI
- ⏳ Responsive mobile testing

### Fase 2 (Post-MVP)
- ❌ Deck Builder completo
- ❌ Precios de cartas (TCGPlayer API)
- ❌ Gráficos de tendencias
- ❌ Magic/Riftbound adapters funcionales
- ❌ Freemium/Pro plan

---

## 📅 Timeline Detallado

### Fase 1: Backend Refactor (Día 1-4)

#### Día 1: Estructura Modular
**Goal**: Crear estructura de carpetas sin romper código existente

**Tasks:**
- [ ] Crear directorios: `core/`, `games/pokemon/`, `routes/`, `middleware/`, `services/`
- [ ] Crear archivos vacíos con exports
- [ ] Testear que `npm run dev` sigue funcionando

**Files:**
```
src/
├── core/
│   ├── cache.js          (exporta getCached, setCached, deleteCached)
│   ├── errors.js         (exporta ErrorHandler class)
│   └── response.js       (exporta jsonResponse, errorResponse)
├── middleware/
│   ├── cors.js           (exporta corsHeaders)
│   └── rateLimit.js      (exporta rateLimitMiddleware)
├── games/
│   ├── registry.js       (exporta gameRegistry Map)
│   └── pokemon/
│       ├── adapter.js    (exporta PokemonAdapter class)
│       ├── limitless.js  (exporta LimitlessClient)
│       └── constants.js  (exporta FORMATS, SETS, COLORS)
└── routes/
    ├── meta.js           (exporta handleMetaTop)
    ├── tournaments.js    (exporta handleTournamentsRecent)
    └── deck.js           (exporta handleDeckDetails)
```

**Success Criteria:**
- ✅ Structure created
- ✅ No build errors
- ✅ Existing endpoints still respond

---

#### Día 2: Extraer Core Utilities

**Goal**: Mover funciones reutilizables a `core/`

**Tasks:**
- [ ] Extraer KV cache logic → `core/cache.js`
  ```javascript
  export async function getCached(env, key) {
    const cached = await env.KVDB.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  export async function setCached(env, key, value, ttl = 43200) {
    await env.KVDB.put(key, JSON.stringify(value), {
      expirationTtl: ttl
    });
  }
  ```

- [ ] Extraer error handling → `core/errors.js`
  ```javascript
  export class APIError extends Error {
    constructor(message, status = 500) {
      super(message);
      this.status = status;
    }
  }

  export function handleError(error) {
    if (error instanceof APIError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // ...
  }
  ```

- [ ] Extraer response helpers → `core/response.js`
  ```javascript
  export function jsonResponse(data, status = 200, cacheHit = null) {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    };
    if (cacheHit !== null) {
      headers['X-Cache'] = cacheHit ? 'HIT' : 'MISS';
    }
    return new Response(JSON.stringify(data), { status, headers });
  }
  ```

- [ ] Refactor `src/index.js` para usar imports
  ```javascript
  import { getCached, setCached } from './core/cache.js';
  import { jsonResponse } from './core/response.js';
  ```

**Testing:**
- ✅ All endpoints return same responses
- ✅ Cache still works (verify X-Cache header)

**Success Criteria:**
- ✅ `core/` modules working
- ✅ `src/index.js` reduced ~100 lines
- ✅ No regressions

---

#### Día 3: Extraer Pokemon Adapter

**Goal**: Mover lógica de Limitless API a `games/pokemon/`

**Tasks:**
- [ ] Crear `games/pokemon/limitless.js` con LimitlessClient
  ```javascript
  export class LimitlessClient {
    constructor(baseURL = 'https://play.limitlesstcg.com/api') {
      this.baseURL = baseURL;
    }

    async fetchTournaments(params) {
      const url = new URL(`${this.baseURL}/tournaments`);
      url.searchParams.set('game', 'PTCG');
      url.searchParams.set('format', params.format.toUpperCase());
      url.searchParams.set('limit', params.limit || 50);

      const response = await fetch(url);
      if (!response.ok) throw new Error('Limitless API error');
      return await response.json();
    }

    async fetchStandings(tournamentId) { ... }
    async fetchDetails(tournamentId) { ... }
  }
  ```

- [ ] Crear `games/pokemon/adapter.js` implementando IGameAdapter
  ```javascript
  import { LimitlessClient } from './limitless.js';
  import { addCardImages } from './enhancers.js';

  export class PokemonAdapter {
    constructor() {
      this.client = new LimitlessClient();
    }

    async fetchMetaDecks(params) {
      const tournaments = await this.client.fetchTournaments(params);
      const deckCounts = new Map();

      for (const tournament of tournaments.slice(0, 5)) {
        const standings = await this.client.fetchStandings(tournament.id);
        for (const player of standings.data || []) {
          if (player.deck?.name) {
            deckCounts.set(
              player.deck.name,
              (deckCounts.get(player.deck.name) || 0) + 1
            );
          }
        }
        await this.delay(500); // Rate limiting
      }

      const decks = Array.from(deckCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, params.limit || 10);

      return addCardImages(decks);
    }

    getSupportedFormats() {
      return ['standard', 'expanded'];
    }
  }
  ```

- [ ] Crear `games/registry.js`
  ```javascript
  import { PokemonAdapter } from './pokemon/adapter.js';

  export const gameRegistry = new Map([
    ['pokemon', new PokemonAdapter()],
    // ['magic', new MagicAdapter()],  // Fase 2
  ]);
  ```

**Testing:**
- ✅ `/v1/meta/top` works via PokemonAdapter
- ✅ Response matches previous format

**Success Criteria:**
- ✅ Pokemon logic isolated in `games/pokemon/`
- ✅ Easy to add Magic adapter later
- ✅ `src/index.js` reduced ~300 lines

---

#### Día 4: Multi-Game Routing

**Goal**: Implementar `/v1/:game/meta/top` con backward compat

**Tasks:**
- [ ] Crear `routes/meta.js`
  ```javascript
  import { gameRegistry } from '../games/registry.js';
  import { getCached, setCached } from '../core/cache.js';
  import { jsonResponse } from '../core/response.js';

  export async function handleMetaTop(request, env, game, params) {
    const adapter = gameRegistry.get(game);
    if (!adapter) {
      return jsonResponse({ error: 'Game not supported' }, 404);
    }

    const cacheKey = `${game}:meta:top:${params.format}:${params.days}:${params.limit}`;
    const cached = await getCached(env, cacheKey);
    if (cached) {
      return jsonResponse(cached, 200, true);
    }

    const decks = await adapter.fetchMetaDecks(params);
    const result = {
      updated_at: new Date().toISOString(),
      format: params.format,
      days: params.days,
      decks
    };

    await setCached(env, cacheKey, result, 43200);
    return jsonResponse(result, 200, false);
  }
  ```

- [ ] Refactor `src/index.js` router
  ```javascript
  import { handleMetaTop } from './routes/meta.js';

  export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const path = url.pathname;

      // Multi-game routing
      const gameMatch = path.match(/^\/v1\/([^\/]+)\/meta\/top$/);
      if (gameMatch) {
        const game = gameMatch[1];
        const params = extractParams(url.searchParams);
        return handleMetaTop(request, env, game, params);
      }

      // Backward compatibility
      if (path === '/v1/meta/top') {
        return handleMetaTop(request, env, 'pokemon', extractParams(url.searchParams));
      }

      // ... otros endpoints
    }
  }
  ```

**Testing:**
- ✅ `/v1/pokemon/meta/top` works
- ✅ `/v1/magic/meta/top` returns 404 (game not supported)
- ✅ `/v1/meta/top` redirects to Pokemon (backward compat)

**Success Criteria:**
- ✅ Multi-game routing functional
- ✅ All routes modularized
- ✅ `src/index.js` down to ~200 lines (router only)

---

### Fase 2: Firebase Setup (Día 5-7)

#### Día 5: Firebase Project Setup

**Goal**: Configurar proyecto Firebase

**Tasks:**
- [ ] Crear proyecto en Firebase Console
  - Nombre: `tcgserver-dev` (dev) / `tcgserver-prod` (production)
  - Plan: Spark (free tier)
  - Location: `us-central1`

- [ ] Habilitar Authentication
  - Enable Google Sign-In provider
  - Add authorized domains: `localhost`, `*.workers.dev`

- [ ] Crear Firestore Database
  - Mode: Production (con Security Rules)
  - Location: `us-central1`

- [ ] Generar Service Account Key
  - Firebase Console → Project Settings → Service Accounts
  - Generate new private key → `service-account-key.json`
  - **NO COMMITEAR** este archivo

- [ ] Configurar Security Rules
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /user_tournaments/{tournamentId} {
        allow read, write: if request.auth != null
                           && request.auth.uid == resource.data.userId;
        allow create: if request.auth != null
                      && request.auth.uid == request.resource.data.userId;
      }

      match /user_matches/{matchId} {
        allow read, write: if request.auth != null
                           && request.auth.uid == resource.data.userId;
        allow create: if request.auth != null
                      && request.auth.uid == request.resource.data.userId;
      }
    }
  }
  ```

**Success Criteria:**
- ✅ Firebase project created
- ✅ Auth enabled
- ✅ Firestore created with rules
- ✅ Service account key saved securely

---

#### Día 6: Firebase Integration (Backend)

**Goal**: Integrar Firebase Auth en Cloudflare Workers

**Tasks:**
- [ ] Install dependency
  ```bash
  npm install firebase-auth-cloudflare-workers
  ```

- [ ] Crear `services/firebase.js`
  ```javascript
  import { Auth } from 'firebase-auth-cloudflare-workers';

  export function initFirebaseAuth(env) {
    return Auth.getOrInitialize(
      env.FIREBASE_PROJECT_ID,
      env.FIREBASE_WEB_API_KEY
    );
  }
  ```

- [ ] Crear `services/firestore.js` (REST client)
  ```javascript
  export class FirestoreClient {
    constructor(projectId, apiKey) {
      this.projectId = projectId;
      this.apiKey = apiKey;
      this.baseURL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
    }

    async createDocument(collection, data) {
      const response = await fetch(`${this.baseURL}/${collection}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ fields: this.toFirestoreFields(data) })
      });
      return await response.json();
    }

    async getDocument(collection, docId) { ... }
    async updateDocument(collection, docId, data) { ... }
    async deleteDocument(collection, docId) { ... }
    async queryDocuments(collection, filters) { ... }

    toFirestoreFields(obj) {
      // Convert {name: "foo", count: 5} → {name: {stringValue: "foo"}, count: {integerValue: 5}}
    }
  }
  ```

- [ ] Crear `middleware/auth.js`
  ```javascript
  import { initFirebaseAuth } from '../services/firebase.js';

  export async function authMiddleware(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const token = authHeader.substring(7);
    const auth = initFirebaseAuth(env);

    try {
      const user = await auth.verifyIdToken(token);
      return user; // { uid, email, ... }
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  ```

- [ ] Agregar secrets a Wrangler
  ```bash
  npx wrangler secret put FIREBASE_PROJECT_ID
  # Ingresar: tcgserver-dev

  npx wrangler secret put FIREBASE_WEB_API_KEY
  # Ingresar: AIza... (desde Firebase Console → Project Settings)
  ```

**Testing:**
- ✅ Auth middleware verifica tokens válidos
- ✅ Auth middleware rechaza tokens inválidos (401)
- ✅ Firestore client puede crear documento

**Success Criteria:**
- ✅ Firebase Auth funcional en Workers
- ✅ Firestore REST client working
- ✅ Middleware protege endpoints

---

#### Día 7: User Tournaments CRUD

**Goal**: Implementar endpoints de torneos de usuario

**Tasks:**
- [ ] Crear `routes/userTournaments.js`
  ```javascript
  import { FirestoreClient } from '../services/firestore.js';
  import { authMiddleware } from '../middleware/auth.js';

  export async function handleCreateTournament(request, env) {
    const user = await authMiddleware(request, env);
    const body = await request.json();

    const tournament = {
      userId: user.uid,
      game: body.game,
      name: body.name,
      format: body.format,
      date: new Date(body.date).toISOString(),
      location: body.location || null,
      imageUrl: body.imageUrl || null,
      deckName: body.deckName || null,
      deckImageUrl: body.deckImageUrl || null,
      notes: body.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const firestore = new FirestoreClient(env.FIREBASE_PROJECT_ID, env.FIREBASE_WEB_API_KEY);
    const doc = await firestore.createDocument('user_tournaments', tournament);

    return jsonResponse({ id: doc.name.split('/').pop(), ...tournament }, 201);
  }

  export async function handleGetUserTournaments(request, env) {
    const user = await authMiddleware(request, env);
    const firestore = new FirestoreClient(env.FIREBASE_PROJECT_ID, env.FIREBASE_WEB_API_KEY);

    const docs = await firestore.queryDocuments('user_tournaments', {
      fieldFilter: {
        field: { fieldPath: 'userId' },
        op: 'EQUAL',
        value: { stringValue: user.uid }
      }
    });

    return jsonResponse({ tournaments: docs, count: docs.length });
  }

  export async function handleUpdateTournament(request, env, tournamentId) { ... }
  export async function handleDeleteTournament(request, env, tournamentId) { ... }
  ```

- [ ] Agregar rutas a `src/index.js`
  ```javascript
  if (path === '/v1/user/tournaments' && method === 'POST') {
    return handleCreateTournament(request, env);
  }
  if (path === '/v1/user/tournaments' && method === 'GET') {
    return handleGetUserTournaments(request, env);
  }
  ```

**Testing:**
```bash
# Get valid Firebase token (from browser console after login)
TOKEN="eyJhbGciOi..."

# Create tournament
curl -X POST http://localhost:8787/v1/user/tournaments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "game": "pokemon",
    "name": "Test Tournament",
    "format": "standard",
    "date": "2026-03-01T10:00:00Z"
  }'

# Get tournaments
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8787/v1/user/tournaments
```

**Success Criteria:**
- ✅ POST creates tournament in Firestore
- ✅ GET lists user's tournaments only
- ✅ PUT updates tournament
- ✅ DELETE removes tournament (cascade matches)

---

### Fase 3: Tournament Tracker Backend (Día 8-10)

#### Día 8: User Matches CRUD

**Goal**: Implementar endpoints de matches

**Tasks:**
- [ ] Crear `routes/userMatches.js`
  ```javascript
  export async function handleCreateMatch(request, env) {
    const user = await authMiddleware(request, env);
    const body = await request.json();

    const match = {
      userId: user.uid,
      tournamentId: body.tournamentId,
      game: body.game,
      round: body.round,
      opponent: body.opponent,
      opponentDeck: body.opponentDeck,
      opponentDeckImageUrl: body.opponentDeckImageUrl || null,
      result: body.result, // "win" | "loss" | "tie"
      myScore: body.myScore || null,
      opponentScore: body.opponentScore || null,
      notes: body.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const firestore = new FirestoreClient(env.FIREBASE_PROJECT_ID, env.FIREBASE_WEB_API_KEY);
    const doc = await firestore.createDocument('user_matches', match);

    return jsonResponse({ id: doc.name.split('/').pop(), ...match }, 201);
  }

  export async function handleGetMatches(request, env, tournamentId) {
    const user = await authMiddleware(request, env);
    const firestore = new FirestoreClient(env.FIREBASE_PROJECT_ID, env.FIREBASE_WEB_API_KEY);

    const docs = await firestore.queryDocuments('user_matches', {
      compositeFilter: {
        op: 'AND',
        filters: [
          {
            fieldFilter: {
              field: { fieldPath: 'userId' },
              op: 'EQUAL',
              value: { stringValue: user.uid }
            }
          },
          {
            fieldFilter: {
              field: { fieldPath: 'tournamentId' },
              op: 'EQUAL',
              value: { stringValue: tournamentId }
            }
          }
        ]
      }
    });

    return jsonResponse({ matches: docs, count: docs.length });
  }
  ```

**Testing:**
```bash
# Create match
curl -X POST http://localhost:8787/v1/user/matches \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tournamentId": "abc123",
    "game": "pokemon",
    "round": 1,
    "opponent": "John Doe",
    "opponentDeck": "Charizard ex",
    "result": "win",
    "myScore": 2,
    "opponentScore": 1
  }'

# Get matches for tournament
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8787/v1/user/matches?tournamentId=abc123"
```

**Success Criteria:**
- ✅ POST creates match
- ✅ GET lists matches for tournament
- ✅ Validation ensures tournamentId belongs to user

---

#### Día 9: Stats Calculation

**Goal**: Agregar stats endpoint

**Tasks:**
- [ ] Crear `routes/stats.js`
  ```javascript
  export async function handleGetTournamentStats(request, env, tournamentId) {
    const user = await authMiddleware(request, env);
    const firestore = new FirestoreClient(env.FIREBASE_PROJECT_ID, env.FIREBASE_WEB_API_KEY);

    const matches = await firestore.queryDocuments('user_matches', {
      compositeFilter: { /* userId + tournamentId */ }
    });

    const wins = matches.filter(m => m.result === 'win').length;
    const losses = matches.filter(m => m.result === 'loss').length;
    const ties = matches.filter(m => m.result === 'tie').length;
    const totalGames = wins + losses + ties;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    // Group by opponent deck
    const matchupStats = matches.reduce((acc, match) => {
      const deck = match.opponentDeck;
      if (!acc[deck]) {
        acc[deck] = { wins: 0, losses: 0, ties: 0 };
      }
      acc[deck][match.result + 's']++;
      return acc;
    }, {});

    return jsonResponse({
      tournamentId,
      record: `${wins}-${losses}-${ties}`,
      wins,
      losses,
      ties,
      winRate: winRate.toFixed(1),
      matchupStats
    });
  }
  ```

**Testing:**
- ✅ Stats calculation correct (2W-1L-1T = 50% WR)
- ✅ Matchup stats grouped by deck

---

#### Día 10: Cascade Delete & Cleanup

**Goal**: Implementar cascade delete y cleanup

**Tasks:**
- [ ] Modificar `handleDeleteTournament` para eliminar matches
  ```javascript
  export async function handleDeleteTournament(request, env, tournamentId) {
    const user = await authMiddleware(request, env);
    const firestore = new FirestoreClient(env.FIREBASE_PROJECT_ID, env.FIREBASE_WEB_API_KEY);

    // Verify ownership
    const tournament = await firestore.getDocument('user_tournaments', tournamentId);
    if (tournament.userId !== user.uid) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    // Delete associated matches
    const matches = await firestore.queryDocuments('user_matches', {
      fieldFilter: {
        field: { fieldPath: 'tournamentId' },
        op: 'EQUAL',
        value: { stringValue: tournamentId }
      }
    });

    for (const match of matches) {
      await firestore.deleteDocument('user_matches', match.id);
    }

    // Delete tournament
    await firestore.deleteDocument('user_tournaments', tournamentId);

    return new Response(null, { status: 204 });
  }
  ```

- [ ] Agregar validation helpers
  ```javascript
  function validateTournamentInput(body) {
    if (!body.name || !body.date || !body.format) {
      throw new Error('Missing required fields');
    }
    if (!['pokemon', 'magic', 'riftbound'].includes(body.game)) {
      throw new Error('Invalid game');
    }
  }

  function validateMatchInput(body) { ... }
  ```

**Testing:**
- ✅ Delete tournament → verify matches deleted
- ✅ Validation rejects invalid inputs
- ✅ Ownership checks prevent cross-user access

---

### Fase 4: Frontend UI (Día 11-13)

#### Día 11: Login UI

**Goal**: Implementar Google Sign-In button

**Tasks:**
- [ ] Agregar Firebase JS SDK a demo page
  ```html
  <script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
    import { getAuth, signInWithPopup, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';

    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "tcgserver-dev.firebaseapp.com",
      projectId: "tcgserver-dev"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    window.login = async function() {
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const token = await user.getIdToken();

        localStorage.setItem('idToken', token);
        localStorage.setItem('user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        }));

        renderApp();
      } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please try again.');
      }
    };

    window.logout = function() {
      auth.signOut();
      localStorage.removeItem('idToken');
      localStorage.removeItem('user');
      renderApp();
    };
  </script>
  ```

- [ ] Agregar UI de login
  ```html
  <div id="authSection" style="text-align: center; margin: 20px;">
    <button onclick="login()" id="loginBtn" style="
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
    ">
      Sign in with Google
    </button>

    <div id="userProfile" style="display: none;">
      <img id="userPhoto" style="width: 40px; height: 40px; border-radius: 50%;">
      <span id="userName"></span>
      <button onclick="logout()">Logout</button>
    </div>
  </div>
  ```

- [ ] Implementar `renderApp()` para mostrar/ocultar secciones
  ```javascript
  function renderApp() {
    const user = JSON.parse(localStorage.getItem('user'));
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    const trackerSection = document.getElementById('tournamentTracker');

    if (user) {
      loginBtn.style.display = 'none';
      userProfile.style.display = 'block';
      document.getElementById('userPhoto').src = user.photoURL;
      document.getElementById('userName').textContent = user.displayName;
      trackerSection.style.display = 'block';

      loadUserTournaments();
    } else {
      loginBtn.style.display = 'block';
      userProfile.style.display = 'none';
      trackerSection.style.display = 'none';
    }
  }
  ```

**Testing:**
- ✅ Click "Sign in with Google" → popup opens
- ✅ After login → profile shows, tracker appears
- ✅ Token saved in localStorage
- ✅ Logout clears data

---

#### Día 12: Tournament Tracker UI

**Goal**: UI para crear torneos y agregar matches

**Tasks:**
- [ ] Crear modal "Create Tournament"
  ```html
  <div id="createTournamentModal" class="modal">
    <div class="modal-content">
      <span class="close" onclick="closeCreateTournamentModal()">&times;</span>
      <h2>Create Tournament</h2>

      <form id="tournamentForm">
        <label>Name *</label>
        <input type="text" id="tournamentName" required>

        <label>Date *</label>
        <input type="date" id="tournamentDate" required>

        <label>Format *</label>
        <select id="tournamentFormat" required>
          <option value="standard">Standard</option>
          <option value="expanded">Expanded</option>
        </select>

        <label>Location (optional)</label>
        <input type="text" id="tournamentLocation">

        <label>Deck Used (optional)</label>
        <div id="deckSelector" style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
        ">
          <!-- Populated with meta decks -->
        </div>

        <label>Notes (optional)</label>
        <textarea id="tournamentNotes"></textarea>

        <button type="submit">Create</button>
      </form>
    </div>
  </div>
  ```

- [ ] Implementar `createTournament()`
  ```javascript
  async function createTournament(event) {
    event.preventDefault();

    const token = localStorage.getItem('idToken');
    const body = {
      game: 'pokemon',
      name: document.getElementById('tournamentName').value,
      format: document.getElementById('tournamentFormat').value,
      date: new Date(document.getElementById('tournamentDate').value).toISOString(),
      location: document.getElementById('tournamentLocation').value || null,
      deckName: selectedDeck ? selectedDeck.name : null,
      deckImageUrl: selectedDeck ? selectedDeck.image : null,
      notes: document.getElementById('tournamentNotes').value || null
    };

    const response = await fetch('/v1/user/tournaments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      closeCreateTournamentModal();
      loadUserTournaments();
    } else {
      alert('Failed to create tournament');
    }
  }
  ```

- [ ] Crear modal "Add Match" (quick-add)
  ```html
  <div id="addMatchModal" class="modal">
    <div class="modal-content">
      <h2>Add Match - Round <span id="matchRound"></span></h2>

      <form id="matchForm">
        <label>Opponent *</label>
        <input type="text" id="matchOpponent" required>

        <label>Opponent's Deck *</label>
        <div id="opponentDeckSelector">
          <!-- Grid visual de decks del meta -->
        </div>

        <label>Result *</label>
        <div style="display: flex; gap: 10px;">
          <button type="button" onclick="setResult('win')" style="background: green;">Win</button>
          <button type="button" onclick="setResult('loss')" style="background: red;">Loss</button>
          <button type="button" onclick="setResult('tie')" style="background: orange;">Tie</button>
        </div>

        <label>Score (optional)</label>
        <input type="number" id="myScore" placeholder="My score" min="0" max="3">
        <input type="number" id="opponentScore" placeholder="Opponent score" min="0" max="3">

        <button type="submit">Add Match</button>
      </form>
    </div>
  </div>
  ```

- [ ] Implementar `addMatch()`
  ```javascript
  async function addMatch(event) {
    event.preventDefault();

    const token = localStorage.getItem('idToken');
    const body = {
      tournamentId: currentTournamentId,
      game: 'pokemon',
      round: currentRound,
      opponent: document.getElementById('matchOpponent').value,
      opponentDeck: selectedOpponentDeck.name,
      opponentDeckImageUrl: selectedOpponentDeck.image,
      result: matchResult, // "win" | "loss" | "tie"
      myScore: parseInt(document.getElementById('myScore').value) || null,
      opponentScore: parseInt(document.getElementById('opponentScore').value) || null
    };

    const response = await fetch('/v1/user/matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      closeAddMatchModal();
      loadMatches(currentTournamentId);
    }
  }
  ```

**Testing:**
- ✅ Create tournament → appears in list
- ✅ Add match → shows with correct color (verde/rojo/amarillo)
- ✅ Deck selector visual works

---

#### Día 13: Matches List & Stats

**Goal**: Mostrar historial de matches con colores

**Tasks:**
- [ ] Implementar `loadMatches(tournamentId)`
  ```javascript
  async function loadMatches(tournamentId) {
    const token = localStorage.getItem('idToken');
    const response = await fetch(`/v1/user/matches?tournamentId=${tournamentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    const matchesContainer = document.getElementById('matchesList');

    matchesContainer.innerHTML = data.matches.map(match => `
      <div class="match-card" style="
        border-left: 5px solid ${getResultColor(match.result)};
        padding: 15px;
        margin-bottom: 10px;
        background: #f9f9f9;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${match.opponentDeckImageUrl}" style="width: 60px; height: auto;">
          <div>
            <strong>Round ${match.round}</strong> vs ${match.opponent}<br>
            ${match.opponentDeck}<br>
            <span style="color: ${getResultColor(match.result)}; font-weight: bold;">
              ${match.result.toUpperCase()}
            </span>
            ${match.myScore !== null ? ` (${match.myScore}-${match.opponentScore})` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  function getResultColor(result) {
    return result === 'win' ? '#4caf50' : result === 'loss' ? '#f44336' : '#ff9800';
  }
  ```

- [ ] Implementar `loadStats(tournamentId)`
  ```javascript
  async function loadStats(tournamentId) {
    const token = localStorage.getItem('idToken');
    const response = await fetch(`/v1/stats/tournament/${tournamentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    const statsContainer = document.getElementById('tournamentStats');

    statsContainer.innerHTML = `
      <div class="stats-summary">
        <h3>Tournament Record</h3>
        <p style="font-size: 24px; font-weight: bold;">
          ${data.record} (${data.winRate}% WR)
        </p>

        <h4>Matchup Stats</h4>
        ${Object.entries(data.matchupStats).map(([deck, stats]) => `
          <div style="margin: 10px 0;">
            <strong>${deck}:</strong>
            <span style="color: green;">${stats.wins}W</span> -
            <span style="color: red;">${stats.losses}L</span> -
            <span style="color: orange;">${stats.ties}T</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  ```

**Testing:**
- ✅ Matches show with correct colors
- ✅ Stats calculate correctly
- ✅ Matchup breakdown accurate

---

### Fase 5: Polish & Deploy (Día 14)

#### Día 14: Final Polish

**Goal**: Deployment production-ready

**Tasks:**
- [ ] Loading states en todos los fetch
  ```javascript
  function showLoading(elementId) {
    document.getElementById(elementId).innerHTML = '<div class="spinner"></div>';
  }

  function hideLoading(elementId) {
    document.getElementById(elementId).innerHTML = '';
  }
  ```

- [ ] Error handling user-friendly
  ```javascript
  async function safeFetch(url, options) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      showError('Something went wrong. Please try again.');
      throw error;
    }
  }

  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-toast';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #f44336; color: white; padding: 15px; border-radius: 8px; z-index: 9999;';
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
  }
  ```

- [ ] Responsive testing
  - Chrome DevTools → Toggle device toolbar
  - Test iPhone SE (375px), iPad (768px), Desktop (1920px)
  - Verify grid adapts correctly

- [ ] Deploy to production
  ```bash
  # Update wrangler.toml production vars
  [env.production]
  vars = { ENVIRONMENT = "production" }

  # Deploy
  npm run deploy

  # Verify
  curl https://tcgserver.YOUR_SUBDOMAIN.workers.dev/health
  ```

- [ ] Smoke tests
  ```bash
  API="https://tcgserver.YOUR_SUBDOMAIN.workers.dev"

  # Meta endpoints
  curl "$API/v1/pokemon/meta/top?limit=5"
  curl "$API/v1/tournaments/recent?limit=10"

  # Auth (con token válido)
  curl -H "Authorization: Bearer $TOKEN" "$API/v1/user/tournaments"
  ```

**Success Criteria:**
- ✅ All endpoints functional in production
- ✅ UI works on mobile + desktop
- ✅ Error handling graceful
- ✅ Loading states smooth

---

## 🎯 Definition of Done

**MVP considerado completo cuando:**

1. ✅ Backend refactored a estructura modular
2. ✅ Multi-game routing funcional (Pokemon + stubs)
3. ✅ Firebase Auth integrado (Google Sign-In)
4. ✅ Firestore CRUD completo (tournaments + matches)
5. ✅ UI Tournament Tracker funcional
6. ✅ Stats calculation correcta
7. ✅ Deployed to production
8. ✅ Smoke tests passing
9. ✅ Mobile responsive
10. ✅ No critical bugs

**Post-MVP:**
- Documentación completa
- Tests automatizados (Vitest)
- CI/CD pipeline (GitHub Actions)
- Magic/Riftbound adapters
- Deck Builder
- Freemium/Pro plan

---

**Última actualización**: Feb 21, 2026
**Progreso actual**: Fase 1 completada (Backend básico), iniciando Fase 2 (Refactor)
