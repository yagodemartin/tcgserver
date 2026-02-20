/**
 * Pokémon TCG Companion Backend
 * Cloudflare Worker - Public API Layer
 */

const LIMITLESS_API_BASE = 'https://play.limitlesstcg.com/api';
const POKEMONTCG_API = 'https://api.pokemontcg.io/v2';

// Cache for card images to avoid repeated lookups
const imageCache = new Map();

/**
 * Fetch tournaments from Limitless API
 */
async function fetchTournaments(days = 7, format = 'standard', limit = 50) {
	const now = new Date();
	const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

	const params = new URLSearchParams({
		game: 'PTCG',
		format: format.toUpperCase(),
		limit,
		page: 0,
	});

	try {
		const res = await fetch(`${LIMITLESS_API_BASE}/tournaments?${params}`);
		if (!res.ok) throw new Error(`API error: ${res.status}`);

		const data = await res.json();
		// Filter tournaments from last N days
		// API returns array directly, not wrapped in .tournaments
		return (Array.isArray(data) ? data : data.tournaments || []).filter(t => {
			const tDate = new Date(t.date);
			return tDate >= startDate;
		});
	} catch (err) {
		console.error('fetchTournaments error:', err);
		throw err;
	}
}

/**
 * Fetch standings for a specific tournament (with retries on rate limit)
 */
async function fetchStandings(tournamentId, retries = 3) {
	for (let i = 0; i < retries; i++) {
		try {
			const res = await fetch(`${LIMITLESS_API_BASE}/tournaments/${tournamentId}/standings`);

			// Check for rate limit
			if (res.status === 429) {
				const retryAfter = res.headers.get('Retry-After');
				const delay = retryAfter ? parseInt(retryAfter) * 1000 : (1000 * Math.pow(2, i));
				console.log(`Rate limited, waiting ${delay}ms before retry ${i + 1}/${retries}`);
				await new Promise(resolve => setTimeout(resolve, delay));
				continue;
			}

			if (!res.ok) throw new Error(`API error: ${res.status}`);
			return await res.json();
		} catch (err) {
			if (i === retries - 1) {
				console.error(`fetchStandings(${tournamentId}) failed after ${retries} retries:`, err);
				return [];
			}
			await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
		}
	}
	return [];
}

/**
 * Extract main card from deck (prioritize "ex" cards, then first pokemon)
 */
function extractMainCard(decklist) {
	if (!decklist || !decklist.pokemon || decklist.pokemon.length === 0) {
		return null;
	}

	// First, try to find an "ex" card
	const exCard = decklist.pokemon.find(card => card.name && card.name.includes('ex'));
	if (exCard) {
		return { name: exCard.name, set: exCard.set, number: exCard.number };
	}

	// Otherwise, return first pokemon
	const firstCard = decklist.pokemon[0];
	return { name: firstCard.name, set: firstCard.set, number: firstCard.number };
}

/**
 * Get card image URL from Pokemon TCG API with timeout
 */
async function getCardImageUrl(cardName, cardSet, cardNumber) {
	const cacheKey = `${cardSet}/${cardNumber}`;

	// Check in-memory cache first
	if (imageCache.has(cacheKey)) {
		return imageCache.get(cacheKey);
	}

	try {
		// Timeout after 2 seconds for image fetching
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 2000);

		const query = `q=name:"${cardName}" set.id:${cardSet}`;
		const res = await fetch(`${POKEMONTCG_API}/cards?${query}`, {
			signal: controller.signal,
			cf: { cacheTtl: 3600 }
		});

		clearTimeout(timeoutId);

		if (!res.ok) throw new Error(`Card API error: ${res.status}`);
		const data = await res.json();

		if (data.data && data.data[0]) {
			const imageUrl = data.data[0].images?.small || data.data[0].images?.large;
			if (imageUrl) {
				imageCache.set(cacheKey, imageUrl);
				return imageUrl;
			}
		}
	} catch (err) {
		console.warn(`getCardImageUrl timeout/error for ${cardName}:`, err.message);
	}

	// Fallback: construct URL based on set/number (always works)
	const fallbackUrl = `https://images.pokemontcg.io/${cardSet}/${cardNumber}.png`;
	imageCache.set(cacheKey, fallbackUrl);
	return fallbackUrl;
}

