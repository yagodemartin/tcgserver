/**
 * Rate limiting middleware using Cloudflare KV
 */

import { rateLimitResponse } from '../core/errors.js';

export async function checkRateLimit(request, env, limit = 100, window = 3600) {
	const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
	const now = Math.floor(Date.now() / 1000);
	const windowKey = Math.floor(now / window);
	const key = `ratelimit:${ip}:${windowKey}`;

	try {
		const count = await env.KVDB.get(key);
		const currentCount = count ? parseInt(count) : 0;

		if (currentCount >= limit) {
			const retryAfter = window - (now % window);
			return rateLimitResponse(retryAfter);
		}

		// Increment counter
		await env.KVDB.put(key, String(currentCount + 1), {
			expirationTtl: window,
		});

		return null; // OK - no rate limit hit
	} catch (err) {
		console.error('Rate limit check error:', err);
		// On error, allow request through (fail open)
		return null;
	}
}
