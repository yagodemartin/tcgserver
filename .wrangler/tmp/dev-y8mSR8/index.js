var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/games/registry.js
var GameAdapter = class {
  static {
    __name(this, "GameAdapter");
  }
  constructor(game) {
    this.game = game;
  }
  /**
   * Fetch recent tournaments
   * @param {number} days - Number of days to look back
   * @param {string} format - Game format (standard, expanded, etc.)
   * @param {number} limit - Max tournaments to fetch
   * @returns {Promise<Array>} Tournament list
   */
  async fetchTournaments(days, format, limit) {
    throw new Error("fetchTournaments not implemented");
  }
  /**
   * Fetch standings for a tournament
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Array>} Standings array
   */
  async fetchStandings(tournamentId) {
    throw new Error("fetchStandings not implemented");
  }
  /**
   * Fetch detailed deck info
   * @param {string} deckName - Deck name
   * @param {number} days - Number of days to look back
   * @param {string} format - Game format
   * @returns {Promise<object|null>} Deck info or null
   */
  async fetchDeckDetails(deckName, days, format) {
    throw new Error("fetchDeckDetails not implemented");
  }
  /**
   * Extract main card from decklist
   * @param {object} decklist - Decklist object
   * @returns {object|null} Main card info
   */
  extractMainCard(decklist) {
    throw new Error("extractMainCard not implemented");
  }
  /**
   * Enhance card list with images
   * @param {object} decklist - Decklist object
   * @returns {object} Enhanced decklist
   */
  enhanceCardListWithImages(decklist) {
    throw new Error("enhanceCardListWithImages not implemented");
  }
  /**
   * Get card image URL
   * @param {string} cardSet - Card set code
   * @param {string} cardNumber - Card number
   * @param {string} size - Image size
   * @returns {string|null} Image URL
   */
  getCardImageUrl(cardSet, cardNumber, size) {
    throw new Error("getCardImageUrl not implemented");
  }
  /**
   * Get deck URL on external site
   * @param {string} deckId - Deck ID
   * @returns {string} Deck URL
   */
  getDeckUrl(deckId) {
    throw new Error("getDeckUrl not implemented");
  }
  /**
   * Build cache key for meta data
   */
  getMetaCacheKey(format, days, limit) {
    return `${this.game}:meta:top:${format}:${days}:${limit}`;
  }
  /**
   * Build cache key for tournaments
   */
  getTournamentsCacheKey(format, days, limit) {
    return `${this.game}:tournaments:recent:${format}:${days}:${limit}`;
  }
  /**
   * Build cache key for deck details
   */
  getDeckCacheKey(deckName, format, days) {
    return `${this.game}:deck:${deckName}:${format}:${days}`;
  }
};
var AdapterRegistry = class {
  static {
    __name(this, "AdapterRegistry");
  }
  constructor() {
    this.adapters = /* @__PURE__ */ new Map();
  }
  /**
   * Register a game adapter
   */
  register(game, adapter) {
    if (!(adapter instanceof GameAdapter)) {
      throw new Error("Adapter must extend GameAdapter class");
    }
    this.adapters.set(game.toLowerCase(), adapter);
  }
  /**
   * Get adapter for a game
   */
  get(game) {
    return this.adapters.get(game.toLowerCase());
  }
  /**
   * Check if game is supported
   */
  isSupported(game) {
    return this.adapters.has(game.toLowerCase());
  }
  /**
   * Get list of supported games
   */
  getSupportedGames() {
    return Array.from(this.adapters.keys());
  }
};
var gameRegistry = new AdapterRegistry();

// src/games/pokemon/constants.js
var LIMITLESS_API_BASE = "https://play.limitlesstcg.com/api";
var LIMITLESS_CDN_BASE = "https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci";
var SET_COLORS = {
  // Current era (Scarlet & Violet)
  "TWM": "#8B4789",
  // Twilight Masquerade - Purple
  "PRE": "#22B14C",
  // Primal Energy - Green
  "OBF": "#FF8C00",
  // Obsidian Flames - Orange
  "PAL": "#1E90FF",
  // Paldean Fates - Blue
  "SVI": "#DC143C",
  // Scarlet & Violet - Red
  "MEG": "#FFD700",
  // Magneton Meta - Gold
  "TEF": "#20B2AA",
  // Temporal Forces - Teal
  "ASC": "#9370DB",
  // Ancient Roar - Indigo
  "DRI": "#FF6347",
  // Dragon Tera - Coral
  "MEW": "#00CED1",
  // Mewtwo - Cyan
  "PAF": "#FF69B4",
  // Paldean Future - Pink
  "PFL": "#8B7355",
  // Paldean Fates - Brown
  "SCR": "#4169E1",
  // Scarlet - Royal Blue
  "SLV": "#C0C0C0",
  // Silver - Silver
  "SHF": "#FF4500",
  // Shining Fates - Red-Orange
  "SVP": "#DA70D6"
  // Sword/Shield Purple
};
var DEFAULT_SET_COLOR = "#808080";

// src/games/pokemon/limitless.js
async function fetchTournaments(days = 7, format = "standard", limit = 50) {
  const now = /* @__PURE__ */ new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1e3);
  const params = new URLSearchParams({
    game: "PTCG",
    format: format.toUpperCase(),
    limit,
    page: 0
  });
  try {
    const res = await fetch(`${LIMITLESS_API_BASE}/tournaments?${params}`);
    if (!res.ok) throw new Error(`Limitless API error: ${res.status}`);
    const data = await res.json();
    return (Array.isArray(data) ? data : data.tournaments || []).filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= startDate;
    });
  } catch (err) {
    console.error("fetchTournaments error:", err);
    throw err;
  }
}
__name(fetchTournaments, "fetchTournaments");
async function fetchStandings(tournamentId, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${LIMITLESS_API_BASE}/tournaments/${tournamentId}/standings`);
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        const delay = retryAfter ? parseInt(retryAfter) * 1e3 : 1e3 * Math.pow(2, i);
        console.warn(`Rate limited, retrying after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      if (!res.ok) throw new Error(`Limitless API error: ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) {
        console.error(`fetchStandings(${tournamentId}) failed after ${retries} retries:`, err);
        return [];
      }
      await new Promise((resolve) => setTimeout(resolve, 1e3 * (i + 1)));
    }
  }
  return [];
}
__name(fetchStandings, "fetchStandings");

// src/games/pokemon/enhancers.js
function extractMainCard(decklist) {
  if (!decklist || !decklist.pokemon || decklist.pokemon.length === 0) {
    return null;
  }
  const exCard = decklist.pokemon.find((card) => card.name && card.name.includes("ex"));
  if (exCard) {
    return { name: exCard.name, set: exCard.set, number: exCard.number };
  }
  const firstCard = decklist.pokemon[0];
  return { name: firstCard.name, set: firstCard.set, number: firstCard.number };
}
__name(extractMainCard, "extractMainCard");
function getCardImageUrl(cardSet, cardNumber, size = "SM") {
  if (!cardSet || !cardNumber) return null;
  return `${LIMITLESS_CDN_BASE}/${cardSet}/${cardSet}_${cardNumber}_R_EN_${size}.png`;
}
__name(getCardImageUrl, "getCardImageUrl");
function getSetColor(cardSet) {
  if (!cardSet) return DEFAULT_SET_COLOR;
  return SET_COLORS[cardSet.toUpperCase()] || DEFAULT_SET_COLOR;
}
__name(getSetColor, "getSetColor");
function enhanceCardListWithImages(decklist) {
  if (!decklist) return decklist;
  const enhanced = { ...decklist };
  const addImagesToCards = /* @__PURE__ */ __name((cards) => {
    if (!Array.isArray(cards)) return cards;
    return cards.map((card) => {
      if (card.set && card.number) {
        card.image = getCardImageUrl(card.set, card.number, "SM");
      }
      return card;
    });
  }, "addImagesToCards");
  if (enhanced.pokemon) {
    enhanced.pokemon = addImagesToCards(enhanced.pokemon);
  }
  if (enhanced.trainer) {
    enhanced.trainer = addImagesToCards(enhanced.trainer);
  }
  if (enhanced.energy) {
    enhanced.energy = addImagesToCards(enhanced.energy);
  }
  return enhanced;
}
__name(enhanceCardListWithImages, "enhanceCardListWithImages");
async function aggregateDecks(standingsArray) {
  const deckMap = {};
  standingsArray.forEach((standing) => {
    if (standing.deck && standing.deck.name) {
      const deckName = standing.deck.name;
      if (!deckMap[deckName]) {
        deckMap[deckName] = {
          name: deckName,
          count: 0,
          mainCard: extractMainCard(standing.decklist),
          deckId: standing.deck.id,
          icons: standing.deck.icons || []
        };
      }
      deckMap[deckName].count++;
    }
  });
  Object.values(deckMap).forEach((deck) => {
    if (deck.mainCard) {
      deck.setColor = getSetColor(deck.mainCard.set);
      deck.setCode = deck.mainCard.set;
      deck.image = getCardImageUrl(deck.mainCard.set, deck.mainCard.number, "LG");
    }
    deck.deckUrl = `https://play.limitlesstcg.com/deck/${deck.deckId}`;
  });
  const decks = Object.values(deckMap);
  return decks.sort((a, b) => b.count - a.count);
}
__name(aggregateDecks, "aggregateDecks");

// src/games/pokemon/adapter.js
var PokemonAdapter = class extends GameAdapter {
  static {
    __name(this, "PokemonAdapter");
  }
  constructor() {
    super("pokemon");
  }
  /**
   * Fetch recent tournaments from Limitless API
   */
  async fetchTournaments(days, format, limit) {
    return await fetchTournaments(days, format, limit);
  }
  /**
   * Fetch standings for a tournament
   */
  async fetchStandings(tournamentId) {
    return await fetchStandings(tournamentId);
  }
  /**
   * Fetch detailed deck info by aggregating tournament standings
   */
  async fetchDeckDetails(deckName, days = 7, format = "standard") {
    const tournaments = await this.fetchTournaments(days, format, 50);
    if (tournaments.length === 0) {
      return null;
    }
    const deckInfo = {
      name: deckName,
      appearances: 0,
      topPlacements: [],
      cardList: null,
      mainCard: null
    };
    const tournamentsToProcess = tournaments.slice(0, 5);
    for (let i = 0; i < tournamentsToProcess.length; i++) {
      const tournament = tournamentsToProcess[i];
      const standings = await this.fetchStandings(tournament.id);
      standings.forEach((standing) => {
        if (standing.deck && standing.deck.name === deckName) {
          deckInfo.appearances++;
          if (standing.placing <= 8) {
            deckInfo.topPlacements.push({
              placing: standing.placing,
              player: standing.name,
              tournament: tournament.name,
              date: tournament.date,
              record: standing.record
            });
          }
          if (standing.decklist && !deckInfo.cardList) {
            deckInfo.cardList = standing.decklist;
            deckInfo.mainCard = this.extractMainCard(standing.decklist);
          }
        }
      });
      if (i < tournamentsToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    if (deckInfo.cardList) {
      deckInfo.cardList = this.enhanceCardListWithImages(deckInfo.cardList);
    }
    return deckInfo.appearances > 0 ? deckInfo : null;
  }
  /**
   * Extract main card from decklist
   */
  extractMainCard(decklist) {
    return extractMainCard(decklist);
  }
  /**
   * Enhance card list with images
   */
  enhanceCardListWithImages(decklist) {
    return enhanceCardListWithImages(decklist);
  }
  /**
   * Get card image URL
   */
  getCardImageUrl(cardSet, cardNumber, size = "SM") {
    return getCardImageUrl(cardSet, cardNumber, size);
  }
  /**
   * Get deck URL on Limitless
   */
  getDeckUrl(deckId) {
    return `https://play.limitlesstcg.com/deck/${deckId}`;
  }
  /**
   * Get set color for visual identification
   */
  getSetColor(cardSet) {
    return getSetColor(cardSet);
  }
  /**
   * Aggregate decks from standings
   */
  async aggregateDecks(standingsArray) {
    return await aggregateDecks(standingsArray);
  }
};

// src/games/magic/adapter.js
var MagicAdapter = class extends GameAdapter {
  static {
    __name(this, "MagicAdapter");
  }
  constructor() {
    super("magic");
  }
  async fetchTournaments(days, format, limit) {
    throw new Error("Magic: The Gathering support coming soon (Phase 2)");
  }
  async fetchStandings(tournamentId) {
    throw new Error("Magic: The Gathering support coming soon (Phase 2)");
  }
  async fetchDeckDetails(deckName, days, format) {
    throw new Error("Magic: The Gathering support coming soon (Phase 2)");
  }
  extractMainCard(decklist) {
    throw new Error("Magic: The Gathering support coming soon (Phase 2)");
  }
  enhanceCardListWithImages(decklist) {
    throw new Error("Magic: The Gathering support coming soon (Phase 2)");
  }
  getCardImageUrl(cardSet, cardNumber, size) {
    throw new Error("Magic: The Gathering support coming soon (Phase 2)");
  }
  getDeckUrl(deckId) {
    throw new Error("Magic: The Gathering support coming soon (Phase 2)");
  }
};

// src/core/response.js
function jsonResponse(data, options = {}) {
  const {
    status = 200,
    cache = null,
    cacheControl = null,
    cors = true
  } = options;
  const headers = {
    "Content-Type": "application/json"
  };
  if (cors) {
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
  }
  if (cache) {
    headers["X-Cache"] = cache;
  }
  if (cacheControl) {
    headers["Cache-Control"] = cacheControl;
  }
  return new Response(JSON.stringify(data), {
    status,
    headers
  });
}
__name(jsonResponse, "jsonResponse");
function corsOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    }
  });
}
__name(corsOptionsResponse, "corsOptionsResponse");
function htmlResponse(html, options = {}) {
  const { cacheControl = "public, max-age=300" } = options;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": cacheControl
    }
  });
}
__name(htmlResponse, "htmlResponse");

