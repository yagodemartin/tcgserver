/**
 * Pokémon TCG Companion Backend
 * Cloudflare Worker - Public API Layer
 */

const LIMITLESS_API_BASE = 'https://play.limitlesstcg.com/api';

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
 * Aggregate decks from standings
 */
function aggregateDecks(standingsArray) {
	const deckCount = {};

	standingsArray.forEach(standing => {
		if (standing.deck && standing.deck.name) {
			const deckName = standing.deck.name;
			deckCount[deckName] = (deckCount[deckName] || 0) + 1;
		}
	});

	// Sort by count descending
	return Object.entries(deckCount)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);
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

		// Aggregate and sort decks
		const decks = aggregateDecks(allStandings).slice(0, limit);

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
