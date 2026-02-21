/**
 * User Tournaments endpoints (protected - requires auth)
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
 * POST /v1/user/tournaments - Create tournament
 */
export async function handleCreateUserTournament(request, env, ctx) {
	// Verify auth
	const { error, user } = await requireAuth(request, env);
	if (error) return error;

	try {
		const body = await request.json();

		// Validate required fields
		if (!body.game || !body.name || !body.format || !body.date) {
			return badRequestResponse('Missing required fields: game, name, format, date');
		}

		const firestore = getFirestore(env);
		const now = new Date().toISOString();

		const tournament = await firestore.createDocument('user_tournaments', {
			userId: user.userId,
			game: body.game,
			name: body.name,
			format: body.format,
			date: body.date,
			location: body.location || null,
			imageUrl: body.imageUrl || null,
			deckName: body.deckName || null,
			deckImageUrl: body.deckImageUrl || null,
			decklistUrl: body.decklistUrl || null,
			notes: body.notes || null,
			createdAt: now,
			updatedAt: now,
		});

		return jsonResponse(tournament, { status: 201 });
	} catch (err) {
		console.error('handleCreateUserTournament error:', err);
		return errorResponse('Failed to create tournament', 500, err.message);
	}
}

/**
 * GET /v1/user/tournaments - List user's tournaments
 */
export async function handleListUserTournaments(request, env, ctx) {
	// Verify auth
	const { error, user } = await requireAuth(request, env);
	if (error) return error;

	try {
		const url = new URL(request.url);
		const game = url.searchParams.get('game');
		const limit = parseInt(url.searchParams.get('limit')) || 50;
		const offset = parseInt(url.searchParams.get('offset')) || 0;

		const firestore = getFirestore(env);

		// Query user's tournaments
		const filters = { userId: user.userId };
		if (game) {
			filters.game = game;
		}

		const allTournaments = await firestore.queryDocuments('user_tournaments', filters);

		// Sort by date descending
		allTournaments.sort((a, b) => new Date(b.date) - new Date(a.date));

		// Pagination
		const tournaments = allTournaments.slice(offset, offset + limit);

		return jsonResponse({
			tournaments,
			count: tournaments.length,
			total: allTournaments.length,
			offset,
			limit,
		});
	} catch (err) {
		console.error('handleListUserTournaments error:', err);
		return errorResponse('Failed to list tournaments', 500, err.message);
	}
}

/**
 * PUT /v1/user/tournaments/:id - Update tournament
 */
export async function handleUpdateUserTournament(request, env, ctx, tournamentId) {
	// Verify auth
	const { error, user } = await requireAuth(request, env);
	if (error) return error;

	try {
		const firestore = getFirestore(env);

		// Verify tournament exists and belongs to user
		const existing = await firestore.getDocument('user_tournaments', tournamentId);
		if (!existing) {
			return notFoundResponse('Tournament not found');
		}
		if (existing.userId !== user.userId) {
			return errorResponse('Forbidden', 403);
		}

		// Update tournament
		const body = await request.json();
		const updates = {
			...body,
			updatedAt: new Date().toISOString(),
		};

		// Don't allow changing userId or id
		delete updates.userId;
		delete updates.id;
		delete updates.createdAt;

		const updated = await firestore.updateDocument('user_tournaments', tournamentId, updates);

		return jsonResponse(updated);
	} catch (err) {
		console.error('handleUpdateUserTournament error:', err);
		return errorResponse('Failed to update tournament', 500, err.message);
	}
}

/**
 * DELETE /v1/user/tournaments/:id - Delete tournament
 */
export async function handleDeleteUserTournament(request, env, ctx, tournamentId) {
	// Verify auth
	const { error, user } = await requireAuth(request, env);
	if (error) return error;

	try {
		const firestore = getFirestore(env);

		// Verify tournament exists and belongs to user
		const existing = await firestore.getDocument('user_tournaments', tournamentId);
		if (!existing) {
			return notFoundResponse('Tournament not found');
		}
		if (existing.userId !== user.userId) {
			return errorResponse('Forbidden', 403);
		}

		// Delete tournament
		await firestore.deleteDocument('user_tournaments', tournamentId);

		// Delete associated matches (cascade delete)
		const matches = await firestore.queryDocuments('user_matches', {
			tournamentId: tournamentId,
		});

		for (const match of matches) {
			await firestore.deleteDocument('user_matches', match.id);
		}

		return new Response(null, { status: 204 });
	} catch (err) {
		console.error('handleDeleteUserTournament error:', err);
		return errorResponse('Failed to delete tournament', 500, err.message);
	}
}