// src/core/errors.js
function errorResponse(message, status = 500, details = null) {
  const body = { error: message };
  if (details) {
    body.details = details;
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(errorResponse, "errorResponse");
function notFoundResponse(message = "Not found") {
  return errorResponse(message, 404);
}
__name(notFoundResponse, "notFoundResponse");
function unauthorizedResponse(message = "Unauthorized") {
  return errorResponse(message, 401);
}
__name(unauthorizedResponse, "unauthorizedResponse");
function badRequestResponse(message = "Bad request", details = null) {
  return errorResponse(message, 400, details);
}
__name(badRequestResponse, "badRequestResponse");
function rateLimitResponse(retryAfter = 3600) {
  return new Response(JSON.stringify({
    error: "Rate limit exceeded",
    retryAfter
  }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfter),
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(rateLimitResponse, "rateLimitResponse");
function methodNotAllowedResponse(allowed = ["GET"]) {
  return new Response(JSON.stringify({
    error: "Method not allowed"
  }), {
    status: 405,
    headers: {
      "Content-Type": "application/json",
      "Allow": allowed.join(", "),
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(methodNotAllowedResponse, "methodNotAllowedResponse");
function comingSoonResponse(game) {
  return new Response(JSON.stringify({
    error: "Coming soon",
    message: `${game} support is not yet implemented. Currently only Pokemon TCG is available.`
  }), {
    status: 501,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(comingSoonResponse, "comingSoonResponse");

// src/core/cache.js
var CacheManager = class {
  static {
    __name(this, "CacheManager");
  }
  constructor(kvNamespace) {
    this.kv = kvNamespace;
  }
  /**
   * Get cached data
   */
  async get(key) {
    try {
      const cached = await this.kv.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.error("Cache get error:", err);
      return null;
    }
  }
  /**
   * Set cached data with TTL
   */
  async set(key, value, ttl = 3600) {
    try {
      await this.kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
      return true;
    } catch (err) {
      console.error("Cache set error:", err);
      return false;
    }
  }
  /**
   * Delete cached data
   */
  async delete(key) {
    try {
      await this.kv.delete(key);
      return true;
    } catch (err) {
      console.error("Cache delete error:", err);
      return false;
    }
  }
  /**
   * Build cache key for meta endpoint
   */
  buildMetaCacheKey(game, format, days, limit) {
    return `${game}:meta:top:${format}:${days}:${limit}`;
  }
  /**
   * Build cache key for tournaments endpoint
   */
  buildTournamentsCacheKey(game, format, days, limit) {
    return `${game}:tournaments:recent:${format}:${days}:${limit}`;
  }
  /**
   * Build cache key for deck details endpoint
   */
  buildDeckCacheKey(game, deckName, format, days) {
    return `${game}:deck:${deckName}:${format}:${days}`;
  }
};

// src/routes/meta.js
async function handleMetaTop(request, env, ctx, game) {
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days")) || 7;
  const format = (url.searchParams.get("format") || "standard").toLowerCase();
  const limit = parseInt(url.searchParams.get("limit")) || 10;
  const adapter = gameRegistry.get(game);
  if (!adapter) {
    return comingSoonResponse(game);
  }
  const cache = new CacheManager(env.KVDB);
  const cacheKey = adapter.getMetaCacheKey(format, days, limit);
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return jsonResponse(cached, { cache: "HIT" });
    }
    const tournaments = await adapter.fetchTournaments(days, format, 50);
    if (tournaments.length === 0) {
      return jsonResponse({
        updated_at: (/* @__PURE__ */ new Date()).toISOString(),
        format,
        days,
        decks: [],
        message: "No tournaments found"
      });
    }
    const tournamentsToProcess = tournaments.slice(0, 5);
    const allStandings = [];
    for (let i = 0; i < tournamentsToProcess.length; i++) {
      const tournament = tournamentsToProcess[i];
      const standings = await adapter.fetchStandings(tournament.id);
      allStandings.push(...standings);
      if (i < tournamentsToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    const allDecks = await adapter.aggregateDecks(allStandings);
    const decks = allDecks.slice(0, limit);
    const response = {
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      format,
      days,
      decks
    };
    ctx.waitUntil(cache.set(cacheKey, response, 43200));
    return jsonResponse(response, { cache: "MISS" });
  } catch (err) {
    console.error("handleMetaTop error:", err);
    if (err.message && err.message.includes("coming soon")) {
      return comingSoonResponse(game);
    }
    return errorResponse("Internal server error", 500, err.message);
  }
}
__name(handleMetaTop, "handleMetaTop");

// src/routes/tournaments.js
async function handleTournamentsRecent(request, env, ctx, game) {
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days")) || 7;
  const format = (url.searchParams.get("format") || "standard").toLowerCase();
  const limit = parseInt(url.searchParams.get("limit")) || 50;
  const adapter = gameRegistry.get(game);
  if (!adapter) {
    return comingSoonResponse(game);
  }
  const cache = new CacheManager(env.KVDB);
  const cacheKey = adapter.getTournamentsCacheKey(format, days, limit);
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return jsonResponse(cached, { cache: "HIT" });
    }
    const tournaments = await adapter.fetchTournaments(days, format, limit);
    const response = {
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      format,
      days,
      count: tournaments.length,
      tournaments: tournaments.map((t) => ({
        id: t.id,
        name: t.name,
        date: t.date,
        players: t.players || 0,
        format: t.format
      }))
    };
    ctx.waitUntil(cache.set(cacheKey, response, 21600));
    return jsonResponse(response, { cache: "MISS" });
  } catch (err) {
    console.error("handleTournamentsRecent error:", err);
    if (err.message && err.message.includes("coming soon")) {
      return comingSoonResponse(game);
    }
    return errorResponse("Internal server error", 500, err.message);
  }
}
__name(handleTournamentsRecent, "handleTournamentsRecent");

// src/routes/deck.js
async function handleDeckDetails(request, env, ctx, game, deckName) {
  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get("days")) || 7;
  const format = (url.searchParams.get("format") || "standard").toLowerCase();
  const adapter = gameRegistry.get(game);
  if (!adapter) {
    return comingSoonResponse(game);
  }
  const decodedDeckName = decodeURIComponent(deckName);
  const cache = new CacheManager(env.KVDB);
  const cacheKey = adapter.getDeckCacheKey(decodedDeckName, format, days);
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return jsonResponse(cached, { cache: "HIT" });
    }
    const deckInfo = await adapter.fetchDeckDetails(decodedDeckName, days, format);
    if (!deckInfo) {
      return notFoundResponse(`No recent data found for deck: ${decodedDeckName}`);
    }
    if (deckInfo.mainCard && adapter.getSetColor) {
      deckInfo.setColor = adapter.getSetColor(deckInfo.mainCard.set);
      deckInfo.setCode = deckInfo.mainCard.set;
    }
    const response = {
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      format,
      days,
      deck: deckInfo
    };
    ctx.waitUntil(cache.set(cacheKey, response, 43200));
    return jsonResponse(response, { cache: "MISS" });
  } catch (err) {
    console.error("handleDeckDetails error:", err);
    if (err.message && err.message.includes("coming soon")) {
      return comingSoonResponse(game);
    }
    return errorResponse("Internal server error", 500, err.message);
  }
}
__name(handleDeckDetails, "handleDeckDetails");

// src/ui/demo.html.js
function generateDemoHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>TCG Companion - Multi-Game Meta Dashboard</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			min-height: 100vh;
			padding: 20px;
			color: #333;
		}
		.container { max-width: 1200px; margin: 0 auto; }
		header {
			background: white;
			border-radius: 12px;
			padding: 30px;
			margin-bottom: 30px;
			box-shadow: 0 4px 6px rgba(0,0,0,0.1);
		}
		h1 { color: #667eea; margin-bottom: 10px; }
		.subtitle { color: #666; font-size: 14px; }
		.controls {
			background: white;
			border-radius: 12px;
			padding: 20px;
			margin-bottom: 30px;
			box-shadow: 0 4px 6px rgba(0,0,0,0.1);
			display: flex;
			gap: 15px;
			flex-wrap: wrap;
			align-items: flex-end;
		}
		.control-group {
			display: flex;
			flex-direction: column;
			gap: 5px;
		}
		label {
			font-size: 12px;
			font-weight: 600;
			color: #666;
			text-transform: uppercase;
		}
		select, input {
			padding: 8px 12px;
			border: 2px solid #e0e0e0;
			border-radius: 6px;
			font-size: 14px;
		}
		select:focus, input:focus {
			outline: none;
			border-color: #667eea;
		}
		option:disabled {
			color: #999;
			font-style: italic;
		}
		button {
			padding: 10px 20px;
			background: #667eea;
			color: white;
			border: none;
			border-radius: 6px;
			font-weight: 600;
			cursor: pointer;
		}
		button:hover { background: #5568d3; }
		button:disabled { background: #ccc; cursor: not-allowed; }
		.section {
			background: white;
			border-radius: 12px;
			padding: 25px;
			margin-bottom: 30px;
			box-shadow: 0 4px 6px rgba(0,0,0,0.1);
		}
		h2 { color: #667eea; margin-bottom: 20px; font-size: 22px; }
		.loading { text-align: center; padding: 40px; color: #999; }
		.error {
			background: #fee;
			border: 2px solid #fcc;
			border-radius: 8px;
			padding: 15px;
			color: #c33;
			margin-bottom: 20px;
		}
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
		.deck-card {
			background: #f8f9fa;
			border-radius: 10px;
			padding: 15px;
			cursor: pointer;
			border: 2px solid transparent;
			transition: all 0.2s;
		}
		.deck-card:hover {
			transform: translateY(-4px);
			box-shadow: 0 6px 12px rgba(0,0,0,0.15);
			border-color: #667eea;
		}
		.deck-image {
			width: 100%;
			height: 200px;
			object-fit: contain;
			border-radius: 8px;
			margin-bottom: 12px;
			background: white;
		}
		.deck-name { font-weight: 600; font-size: 16px; margin-bottom: 8px; }
		.deck-count { color: #667eea; font-size: 14px; font-weight: 600; }
		.tournament-list { display: flex; flex-direction: column; gap: 12px; }
		.tournament-item {
			background: #f8f9fa;
			padding: 15px;
			border-radius: 8px;
			border-left: 4px solid #667eea;
		}
		.tournament-name { font-weight: 600; margin-bottom: 5px; }
		.tournament-meta { font-size: 13px; color: #666; }
		.modal {
			display: none;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0,0,0,0.7);
			z-index: 1000;
			padding: 20px;
			overflow-y: auto;
		}
		.modal.active {
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.modal-content {
			background: white;
			border-radius: 12px;
			padding: 30px;
			max-width: 900px;
			width: 100%;
			max-height: 90vh;
			overflow-y: auto;
			position: relative;
		}
		.close-modal {
			position: absolute;
			top: 15px;
			right: 15px;
			background: #f0f0f0;
			border: none;
			width: 32px;
			height: 32px;
			border-radius: 50%;
			cursor: pointer;
			font-size: 20px;
		}
		.close-modal:hover { background: #e0e0e0; }
		.card-section { margin-bottom: 25px; }
		.card-section h3 { color: #667eea; margin-bottom: 12px; font-size: 16px; text-transform: uppercase; }
		.card-list { display: flex; flex-direction: column; gap: 8px; }
		.card-item {
			background: #f8f9fa;
			padding: 10px 15px;
			border-radius: 6px;
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 15px;
		}
		.card-image-thumb {
			width: 50px;
			height: 70px;
			border-radius: 4px;
			background: white;
			border: 1px solid #ddd;
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
		}
		.card-image-thumb img {
			max-width: 100%;
			max-height: 100%;
			object-fit: contain;
		}
		.card-count {
			background: #667eea;
			color: white;
			padding: 4px 10px;
			border-radius: 12px;
			font-size: 12px;
			font-weight: 600;
		}
		.cache-badge {
			display: inline-block;
			padding: 4px 8px;
			border-radius: 4px;
			font-size: 11px;
			font-weight: 600;
			margin-left: 10px;
		}
		.cache-hit { background: #d4edda; color: #155724; }
		.cache-miss { background: #fff3cd; color: #856404; }
	</style>
</head>
<body>
	<div class="container">
		<header>
			<h1>TCG Companion</h1>
			<p class="subtitle">Multi-game meta tracker powered by Cloudflare Workers</p>
		</header>

		<div class="controls">
			<div class="control-group">
				<label>Game</label>
				<select id="game" onchange="loadData()">
					<option value="pokemon" selected>Pok\xE9mon TCG</option>
					<option value="magic" disabled>Magic: The Gathering (Coming Soon)</option>
					<option value="riftbound" disabled>Riftbound (Coming Soon)</option>
				</select>
			</div>

			<div class="control-group">
				<label>Days</label>
				<select id="days">
					<option value="3">Last 3 Days</option>
					<option value="7" selected>Last 7 Days</option>
					<option value="14">Last 14 Days</option>
					<option value="30">Last 30 Days</option>
				</select>
			</div>

			<div class="control-group">
				<label>Format</label>
				<select id="format">
					<option value="standard" selected>Standard</option>
					<option value="expanded">Expanded</option>
				</select>
			</div>

			<div class="control-group">
				<label>Limit</label>
				<input type="number" id="limit" value="10" min="5" max="20">
			</div>

			<button id="refreshBtn" onclick="loadData()">Refresh Data</button>
		</div>

		<div id="errorContainer"></div>

		<div class="section">
			<h2>Top Meta Decks <span id="metaCacheBadge"></span></h2>
			<div id="metaDecks" class="loading">Loading...</div>
		</div>

		<div class="section">
			<h2>Recent Tournaments <span id="tournamentCacheBadge"></span></h2>
			<div id="tournaments" class="loading">Loading...</div>
		</div>
	</div>

	<div id="deckModal" class="modal">
		<div class="modal-content">
			<button class="close-modal" onclick="closeModal()">&times;</button>
			<div id="modalContent"></div>
		</div>
	</div>

	<script>
		async function loadData() {
			const game = document.getElementById('game').value;
			const days = document.getElementById('days').value;
			const format = document.getElementById('format').value;
			const limit = document.getElementById('limit').value;
			const refreshBtn = document.getElementById('refreshBtn');

			refreshBtn.disabled = true;
			document.getElementById('errorContainer').innerHTML = '';

			try {
				await Promise.all([
					loadMetaDecks(game, days, format, limit),
					loadTournaments(game, days, format)
				]);
			} catch (error) {
				console.error('Error loading data:', error);
				showError('Failed to load data: ' + error.message);
			} finally {
				refreshBtn.disabled = false;
			}
		}

		async function loadMetaDecks(game, days, format, limit) {
			const container = document.getElementById('metaDecks');
			container.innerHTML = '<div class="loading">Loading meta decks...</div>';

			try {
				const res = await fetch(\`/v1/\${game}/meta/top?days=\${days}&format=\${format}&limit=\${limit}\`);

				if (res.status === 501) {
					container.innerHTML = '<div class="loading">\u{1F6A7} This game is not yet supported. Currently only Pok\xE9mon TCG is available.</div>';
					return;
				}

				if (!res.ok) throw new Error(\`HTTP \${res.status}\`);

				const cacheStatus = res.headers.get('X-Cache');
				updateCacheBadge('metaCacheBadge', cacheStatus);

				const data = await res.json();

				if (data.decks.length === 0) {
					container.innerHTML = '<p class="loading">No decks found for this period.</p>';
					return;
				}

				container.innerHTML = '';
				const grid = document.createElement('div');
				grid.className = 'deck-grid';

				data.decks.forEach((deck, index) => {
					const card = document.createElement('div');
					card.className = 'deck-card';
					card.onclick = () => showDeckDetails(game, deck.name, days, format);

					const setColor = deck.setColor || '#808080';
					const deckUrl = deck.deckUrl || '#';
					const deckName = deck.name || 'Unknown';
					const deckCount = deck.count || 0;
					const setCode = deck.setCode || 'Unknown';

					let imageHtml = '';
					if (deck.image) {
						imageHtml = '<img src="' + deck.image + '" alt="' + deckName + '" style="height: 100%; width: auto; object-fit: contain;" onerror="this.style.display='none'">';
					} else {
						imageHtml = '<span style="color: white; font-size: 12px; font-weight: bold; text-transform: uppercase;">' + setCode + '</span>';
					}

					card.innerHTML = '<div class="deck-image" style="background-color: ' + setColor + '; display: flex; align-items: center; justify-content: center; position: relative;">' +
						imageHtml +
						'</div>' +
						'<div class="deck-name">' + deckName + '</div>' +
						'<div class="deck-count">' + deckCount + ' appearances</div>' +
						'<a href="' + deckUrl + '" target="_blank" style="display: inline-block; margin-top: 8px; padding: 4px 8px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; font-size: 11px; font-weight: 600;">View Deck</a>';

					grid.appendChild(card);
				});

				container.appendChild(grid);
			} catch (error) {
				console.error('loadMetaDecks error:', error);
				container.innerHTML = \`<div class="error">Failed to load meta decks: \${error.message}</div>\`;
			}
		}

		async function loadTournaments(game, days, format) {
			const container = document.getElementById('tournaments');
			container.innerHTML = '<div class="loading">Loading tournaments...</div>';

			try {
				const res = await fetch(\`/v1/\${game}/tournaments/recent?days=\${days}&format=\${format}&limit=50\`);

				if (res.status === 501) {
					container.innerHTML = '<div class="loading">\u{1F6A7} This game is not yet supported. Currently only Pok\xE9mon TCG is available.</div>';
					return;
				}

				if (!res.ok) throw new Error(\`HTTP \${res.status}\`);

				const cacheStatus = res.headers.get('X-Cache');
				updateCacheBadge('tournamentCacheBadge', cacheStatus);

				const data = await res.json();

				if (data.tournaments.length === 0) {
					container.innerHTML = '<p class="loading">No tournaments found for this period.</p>';
					return;
				}

				container.innerHTML = '';
				const list = document.createElement('div');
				list.className = 'tournament-list';

				data.tournaments.slice(0, 10).forEach((tournament, index) => {
					const item = document.createElement('div');
					item.className = 'tournament-item';

					item.innerHTML = \`
						<div class="tournament-name">\${tournament.name}</div>
						<div class="tournament-meta">
							\${new Date(tournament.date).toLocaleDateString()}
							\u2022 \${tournament.players || 'N/A'} players
							\u2022 \${tournament.format}
						</div>
					\`;

					list.appendChild(item);
				});

				container.appendChild(list);
			} catch (error) {
				console.error('loadTournaments error:', error);
				container.innerHTML = \`<div class="error">Failed to load tournaments: \${error.message}</div>\`;
			}
		}

		async function showDeckDetails(game, deckName, days, format) {
			const modal = document.getElementById('deckModal');
			const content = document.getElementById('modalContent');

			modal.classList.add('active');
			content.innerHTML = '<div class="loading">Loading deck details...</div>';

			try {
				const res = await fetch(\`/v1/\${game}/meta/deck/\${encodeURIComponent(deckName)}?days=\${days}&format=\${format}\`);

				if (res.status === 501) {
					content.innerHTML = '<div class="loading">\u{1F6A7} Deck details not available for this game yet.</div>';
					return;
				}

				if (!res.ok) {
					if (res.status === 404) {
						throw new Error('Deck details not available');
					}
					throw new Error(\`HTTP \${res.status}\`);
				}

				const data = await res.json();
				const deck = data.deck;

				if (!deck || !deck.name) {
					throw new Error('Invalid deck data received');
				}

				const setColor = deck.setColor || '#808080';
				const deckName = deck.name || 'Unknown';
				const deckAppearances = deck.appearances || 0;
				const deckUrl = deck.deckUrl || '#';
				const setCode = deck.setCode || 'Unknown';

				let imageHtml = '';
				if (deck.image) {
					imageHtml = '<img src="' + deck.image + '" alt="' + deckName + '" style="height: 100%; width: auto; object-fit: contain;" onerror="this.style.display='none'">';
				} else {
					imageHtml = '<span style="color: white; font-size: 18px; font-weight: bold; text-transform: uppercase;">' + setCode + '</span>';
				}

				let html = '<h2>' + deckName + '</h2>' +
					'<p style="color: #666; margin-bottom: 10px;">' +
					deckAppearances + ' appearances in last ' + days + ' days' +
					'</p>' +
					'<a href="' + deckUrl + '" target="_blank" style="display: inline-block; margin-bottom: 20px; padding: 8px 16px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">\u{1F4CB} View Full Deck</a>' +
					'<div style="width: 200px; height: 200px; background-color: ' + setColor + '; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center;">' +
					imageHtml +
					'</div>';

				if (deck.topPlacements && deck.topPlacements.length > 0) {
					html += '<div class="card-section"><h3>Top Placements</h3><div class="card-list">';
					deck.topPlacements.slice(0, 5).forEach(placement => {
						const placing = placement.placing || '?';
						const player = placement.player || 'Unknown';
						const tournament = placement.tournament || 'Unknown';
						const record = placement.record || {wins: 0, losses: 0, ties: 0};
						const date = placement.date ? new Date(placement.date).toLocaleDateString() : 'Unknown';

						html += \`
							<div class="card-item">
								<div>
									<strong>#\${placing}</strong> - \${player} at \${tournament}
									<div style="font-size: 12px; color: #666; margin-top: 4px;">
										\${record.wins}-\${record.losses}-\${record.ties}
										\u2022 \${date}
									</div>
								</div>
							</div>
						\`;
					});
					html += '</div></div>';
				}

				if (deck.cardList) {
					const cardList = deck.cardList;

					if (cardList.pokemon && cardList.pokemon.length > 0) {
						html += \`<div class="card-section"><h3>Pokemon (\${cardList.pokemon.length})</h3><div class="card-list">\`;
						cardList.pokemon.forEach(card => {
							const imageHtml = card.image
								? \`<div class="card-image-thumb"><img src="\${card.image}" alt="\${card.name}" onerror="this.style.display='none'" /></div>\`
								: '';
							html += \`
								<div class="card-item">
									\${imageHtml}
									<span>\${card.name}</span>
									<span class="card-count">\${card.count}x</span>
								</div>
							\`;
						});
						html += '</div></div>';
					}

					if (cardList.trainer && cardList.trainer.length > 0) {
						html += \`<div class="card-section"><h3>Trainers (\${cardList.trainer.length})</h3><div class="card-list">\`;
						cardList.trainer.forEach(card => {
							const imageHtml = card.image
								? \`<div class="card-image-thumb"><img src="\${card.image}" alt="\${card.name}" onerror="this.style.display='none'" /></div>\`
								: '';
							html += \`
								<div class="card-item">
									\${imageHtml}
									<span>\${card.name}</span>
									<span class="card-count">\${card.count}x</span>
								</div>
							\`;
						});
						html += '</div></div>';
					}

					if (cardList.energy && cardList.energy.length > 0) {
						html += \`<div class="card-section"><h3>Energy (\${cardList.energy.length})</h3><div class="card-list">\`;
						cardList.energy.forEach(card => {
							const imageHtml = card.image
								? \`<div class="card-image-thumb"><img src="\${card.image}" alt="\${card.name}" onerror="this.style.display='none'" /></div>\`
								: '';
							html += \`
								<div class="card-item">
									\${imageHtml}
									<span>\${card.name}</span>
									<span class="card-count">\${card.count}x</span>
								</div>
							\`;
						});
						html += '</div></div>';
					}
				}

				content.innerHTML = html;
			} catch (error) {
				content.innerHTML = \`<div class="error">Failed to load deck details: \${error.message}</div>\`;
			}
		}

		function closeModal() {
			document.getElementById('deckModal').classList.remove('active');
		}

		function updateCacheBadge(badgeId, cacheStatus) {
			const badge = document.getElementById(badgeId);
			if (cacheStatus === 'HIT') {
				badge.innerHTML = '<span class="cache-badge cache-hit">CACHED</span>';
			} else if (cacheStatus === 'MISS') {
				badge.innerHTML = '<span class="cache-badge cache-miss">FRESH</span>';
			}
		}

		function showError(message) {
			const container = document.getElementById('errorContainer');
			container.innerHTML = \`<div class="error">\${message}</div>\`;
		}

		loadData();

		document.getElementById('deckModal').addEventListener('click', (e) => {
			if (e.target.id === 'deckModal') {
				closeModal();
			}
		});
	<\/script>
</body>
</html>`;
}
__name(generateDemoHTML, "generateDemoHTML");

// src/routes/demo.js
async function handleDemo(request, env, ctx) {
  return htmlResponse(generateDemoHTML(), {
    cacheControl: "public, max-age=300"
  });
}
__name(handleDemo, "handleDemo");

// node_modules/firebase-auth-cloudflare-workers/dist/module/api-requests.js
var ApiSettings = class {
  static {
    __name(this, "ApiSettings");
  }
  version;
  endpoint;
  httpMethod;
  requestValidator;
  responseValidator;
  constructor(version2, endpoint, httpMethod = "POST") {
    this.version = version2;
    this.endpoint = endpoint;
    this.httpMethod = httpMethod;
    this.setRequestValidator(null).setResponseValidator(null);
  }
  /** @returns The backend API resource version. */
  getVersion() {
    return this.version;
  }
  /** @returns The backend API endpoint. */
  getEndpoint() {
    return this.endpoint;
  }
  /** @returns The request HTTP method. */
  getHttpMethod() {
    return this.httpMethod;
  }
  /**
   * @param requestValidator - The request validator.
   * @returns The current API settings instance.
   */
  setRequestValidator(requestValidator) {
    const nullFunction = /* @__PURE__ */ __name(() => void 0, "nullFunction");
    this.requestValidator = requestValidator || nullFunction;
    return this;
  }
  /** @returns The request validator. */
  getRequestValidator() {
    return this.requestValidator;
  }
  /**
   * @param responseValidator - The response validator.
   * @returns The current API settings instance.
   */
  setResponseValidator(responseValidator) {
    const nullFunction = /* @__PURE__ */ __name(() => void 0, "nullFunction");
    this.responseValidator = responseValidator || nullFunction;
    return this;
  }
  /** @returns The response validator. */
  getResponseValidator() {
    return this.responseValidator;
  }
};

// node_modules/firebase-auth-cloudflare-workers/dist/module/emulator.js
function emulatorHost(env) {
  return env?.FIREBASE_AUTH_EMULATOR_HOST;
}
__name(emulatorHost, "emulatorHost");
var useEmulator = /* @__PURE__ */ __name((env) => {
  return !!emulatorHost(env);
}, "useEmulator");

// node_modules/firebase-auth-cloudflare-workers/dist/module/errors.js
var JwtError = class _JwtError extends Error {
  static {
    __name(this, "JwtError");
  }
  code;
  message;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.message = message;
    this.__proto__ = _JwtError.prototype;
  }
};
var JwtErrorCode;
(function(JwtErrorCode2) {
  JwtErrorCode2["INVALID_ARGUMENT"] = "invalid-argument";
  JwtErrorCode2["INVALID_CREDENTIAL"] = "invalid-credential";
  JwtErrorCode2["TOKEN_EXPIRED"] = "token-expired";
  JwtErrorCode2["INVALID_SIGNATURE"] = "invalid-token";
  JwtErrorCode2["NO_MATCHING_KID"] = "no-matching-kid-error";
  JwtErrorCode2["NO_KID_IN_HEADER"] = "no-kid-error";
  JwtErrorCode2["KEY_FETCH_ERROR"] = "key-fetch-error";
})(JwtErrorCode || (JwtErrorCode = {}));
var AppErrorCodes = class {
  static {
    __name(this, "AppErrorCodes");
  }
  static INVALID_CREDENTIAL = "invalid-credential";
  static INTERNAL_ERROR = "internal-error";
  static NETWORK_ERROR = "network-error";
  static NETWORK_TIMEOUT = "network-timeout";
  static UNABLE_TO_PARSE_RESPONSE = "unable-to-parse-response";
};
var AuthClientErrorCode = class {
  static {
    __name(this, "AuthClientErrorCode");
  }
  static INVALID_ARGUMENT = {
    code: "argument-error",
    message: "Invalid argument provided."
  };
  static INVALID_CREDENTIAL = {
    code: "invalid-credential",
    message: "Invalid credential object provided."
  };
  static ID_TOKEN_EXPIRED = {
    code: "id-token-expired",
    message: "The provided Firebase ID token is expired."
  };
  static INVALID_ID_TOKEN = {
    code: "invalid-id-token",
    message: "The provided ID token is not a valid Firebase ID token."
  };
  static ID_TOKEN_REVOKED = {
    code: "id-token-revoked",
    message: "The Firebase ID token has been revoked."
  };
  static INTERNAL_ERROR = {
    code: "internal-error",
    message: "An internal error has occurred."
  };
  static USER_NOT_FOUND = {
    code: "user-not-found",
    message: "There is no user record corresponding to the provided identifier."
  };
  static USER_DISABLED = {
    code: "user-disabled",
    message: "The user record is disabled."
  };
  static SESSION_COOKIE_EXPIRED = {
    code: "session-cookie-expired",
    message: "The Firebase session cookie is expired."
  };
  static SESSION_COOKIE_REVOKED = {
    code: "session-cookie-revoked",
    message: "The Firebase session cookie has been revoked."
  };
  static INVALID_SESSION_COOKIE_DURATION = {
    code: "invalid-session-cookie-duration",
    message: "The session cookie duration must be a valid number in milliseconds between 5 minutes and 2 weeks."
  };
  static INVALID_UID = {
    code: "invalid-uid",
    message: "The uid must be a non-empty string with at most 128 characters."
  };
  static INVALID_TOKENS_VALID_AFTER_TIME = {
    code: "invalid-tokens-valid-after-time",
    message: "The tokensValidAfterTime must be a valid UTC number in seconds."
  };
  static FORBIDDEN_CLAIM = {
    code: "reserved-claim",
    message: "The specified developer claim is reserved and cannot be specified."
  };
  static INVALID_CLAIMS = {
    code: "invalid-claims",
    message: "The provided custom claim attributes are invalid."
  };
  static CLAIMS_TOO_LARGE = {
    code: "claims-too-large",
    message: "Developer claims maximum payload size exceeded."
  };
};
var FirebaseError = class _FirebaseError extends Error {
  static {
    __name(this, "FirebaseError");
  }
  errorInfo;
  constructor(errorInfo) {
    super(errorInfo.message);
    this.errorInfo = errorInfo;
    this.__proto__ = _FirebaseError.prototype;
  }
  /** @returns The error code. */
  get code() {
    return this.errorInfo.code;
  }
  /** @returns The error message. */
  get message() {
    return this.errorInfo.message;
  }
  /** @returns The object representation of the error. */
  toJSON() {
    return {
      code: this.code,
      message: this.message
    };
  }
};
var PrefixedFirebaseError = class _PrefixedFirebaseError extends FirebaseError {
  static {
    __name(this, "PrefixedFirebaseError");
  }
  codePrefix;
  constructor(codePrefix, code, message) {
    super({
      code: `${codePrefix}/${code}`,
      message
    });
    this.codePrefix = codePrefix;
    this.__proto__ = _PrefixedFirebaseError.prototype;
  }
  /**
   * Allows the error type to be checked without needing to know implementation details
   * of the code prefixing.
   *
   * @param code - The non-prefixed error code to test against.
   * @returns True if the code matches, false otherwise.
   */
  hasCode(code) {
    return `${this.codePrefix}/${code}` === this.code;
  }
};
var FirebaseAuthError = class _FirebaseAuthError extends PrefixedFirebaseError {
  static {
    __name(this, "FirebaseAuthError");
  }
  constructor(info, message) {
    super("auth", info.code, message || info.message);
    this.__proto__ = _FirebaseAuthError.prototype;
  }
  /**
   * Creates the developer-facing error corresponding to the backend error code.
   *
   * @param serverErrorCode - The server error code.
   * @param [message] The error message. The default message is used
   *     if not provided.
   * @param [rawServerResponse] The error's raw server response.
   * @returns The corresponding developer-facing error.
   */
  static fromServerError(serverErrorCode, rawServerResponse) {
    const colonSeparator = (serverErrorCode || "").indexOf(":");
    if (colonSeparator !== -1) {
      serverErrorCode = serverErrorCode.substring(0, colonSeparator).trim();
    }
    const clientCodeKey = AUTH_SERVER_TO_CLIENT_CODE[serverErrorCode] || "INTERNAL_ERROR";
    const error = {
      ...AuthClientErrorCode.INTERNAL_ERROR,
      ...AuthClientErrorCode[clientCodeKey]
    };
    if (clientCodeKey === "INTERNAL_ERROR" && typeof rawServerResponse !== "undefined") {
      try {
        error.message += ` Raw server response: "${JSON.stringify(rawServerResponse)}"`;
      } catch (e) {
      }
    }
    return new _FirebaseAuthError(error);
  }
};
var FirebaseAppError = class _FirebaseAppError extends PrefixedFirebaseError {
  static {
    __name(this, "FirebaseAppError");
  }
  constructor(code, message) {
    super("app", code, message);
    this.__proto__ = _FirebaseAppError.prototype;
  }
};
var AUTH_SERVER_TO_CLIENT_CODE = {
  // Feature being configured or used requires a billing account.
  BILLING_NOT_ENABLED: "BILLING_NOT_ENABLED",
  // Claims payload is too large.
  CLAIMS_TOO_LARGE: "CLAIMS_TOO_LARGE",
  // Configuration being added already exists.
  CONFIGURATION_EXISTS: "CONFIGURATION_EXISTS",
  // Configuration not found.
  CONFIGURATION_NOT_FOUND: "CONFIGURATION_NOT_FOUND",
  // Provided credential has insufficient permissions.
  INSUFFICIENT_PERMISSION: "INSUFFICIENT_PERMISSION",
  // Provided configuration has invalid fields.
  INVALID_CONFIG: "INVALID_CONFIG",
  // Provided configuration identifier is invalid.
  INVALID_CONFIG_ID: "INVALID_PROVIDER_ID",
  // ActionCodeSettings missing continue URL.
  INVALID_CONTINUE_URI: "INVALID_CONTINUE_URI",
  // Dynamic link domain in provided ActionCodeSettings is not authorized.
  INVALID_DYNAMIC_LINK_DOMAIN: "INVALID_DYNAMIC_LINK_DOMAIN",
  // uploadAccount provides an email that already exists.
  DUPLICATE_EMAIL: "EMAIL_ALREADY_EXISTS",
  // uploadAccount provides a localId that already exists.
  DUPLICATE_LOCAL_ID: "UID_ALREADY_EXISTS",
  // Request specified a multi-factor enrollment ID that already exists.
  DUPLICATE_MFA_ENROLLMENT_ID: "SECOND_FACTOR_UID_ALREADY_EXISTS",
  // setAccountInfo email already exists.
  EMAIL_EXISTS: "EMAIL_ALREADY_EXISTS",
  // /accounts:sendOobCode for password reset when user is not found.
  EMAIL_NOT_FOUND: "EMAIL_NOT_FOUND",
  // Reserved claim name.
  FORBIDDEN_CLAIM: "FORBIDDEN_CLAIM",
  // Invalid claims provided.
  INVALID_CLAIMS: "INVALID_CLAIMS",
  // Invalid session cookie duration.
  INVALID_DURATION: "INVALID_SESSION_COOKIE_DURATION",
  // Invalid email provided.
  INVALID_EMAIL: "INVALID_EMAIL",
  // Invalid new email provided.
  INVALID_NEW_EMAIL: "INVALID_NEW_EMAIL",
  // Invalid tenant display name. This can be thrown on CreateTenant and UpdateTenant.
  INVALID_DISPLAY_NAME: "INVALID_DISPLAY_NAME",
  // Invalid ID token provided.
  INVALID_ID_TOKEN: "INVALID_ID_TOKEN",
  // Invalid tenant/parent resource name.
  INVALID_NAME: "INVALID_NAME",
  // OIDC configuration has an invalid OAuth client ID.
  INVALID_OAUTH_CLIENT_ID: "INVALID_OAUTH_CLIENT_ID",
  // Invalid page token.
  INVALID_PAGE_SELECTION: "INVALID_PAGE_TOKEN",
  // Invalid phone number.
  INVALID_PHONE_NUMBER: "INVALID_PHONE_NUMBER",
  // Invalid agent project. Either agent project doesn't exist or didn't enable multi-tenancy.
  INVALID_PROJECT_ID: "INVALID_PROJECT_ID",
  // Invalid provider ID.
  INVALID_PROVIDER_ID: "INVALID_PROVIDER_ID",
  // Invalid service account.
  INVALID_SERVICE_ACCOUNT: "INVALID_SERVICE_ACCOUNT",
  // Invalid testing phone number.
  INVALID_TESTING_PHONE_NUMBER: "INVALID_TESTING_PHONE_NUMBER",
  // Invalid tenant type.
  INVALID_TENANT_TYPE: "INVALID_TENANT_TYPE",
  // Missing Android package name.
  MISSING_ANDROID_PACKAGE_NAME: "MISSING_ANDROID_PACKAGE_NAME",
  // Missing configuration.
  MISSING_CONFIG: "MISSING_CONFIG",
  // Missing configuration identifier.
  MISSING_CONFIG_ID: "MISSING_PROVIDER_ID",
  // Missing tenant display name: This can be thrown on CreateTenant and UpdateTenant.
  MISSING_DISPLAY_NAME: "MISSING_DISPLAY_NAME",
  // Email is required for the specified action. For example a multi-factor user requires
  // a verified email.
  MISSING_EMAIL: "MISSING_EMAIL",
  // Missing iOS bundle ID.
  MISSING_IOS_BUNDLE_ID: "MISSING_IOS_BUNDLE_ID",
  // Missing OIDC issuer.
  MISSING_ISSUER: "MISSING_ISSUER",
  // No localId provided (deleteAccount missing localId).
  MISSING_LOCAL_ID: "MISSING_UID",
  // OIDC configuration is missing an OAuth client ID.
  MISSING_OAUTH_CLIENT_ID: "MISSING_OAUTH_CLIENT_ID",
  // Missing provider ID.
  MISSING_PROVIDER_ID: "MISSING_PROVIDER_ID",
  // Missing SAML RP config.
  MISSING_SAML_RELYING_PARTY_CONFIG: "MISSING_SAML_RELYING_PARTY_CONFIG",
  // Empty user list in uploadAccount.
  MISSING_USER_ACCOUNT: "MISSING_UID",
  // Password auth disabled in console.
  OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED",
  // Provided credential has insufficient permissions.
  PERMISSION_DENIED: "INSUFFICIENT_PERMISSION",
  // Phone number already exists.
  PHONE_NUMBER_EXISTS: "PHONE_NUMBER_ALREADY_EXISTS",
  // Project not found.
  PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",
  // In multi-tenancy context: project creation quota exceeded.
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  // Currently only 5 second factors can be set on the same user.
  SECOND_FACTOR_LIMIT_EXCEEDED: "SECOND_FACTOR_LIMIT_EXCEEDED",
  // Tenant not found.
  TENANT_NOT_FOUND: "TENANT_NOT_FOUND",
  // Tenant ID mismatch.
  TENANT_ID_MISMATCH: "MISMATCHING_TENANT_ID",
  // Token expired error.
  TOKEN_EXPIRED: "ID_TOKEN_EXPIRED",
  // Continue URL provided in ActionCodeSettings has a domain that is not whitelisted.
  UNAUTHORIZED_DOMAIN: "UNAUTHORIZED_DOMAIN",
  // A multi-factor user requires a supported first factor.
  UNSUPPORTED_FIRST_FACTOR: "UNSUPPORTED_FIRST_FACTOR",
  // The request specified an unsupported type of second factor.
  UNSUPPORTED_SECOND_FACTOR: "UNSUPPORTED_SECOND_FACTOR",
  // Operation is not supported in a multi-tenant context.
  UNSUPPORTED_TENANT_OPERATION: "UNSUPPORTED_TENANT_OPERATION",
  // A verified email is required for the specified action. For example a multi-factor user
  // requires a verified email.
  UNVERIFIED_EMAIL: "UNVERIFIED_EMAIL",
  // User on which action is to be performed is not found.
  USER_NOT_FOUND: "USER_NOT_FOUND",
  // User record is disabled.
  USER_DISABLED: "USER_DISABLED",
  // Password provided is too weak.
  WEAK_PASSWORD: "INVALID_PASSWORD",
  // Unrecognized reCAPTCHA action.
  INVALID_RECAPTCHA_ACTION: "INVALID_RECAPTCHA_ACTION",
  // Unrecognized reCAPTCHA enforcement state.
  INVALID_RECAPTCHA_ENFORCEMENT_STATE: "INVALID_RECAPTCHA_ENFORCEMENT_STATE",
  // reCAPTCHA is not enabled for account defender.
  RECAPTCHA_NOT_ENABLED: "RECAPTCHA_NOT_ENABLED"
};

// node_modules/firebase-auth-cloudflare-workers/dist/module/validator.js
function isURL(urlStr) {
  if (typeof urlStr !== "string") {
    return false;
  }
  const re = /[^a-z0-9:/?#[\]@!$&'()*+,;=.\-_~%]/i;
  if (re.test(urlStr)) {
    return false;
  }
  try {
    const uri = new URL(urlStr);
    const scheme = uri.protocol;
    const hostname = uri.hostname;
    const pathname = uri.pathname;
    if (scheme !== "http:" && scheme !== "https:") {
      return false;
    }
    if (!hostname || !/^[a-zA-Z0-9]+[\w-]*([.]?[a-zA-Z0-9]+[\w-]*)*$/.test(hostname)) {
      return false;
    }
    const pathnameRe = /^(\/[\w\-.~!$'()*+,;=:@%]+)*\/?$/;
    if (pathname && pathname !== "/" && !pathnameRe.test(pathname)) {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
}
__name(isURL, "isURL");
function isNumber(value) {
  return typeof value === "number";
}
__name(isNumber, "isNumber");
function isString(value) {
  return typeof value === "string";
}
__name(isString, "isString");
function isNonEmptyString(value) {
  return isString(value) && value !== "";
}
__name(isNonEmptyString, "isNonEmptyString");
function isObject(value) {
  return typeof value === "object" && !Array.isArray(value);
}
__name(isObject, "isObject");
function isNonNullObject(value) {
  return isObject(value) && value !== null;
}
__name(isNonNullObject, "isNonNullObject");
function isUid(uid) {
  return typeof uid === "string" && uid.length > 0 && uid.length <= 128;
}
__name(isUid, "isUid");

// node_modules/firebase-auth-cloudflare-workers/dist/module/version.js
var version = "2.0.6";

// node_modules/firebase-auth-cloudflare-workers/dist/module/client.js
function defaultRetryConfig() {
  return {
    maxRetries: 4,
    statusCodes: [503],
    ioErrorCodes: ["ECONNRESET", "ETIMEDOUT"],
    backOffFactor: 0.5,
    maxDelayInMillis: 60 * 1e3
  };
}
__name(defaultRetryConfig, "defaultRetryConfig");
function buildApiUrl(projectId, apiSettings, env) {
  const defaultAuthURL = "https://identitytoolkit.googleapis.com";
  const baseUrl = env?.FIREBASE_AUTH_EMULATOR_HOST ? `http://${env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com` : defaultAuthURL;
  const endpoint = apiSettings.getEndpoint();
  return `${baseUrl}/${apiSettings.getVersion()}/projects/${projectId}${endpoint}`;
}
__name(buildApiUrl, "buildApiUrl");
var BaseClient = class {
  static {
    __name(this, "BaseClient");
  }
  projectId;
  credential;
  retryConfig;
  constructor(projectId, credential, retryConfig = defaultRetryConfig()) {
    this.projectId = projectId;
    this.credential = credential;
    this.retryConfig = retryConfig;
  }
  async getToken(env) {
    if (useEmulator(env)) {
      return "owner";
    }
    const result = await this.credential.getAccessToken();
    return result.access_token;
  }
  async fetch(apiSettings, requestData, env) {
    const fullUrl = buildApiUrl(this.projectId, apiSettings, env);
    if (requestData) {
      const requestValidator = apiSettings.getRequestValidator();
      requestValidator(requestData);
    }
    const token = await this.getToken(env);
    const method = apiSettings.getHttpMethod();
    const signal = AbortSignal.timeout(25e3);
    return await this.fetchWithRetry(fullUrl, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": `Code-Hex/firebase-auth-cloudflare-workers/${version}`,
        "X-Client-Version": `Code-Hex/firebase-auth-cloudflare-workers/${version}`,
        "Content-Type": "application/json;charset=utf-8"
      },
      body: requestData ? JSON.stringify(requestData) : void 0,
      signal
    });
  }
  async fetchWithRetry(url, init, retryAttempts = 0) {
    try {
      const res = await fetch(url, init);
      const text = await res.text();
      if (!res.ok) {
        throw new HttpError(res.status, text);
      }
      try {
        return JSON.parse(text);
      } catch (err) {
        throw new HttpError(res.status, text, {
          cause: new FirebaseAppError(AppErrorCodes.UNABLE_TO_PARSE_RESPONSE, `Error while parsing response data: "${String(err)}". Raw server response: "${text}". Status code: "${res.status}". Outgoing request: "${init.method} ${url}."`)
        });
      }
    } catch (err) {
      const canRetry = this.isRetryEligible(retryAttempts, err);
      const delayMillis = this.backOffDelayMillis(retryAttempts);
      if (canRetry && delayMillis <= this.retryConfig.maxDelayInMillis) {
        await this.waitForRetry(delayMillis);
        return await this.fetchWithRetry(url, init, retryAttempts + 1);
      }
      if (err instanceof HttpError) {
        if (err.cause) {
          throw err.cause;
        }
        try {
          const json = JSON.parse(err.message);
          const errorCode = this.getErrorCode(json);
          if (errorCode) {
            throw FirebaseAuthError.fromServerError(errorCode, json);
          }
        } catch (err2) {
          if (err2 instanceof FirebaseAuthError) {
            throw err2;
          }
        }
        throw new FirebaseAppError(AppErrorCodes.INTERNAL_ERROR, `Error while sending request or reading response: "${err}". Raw server response: Status code: "${err.status}". Outgoing request: "${init.method} ${url}."`);
      }
      throw new FirebaseAppError(AppErrorCodes.NETWORK_ERROR, `Error while making request: ${String(err)}`);
    }
  }
  /**
   * @param response - The response to check for errors.
   * @returns The error code if present; null otherwise.
   */
  getErrorCode(response) {
    return isNonNullObject(response) && response.error && response.error.message || null;
  }
  waitForRetry(delayMillis) {
    if (delayMillis > 0) {
      return new Promise((resolve) => {
        setTimeout(resolve, delayMillis);
      });
    }
    return Promise.resolve();
  }
  isRetryEligible(retryAttempts, err) {
    if (retryAttempts >= this.retryConfig.maxRetries) {
      return false;
    }
    if (err instanceof HttpError) {
      const statusCodes = this.retryConfig.statusCodes || [];
      return statusCodes.includes(err.status);
    }
    if (err instanceof Error && err.name === "AbortError") {
      return false;
    }
    return true;
  }
  backOffDelayMillis(retryAttempts) {
    if (retryAttempts === 0) {
      return 0;
    }
    const backOffFactor = this.retryConfig.backOffFactor || 0;
    const delayInSeconds = 2 ** retryAttempts * backOffFactor;
    return Math.min(delayInSeconds * 1e3, this.retryConfig.maxDelayInMillis);
  }
};
var HttpError = class extends Error {
  static {
    __name(this, "HttpError");
  }
  status;
  constructor(status, message, opts) {
    super(message, opts);
    this.status = status;
    this.name = "HttpError";
  }
};

// node_modules/firebase-auth-cloudflare-workers/dist/module/user-record.js
var B64_REDACTED = "UkVEQUNURUQ=";
function parseDate(time) {
  try {
    const date = new Date(parseInt(time, 10));
    if (!isNaN(date.getTime())) {
      return date.toUTCString();
    }
  } catch (e) {
  }
  return null;
}
__name(parseDate, "parseDate");
var MultiFactorId;
(function(MultiFactorId2) {
  MultiFactorId2["Phone"] = "phone";
  MultiFactorId2["Totp"] = "totp";
})(MultiFactorId || (MultiFactorId = {}));
var MultiFactorInfo = class {
  static {
    __name(this, "MultiFactorInfo");
  }
  /**
   * The ID of the enrolled second factor. This ID is unique to the user.
   */
  uid;
  /**
   * The optional display name of the enrolled second factor.
   */
  displayName;
  /**
   * The type identifier of the second factor.
   * For SMS second factors, this is `phone`.
   * For TOTP second factors, this is `totp`.
   */
  factorId;
  /**
   * The optional date the second factor was enrolled, formatted as a UTC string.
   */
  enrollmentTime;
  /**
   * Initializes the MultiFactorInfo associated subclass using the server side.
   * If no MultiFactorInfo is associated with the response, null is returned.
   *
   * @param response - The server side response.
   * @internal
   */
  static initMultiFactorInfo(response) {
    let multiFactorInfo = null;
    try {
      if (response.phoneInfo !== void 0) {
        multiFactorInfo = new PhoneMultiFactorInfo(response);
      } else if (response.totpInfo !== void 0) {
        multiFactorInfo = new TotpMultiFactorInfo(response);
      } else {
      }
    } catch (e) {
    }
    return multiFactorInfo;
  }
  /**
   * Initializes the MultiFactorInfo object using the server side response.
   *
   * @param response - The server side response.
   * @constructor
   * @internal
   */
  constructor(response) {
    this.initFromServerResponse(response);
  }
  /**
   * Returns a JSON-serializable representation of this object.
   *
   * @returns A JSON-serializable representation of this object.
   */
  toJSON() {
    return {
      uid: this.uid,
      displayName: this.displayName,
      factorId: this.factorId,
      enrollmentTime: this.enrollmentTime
    };
  }
  /**
   * Initializes the MultiFactorInfo object using the provided server response.
   *
   * @param response - The server side response.
   */
  initFromServerResponse(response) {
    const factorId = response && this.getFactorId(response);
    if (!factorId || !response || !response.mfaEnrollmentId) {
      throw new FirebaseAuthError(AuthClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid multi-factor info response");
    }
    addReadonlyGetter(this, "uid", response.mfaEnrollmentId);
    addReadonlyGetter(this, "factorId", factorId);
    addReadonlyGetter(this, "displayName", response.displayName);
    if (response.enrolledAt) {
      addReadonlyGetter(this, "enrollmentTime", new Date(response.enrolledAt).toUTCString());
    } else {
      addReadonlyGetter(this, "enrollmentTime", null);
    }
  }
};
var PhoneMultiFactorInfo = class extends MultiFactorInfo {
  static {
    __name(this, "PhoneMultiFactorInfo");
  }
  /**
   * The phone number associated with a phone second factor.
   */
  phoneNumber;
  /**
   * Initializes the PhoneMultiFactorInfo object using the server side response.
   *
   * @param response - The server side response.
   * @constructor
   * @internal
   */
  constructor(response) {
    super(response);
    addReadonlyGetter(this, "phoneNumber", response.phoneInfo);
  }
  /**
   * {@inheritdoc MultiFactorInfo.toJSON}
   */
  toJSON() {
    return Object.assign(super.toJSON(), {
      phoneNumber: this.phoneNumber
    });
  }
  /**
   * Returns the factor ID based on the response provided.
   *
   * @param response - The server side response.
   * @returns The multi-factor ID associated with the provided response. If the response is
   *     not associated with any known multi-factor ID, null is returned.
   *
   * @internal
   */
  getFactorId(response) {
    return response && response.phoneInfo ? MultiFactorId.Phone : null;
  }
};
var TotpMultiFactorInfo = class extends MultiFactorInfo {
  static {
    __name(this, "TotpMultiFactorInfo");
  }
  /**
   * `TotpInfo` struct associated with a second factor
   */
  totpInfo;
  /**
   * Initializes the `TotpMultiFactorInfo` object using the server side response.
   *
   * @param response - The server side response.
   * @constructor
   * @internal
   */
  constructor(response) {
    super(response);
    addReadonlyGetter(this, "totpInfo", response.totpInfo);
  }
  /**
   * {@inheritdoc MultiFactorInfo.toJSON}
   */
  toJSON() {
    return Object.assign(super.toJSON(), {
      totpInfo: this.totpInfo
    });
  }
  /**
   * Returns the factor ID based on the response provided.
   *
   * @param response - The server side response.
   * @returns The multi-factor ID associated with the provided response. If the response is
   *     not associated with any known multi-factor ID, `null` is returned.
   *
   * @internal
   */
  getFactorId(response) {
    return response && response.totpInfo ? MultiFactorId.Totp : null;
  }
};
var MultiFactorSettings = class {
  static {
    __name(this, "MultiFactorSettings");
  }
  /**
   * List of second factors enrolled with the current user.
   * Currently only phone and TOTP second factors are supported.
   */
  enrolledFactors;
  /**
   * Initializes the `MultiFactor` object using the server side or JWT format response.
   *
   * @param response - The server side response.
   * @constructor
   * @internal
   */
  constructor(response) {
    const parsedEnrolledFactors = [];
    if (!isNonNullObject(response)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid multi-factor response");
    } else if (response.mfaInfo) {
      response.mfaInfo.forEach((factorResponse) => {
        const multiFactorInfo = MultiFactorInfo.initMultiFactorInfo(factorResponse);
        if (multiFactorInfo) {
          parsedEnrolledFactors.push(multiFactorInfo);
        }
      });
    }
    addReadonlyGetter(this, "enrolledFactors", Object.freeze(parsedEnrolledFactors));
  }
  /**
   * Returns a JSON-serializable representation of this multi-factor object.
   *
   * @returns A JSON-serializable representation of this multi-factor object.
   */
  toJSON() {
    return {
      enrolledFactors: this.enrolledFactors.map((info) => info.toJSON())
    };
  }
};
var UserMetadata = class {
  static {
    __name(this, "UserMetadata");
  }
  /**
   * The date the user was created, formatted as a UTC string.
   */
  creationTime;
  /**
   * The date the user last signed in, formatted as a UTC string.
   */
  lastSignInTime;
  /**
   * The time at which the user was last active (ID token refreshed),
   * formatted as a UTC Date string (eg 'Sat, 03 Feb 2001 04:05:06 GMT').
   * Returns null if the user was never active.
   */
  lastRefreshTime;
  /**
   * @param response - The server side response returned from the `getAccountInfo`
   *     endpoint.
   * @constructor
   * @internal
   */
  constructor(response) {
    addReadonlyGetter(this, "creationTime", parseDate(response.createdAt));
    addReadonlyGetter(this, "lastSignInTime", parseDate(response.lastLoginAt));
    const lastRefreshAt = response.lastRefreshAt ? new Date(response.lastRefreshAt).toUTCString() : null;
    addReadonlyGetter(this, "lastRefreshTime", lastRefreshAt);
  }
  /**
   * Returns a JSON-serializable representation of this object.
   *
   * @returns A JSON-serializable representation of this object.
   */
  toJSON() {
    return {
      lastSignInTime: this.lastSignInTime,
      creationTime: this.creationTime,
      lastRefreshTime: this.lastRefreshTime
    };
  }
};
var UserInfo = class {
  static {
    __name(this, "UserInfo");
  }
  /**
   * The user identifier for the linked provider.
   */
  uid;
  /**
   * The display name for the linked provider.
   */
  displayName;
  /**
   * The email for the linked provider.
   */
  email;
  /**
   * The photo URL for the linked provider.
   */
  photoURL;
  /**
   * The linked provider ID (for example, "google.com" for the Google provider).
   */
  providerId;
  /**
   * The phone number for the linked provider.
   */
  phoneNumber;
  /**
   * @param response - The server side response returned from the `getAccountInfo`
   *     endpoint.
   * @constructor
   * @internal
   */
  constructor(response) {
    if (!response.rawId || !response.providerId) {
      throw new FirebaseAuthError(AuthClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid user info response");
    }
    addReadonlyGetter(this, "uid", response.rawId);
    addReadonlyGetter(this, "displayName", response.displayName);
    addReadonlyGetter(this, "email", response.email);
    addReadonlyGetter(this, "photoURL", response.photoUrl);
    addReadonlyGetter(this, "providerId", response.providerId);
    addReadonlyGetter(this, "phoneNumber", response.phoneNumber);
  }
  /**
   * Returns a JSON-serializable representation of this object.
   *
   * @returns A JSON-serializable representation of this object.
   */
  toJSON() {
    return {
      uid: this.uid,
      displayName: this.displayName,
      email: this.email,
      photoURL: this.photoURL,
      providerId: this.providerId,
      phoneNumber: this.phoneNumber
    };
  }
};
var UserRecord = class {
  static {
    __name(this, "UserRecord");
  }
  /**
   * The user's `uid`.
   */
  uid;
  /**
   * The user's primary email, if set.
   */
  email;
  /**
   * Whether or not the user's primary email is verified.
   */
  emailVerified;
  /**
   * The user's display name.
   */
  displayName;
  /**
   * The user's photo URL.
   */
  photoURL;
  /**
   * The user's primary phone number, if set.
   */
  phoneNumber;
  /**
   * Whether or not the user is disabled: `true` for disabled; `false` for
   * enabled.
   */
  disabled;
  /**
   * Additional metadata about the user.
   */
  metadata;
  /**
   * An array of providers (for example, Google, Facebook) linked to the user.
   */
  providerData;
  /**
   * The user's hashed password (base64-encoded), only if Firebase Auth hashing
   * algorithm (SCRYPT) is used. If a different hashing algorithm had been used
   * when uploading this user, as is typical when migrating from another Auth
   * system, this will be an empty string. If no password is set, this is
   * null. This is only available when the user is obtained from
   * {@link BaseAuth.listUsers}.
   */
  passwordHash;
  /**
   * The user's password salt (base64-encoded), only if Firebase Auth hashing
   * algorithm (SCRYPT) is used. If a different hashing algorithm had been used to
   * upload this user, typical when migrating from another Auth system, this will
   * be an empty string. If no password is set, this is null. This is only
   * available when the user is obtained from {@link BaseAuth.listUsers}.
   */
  passwordSalt;
  /**
   * The user's custom claims object if available, typically used to define
   * user roles and propagated to an authenticated user's ID token.
   * This is set via {@link BaseAuth.setCustomUserClaims}
   */
  customClaims;
  /**
   * The ID of the tenant the user belongs to, if available.
   */
  tenantId;
  /**
   * The date the user's tokens are valid after, formatted as a UTC string.
   * This is updated every time the user's refresh token are revoked either
   * from the {@link BaseAuth.revokeRefreshTokens}
   * API or from the Firebase Auth backend on big account changes (password
   * resets, password or email updates, etc).
   */
  tokensValidAfterTime;
  /**
   * The multi-factor related properties for the current user, if available.
   */
  multiFactor;
  /**
   * @param response - The server side response returned from the getAccountInfo
   *     endpoint.
   * @constructor
   * @internal
   */
  constructor(response) {
    if (!response.localId) {
      throw new FirebaseAuthError(AuthClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Invalid user response");
    }
    addReadonlyGetter(this, "uid", response.localId);
    addReadonlyGetter(this, "email", response.email);
    addReadonlyGetter(this, "emailVerified", !!response.emailVerified);
    addReadonlyGetter(this, "displayName", response.displayName);
    addReadonlyGetter(this, "photoURL", response.photoUrl);
    addReadonlyGetter(this, "phoneNumber", response.phoneNumber);
    addReadonlyGetter(this, "disabled", response.disabled || false);
    addReadonlyGetter(this, "metadata", new UserMetadata(response));
    const providerData = [];
    for (const entry of response.providerUserInfo || []) {
      providerData.push(new UserInfo(entry));
    }
    addReadonlyGetter(this, "providerData", providerData);
    if (response.passwordHash === B64_REDACTED) {
      addReadonlyGetter(this, "passwordHash", void 0);
    } else {
      addReadonlyGetter(this, "passwordHash", response.passwordHash);
    }
    addReadonlyGetter(this, "passwordSalt", response.salt);
    if (response.customAttributes) {
      addReadonlyGetter(this, "customClaims", JSON.parse(response.customAttributes));
    }
    let validAfterTime = null;
    if (typeof response.validSince !== "undefined") {
      validAfterTime = parseDate(parseInt(response.validSince, 10) * 1e3);
    }
    addReadonlyGetter(this, "tokensValidAfterTime", validAfterTime || void 0);
    addReadonlyGetter(this, "tenantId", response.tenantId);
    const multiFactor = new MultiFactorSettings(response);
    if (multiFactor.enrolledFactors.length > 0) {
      addReadonlyGetter(this, "multiFactor", multiFactor);
    }
  }
  /**
   * Returns a JSON-serializable representation of this object.
   *
   * @returns A JSON-serializable representation of this object.
   */
  toJSON() {
    const json = {
      uid: this.uid,
      email: this.email,
      emailVerified: this.emailVerified,
      displayName: this.displayName,
      photoURL: this.photoURL,
      phoneNumber: this.phoneNumber,
      disabled: this.disabled,
      // Convert metadata to json.
      metadata: this.metadata.toJSON(),
      passwordHash: this.passwordHash,
      passwordSalt: this.passwordSalt,
      customClaims: deepCopy(this.customClaims),
      tokensValidAfterTime: this.tokensValidAfterTime,
      tenantId: this.tenantId
    };
    if (this.multiFactor) {
      json.multiFactor = this.multiFactor.toJSON();
    }
    json.providerData = [];
    for (const entry of this.providerData) {
      json.providerData.push(entry.toJSON());
    }
    return json;
  }
};
function addReadonlyGetter(obj, prop, value) {
  Object.defineProperty(obj, prop, {
    value,
    // Make this property read-only.
    writable: false,
    // Include this property during enumeration of obj's properties.
    enumerable: true
  });
}
__name(addReadonlyGetter, "addReadonlyGetter");
function deepCopy(value) {
  return deepExtend(void 0, value);
}
__name(deepCopy, "deepCopy");
function deepExtend(target, source) {
  if (!(source instanceof Object)) {
    return source;
  }
  switch (source.constructor) {
    case Date: {
      const dateValue = source;
      return new Date(dateValue.getTime());
    }
    case Object:
      if (target === void 0) {
        target = {};
      }
      break;
    case Array:
      target = [];
      break;
    default:
      return source;
  }
  for (const prop in source) {
    if (!Object.prototype.hasOwnProperty.call(source, prop)) {
      continue;
    }
    target[prop] = deepExtend(target[prop], source[prop]);
  }
  return target;
}
__name(deepExtend, "deepExtend");

// node_modules/firebase-auth-cloudflare-workers/dist/module/auth-api-requests.js
var MIN_SESSION_COOKIE_DURATION_SECS = 5 * 60;
var MAX_SESSION_COOKIE_DURATION_SECS = 14 * 24 * 60 * 60;
var RESERVED_CLAIMS = [
  "acr",
  "amr",
  "at_hash",
  "aud",
  "auth_time",
  "azp",
  "cnf",
  "c_hash",
  "exp",
  "iat",
  "iss",
  "jti",
  "nbf",
  "nonce",
  "sub",
  "firebase"
];
var MAX_CLAIMS_PAYLOAD_SIZE = 1e3;
var FIREBASE_AUTH_CREATE_SESSION_COOKIE = new ApiSettings("v1", ":createSessionCookie", "POST").setRequestValidator((request) => {
  if (!isNonEmptyString(request.idToken)) {
    throw new FirebaseAuthError(AuthClientErrorCode.INVALID_ID_TOKEN);
  }
  if (!isNumber(request.validDuration) || request.validDuration < MIN_SESSION_COOKIE_DURATION_SECS || request.validDuration > MAX_SESSION_COOKIE_DURATION_SECS) {
    throw new FirebaseAuthError(AuthClientErrorCode.INVALID_SESSION_COOKIE_DURATION);
  }
}).setResponseValidator((response) => {
  if (!isNonEmptyString(response.sessionCookie)) {
    throw new FirebaseAuthError(AuthClientErrorCode.INTERNAL_ERROR);
  }
});
var FIREBASE_AUTH_GET_ACCOUNT_INFO = new ApiSettings("v1", "/accounts:lookup", "POST").setRequestValidator((request) => {
  if (!request.localId && !request.email && !request.phoneNumber && !request.federatedUserId) {
    throw new FirebaseAuthError(AuthClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Server request is missing user identifier");
  }
}).setResponseValidator((response) => {
  if (!response.users || !response.users.length) {
    throw new FirebaseAuthError(AuthClientErrorCode.USER_NOT_FOUND);
  }
});
var FIREBASE_AUTH_REVOKE_REFRESH_TOKENS = new ApiSettings("v1", "/accounts:update", "POST").setRequestValidator((request) => {
  if (typeof request.localId === "undefined") {
    throw new FirebaseAuthError(AuthClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Server request is missing user identifier");
  }
  if (typeof request.validSince !== "undefined" && !isNumber(request.validSince)) {
    throw new FirebaseAuthError(AuthClientErrorCode.INVALID_TOKENS_VALID_AFTER_TIME);
  }
}).setResponseValidator((response) => {
  if (!response.localId) {
    throw new FirebaseAuthError(AuthClientErrorCode.USER_NOT_FOUND);
  }
});
var FIREBASE_AUTH_SET_CUSTOM_USER_CLAIMS = new ApiSettings("v1", "/accounts:update", "POST").setRequestValidator((request) => {
  if (typeof request.localId === "undefined") {
    throw new FirebaseAuthError(AuthClientErrorCode.INTERNAL_ERROR, "INTERNAL ASSERT FAILED: Server request is missing user identifier");
  }
  if (typeof request.customAttributes !== "undefined") {
    let developerClaims;
    try {
      developerClaims = JSON.parse(request.customAttributes);
    } catch (error) {
      if (error instanceof Error) {
        throw new FirebaseAuthError(AuthClientErrorCode.INVALID_CLAIMS, error.message);
      }
      throw error;
    }
    const invalidClaims = [];
    RESERVED_CLAIMS.forEach((blacklistedClaim) => {
      if (Object.prototype.hasOwnProperty.call(developerClaims, blacklistedClaim)) {
        invalidClaims.push(blacklistedClaim);
      }
    });
    if (invalidClaims.length > 0) {
      throw new FirebaseAuthError(AuthClientErrorCode.FORBIDDEN_CLAIM, invalidClaims.length > 1 ? `Developer claims "${invalidClaims.join('", "')}" are reserved and cannot be specified.` : `Developer claim "${invalidClaims[0]}" is reserved and cannot be specified.`);
    }
    if (request.customAttributes.length > MAX_CLAIMS_PAYLOAD_SIZE) {
      throw new FirebaseAuthError(AuthClientErrorCode.CLAIMS_TOO_LARGE, `Developer claims payload should not exceed ${MAX_CLAIMS_PAYLOAD_SIZE} characters.`);
    }
  }
}).setResponseValidator((response) => {
  if (!response.localId) {
    throw new FirebaseAuthError(AuthClientErrorCode.USER_NOT_FOUND);
  }
});
var AuthApiClient = class extends BaseClient {
  static {
    __name(this, "AuthApiClient");
  }
  /**
   * Creates a new Firebase session cookie with the specified duration that can be used for
   * session management (set as a server side session cookie with custom cookie policy).
   * The session cookie JWT will have the same payload claims as the provided ID token.
   *
   * @param idToken - The Firebase ID token to exchange for a session cookie.
   * @param expiresIn - The session cookie duration in milliseconds.
   * @param env - An optional parameter specifying the environment in which the function is running.
   *   If the function is running in an emulator environment, this should be set to `EmulatorEnv`.
   *   If not specified, the function will assume it is running in a production environment.
   *
   * @returns A promise that resolves on success with the created session cookie.
   */
  async createSessionCookie(idToken, expiresIn, env) {
    const request = {
      idToken,
      // Convert to seconds.
      validDuration: expiresIn / 1e3
    };
    const res = await this.fetch(FIREBASE_AUTH_CREATE_SESSION_COOKIE, request, env);
    return res.sessionCookie;
  }
  /**
   * Looks up a user by uid.
   *
   * @param uid - The uid of the user to lookup.
   * @param env - An optional parameter specifying the environment in which the function is running.
   *   If the function is running in an emulator environment, this should be set to `EmulatorEnv`.
   *   If not specified, the function will assume it is running in a production environment.
   * @returns A promise that resolves with the user information.
   */
  async getAccountInfoByUid(uid, env) {
    if (!isUid(uid)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_UID);
    }
    const request = {
      localId: [uid]
    };
    const res = await this.fetch(FIREBASE_AUTH_GET_ACCOUNT_INFO, request, env);
    return new UserRecord(res.users[0]);
  }
  /**
   * Revokes all refresh tokens for the specified user identified by the uid provided.
   * In addition to revoking all refresh tokens for a user, all ID tokens issued
   * before revocation will also be revoked on the Auth backend. Any request with an
   * ID token generated before revocation will be rejected with a token expired error.
   * Note that due to the fact that the timestamp is stored in seconds, any tokens minted in
   * the same second as the revocation will still be valid. If there is a chance that a token
   * was minted in the last second, delay for 1 second before revoking.
   *
   * @param uid - The user whose tokens are to be revoked.
   * @param env - An optional parameter specifying the environment in which the function is running.
   *   If the function is running in an emulator environment, this should be set to `EmulatorEnv`.
   *   If not specified, the function will assume it is running in a production environment.
   * @returns A promise that resolves when the operation completes
   *     successfully with the user id of the corresponding user.
   */
  async revokeRefreshTokens(uid, env) {
    if (!isUid(uid)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_UID);
    }
    const request = {
      localId: uid,
      // validSince is in UTC seconds.
      validSince: Math.floor((/* @__PURE__ */ new Date()).getTime() / 1e3)
    };
    const res = await this.fetch(FIREBASE_AUTH_REVOKE_REFRESH_TOKENS, request, env);
    return res.localId;
  }
  /**
   * Sets additional developer claims on an existing user identified by provided UID.
   *
   * @param uid - The user to edit.
   * @param customUserClaims - The developer claims to set.
   * @param env - An optional parameter specifying the environment in which the function is running.
   *   If the function is running in an emulator environment, this should be set to `EmulatorEnv`.
   *   If not specified, the function will assume it is running in a production environment.
   * @returns A promise that resolves when the operation completes
   *     with the user id that was edited.
   */
  async setCustomUserClaims(uid, customUserClaims, env) {
    if (!isUid(uid)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_UID);
    } else if (!isObject(customUserClaims)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, "CustomUserClaims argument must be an object or null.");
    }
    if (customUserClaims === null) {
      customUserClaims = {};
    }
    const request = {
      localId: uid,
      customAttributes: JSON.stringify(customUserClaims)
    };
    const res = await this.fetch(FIREBASE_AUTH_SET_CUSTOM_USER_CLAIMS, request, env);
    return res.localId;
  }
};

// node_modules/firebase-auth-cloudflare-workers/dist/module/utf8.js
var utf8Encoder = new TextEncoder();
var utf8Decoder = new TextDecoder();

// node_modules/firebase-auth-cloudflare-workers/dist/module/base64.js
var decodeBase64Url = /* @__PURE__ */ __name((str) => {
  return decodeBase64(str.replace(/_|-/g, (m) => ({ _: "/", "-": "+" })[m] ?? m));
}, "decodeBase64Url");
var decodeBase64 = /* @__PURE__ */ __name((str) => {
  const binary = atob(str);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  const half = binary.length / 2;
  for (let i = 0, j = binary.length - 1; i <= half; i++, j--) {
    bytes[i] = binary.charCodeAt(i);
    bytes[j] = binary.charCodeAt(j);
  }
  return bytes;
}, "decodeBase64");

// node_modules/firebase-auth-cloudflare-workers/dist/module/x509.js
function getElement(seq) {
  const result = [];
  let next = 0;
  while (next < seq.length) {
    const nextPart = parseElement(seq.subarray(next));
    result.push(nextPart);
    next += nextPart.byteLength;
  }
  return result;
}
__name(getElement, "getElement");
function parseElement(bytes) {
  let position = 0;
  let tag = bytes[0] & 31;
  position++;
  if (tag === 31) {
    tag = 0;
    while (bytes[position] >= 128) {
      tag = tag * 128 + bytes[position] - 128;
      position++;
    }
    tag = tag * 128 + bytes[position] - 128;
    position++;
  }
  let length = 0;
  if (bytes[position] < 128) {
    length = bytes[position];
    position++;
  } else if (length === 128) {
    length = 0;
    while (bytes[position + length] !== 0 || bytes[position + length + 1] !== 0) {
      if (length > bytes.byteLength) {
        throw new TypeError("invalid indefinite form length");
      }
      length++;
    }
    const byteLength2 = position + length + 2;
    return {
      byteLength: byteLength2,
      contents: bytes.subarray(position, position + length),
      raw: bytes.subarray(0, byteLength2)
    };
  } else {
    const numberOfDigits = bytes[position] & 127;
    position++;
    length = 0;
    for (let i = 0; i < numberOfDigits; i++) {
      length = length * 256 + bytes[position];
      position++;
    }
  }
  const byteLength = position + length;
  return {
    byteLength,
    contents: bytes.subarray(position, byteLength),
    raw: bytes.subarray(0, byteLength)
  };
}
__name(parseElement, "parseElement");
async function spkiFromX509(buf) {
  const tbsCertificate = getElement(getElement(parseElement(buf).contents)[0].contents);
  const spki = tbsCertificate[tbsCertificate[0].raw[0] === 160 ? 6 : 5].raw;
  return await crypto.subtle.importKey("spki", spki, {
    name: "RSASSA-PKCS1-v1_5",
    hash: "SHA-256"
  }, true, ["verify"]);
}
__name(spkiFromX509, "spkiFromX509");
async function jwkFromX509(kid, x509) {
  const pem = x509.replace(/(?:-----(?:BEGIN|END) CERTIFICATE-----|\s)/g, "");
  const raw = decodeBase64(pem);
  const spki = await spkiFromX509(raw);
  const { kty, alg, n, e } = await crypto.subtle.exportKey("jwk", spki);
  return {
    kid,
    use: "sig",
    kty,
    alg,
    n,
    e
  };
}
__name(jwkFromX509, "jwkFromX509");

// node_modules/firebase-auth-cloudflare-workers/dist/module/jwk-fetcher.js
var isJWKMetadata = /* @__PURE__ */ __name((value) => {
  if (!isNonNullObject(value) || !value.keys) {
    return false;
  }
  const keys = value.keys;
  if (!Array.isArray(keys)) {
    return false;
  }
  const filtered = keys.filter((key) => isObject(key) && !!key.kid && typeof key.kid === "string");
  return keys.length === filtered.length;
}, "isJWKMetadata");
var isX509Certificates = /* @__PURE__ */ __name((value) => {
  if (!isNonNullObject(value)) {
    return false;
  }
  const values = Object.values(value);
  if (values.length === 0) {
    return false;
  }
  for (const v of values) {
    if (typeof v !== "string" || v === "") {
      return false;
    }
  }
  return true;
}, "isX509Certificates");
var UrlKeyFetcher = class {
  static {
    __name(this, "UrlKeyFetcher");
  }
  fetcher;
  keyStorer;
  constructor(fetcher, keyStorer) {
    this.fetcher = fetcher;
    this.keyStorer = keyStorer;
  }
  /**
   * Fetches the public keys for the Google certs.
   *
   * @returns A promise fulfilled with public keys for the Google certs.
   */
  async fetchPublicKeys() {
    const publicKeys = await this.keyStorer.get();
    if (publicKeys === null || typeof publicKeys !== "object") {
      return await this.refresh();
    }
    return publicKeys;
  }
  async refresh() {
    const resp = await this.fetcher.fetch();
    if (!resp.ok) {
      const errorMessage = "Error fetching public keys for Google certs: ";
      const text = await resp.text();
      throw new Error(errorMessage + text);
    }
    const json = await resp.json();
    const publicKeys = await this.retrievePublicKeys(json);
    const cacheControlHeader = resp.headers.get("cache-control");
    const maxAge = parseMaxAge(cacheControlHeader);
    if (!isNaN(maxAge) && maxAge > 0) {
      await this.keyStorer.put(JSON.stringify(publicKeys), maxAge);
    }
    return publicKeys;
  }
  async retrievePublicKeys(json) {
    if (isX509Certificates(json)) {
      const jwks = [];
      for (const [kid, x509] of Object.entries(json)) {
        jwks.push(await jwkFromX509(kid, x509));
      }
      return jwks;
    }
    if (!isJWKMetadata(json)) {
      throw new Error(`The public keys are not an object or null: "${json}`);
    }
    return json.keys;
  }
};
var parseMaxAge = /* @__PURE__ */ __name((cacheControlHeader) => {
  if (cacheControlHeader === null) {
    return NaN;
  }
  const parts = cacheControlHeader.split(",");
  for (const part of parts) {
    const subParts = part.trim().split("=");
    if (subParts[0] !== "max-age") {
      continue;
    }
    return Number(subParts[1]);
  }
  return NaN;
}, "parseMaxAge");
var HTTPFetcher = class {
  static {
    __name(this, "HTTPFetcher");
  }
  clientCertUrl;
  constructor(clientCertUrl) {
    this.clientCertUrl = clientCertUrl;
    if (!isURL(clientCertUrl)) {
      throw new Error("The provided public client certificate URL is not a valid URL.");
    }
  }
  fetch() {
    return fetch(this.clientCertUrl);
  }
};

// node_modules/firebase-auth-cloudflare-workers/dist/module/jws-verifier.js
var rs256alg = {
  name: "RSASSA-PKCS1-v1_5",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256"
};
var PublicKeySignatureVerifier = class _PublicKeySignatureVerifier {
  static {
    __name(this, "PublicKeySignatureVerifier");
  }
  keyFetcher;
  constructor(keyFetcher) {
    this.keyFetcher = keyFetcher;
    if (!isNonNullObject(keyFetcher)) {
      throw new Error("The provided key fetcher is not an object or null.");
    }
  }
  static withCertificateUrl(clientCertUrl, keyStorer) {
    const fetcher = new HTTPFetcher(clientCertUrl);
    return new _PublicKeySignatureVerifier(new UrlKeyFetcher(fetcher, keyStorer));
  }
  /**
   * Verifies the signature of a JWT using the provided secret or a function to fetch
   * the public key.
   *
   * @param token - The JWT to be verified.
   * @throws If the JWT is not a valid RS256 token.
   * @returns A Promise resolving for a token with a valid signature.
   */
  async verify(token) {
    const { header } = token.decodedToken;
    const publicKeys = await this.fetchPublicKeys();
    for (const publicKey of publicKeys) {
      if (publicKey.kid !== header.kid) {
        continue;
      }
      const verified = await this.verifySignature(token, publicKey);
      if (verified) {
        return;
      }
      throw new JwtError(JwtErrorCode.INVALID_SIGNATURE, "The token signature is invalid.");
    }
    throw new JwtError(JwtErrorCode.NO_MATCHING_KID, "The token does not match the kid.");
  }
  async verifySignature(token, publicJWK) {
    try {
      const key = await crypto.subtle.importKey("jwk", publicJWK, rs256alg, false, ["verify"]);
      return await crypto.subtle.verify(rs256alg, key, token.decodedToken.signature, token.getHeaderPayloadBytes());
    } catch (err) {
      throw new JwtError(JwtErrorCode.INVALID_SIGNATURE, `Error verifying signature: ${err}`);
    }
  }
  async fetchPublicKeys() {
    try {
      return await this.keyFetcher.fetchPublicKeys();
    } catch (err) {
      throw new JwtError(JwtErrorCode.KEY_FETCH_ERROR, `Error fetching public keys for Google certs: ${err}`);
    }
  }
};
var EmulatorSignatureVerifier = class {
  static {
    __name(this, "EmulatorSignatureVerifier");
  }
  async verify() {
  }
};

// node_modules/firebase-auth-cloudflare-workers/dist/module/jwt-decoder.js
var RS256Token = class _RS256Token {
  static {
    __name(this, "RS256Token");
  }
  rawToken;
  decodedToken;
  constructor(rawToken, decodedToken) {
    this.rawToken = rawToken;
    this.decodedToken = decodedToken;
  }
  /**
   *
   * @param token - The JWT to verify.
   * @param currentTimestamp - Current timestamp in seconds since the Unix epoch.
   * @param skipVerifyHeader - skip verification header content if true.
   * @throw Error if the token is invalid.
   * @returns
   */
  static decode(token, currentTimestamp, skipVerifyHeader = false) {
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      throw new JwtError(JwtErrorCode.INVALID_ARGUMENT, "token must consist of 3 parts");
    }
    const header = decodeHeader(tokenParts[0], skipVerifyHeader);
    const payload = decodePayload(tokenParts[1], currentTimestamp);
    return new _RS256Token(token, {
      header,
      payload,
      signature: decodeBase64Url(tokenParts[2])
    });
  }
  getHeaderPayloadBytes() {
    const rawToken = this.rawToken;
    const trimmedSignature = rawToken.substring(0, rawToken.lastIndexOf("."));
    return utf8Encoder.encode(trimmedSignature);
  }
};
var decodeHeader = /* @__PURE__ */ __name((headerPart, skipVerifyHeader) => {
  const header = decodeBase64JSON(headerPart);
  if (skipVerifyHeader) {
    return header;
  }
  const kid = header.kid;
  if (!isString(kid)) {
    throw new JwtError(JwtErrorCode.NO_KID_IN_HEADER, `kid must be a string but got ${kid}`);
  }
  const alg = header.alg;
  if (isString(alg) && alg !== "RS256") {
    throw new JwtError(JwtErrorCode.INVALID_ARGUMENT, `algorithm must be RS256 but got ${alg}`);
  }
  return header;
}, "decodeHeader");
var decodePayload = /* @__PURE__ */ __name((payloadPart, currentTimestamp) => {
  const payload = decodeBase64JSON(payloadPart);
  if (!isNonEmptyString(payload.aud)) {
    throw new JwtError(JwtErrorCode.INVALID_ARGUMENT, `"aud" claim must be a string but got "${payload.aud}"`);
  }
  if (!isNonEmptyString(payload.sub)) {
    throw new JwtError(JwtErrorCode.INVALID_ARGUMENT, `"sub" claim must be a string but got "${payload.sub}"`);
  }
  if (!isNonEmptyString(payload.iss)) {
    throw new JwtError(JwtErrorCode.INVALID_ARGUMENT, `"iss" claim must be a string but got "${payload.iss}"`);
  }
  if (!isNumber(payload.iat)) {
    throw new JwtError(JwtErrorCode.INVALID_ARGUMENT, `"iat" claim must be a number but got "${payload.iat}"`);
  }
  if (currentTimestamp < payload.iat) {
    throw new JwtError(JwtErrorCode.INVALID_ARGUMENT, `Incorrect "iat" claim must be a older than "${currentTimestamp}" (iat: "${payload.iat}")`);
  }
  if (!isNumber(payload.exp)) {
    throw new JwtError(JwtErrorCode.INVALID_ARGUMENT, `"exp" claim must be a number but got "${payload.exp}"`);
  }
  if (currentTimestamp > payload.exp) {
    throw new JwtError(JwtErrorCode.TOKEN_EXPIRED, `Incorrect "exp" (expiration time) claim must be a newer than "${currentTimestamp}" (exp: "${payload.exp}")`);
  }
  return payload;
}, "decodePayload");
var decodeBase64JSON = /* @__PURE__ */ __name((b64Url) => {
  const decoded = decodeBase64Url(b64Url);
  try {
    return JSON.parse(utf8Decoder.decode(decoded));
  } catch {
    return null;
  }
}, "decodeBase64JSON");

// node_modules/firebase-auth-cloudflare-workers/dist/module/token-verifier.js
var FIREBASE_AUDIENCE = "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";
var EMULATOR_VERIFIER = new EmulatorSignatureVerifier();
var makeExpectedbutGotMsg = /* @__PURE__ */ __name((want, got) => `Expected "${want}" but got "${got}".`, "makeExpectedbutGotMsg");
var FirebaseTokenVerifier = class {
  static {
    __name(this, "FirebaseTokenVerifier");
  }
  signatureVerifier;
  projectId;
  issuer;
  tokenInfo;
  shortNameArticle;
  constructor(signatureVerifier, projectId, issuer, tokenInfo) {
    this.signatureVerifier = signatureVerifier;
    this.projectId = projectId;
    this.issuer = issuer;
    this.tokenInfo = tokenInfo;
    if (!isNonEmptyString(projectId)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, "Your Firebase project ID must be a non-empty string");
    } else if (!isURL(issuer)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, "The provided JWT issuer is an invalid URL.");
    } else if (!isNonNullObject(tokenInfo)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, "The provided JWT information is not an object or null.");
    } else if (!isURL(tokenInfo.url)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, "The provided JWT verification documentation URL is invalid.");
    } else if (!isNonEmptyString(tokenInfo.verifyApiName)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, "The JWT verify API name must be a non-empty string.");
    } else if (!isNonEmptyString(tokenInfo.jwtName)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, "The JWT public full name must be a non-empty string.");
    } else if (!isNonEmptyString(tokenInfo.shortName)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, "The JWT public short name must be a non-empty string.");
    } else if (!isNonNullObject(tokenInfo.expiredErrorCode) || !("code" in tokenInfo.expiredErrorCode)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, "The JWT expiration error code must be a non-null ErrorInfo object.");
    }
    this.shortNameArticle = tokenInfo.shortName.charAt(0).match(/[aeiou]/i) ? "an" : "a";
  }
  /**
   * Verifies the format and signature of a Firebase Auth JWT token.
   *
   * @param jwtToken - The Firebase Auth JWT token to verify.
   * @param isEmulator - Whether to accept Auth Emulator tokens.
   * @param clockSkewSeconds - The number of seconds to tolerate when checking the token's iat. Must be between 0-60, and an integer. Defualts to 0.
   * @returns A promise fulfilled with the decoded claims of the Firebase Auth ID token.
   */
  verifyJWT(jwtToken, isEmulator = false, clockSkewSeconds = 5) {
    if (!isString(jwtToken)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, `First argument to ${this.tokenInfo.verifyApiName} must be a ${this.tokenInfo.jwtName} string.`);
    }
    if (clockSkewSeconds < 0 || clockSkewSeconds > 60 || !Number.isInteger(clockSkewSeconds)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, "clockSkewSeconds must be an integer between 0 and 60.");
    }
    return this.decodeAndVerify(jwtToken, isEmulator, clockSkewSeconds).then((payload) => {
      payload.uid = payload.sub;
      return payload;
    });
  }
  async decodeAndVerify(token, isEmulator, clockSkewSeconds = 5) {
    const currentTimestamp = Math.floor(Date.now() / 1e3) + clockSkewSeconds;
    try {
      const rs256Token = this.safeDecode(token, isEmulator, currentTimestamp);
      const { payload } = rs256Token.decodedToken;
      this.verifyPayload(payload, currentTimestamp);
      await this.verifySignature(rs256Token, isEmulator);
      return payload;
    } catch (err) {
      if (err instanceof JwtError) {
        throw this.mapJwtErrorToAuthError(err);
      }
      throw err;
    }
  }
  safeDecode(jwtToken, isEmulator, currentTimestamp) {
    try {
      return RS256Token.decode(jwtToken, currentTimestamp, isEmulator);
    } catch (err) {
      const verifyJwtTokenDocsMessage = ` See ${this.tokenInfo.url} for details on how to retrieve ${this.shortNameArticle} ${this.tokenInfo.shortName}.`;
      const errorMessage = `Decoding ${this.tokenInfo.jwtName} failed. Make sure you passed the entire string JWT which represents ${this.shortNameArticle} ${this.tokenInfo.shortName}.` + verifyJwtTokenDocsMessage;
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, errorMessage + ` err: ${err}`);
    }
  }
  verifyPayload(tokenPayload, currentTimestamp) {
    const payload = tokenPayload;
    const projectIdMatchMessage = ` Make sure the ${this.tokenInfo.shortName} comes from the same Firebase project as the service account used to authenticate this SDK.`;
    const verifyJwtTokenDocsMessage = ` See ${this.tokenInfo.url} for details on how to retrieve ${this.shortNameArticle} ${this.tokenInfo.shortName}.`;
    const createInvalidArgument = /* @__PURE__ */ __name((errorMessage) => new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, errorMessage), "createInvalidArgument");
    if (payload.aud !== this.projectId && payload.aud !== FIREBASE_AUDIENCE) {
      throw createInvalidArgument(`${this.tokenInfo.jwtName} has incorrect "aud" (audience) claim. ` + makeExpectedbutGotMsg(this.projectId, payload.aud) + projectIdMatchMessage + verifyJwtTokenDocsMessage);
    }
    if (payload.iss !== this.issuer + this.projectId) {
      throw createInvalidArgument(`${this.tokenInfo.jwtName} has incorrect "iss" (issuer) claim. ` + makeExpectedbutGotMsg(this.issuer, payload.iss) + projectIdMatchMessage + verifyJwtTokenDocsMessage);
    }
    if (payload.sub.length > 128) {
      throw createInvalidArgument(`${this.tokenInfo.jwtName} has "sub" (subject) claim longer than 128 characters.` + verifyJwtTokenDocsMessage);
    }
    if (typeof payload.auth_time !== "number") {
      throw createInvalidArgument(`${this.tokenInfo.jwtName} has no "auth_time" claim. ` + verifyJwtTokenDocsMessage);
    }
    if (currentTimestamp < payload.auth_time) {
      throw createInvalidArgument(`${this.tokenInfo.jwtName} has incorrect "auth_time" claim. ` + verifyJwtTokenDocsMessage);
    }
  }
  async verifySignature(token, isEmulator) {
    const verifier = isEmulator ? EMULATOR_VERIFIER : this.signatureVerifier;
    return await verifier.verify(token);
  }
  /**
   * Maps JwtError to FirebaseAuthError
   *
   * @param error - JwtError to be mapped.
   * @returns FirebaseAuthError or Error instance.
   */
  mapJwtErrorToAuthError(error) {
    const verifyJwtTokenDocsMessage = ` See ${this.tokenInfo.url} for details on how to retrieve ${this.shortNameArticle} ${this.tokenInfo.shortName}.`;
    if (error.code === JwtErrorCode.TOKEN_EXPIRED) {
      const errorMessage = `${this.tokenInfo.jwtName} has expired. Get a fresh ${this.tokenInfo.shortName} from your client app and try again (auth/${this.tokenInfo.expiredErrorCode.code}).` + verifyJwtTokenDocsMessage;
      return new FirebaseAuthError(this.tokenInfo.expiredErrorCode, errorMessage);
    } else if (error.code === JwtErrorCode.INVALID_SIGNATURE) {
      const errorMessage = `${this.tokenInfo.jwtName} has invalid signature.` + verifyJwtTokenDocsMessage;
      return new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, errorMessage);
    } else if (error.code === JwtErrorCode.NO_MATCHING_KID) {
      const errorMessage = `${this.tokenInfo.jwtName} has "kid" claim which does not correspond to a known public key. Most likely the ${this.tokenInfo.shortName} is expired, so get a fresh token from your client app and try again.`;
      return new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, errorMessage);
    }
    return new FirebaseAuthError(AuthClientErrorCode.INVALID_ARGUMENT, error.message);
  }
};
var CLIENT_JWK_URL = "https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com";
var ID_TOKEN_INFO = {
  url: "https://firebase.google.com/docs/auth/admin/verify-id-tokens",
  verifyApiName: "verifyIdToken()",
  jwtName: "Firebase ID token",
  shortName: "ID token",
  expiredErrorCode: AuthClientErrorCode.ID_TOKEN_EXPIRED
};
function createIdTokenVerifier(projectID, keyStorer) {
  const signatureVerifier = PublicKeySignatureVerifier.withCertificateUrl(CLIENT_JWK_URL, keyStorer);
  return baseCreateIdTokenVerifier(signatureVerifier, projectID);
}
__name(createIdTokenVerifier, "createIdTokenVerifier");
function baseCreateIdTokenVerifier(signatureVerifier, projectID) {
  return new FirebaseTokenVerifier(signatureVerifier, projectID, "https://securetoken.google.com/", ID_TOKEN_INFO);
}
__name(baseCreateIdTokenVerifier, "baseCreateIdTokenVerifier");
var SESSION_COOKIE_CERT_URL = "https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys";
var SESSION_COOKIE_INFO = {
  url: "https://firebase.google.com/docs/auth/admin/manage-cookies",
  verifyApiName: "verifySessionCookie()",
  jwtName: "Firebase session cookie",
  shortName: "session cookie",
  expiredErrorCode: AuthClientErrorCode.SESSION_COOKIE_EXPIRED
};
function createSessionCookieVerifier(projectID, keyStorer) {
  const signatureVerifier = PublicKeySignatureVerifier.withCertificateUrl(SESSION_COOKIE_CERT_URL, keyStorer);
  return baseCreateSessionCookieVerifier(signatureVerifier, projectID);
}
__name(createSessionCookieVerifier, "createSessionCookieVerifier");
function baseCreateSessionCookieVerifier(signatureVerifier, projectID) {
  return new FirebaseTokenVerifier(signatureVerifier, projectID, "https://session.firebase.google.com/", SESSION_COOKIE_INFO);
}
__name(baseCreateSessionCookieVerifier, "baseCreateSessionCookieVerifier");

// node_modules/firebase-auth-cloudflare-workers/dist/module/auth.js
var BaseAuth = class {
  static {
    __name(this, "BaseAuth");
  }
  /** @internal */
  idTokenVerifier;
  sessionCookieVerifier;
  _authApiClient;
  constructor(projectId, keyStore, credential) {
    this.idTokenVerifier = createIdTokenVerifier(projectId, keyStore);
    this.sessionCookieVerifier = createSessionCookieVerifier(projectId, keyStore);
    if (credential) {
      this._authApiClient = new AuthApiClient(projectId, credential);
    }
  }
  get authApiClient() {
    if (this._authApiClient) {
      return this._authApiClient;
    }
    throw new FirebaseAppError(AppErrorCodes.INVALID_CREDENTIAL, "Service account must be required in initialization.");
  }
  /**
   * Verifies a Firebase ID token (JWT). If the token is valid, the promise is
   * fulfilled with the token's decoded claims; otherwise, the promise is
   * rejected.
   *
   * If `checkRevoked` is set to true, first verifies whether the corresponding
   * user is disabled. If yes, an `auth/user-disabled` error is thrown. If no,
   * verifies if the session corresponding to the ID token was revoked. If the
   * corresponding user's session was invalidated, an `auth/id-token-revoked`
   * error is thrown. If not specified the check is not applied.
   *
   * See {@link https://firebase.google.com/docs/auth/admin/verify-id-tokens | Verify ID Tokens}
   * for code samples and detailed documentation.
   *
   * @param idToken - The ID token to verify.
   * @param checkRevoked - Whether to check if the ID token was revoked.
   *   This requires an extra request to the Firebase Auth backend to check
   *   the `tokensValidAfterTime` time for the corresponding user.
   *   When not specified, this additional check is not applied.
   * @param env - An optional parameter specifying the environment in which the function is running.
   *   If the function is running in an emulator environment, this should be set to `EmulatorEnv`.
   *   If not specified, the function will assume it is running in a production environment.
   * @param clockSkewSeconds - The number of seconds to tolerate when checking the `iat`.
   *   This is to deal with small clock differences among different servers.
   * @returns A promise fulfilled with the
   *   token's decoded claims if the ID token is valid; otherwise, a rejected
   *   promise.
   */
  async verifyIdToken(idToken, checkRevoked = false, env, clockSkewSeconds) {
    const isEmulator = useEmulator(env);
    const decodedIdToken = await this.idTokenVerifier.verifyJWT(idToken, isEmulator, clockSkewSeconds);
    if (checkRevoked) {
      return await this.verifyDecodedJWTNotRevokedOrDisabled(decodedIdToken, AuthClientErrorCode.ID_TOKEN_REVOKED, env);
    }
    return decodedIdToken;
  }
  /**
   * Creates a new Firebase session cookie with the specified options. The created
   * JWT string can be set as a server-side session cookie with a custom cookie
   * policy, and be used for session management. The session cookie JWT will have
   * the same payload claims as the provided ID token.
   *
   * See {@link https://firebase.google.com/docs/auth/admin/manage-cookies | Manage Session Cookies}
   * for code samples and detailed documentation.
   *
   * @param idToken - The Firebase ID token to exchange for a session
   *   cookie.
   * @param sessionCookieOptions - The session
   *   cookie options which includes custom session duration.
   * @param env - An optional parameter specifying the environment in which the function is running.
   *   If the function is running in an emulator environment, this should be set to `EmulatorEnv`.
   *   If not specified, the function will assume it is running in a production environment.
   *
   * @returns A promise that resolves on success with the
   *   created session cookie.
   */
  async createSessionCookie(idToken, sessionCookieOptions, env) {
    if (!isNonNullObject(sessionCookieOptions) || !isNumber(sessionCookieOptions.expiresIn)) {
      throw new FirebaseAuthError(AuthClientErrorCode.INVALID_SESSION_COOKIE_DURATION);
    }
    return await this.authApiClient.createSessionCookie(idToken, sessionCookieOptions.expiresIn, env);
  }
  /**
   * Verifies a Firebase session cookie. Returns a Promise with the cookie claims.
   * Rejects the promise if the cookie could not be verified.
   *
   * If `checkRevoked` is set to true, first verifies whether the corresponding
   * user is disabled: If yes, an `auth/user-disabled` error is thrown. If no,
   * verifies if the session corresponding to the session cookie was revoked.
   * If the corresponding user's session was invalidated, an
   * `auth/session-cookie-revoked` error is thrown. If not specified the check
   * is not performed.
   *
   * See {@link https://firebase.google.com/docs/auth/admin/manage-cookies#verify_session_cookie_and_check_permissions |
   * Verify Session Cookies}
   * for code samples and detailed documentation
   *
   * @param sessionCookie - The session cookie to verify.
   * @param checkRevoked -  Whether to check if the session cookie was
   *   revoked. This requires an extra request to the Firebase Auth backend to
   *   check the `tokensValidAfterTime` time for the corresponding user.
   *   When not specified, this additional check is not performed.
   * @param env - An optional parameter specifying the environment in which the function is running.
   *   If the function is running in an emulator environment, this should be set to `EmulatorEnv`.
   *   If not specified, the function will assume it is running in a production environment.
   *
   * @returns A promise fulfilled with the
   *   session cookie's decoded claims if the session cookie is valid; otherwise,
   *   a rejected promise.
   */
  async verifySessionCookie(sessionCookie, checkRevoked = false, env) {
    const isEmulator = useEmulator(env);
    const decodedIdToken = await this.sessionCookieVerifier.verifyJWT(sessionCookie, isEmulator);
    if (checkRevoked) {
      return await this.verifyDecodedJWTNotRevokedOrDisabled(decodedIdToken, AuthClientErrorCode.SESSION_COOKIE_REVOKED, env);
    }
    return decodedIdToken;
  }
  /**
   * Gets the user data for the user corresponding to a given `uid`.
   *
   * See {@link https://firebase.google.com/docs/auth/admin/manage-users#retrieve_user_data | Retrieve user data}
   * for code samples and detailed documentation.
   *
   * @param uid - The `uid` corresponding to the user whose data to fetch.
   * @param env - An optional parameter specifying the environment in which the function is running.
   *   If the function is running in an emulator environment, this should be set to `EmulatorEnv`.
   *   If not specified, the function will assume it is running in a production environment.
   *
   * @returns A promise fulfilled with the user
   *   data corresponding to the provided `uid`.
   */
  async getUser(uid, env) {
    return await this.authApiClient.getAccountInfoByUid(uid, env);
  }
  /**
   * Revokes all refresh tokens for an existing user.
   *
   * This API will update the user's {@link UserRecord.tokensValidAfterTime} to
   * the current UTC. It is important that the server on which this is called has
   * its clock set correctly and synchronized.
   *
   * While this will revoke all sessions for a specified user and disable any
   * new ID tokens for existing sessions from getting minted, existing ID tokens
   * may remain active until their natural expiration (one hour). To verify that
   * ID tokens are revoked, use {@link BaseAuth.verifyIdToken}
   * where `checkRevoked` is set to true.
   *
   * @param uid - The `uid` corresponding to the user whose refresh tokens
   *   are to be revoked.
   * @param env - An optional parameter specifying the environment in which the function is running.
   *   If the function is running in an emulator environment, this should be set to `EmulatorEnv`.
   *   If not specified, the function will assume it is running in a production environment.
   *
   * @returns An empty promise fulfilled once the user's refresh
   *   tokens have been revoked.
   */
  async revokeRefreshTokens(uid, env) {
    await this.authApiClient.revokeRefreshTokens(uid, env);
  }
  /**
   * Sets additional developer claims on an existing user identified by the
   * provided `uid`, typically used to define user roles and levels of
   * access. These claims should propagate to all devices where the user is
   * already signed in (after token expiration or when token refresh is forced)
   * and the next time the user signs in. If a reserved OIDC claim name
   * is used (sub, iat, iss, etc), an error is thrown. They are set on the
   * authenticated user's ID token JWT.
   *
   * See {@link https://firebase.google.com/docs/auth/admin/custom-claims |
   * Defining user roles and access levels}
   * for code samples and detailed documentation.
   *
   * @param uid - The `uid` of the user to edit.
   * @param customUserClaims - The developer claims to set. If null is
   *   passed, existing custom claims are deleted. Passing a custom claims payload
   *   larger than 1000 bytes will throw an error. Custom claims are added to the
   *   user's ID token which is transmitted on every authenticated request.
   *   For profile non-access related user attributes, use database or other
   *   separate storage systems.
   * @param env - An optional parameter specifying the environment in which the function is running.
   *   If the function is running in an emulator environment, this should be set to `EmulatorEnv`.
   *   If not specified, the function will assume it is running in a production environment.
   * @returns A promise that resolves when the operation completes
   *   successfully.
   */
  async setCustomUserClaims(uid, customUserClaims, env) {
    await this.authApiClient.setCustomUserClaims(uid, customUserClaims, env);
  }
  /**
   * Verifies the decoded Firebase issued JWT is not revoked or disabled. Returns a promise that
   * resolves with the decoded claims on success. Rejects the promise with revocation error if revoked
   * or user disabled.
   *
   * @param decodedIdToken - The JWT's decoded claims.
   * @param revocationErrorInfo - The revocation error info to throw on revocation
   *     detection.
   * @returns A promise that will be fulfilled after a successful verification.
   */
  async verifyDecodedJWTNotRevokedOrDisabled(decodedIdToken, revocationErrorInfo, env) {
    const user = await this.getUser(decodedIdToken.sub, env);
    if (user.disabled) {
      throw new FirebaseAuthError(AuthClientErrorCode.USER_DISABLED, "The user record is disabled.");
    }
    if (user.tokensValidAfterTime) {
      const authTimeUtc = decodedIdToken.auth_time * 1e3;
      const validSinceUtc = new Date(user.tokensValidAfterTime).getTime();
      if (authTimeUtc < validSinceUtc) {
        throw new FirebaseAuthError(revocationErrorInfo);
      }
    }
    return decodedIdToken;
  }
};

// node_modules/firebase-auth-cloudflare-workers/dist/module/index.js
var Auth = class _Auth extends BaseAuth {
  static {
    __name(this, "Auth");
  }
  static instance;
  static withCredential;
  constructor(projectId, keyStore, credential) {
    super(projectId, keyStore, credential);
  }
  static getOrInitialize(projectId, keyStore, credential) {
    if (!_Auth.withCredential && credential !== void 0) {
      _Auth.withCredential = new _Auth(projectId, keyStore, credential);
    }
    if (_Auth.withCredential) {
      return _Auth.withCredential;
    }
    if (!_Auth.instance) {
      _Auth.instance = new _Auth(projectId, keyStore);
    }
    return _Auth.instance;
  }
};

// src/middleware/auth.js
function getFirebaseAuth(env) {
  if (!env.FIREBASE_PROJECT_ID) {
    throw new Error("FIREBASE_PROJECT_ID not configured");
  }
  return Auth.getOrInitialize(
    env.FIREBASE_PROJECT_ID,
    env.FIREBASE_KEYS || env.KVDB
    // Use dedicated KV for keys or fallback to main KV
  );
}
__name(getFirebaseAuth, "getFirebaseAuth");
async function verifyIdToken(idToken, env) {
  try {
    const auth = getFirebaseAuth(env);
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (err) {
    console.error("Token verification error:", err);
    return null;
  }
}
__name(verifyIdToken, "verifyIdToken");
async function requireAuth(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: unauthorizedResponse("Missing or invalid Authorization header"),
      user: null
    };
  }
  const idToken = authHeader.slice(7);
  try {
    const decodedToken = await verifyIdToken(idToken, env);
    if (!decodedToken) {
      return {
        error: unauthorizedResponse("Invalid token"),
        user: null
      };
    }
    return {
      error: null,
      user: {
        userId: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture
      }
    };
  } catch (err) {
    console.error("Auth verification error:", err);
    return {
      error: unauthorizedResponse("Authentication failed"),
      user: null
    };
  }
}
__name(requireAuth, "requireAuth");

// src/services/firestore.js
var FIRESTORE_API_BASE = "https://firestore.googleapis.com/v1";
var FirestoreClient = class {
  static {
    __name(this, "FirestoreClient");
  }
  constructor(projectId, apiKey) {
    this.projectId = projectId;
    this.apiKey = apiKey;
    this.baseUrl = `${FIRESTORE_API_BASE}/projects/${projectId}/databases/(default)/documents`;
  }
  /**
   * Convert JS object to Firestore fields format
   */
  toFirestoreFields(obj) {
    const fields = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === void 0) continue;
      if (typeof value === "string") {
        fields[key] = { stringValue: value };
      } else if (typeof value === "number") {
        if (Number.isInteger(value)) {
          fields[key] = { integerValue: value };
        } else {
          fields[key] = { doubleValue: value };
        }
      } else if (typeof value === "boolean") {
        fields[key] = { booleanValue: value };
      } else if (value instanceof Date) {
        fields[key] = { timestampValue: value.toISOString() };
      } else if (Array.isArray(value)) {
        fields[key] = {
          arrayValue: {
            values: value.map((v) => this.toFirestoreFields({ v }).v)
          }
        };
      } else if (typeof value === "object") {
        fields[key] = {
          mapValue: {
            fields: this.toFirestoreFields(value)
          }
        };
      }
    }
    return fields;
  }
  /**
   * Convert Firestore fields to JS object
   */
  fromFirestoreFields(fields) {
    if (!fields) return {};
    const obj = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value.stringValue !== void 0) {
        obj[key] = value.stringValue;
      } else if (value.integerValue !== void 0) {
        obj[key] = parseInt(value.integerValue);
      } else if (value.doubleValue !== void 0) {
        obj[key] = value.doubleValue;
      } else if (value.booleanValue !== void 0) {
        obj[key] = value.booleanValue;
      } else if (value.timestampValue !== void 0) {
        obj[key] = value.timestampValue;
      } else if (value.arrayValue !== void 0) {
        obj[key] = (value.arrayValue.values || []).map(
          (v) => this.fromFirestoreFields({ temp: v }).temp
        );
      } else if (value.mapValue !== void 0) {
        obj[key] = this.fromFirestoreFields(value.mapValue.fields);
      }
    }
    return obj;
  }
  /**
   * Extract document ID from full path
   */
  extractDocId(path) {
    const parts = path.split("/");
    return parts[parts.length - 1];
  }
  /**
   * Create a document
   */
  async createDocument(collection, data) {
    const url = `${this.baseUrl}/${collection}?key=${this.apiKey}`;
    const fields = this.toFirestoreFields(data);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields })
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Firestore create error: ${res.status} - ${error}`);
      }
      const doc = await res.json();
      return {
        id: this.extractDocId(doc.name),
        ...this.fromFirestoreFields(doc.fields)
      };
    } catch (err) {
      console.error("createDocument error:", err);
      throw err;
    }
  }
  /**
   * Get a document by ID
   */
  async getDocument(collection, docId) {
    const url = `${this.baseUrl}/${collection}/${docId}?key=${this.apiKey}`;
    try {
      const res = await fetch(url);
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Firestore get error: ${res.status} - ${error}`);
      }
      const doc = await res.json();
      return {
        id: docId,
        ...this.fromFirestoreFields(doc.fields)
      };
    } catch (err) {
      console.error("getDocument error:", err);
      throw err;
    }
  }
  /**
   * Update a document
   */
  async updateDocument(collection, docId, data) {
    const url = `${this.baseUrl}/${collection}/${docId}?key=${this.apiKey}`;
    const fields = this.toFirestoreFields(data);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields })
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Firestore update error: ${res.status} - ${error}`);
      }
      const doc = await res.json();
      return {
        id: docId,
        ...this.fromFirestoreFields(doc.fields)
      };
    } catch (err) {
      console.error("updateDocument error:", err);
      throw err;
    }
  }
  /**
   * Delete a document
   */
  async deleteDocument(collection, docId) {
    const url = `${this.baseUrl}/${collection}/${docId}?key=${this.apiKey}`;
    try {
      const res = await fetch(url, {
        method: "DELETE"
      });
      if (!res.ok && res.status !== 404) {
        const error = await res.text();
        throw new Error(`Firestore delete error: ${res.status} - ${error}`);
      }
      return true;
    } catch (err) {
      console.error("deleteDocument error:", err);
      throw err;
    }
  }
  /**
   * Query documents (simplified - filter by one field)
   */
  async queryDocuments(collection, filters = {}) {
    const url = `${this.baseUrl}:runQuery?key=${this.apiKey}`;
    const query = {
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {}
      }
    };
    if (Object.keys(filters).length > 0) {
      const fieldFilters = [];
      for (const [field, value] of Object.entries(filters)) {
        const firestoreValue = this.toFirestoreFields({ value }).value;
        fieldFilters.push({
          fieldFilter: {
            field: { fieldPath: field },
            op: "EQUAL",
            value: firestoreValue
          }
        });
      }
      if (fieldFilters.length === 1) {
        query.structuredQuery.where = fieldFilters[0];
      } else if (fieldFilters.length > 1) {
        query.structuredQuery.where = {
          compositeFilter: {
            op: "AND",
            filters: fieldFilters
          }
        };
      }
    }
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query)
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Firestore query error: ${res.status} - ${error}`);
      }
      const results = await res.json();
      if (!results || results.length === 0) {
        return [];
      }
      return results.filter((r) => r.document).map((r) => ({
        id: this.extractDocId(r.document.name),
        ...this.fromFirestoreFields(r.document.fields)
      }));
    } catch (err) {
      console.error("queryDocuments error:", err);
      throw err;
    }
  }
};

