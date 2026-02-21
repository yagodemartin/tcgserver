/**
 * KV Cache utilities for Cloudflare Workers
 */

export class CacheManager {
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
			console.error('Cache get error:', err);
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
			console.error('Cache set error:', err);
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
			console.error('Cache delete error:', err);
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
}
