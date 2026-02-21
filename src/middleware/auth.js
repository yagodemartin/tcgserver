/**
 * Firebase Auth middleware for Cloudflare Workers
 * Note: Firebase integration will be implemented in Phase 2
 */

import { unauthorizedResponse } from '../core/errors.js';

/**
 * Verify Firebase ID token
 * @param {string} idToken - Firebase ID token from Authorization header
 * @param {object} env - Worker environment with Firebase config
 * @returns {Promise<object|null>} Decoded token or null if invalid
 */
export async function verifyIdToken(idToken, env) {
	// TODO: Phase 2 - Implement Firebase Auth verification
	// Use firebase-auth-cloudflare-workers package
	// Verify JWT signature using Google public keys (cached in KV)
	// Return decoded token with { uid, email, ... }

	throw new Error('Firebase Auth not yet implemented - Phase 2');
}

/**
 * Require authentication middleware
 * Checks for valid Bearer token in Authorization header
 */
export async function requireAuth(request, env) {
	const authHeader = request.headers.get('Authorization');

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return {
			error: unauthorizedResponse('Missing or invalid Authorization header'),
			user: null,
		};
	}

	const idToken = authHeader.slice(7); // Remove 'Bearer '

	try {
		const decodedToken = await verifyIdToken(idToken, env);

		if (!decodedToken) {
			return {
				error: unauthorizedResponse('Invalid token'),
				user: null,
			};
		}

		return {
			error: null,
			user: {
				userId: decodedToken.uid,
				email: decodedToken.email,
			},
		};
	} catch (err) {
		console.error('Auth verification error:', err);
		return {
			error: unauthorizedResponse('Authentication failed'),
			user: null,
		};
	}
}
