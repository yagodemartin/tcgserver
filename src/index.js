/**
 * Pokémon TCG Companion Backend
 * Cloudflare Worker - Public API Layer
 */

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Health check
		if (url.pathname === '/health') {
			return new Response('OK', { status: 200 });
		}

		// Not found
		return new Response('Not Found', { status: 404 });
	},
};
