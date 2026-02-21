/**
 * Deck details endpoints
 */

import { gameRegistry } from '../games/registry.js';
import { jsonResponse } from '../core/response.js';
import { errorResponse, notFoundResponse, comingSoonResponse } from '../core/errors.js';
import { CacheManager } from '../core/cache.js';

/**
 * GET /v1/:game/meta/deck/:deckName - Get detailed deck info
 */
export async function handleDeckDetails(request, env, ctx, game, deckName) {
	const url = new URL(request.url);
	const days = parseInt(url.searchParams.get('days')) || 7;
	const format = (url.searchParams.get('format') || 'standard').toLowerCase();

	// Get game adapter
	const adapter = gameRegistry.get(game);
	if (!adapter) {
		return comingSoonResponse(game);
	}

	const decodedDeckName = decodeURIComponent(deckName);
	const cache = new CacheManager(env.KVDB);
	const cacheKey = adapter.getDeckCacheKey(decodedDeckName, format, days);

	try {
		// Check cache first
		const cached = await cache.get(cacheKey);
		if (cached) {
			return jsonResponse(cached, { cache: 'HIT' });
		}

		// Fetch deck details
		const deckInfo = await adapter.fetchDeckDetails(decodedDeckName, days, format);

		if (!deckInfo) {
			return notFoundResponse(`No recent data found for deck: ${decodedDeckName}`);
		}

		// Add set color and code if main card exists
		if (deckInfo.mainCard && adapter.getSetColor) {
			deckInfo.setColor = adapter.getSetColor(deckInfo.mainCard.set);
			deckInfo.setCode = deckInfo.mainCard.set;
		}

		const response = {
			updated_at: new Date().toISOString(),
			format,
			days,
			deck: deckInfo,
		};

		// Cache for 12 hours
		ctx.waitUntil(cache.set(cacheKey, response, 43200));

		return jsonResponse(response, { cache: 'MISS' });
	} catch (err) {
		console.error('handleDeckDetails error:', err);
		// Check if this is a "coming soon" error
		if (err.message && err.message.includes('coming soon')) {
			return comingSoonResponse(game);
		}
		return errorResponse('Internal server error', 500, err.message);
	}
}