// src/routes/userTournaments.js
function getFirestore(env) {
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_API_KEY) {
    throw new Error("Firebase not configured");
  }
  return new FirestoreClient(env.FIREBASE_PROJECT_ID, env.FIREBASE_API_KEY);
}
__name(getFirestore, "getFirestore");
async function handleCreateUserTournament(request, env, ctx) {
  const { error, user } = await requireAuth(request, env);
  if (error) return error;
  try {
    const body = await request.json();
    if (!body.game || !body.name || !body.format || !body.date) {
      return badRequestResponse("Missing required fields: game, name, format, date");
    }
    const firestore = getFirestore(env);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const tournament = await firestore.createDocument("user_tournaments", {
      userId: user.userId,
      game: body.game,
      name: body.name,
      format: body.format,
      date: body.date,
      location: body.location || null,
      imageUrl: body.imageUrl || null,
      deckName: body.deckName || null,
      deckImageUrl: body.deckImageUrl || null,
      decklistUrl: body.decklistUrl || null,
      notes: body.notes || null,
      createdAt: now,
      updatedAt: now
    });
    return jsonResponse(tournament, { status: 201 });
  } catch (err) {
    console.error("handleCreateUserTournament error:", err);
    return errorResponse("Failed to create tournament", 500, err.message);
  }
}
__name(handleCreateUserTournament, "handleCreateUserTournament");
async function handleListUserTournaments(request, env, ctx) {
  const { error, user } = await requireAuth(request, env);
  if (error) return error;
  try {
    const url = new URL(request.url);
    const game = url.searchParams.get("game");
    const limit = parseInt(url.searchParams.get("limit")) || 50;
    const offset = parseInt(url.searchParams.get("offset")) || 0;
    const firestore = getFirestore(env);
    const filters = { userId: user.userId };
    if (game) {
      filters.game = game;
    }
    const allTournaments = await firestore.queryDocuments("user_tournaments", filters);
    allTournaments.sort((a, b) => new Date(b.date) - new Date(a.date));
    const tournaments = allTournaments.slice(offset, offset + limit);
    return jsonResponse({
      tournaments,
      count: tournaments.length,
      total: allTournaments.length,
      offset,
      limit
    });
  } catch (err) {
    console.error("handleListUserTournaments error:", err);
    return errorResponse("Failed to list tournaments", 500, err.message);
  }
}
__name(handleListUserTournaments, "handleListUserTournaments");
async function handleUpdateUserTournament(request, env, ctx, tournamentId) {
  const { error, user } = await requireAuth(request, env);
  if (error) return error;
  try {
    const firestore = getFirestore(env);
    const existing = await firestore.getDocument("user_tournaments", tournamentId);
    if (!existing) {
      return notFoundResponse("Tournament not found");
    }
    if (existing.userId !== user.userId) {
      return errorResponse("Forbidden", 403);
    }
    const body = await request.json();
    const updates = {
      ...body,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    delete updates.userId;
    delete updates.id;
    delete updates.createdAt;
    const updated = await firestore.updateDocument("user_tournaments", tournamentId, updates);
    return jsonResponse(updated);
  } catch (err) {
    console.error("handleUpdateUserTournament error:", err);
    return errorResponse("Failed to update tournament", 500, err.message);
  }
}
__name(handleUpdateUserTournament, "handleUpdateUserTournament");
async function handleDeleteUserTournament(request, env, ctx, tournamentId) {
  const { error, user } = await requireAuth(request, env);
  if (error) return error;
  try {
    const firestore = getFirestore(env);
    const existing = await firestore.getDocument("user_tournaments", tournamentId);
    if (!existing) {
      return notFoundResponse("Tournament not found");
    }
    if (existing.userId !== user.userId) {
      return errorResponse("Forbidden", 403);
    }
    await firestore.deleteDocument("user_tournaments", tournamentId);
    const matches = await firestore.queryDocuments("user_matches", {
      tournamentId
    });
    for (const match of matches) {
      await firestore.deleteDocument("user_matches", match.id);
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("handleDeleteUserTournament error:", err);
    return errorResponse("Failed to delete tournament", 500, err.message);
  }
}
__name(handleDeleteUserTournament, "handleDeleteUserTournament");

// src/routes/userMatches.js
function getFirestore2(env) {
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_API_KEY) {
    throw new Error("Firebase not configured");
  }
  return new FirestoreClient(env.FIREBASE_PROJECT_ID, env.FIREBASE_API_KEY);
}
__name(getFirestore2, "getFirestore");
function calculateStats(matches) {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  matches.forEach((match) => {
    if (match.result === "win") wins++;
    else if (match.result === "loss") losses++;
    else if (match.result === "tie") ties++;
  });
  const totalGames = wins + losses + ties;
  const winRate = totalGames > 0 ? wins / totalGames * 100 : 0;
  return {
    wins,
    losses,
    ties,
    totalGames,
    winRate: Math.round(winRate * 100) / 100
    // Round to 2 decimals
  };
}
__name(calculateStats, "calculateStats");
async function handleCreateUserMatch(request, env, ctx) {
  const { error, user } = await requireAuth(request, env);
  if (error) return error;
  try {
    const body = await request.json();
    if (!body.tournamentId || !body.game || !body.round || !body.opponent || !body.opponentDeck || !body.result) {
      return badRequestResponse("Missing required fields: tournamentId, game, round, opponent, opponentDeck, result");
    }
    if (!["win", "loss", "tie"].includes(body.result)) {
      return badRequestResponse("Invalid result. Must be: win, loss, or tie");
    }
    const firestore = getFirestore2(env);
    const tournament = await firestore.getDocument("user_tournaments", body.tournamentId);
    if (!tournament) {
      return notFoundResponse("Tournament not found");
    }
    if (tournament.userId !== user.userId) {
      return errorResponse("Forbidden", 403);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const match = await firestore.createDocument("user_matches", {
      userId: user.userId,
      tournamentId: body.tournamentId,
      game: body.game,
      round: body.round,
      opponent: body.opponent,
      opponentDeck: body.opponentDeck,
      opponentDeckImageUrl: body.opponentDeckImageUrl || null,
      result: body.result,
      myScore: body.myScore || null,
      opponentScore: body.opponentScore || null,
      notes: body.notes || null,
      createdAt: now,
      updatedAt: now
    });
    return jsonResponse(match, { status: 201 });
  } catch (err) {
    console.error("handleCreateUserMatch error:", err);
    return errorResponse("Failed to create match", 500, err.message);
  }
}
__name(handleCreateUserMatch, "handleCreateUserMatch");
async function handleListUserMatches(request, env, ctx) {
  const { error, user } = await requireAuth(request, env);
  if (error) return error;
  try {
    const url = new URL(request.url);
    const tournamentId = url.searchParams.get("tournamentId");
    if (!tournamentId) {
      return badRequestResponse("Missing required parameter: tournamentId");
    }
    const firestore = getFirestore2(env);
    const tournament = await firestore.getDocument("user_tournaments", tournamentId);
    if (!tournament) {
      return notFoundResponse("Tournament not found");
    }
    if (tournament.userId !== user.userId) {
      return errorResponse("Forbidden", 403);
    }
    const matches = await firestore.queryDocuments("user_matches", {
      tournamentId
    });
    matches.sort((a, b) => a.round - b.round);
    const stats = calculateStats(matches);
    return jsonResponse({
      matches,
      count: matches.length,
      stats
    });
  } catch (err) {
    console.error("handleListUserMatches error:", err);
    return errorResponse("Failed to list matches", 500, err.message);
  }
}
__name(handleListUserMatches, "handleListUserMatches");
async function handleUpdateUserMatch(request, env, ctx, matchId) {
  const { error, user } = await requireAuth(request, env);
  if (error) return error;
  try {
    const firestore = getFirestore2(env);
    const existing = await firestore.getDocument("user_matches", matchId);
    if (!existing) {
      return notFoundResponse("Match not found");
    }
    if (existing.userId !== user.userId) {
      return errorResponse("Forbidden", 403);
    }
    const body = await request.json();
    const updates = {
      ...body,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    delete updates.userId;
    delete updates.tournamentId;
    delete updates.id;
    delete updates.createdAt;
    const updated = await firestore.updateDocument("user_matches", matchId, updates);
    return jsonResponse(updated);
  } catch (err) {
    console.error("handleUpdateUserMatch error:", err);
    return errorResponse("Failed to update match", 500, err.message);
  }
}
__name(handleUpdateUserMatch, "handleUpdateUserMatch");
async function handleDeleteUserMatch(request, env, ctx, matchId) {
  const { error, user } = await requireAuth(request, env);
  if (error) return error;
  try {
    const firestore = getFirestore2(env);
    const existing = await firestore.getDocument("user_matches", matchId);
    if (!existing) {
      return notFoundResponse("Match not found");
    }
    if (existing.userId !== user.userId) {
      return errorResponse("Forbidden", 403);
    }
    await firestore.deleteDocument("user_matches", matchId);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("handleDeleteUserMatch error:", err);
    return errorResponse("Failed to delete match", 500, err.message);
  }
}
__name(handleDeleteUserMatch, "handleDeleteUserMatch");

// src/middleware/rateLimit.js
async function checkRateLimit(request, env, limit = 100, window = 3600) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const now = Math.floor(Date.now() / 1e3);
  const windowKey = Math.floor(now / window);
  const key = `ratelimit:${ip}:${windowKey}`;
  try {
    const count = await env.KVDB.get(key);
    const currentCount = count ? parseInt(count) : 0;
    if (currentCount >= limit) {
      const retryAfter = window - now % window;
      return rateLimitResponse(retryAfter);
    }
    await env.KVDB.put(key, String(currentCount + 1), {
      expirationTtl: window
    });
    return null;
  } catch (err) {
    console.error("Rate limit check error:", err);
    return null;
  }
}
__name(checkRateLimit, "checkRateLimit");

// src/index.js
function initializeAdapters() {
  gameRegistry.register("pokemon", new PokemonAdapter());
  gameRegistry.register("magic", new MagicAdapter());
}
__name(initializeAdapters, "initializeAdapters");
var src_default = {
  async fetch(request, env, ctx) {
    initializeAdapters();
    const url = new URL(request.url);
    const method = request.method;
    if (method === "OPTIONS") {
      return corsOptionsResponse();
    }
    if (url.pathname === "/health" && method === "GET") {
      return jsonResponse({ status: "OK", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }
    if ((url.pathname === "/" || url.pathname === "/demo") && method === "GET") {
      return await handleDemo(request, env, ctx);
    }
    if (url.pathname.startsWith("/v1/")) {
      const rateLimitResult = await checkRateLimit(request, env, 100, 3600);
      if (rateLimitResult) {
        return rateLimitResult;
      }
    }
    const metaTopMatch = url.pathname.match(/^\/v1\/([^/]+)\/meta\/top$/);
    if (metaTopMatch && method === "GET") {
      const game = metaTopMatch[1].toLowerCase();
      return await handleMetaTop(request, env, ctx, game);
    }
    const tournamentsMatch = url.pathname.match(/^\/v1\/([^/]+)\/tournaments\/recent$/);
    if (tournamentsMatch && method === "GET") {
      const game = tournamentsMatch[1].toLowerCase();
      return await handleTournamentsRecent(request, env, ctx, game);
    }
    const deckDetailsMatch = url.pathname.match(/^\/v1\/([^/]+)\/meta\/deck\/([^/]+)$/);
    if (deckDetailsMatch && method === "GET") {
      const game = deckDetailsMatch[1].toLowerCase();
      const deckName = deckDetailsMatch[2];
      return await handleDeckDetails(request, env, ctx, game, deckName);
    }
    if (url.pathname === "/v1/meta/top" && method === "GET") {
      return await handleMetaTop(request, env, ctx, "pokemon");
    }
    if (url.pathname === "/v1/tournaments/recent" && method === "GET") {
      return await handleTournamentsRecent(request, env, ctx, "pokemon");
    }
    const legacyDeckMatch = url.pathname.match(/^\/v1\/meta\/deck\/([^/]+)$/);
    if (legacyDeckMatch && method === "GET") {
      const deckName = legacyDeckMatch[1];
      return await handleDeckDetails(request, env, ctx, "pokemon", deckName);
    }
    if (url.pathname === "/v1/user/tournaments") {
      if (method === "POST") {
        return await handleCreateUserTournament(request, env, ctx);
      }
      if (method === "GET") {
        return await handleListUserTournaments(request, env, ctx);
      }
      return methodNotAllowedResponse(["GET", "POST"]);
    }
    const tournamentIdMatch = url.pathname.match(/^\/v1\/user\/tournaments\/([^/]+)$/);
    if (tournamentIdMatch) {
      const tournamentId = tournamentIdMatch[1];
      if (method === "PUT") {
        return await handleUpdateUserTournament(request, env, ctx, tournamentId);
      }
      if (method === "DELETE") {
        return await handleDeleteUserTournament(request, env, ctx, tournamentId);
      }
      return methodNotAllowedResponse(["PUT", "DELETE"]);
    }
    if (url.pathname === "/v1/user/matches") {
      if (method === "POST") {
        return await handleCreateUserMatch(request, env, ctx);
      }
      if (method === "GET") {
        return await handleListUserMatches(request, env, ctx);
      }
      return methodNotAllowedResponse(["GET", "POST"]);
    }
    const matchIdMatch = url.pathname.match(/^\/v1\/user\/matches\/([^/]+)$/);
    if (matchIdMatch) {
      const matchId = matchIdMatch[1];
      if (method === "PUT") {
        return await handleUpdateUserMatch(request, env, ctx, matchId);
      }
      if (method === "DELETE") {
        return await handleDeleteUserMatch(request, env, ctx, matchId);
      }
      return methodNotAllowedResponse(["PUT", "DELETE"]);
    }
    return notFoundResponse("Endpoint not found");
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-GaryF3/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-GaryF3/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
