/**
 * User Matches endpoints (protected - requires auth)
 */

import { requireAuth } from '../middleware/auth.js';
import { FirestoreClient } from '../services/firestore.js';
import { jsonResponse } from '../core/response.js';
import { errorResponse, notFoundResponse, badRequestResponse } from '../core/errors.js';

/**
 * Get Firestore client instance
 */
function getFirestore(env) {
	if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_API_KEY) {
		throw new Error('Firebase not configured');
	}
	return new FirestoreClient(env.FIREBASE_PROJECT_ID, env.FIREBASE_API_KEY);
}

/**
 * Calculate match statistics
 */
function calculateStats(matches) {
	let wins = 0;
	let losses = 0;
	let ties = 0;

	matches.forEach(match => {
		if (match.result === 'win') wins++;
		else if (match.result === 'loss') losses++;
		else if (match.result === 'tie') ties++;
	});

	const totalGames = wins + losses + ties;
	const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

	return {
		wins,
		losses,
		ties,
		totalGames,
		winRate: Math.round(winRate * 100) / 100, // Round to 2 decimals
	};
}

/**
 * POST /v1/user/matches - Create match
 */
export async function handleCreateUserMatch(request, env, ctx) {
	// Verify auth
	const { error, user } = await requireAuth(request, env);
	if (error) return error;

	try {
		const body = await request.json();

		// Validate required fields
		if (!body.tournamentId || !body.game || !body.round || !body.opponent || !body.opponentDeck || !body.result) {
			return badRequestResponse('Missing required fields: tournamentId, game, round, opponent, opponentDeck, result');
		}

		if (!['win', 'loss', 'tie'].includes(body.result)) {
			return badRequestResponse('Invalid result. Must be: win, loss, or tie');
		}

		const firestore = getFirestore(env);

		// Verify tournament exists and belongs to user
		const tournament = await firestore.getDocument('user_tournaments', body.tournamentId);
		if (!tournament) {
			return notFoundResponse('Tournament not found');
		}
		if (tournament.userId !== user.userId) {
			return errorResponse('Forbidden', 403);
		}

		const now = new Date().toISOString();

		const match = await firestore.createDocument('user_matches', {
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
			updatedAt: now,
		});

		return jsonResponse(match, { status: 201 });
	} catch (err) {
		console.error('handleCreateUserMatch error:', err);
		return errorResponse('Failed to create match', 500, err.message);
	}
}

/**
 * GET /v1/user/matches - List matches for a tournament
 */
export async function handleListUserMatches(request, env, ctx) {
	// Verify auth
	const { error, user } = await requireAuth(request, env);
	if (error) return error;

	try {
		const url = new URL(request.url);
		const tournamentId = url.searchParams.get('tournamentId');

		if (!tournamentId) {
			return badRequestResponse('Missing required parameter: tournamentId');
		}

		const firestore = getFirestore(env);

		// Verify tournament exists and belongs to user
		const tournament = await firestore.getDocument('user_tournaments', tournamentId);
		if (!tournament) {
			return notFoundResponse('Tournament not found');
		}
		if (tournament.userId !== user.userId) {
			return errorResponse('Forbidden', 403);
		}

		// Query matches for tournament
		const matches = await firestore.queryDocuments('user_matches', {
			tournamentId: tournamentId,
		});

		// Sort by round ascending
		matches.sort((a, b) => a.round - b.round);

		// Calculate stats
		const stats = calculateStats(matches);

		return jsonResponse({
			matches,
			count: matches.length,
			stats,
		});
	} catch (err) {
		console.error('handleListUserMatches error:', err);
		return errorResponse('Failed to list matches', 500, err.message);
	}
}

/**
 * PUT /v1/user/matches/:id - Update match
 */
export async function handleUpdateUserMatch(request, env, ctx, matchId) {
	// Verify auth
	const { error, user } = await requireAuth(request, env);
	if (error) return error;

	try {
		const firestore = getFirestore(env);

		// Verify match exists and belongs to user
		const existing = await firestore.getDocument('user_matches', matchId);
		if (!existing) {
			return notFoundResponse('Match not found');
		}
		if (existing.userId !== user.userId) {
			return errorResponse('Forbidden', 403);
		}

		// Update match
		const body = await request.json();
		const updates = {
			...body,
			updatedAt: new Date().toISOString(),
		};

		// Don't allow changing userId, tournamentId, or id
		delete updates.userId;
		delete updates.tournamentId;
		delete updates.id;
		delete updates.createdAt;

		const updated = await firestore.updateDocument('user_matches', matchId, updates);

		return jsonResponse(updated);
	} catch (err) {
		console.error('handleUpdateUserMatch error:', err);
		return errorResponse('Failed to update match', 500, err.message);
	}
}

/**
 * DELETE /v1/user/matches/:id - Delete match
 */
export async function handleDeleteUserMatch(request, env, ctx, matchId) {
	// Verify auth
	const { error, user } = await requireAuth(request, env);
	if (error) return error;

	try {
		const firestore = getFirestore(env);

		// Verify match exists and belongs to user
		const existing = await firestore.getDocument('user_matches', matchId);
		if (!existing) {
			return notFoundResponse('Match not found');
		}
		if (existing.userId !== user.userId) {
			return errorResponse('Forbidden', 403);
		}

		// Delete match
		await firestore.deleteDocument('user_matches', matchId);

		return new Response(null, { status: 204 });
	} catch (err) {
		console.error('handleDeleteUserMatch error:', err);
		return errorResponse('Failed to delete match', 500, err.message);
	}
}
