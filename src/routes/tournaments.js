/**
 * Tournaments endpoints - Recent tournament listings
 */

import { gameRegistry } from '../games/registry.js';
import { jsonResponse } from '../core/response.js';
import { errorResponse, comingSoonResponse } from '../core/errors.js';
import { CacheManager } from '../core/cache.js';

/**
 * GET /v1/:game/tournaments/recent - Return recent tournaments
 */
export async function handleTournamentsRecent(request, env, ctx, game) {
	const url = new URL(request.url);
	const days = parseInt(url.searchParams.get('days')) || 7;
	const format = (url.searchParams.get('format') || 'standard').toLowerCase();
	const limit = parseInt(url.searchParams.get('limit')) || 50;

	// Get game adapter
	const adapter = gameRegistry.get(game);
	if (!adapter) {
		return comingSoonResponse(game);
	}

	const cache = new CacheManager(env.KVDB);
	const cacheKey = adapter.getTournamentsCacheKey(format, days, limit);

	try {
		// Check cache first
		const cached = await cache.get(cacheKey);
		if (cached) {
			return jsonResponse(cached, { cache: 'HIT' });
		}

		// Fetch tournaments
		const tournaments = await adapter.fetchTournaments(days, format, limit);

		const response = {
			updated_at: new Date().toISOString(),
			format,
			days,
			count: tournaments.length,
			tournaments: tournaments.map(t => ({
				id: t.id,
				name: t.name,
				date: t.date,
				players: t.players || 0,
				format: t.format,
			})),
		};

		// Cache for 6 hours
		ctx.waitUntil(cache.set(cacheKey, response, 21600));

		return jsonResponse(response, { cache: 'MISS' });
	} catch (err) {
		console.error('handleTournamentsRecent error:', err);
		// Check if this is a "coming soon" error
		if (err.message && err.message.includes('coming soon')) {
			return comingSoonResponse(game);
		}
		return errorResponse('Internal server error', 500, err.message);
	}
}
