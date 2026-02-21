# TCGServer - Multi-Game TCG Companion Backend

**Plataforma todo-en-uno para jugadores competitivos de Trading Card Games**

![Status](https://img.shields.io/badge/status-MVP%20in%20progress-yellow)
![Cost](https://img.shields.io/badge/cost-$0%20free%20tiers-green)
![Stack](https://img.shields.io/badge/stack-Cloudflare%20Workers-orange)

---

## 🎯 Visión del Producto

Plataforma con 3 pilares principales:

1. **Meta Tracking** - Ver qué decks están ganando torneos oficiales
2. **Tournament Tracker Personal** (DIFERENCIADOR) - Trackear tus torneos locales con matches, resultados y stats
3. **Deck Builder** - Crear/editar/guardar mazos (Fase 2)

### Diferenciadores vs Limitless TCG
- ✅ **Tournament Tracker Personal** - Limitless solo muestra torneos oficiales
- ✅ **UX user-friendly** - Interfaz más intuitiva
- ✅ **Deck Builder integrado** - (Fase 2)

---

## 🚀 Quick Start

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor local
npm run dev

# Visitar demo
open http://127.0.0.1:8787/demo
```

### Deploy a Producción

```bash
# Login a Cloudflare (primera vez)
npx wrangler login

# Deploy
npm run deploy
```

---

## ✅ Estado Actual (Feb 2026)

### Funcionando 100%
- ✅ GET `/v1/meta/top` - Top decks del meta con imágenes
- ✅ GET `/v1/tournaments/recent` - Torneos recientes
- ✅ GET `/v1/meta/deck/:name` - Detalles de mazos con card list
- ✅ GET `/demo` - Página web interactiva
- ✅ Caching KV (12h meta, 6h tournaments)
- ✅ Card images desde Limitless CDN
- ✅ Rate limiting (500ms delays)

### En Progreso 🚧
- ⏳ Firebase Auth (Google Sign-In)
- ⏳ Firestore CRUD (tournaments, matches)
- ⏳ Tournament Tracker UI
- ⏳ Multi-game architecture refactor

---

## 📚 API Endpoints

### Públicos (sin auth)

#### GET `/v1/meta/top`
Top decks del meta basados en torneos recientes.

**Query params:**
- `days` (default: 7) - Días atrás para analizar
- `format` (default: standard) - Formato del juego
- `limit` (default: 10) - Número de decks a retornar

**Response:**
```json
{
  "updated_at": "2026-02-21T10:00:00Z",
  "format": "standard",
  "days": 7,
  "decks": [
    {
      "name": "Charizard ex",
      "count": 45,
      "mainCard": "PAL-6",
      "image": "https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/PAL/PAL_006_R_EN_LG.png"
    }
  ]
}
```

#### GET `/v1/tournaments/recent`
Lista de torneos recientes.

**Query params:**
- `days` (default: 7)
- `format` (default: standard)
- `limit` (default: 50)

#### GET `/v1/meta/deck/:deckName`
Detalles completos de un deck específico.

**Response:**
```json
{
  "deck": {
    "name": "Charizard ex",
    "appearances": 12,
    "topPlacements": [
      {"tournament": "Regional São Paulo", "player": "John Doe", "placing": 1}
    ],
    "cardList": [
      {"name": "Charizard ex", "count": 2, "number": "PAL-6"}
    ],
    "mainCard": "PAL-6",
    "image": "https://..."
  }
}
```

### Privados (requieren Firebase Auth - Fase 2)

#### POST `/v1/user/tournaments`
Crear torneo personal.

**Body:**
```json
{
  "game": "pokemon",
  "name": "League Cup Local",
  "format": "standard",
  "date": "2026-03-01T10:00:00Z",
  "location": "Barcelona",
  "deckName": "Charizard ex",
  "deckImageUrl": "https://...",
  "notes": "First tournament with this deck"
}
```

#### POST `/v1/user/matches`
Registrar match de un torneo.

**Body:**
```json
{
  "tournamentId": "abc123",
  "round": 1,
  "opponent": "Jane Smith",
  "opponentDeck": "Lugia VSTAR",
  "opponentDeckImageUrl": "https://...",
  "result": "win",
  "myScore": 2,
  "opponentScore": 1,
  "notes": "Close game, won turn 4"
}
```

---

## 🏗️ Arquitectura

### Stack Tecnológico
- **Backend**: Cloudflare Workers (Edge compute)
- **Cache**: Cloudflare KV Store (12h meta, 6h tournaments)
- **Auth**: Firebase Auth (Google Sign-In)
- **Database**: Firestore (free tier: 50k reads/day, 20k writes/day)
- **Frontend**: Vanilla JS (no frameworks)
- **External API**: Limitless TCG API

### Estructura de Código

```
src/
├── index.js              # Router principal (1071 líneas - pendiente refactor)
├── core/
│   ├── cache.js         # KV wrapper
│   ├── rateLimit.js     # IP-based rate limiting
│   └── auth.js          # Firebase Admin SDK
├── games/
│   ├── pokemon/
│   │   ├── adapter.js   # Limitless API adapter
│   │   └── constants.js # STANDARD, EXPANDED formats
│   ├── magic/           # Fase 2
│   └── registry.js      # Game router
├── routes/
│   ├── meta.js          # Meta endpoints
│   ├── tournaments.js   # User tournaments CRUD
│   └── matches.js       # User matches CRUD
└── services/
    ├── firebase.js      # Firebase setup
    └── firestore.js     # Firestore client
```

### Data Models (Firestore)

**Collection: `user_tournaments`**
```javascript
{
  id: string,
  userId: string,
  game: "pokemon" | "magic" | "riftbound",
  name: string,
  format: string,
  date: timestamp,
  location?: string,
  imageUrl?: string,
  deckName?: string,
  deckImageUrl?: string,
  notes?: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Collection: `user_matches`**
```javascript
{
  id: string,
  userId: string,
  tournamentId: string,
  game: string,
  round: number,
  opponent: string,
  opponentDeck: string,
  opponentDeckImageUrl?: string,
  result: "win" | "loss" | "tie",
  myScore?: number,
  opponentScore?: number,
  notes?: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## 🔧 Configuración

### Variables de Entorno (wrangler.toml)

```toml
[vars]
ENVIRONMENT = "development"

# Firebase (configurar después de crear proyecto)
# FIREBASE_PROJECT_ID = "your-project-id"
# FIREBASE_API_KEY = "your-api-key"

[env.production]
vars = { ENVIRONMENT = "production" }
```

### Secrets (no commitear)

```bash
# Firebase Service Account (para Firestore)
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_KEY
# Pegar el contenido del archivo service-account-key.json

# Firebase Web API Key (para Auth)
npx wrangler secret put FIREBASE_WEB_API_KEY
```

---

## 💰 Costos (Free Tiers)

- **Cloudflare Workers**: 100,000 req/día (Free)
- **Cloudflare KV**: 1 GB storage + 100K reads/día (Free)
- **Firebase Spark Plan**:
  - Auth: Ilimitado
  - Firestore: 50K reads/día, 20K writes/día, 1GB storage
  - Analytics: Ilimitado

**Estimado de uso diario**: ~2,500 requests/día
**Costo actual**: $0 ✅

---

## 🧪 Testing

### Manual Testing (curl)

```bash
# Health check
curl http://localhost:8787/health

# Meta top decks
curl http://localhost:8787/v1/meta/top?days=7&limit=5

# Recent tournaments
curl http://localhost:8787/v1/tournaments/recent?days=3

# Deck details
curl http://localhost:8787/v1/meta/deck/charizard-ex
```

### UI Testing

1. Abrir http://localhost:8787/demo
2. Verificar grid de decks carga imágenes
3. Click en deck → Modal con card list
4. Cambiar filtros (days, format, limit)
5. Verificar cache badges (HIT/MISS)

---

## 📋 Roadmap

### MVP (1-2 semanas) - En Progreso
- [x] Backend API con meta endpoints
- [x] Demo UI interactiva
- [x] Card images funcionando
- [ ] Firebase Auth (Google Sign-In)
- [ ] Tournament Tracker UI
- [ ] Firestore CRUD endpoints
- [ ] Multi-game architecture refactor
- [ ] Deploy a producción

### Fase 2 (Post-MVP)
- [ ] Deck Builder completo (drag & drop, validación)
- [ ] Precios de cartas (TCGPlayer API)
- [ ] Gráficos de tendencias (Chart.js)
- [ ] Búsqueda avanzada con autocomplete
- [ ] Comentarios/mood en matches
- [ ] Snapshots históricos semanales del meta
- [ ] Dark mode automático
- [ ] Magic/Riftbound/otros juegos funcionales
- [ ] Freemium/Pro plan (Stripe + Apple IAP)
- [ ] Tests automatizados (Vitest)
- [ ] CI/CD (GitHub Actions)

---

## 📖 Documentación Adicional

- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Guía completa de setup Firebase
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura detallada del sistema
- [PLAN.md](./PLAN.md) - Plan de implementación completo (14 días)
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Estado actual del proyecto

---

## 🤝 Contribuir

Este es un proyecto personal en desarrollo activo. Pull requests son bienvenidos.

### Flujo de trabajo
1. Fork el repo
2. Crear branch (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

---

## 📝 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

---

## 👨‍💻 Autor

**Yago de Martin**
- GitHub: [@yagodemartin](https://github.com/yagodemartin)

---

## 🙏 Agradecimientos

- [Limitless TCG](https://limitlesstcg.com) - API de torneos y meta data
- [Cloudflare](https://cloudflare.com) - Workers y KV storage
- [Firebase](https://firebase.google.com) - Auth y Firestore
- Comunidad Pokémon TCG por feedback

---

**Status del Proyecto**: 🚧 MVP en desarrollo activo (Feb 2026)
