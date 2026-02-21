/**
 * TCG Companion Backend - Multi-Game Architecture
 * Cloudflare Worker - Main Router
 */

import { gameRegistry } from './games/registry.js';
import { PokemonAdapter } from './games/pokemon/adapter.js';
import { MagicAdapter } from './games/magic/adapter.js';

import { handleMetaTop } from './routes/meta.js';
import { handleTournamentsRecent } from './routes/tournaments.js';
import { handleDeckDetails } from './routes/deck.js';
import { handleDemo } from './routes/demo.js';
import {
	handleCreateUserTournament,
	handleListUserTournaments,
	handleUpdateUserTournament,
	handleDeleteUserTournament,
} from './routes/userTournaments.js';
import {
	handleCreateUserMatch,
	handleListUserMatches,
	handleUpdateUserMatch,
	handleDeleteUserMatch,
} from './routes/userMatches.js';

import { handleCorsOptions } from './middleware/cors.js';
import { checkRateLimit } from './middleware/rateLimit.js';

import { jsonResponse, corsOptionsResponse } from './core/response.js';
import { notFoundResponse, methodNotAllowedResponse } from './core/errors.js';

/**
 * Initialize game adapters
 */
function initializeAdapters() {
	gameRegistry.register('pokemon', new PokemonAdapter());
	gameRegistry.register('magic', new MagicAdapter()); // Stub - Phase 2
	// Add more games here in Phase 2
}

/**
 * Main worker fetch handler
 */
export default {
	async fetch(request, env, ctx) {
		// Initialize game adapters
		initializeAdapters();

		const url = new URL(request.url);
		const method = request.method;

		// CORS preflight
		if (method === 'OPTIONS') {
			return corsOptionsResponse();
		}

		// Health check
		if (url.pathname === '/health' && method === 'GET') {
			return jsonResponse({ status: 'OK', timestamp: new Date().toISOString() });
		}

		// Demo page
		if ((url.pathname === '/' || url.pathname === '/demo') && method === 'GET') {
			return await handleDemo(request, env, ctx);
		}

		// Apply rate limiting to API endpoints
		if (url.pathname.startsWith('/v1/')) {
			const rateLimitResult = await checkRateLimit(request, env, 100, 3600);
			if (rateLimitResult) {
				return rateLimitResult;
			}
		}

		// Multi-game routing: /v1/:game/meta/top
		const metaTopMatch = url.pathname.match(/^\/v1\/([^/]+)\/meta\/top$/);
		if (metaTopMatch && method === 'GET') {
			const game = metaTopMatch[1].toLowerCase();
			return await handleMetaTop(request, env, ctx, game);
		}

		// Multi-game routing: /v1/:game/tournaments/recent
		const tournamentsMatch = url.pathname.match(/^\/v1\/([^/]+)\/tournaments\/recent$/);
		if (tournamentsMatch && method === 'GET') {
			const game = tournamentsMatch[1].toLowerCase();
			return await handleTournamentsRecent(request, env, ctx, game);
		}

		// Multi-game routing: /v1/:game/meta/deck/:deckName
		const deckDetailsMatch = url.pathname.match(/^\/v1\/([^/]+)\/meta\/deck\/([^/]+)$/);
		if (deckDetailsMatch && method === 'GET') {
			const game = deckDetailsMatch[1].toLowerCase();
			const deckName = deckDetailsMatch[2];
			return await handleDeckDetails(request, env, ctx, game, deckName);
		}

		// Backward compatibility: /v1/meta/top → /v1/pokemon/meta/top
		if (url.pathname === '/v1/meta/top' && method === 'GET') {
			return await handleMetaTop(request, env, ctx, 'pokemon');
		}

		// Backward compatibility: /v1/tournaments/recent → /v1/pokemon/tournaments/recent
		if (url.pathname === '/v1/tournaments/recent' && method === 'GET') {
			return await handleTournamentsRecent(request, env, ctx, 'pokemon');
		}

		// Backward compatibility: /v1/meta/deck/:deckName → /v1/pokemon/meta/deck/:deckName
		const legacyDeckMatch = url.pathname.match(/^\/v1\/meta\/deck\/([^/]+)$/);
		if (legacyDeckMatch && method === 'GET') {
			const deckName = legacyDeckMatch[1];
			return await handleDeckDetails(request, env, ctx, 'pokemon', deckName);
		}

		// User Tournaments endpoints (protected)
		if (url.pathname === '/v1/user/tournaments') {
			if (method === 'POST') {
				return await handleCreateUserTournament(request, env, ctx);
			}
			if (method === 'GET') {
				return await handleListUserTournaments(request, env, ctx);
			}
			return methodNotAllowedResponse(['GET', 'POST']);
		}

		const tournamentIdMatch = url.pathname.match(/^\/v1\/user\/tournaments\/([^/]+)$/);
		if (tournamentIdMatch) {
			const tournamentId = tournamentIdMatch[1];
			if (method === 'PUT') {
				return await handleUpdateUserTournament(request, env, ctx, tournamentId);
			}
			if (method === 'DELETE') {
				return await handleDeleteUserTournament(request, env, ctx, tournamentId);
			}
			return methodNotAllowedResponse(['PUT', 'DELETE']);
		}

		// User Matches endpoints (protected)
		if (url.pathname === '/v1/user/matches') {
			if (method === 'POST') {
				return await handleCreateUserMatch(request, env, ctx);
			}
			if (method === 'GET') {
				return await handleListUserMatches(request, env, ctx);
			}
			return methodNotAllowedResponse(['GET', 'POST']);
		}

		const matchIdMatch = url.pathname.match(/^\/v1\/user\/matches\/([^/]+)$/);
		if (matchIdMatch) {
			const matchId = matchIdMatch[1];
			if (method === 'PUT') {
				return await handleUpdateUserMatch(request, env, ctx, matchId);
			}
			if (method === 'DELETE') {
				return await handleDeleteUserMatch(request, env, ctx, matchId);
			}
			return methodNotAllowedResponse(['PUT', 'DELETE']);
		}

		// Not found
		return notFoundResponse('Endpoint not found');
	},
};