/**
 * Aggregate decks from standings with main card info
 */
async function aggregateDecks(standingsArray) {
	const deckMap = {};

	// Aggregate deck info
	standingsArray.forEach(standing => {
		if (standing.deck && standing.deck.name) {
			const deckName = standing.deck.name;
			if (!deckMap[deckName]) {
				deckMap[deckName] = {
					name: deckName,
					count: 0,
					mainCard: extractMainCard(standing.decklist),
				};
			}
			deckMap[deckName].count++;
		}
	});

	// Get image URLs for each deck's main card
	const decks = await Promise.all(
		Object.values(deckMap).map(async (deck) => {
			if (deck.mainCard) {
				try {
					deck.image = await getCardImageUrl(
						deck.mainCard.name,
						deck.mainCard.set,
						deck.mainCard.number
					);
				} catch (err) {
					console.warn(`Failed to get image for ${deck.name}:`, err.message);
					deck.image = null;
				}
			}
			return deck;
		})
	);

	// Sort by count descending
	return decks.sort((a, b) => b.count - a.count);
}

/**
 * GET /v1/meta/top - Return top meta decks
 */
async function handleMetaTop(request, env, ctx) {
	const url = new URL(request.url);
	const days = parseInt(url.searchParams.get('days')) || 7;
	const format = (url.searchParams.get('format') || 'standard').toLowerCase();
	const limit = parseInt(url.searchParams.get('limit')) || 10;

	// Cache key
	const cacheKey = `meta:top:${format}:${days}:${limit}`;

	try {
		// Check cache first
		const cached = await env.KVDB.get(cacheKey);
		if (cached) {
			return new Response(cached, {
				headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
			});
		}

		// Fetch tournaments
		const tournaments = await fetchTournaments(days, format, 50);
		console.log(`Found ${tournaments.length} tournaments in last ${days} days`);

		if (tournaments.length === 0) {
			return new Response(JSON.stringify({
				updated_at: new Date().toISOString(),
				format,
				days,
				decks: [],
				message: 'No tournaments found'
			}), {
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// MVP: Process only first 15 tournaments to avoid rate limiting
		// In production, this would be better with pagination or background jobs
		const tournamentsToProcess = tournaments.slice(0, 15);
		console.log(`Processing ${tournamentsToProcess.length} tournaments (rate limit protection)`);

		// Fetch standings for each tournament with delays
		const allStandings = [];
		for (let i = 0; i < tournamentsToProcess.length; i++) {
			const tournament = tournamentsToProcess[i];
			const standings = await fetchStandings(tournament.id);
			allStandings.push(...standings);

			// Delay between requests to respect rate limiting (MVP: 500ms)
			if (i < tournamentsToProcess.length - 1) {
				await new Promise(resolve => setTimeout(resolve, 500));
			}
		}

		// Aggregate and sort decks (now async to fetch images)
		const allDecks = await aggregateDecks(allStandings);
		const decks = allDecks.slice(0, limit);

		const response = {
			updated_at: new Date().toISOString(),
			format,
			days,
			decks,
		};

		const responseJson = JSON.stringify(response);

		// Cache for 12 hours (43200 seconds)
		ctx.waitUntil(env.KVDB.put(cacheKey, responseJson, { expirationTtl: 43200 }));

		return new Response(responseJson, {
			headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
		});
	} catch (err) {
		console.error('handleMetaTop error:', err);
		return new Response(JSON.stringify({
			error: 'Internal server error',
			message: err.message,
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Health check
		if (url.pathname === '/health') {
			return new Response('OK', { status: 200 });
		}

		// GET /v1/meta/top
		if (url.pathname === '/v1/meta/top' && request.method === 'GET') {
			return await handleMetaTop(request, env, ctx);
		}

		// Not found
		return new Response('Not Found', { status: 404 });
	},
};
