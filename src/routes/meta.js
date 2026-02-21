/**
 * Meta endpoints - Top decks from recent tournaments
 */

import { gameRegistry } from '../games/registry.js';
import { jsonResponse } from '../core/response.js';
import { errorResponse, comingSoonResponse } from '../core/errors.js';
import { CacheManager } from '../core/cache.js';

/**
 * GET /v1/:game/meta/top - Return top meta decks
 */
export async function handleMetaTop(request, env, ctx, game) {
	const url = new URL(request.url);
	const days = parseInt(url.searchParams.get('days')) || 7;
	const format = (url.searchParams.get('format') || 'standard').toLowerCase();
	const limit = parseInt(url.searchParams.get('limit')) || 10;

	// Get game adapter
	const adapter = gameRegistry.get(game);
	if (!adapter) {
		return comingSoonResponse(game);
	}

	const cache = new CacheManager(env.KVDB);
	const cacheKey = adapter.getMetaCacheKey(format, days, limit);

	try {
		// Check cache first
		const cached = await cache.get(cacheKey);
		if (cached) {
			return jsonResponse(cached, { cache: 'HIT' });
		}

		// Fetch tournaments
		const tournaments = await adapter.fetchTournaments(days, format, 50);

		if (tournaments.length === 0) {
			return jsonResponse({
				updated_at: new Date().toISOString(),
				format,
				days,
				decks: [],
				message: 'No tournaments found',
			});
		}

		// Process only first 5 tournaments to avoid rate limiting
		const tournamentsToProcess = tournaments.slice(0, 5);

		// Fetch standings for each tournament with delays
		const allStandings = [];
		for (let i = 0; i < tournamentsToProcess.length; i++) {
			const tournament = tournamentsToProcess[i];
			const standings = await adapter.fetchStandings(tournament.id);
			allStandings.push(...standings);

			// Delay between requests to respect rate limiting
			if (i < tournamentsToProcess.length - 1) {
				await new Promise(resolve => setTimeout(resolve, 500));
			}
		}

		// Aggregate and sort decks
		const allDecks = await adapter.aggregateDecks(allStandings);
		const decks = allDecks.slice(0, limit);

		const response = {
			updated_at: new Date().toISOString(),
			format,
			days,
			decks,
		};

		// Cache for 12 hours
		ctx.waitUntil(cache.set(cacheKey, response, 43200));

		return jsonResponse(response, { cache: 'MISS' });
	} catch (err) {
		console.error('handleMetaTop error:', err);
		// Check if this is a "coming soon" error
		if (err.message && err.message.includes('coming soon')) {
			return comingSoonResponse(game);
		}
		return errorResponse('Internal server error', 500, err.message);
	}
}
