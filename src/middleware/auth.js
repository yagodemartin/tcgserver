/**
 * Firebase Auth middleware for Cloudflare Workers
 */

import { Auth } from 'firebase-auth-cloudflare-workers';
import { unauthorizedResponse } from '../core/errors.js';

/**
 * Initialize Firebase Auth
 * @param {object} env - Worker environment with Firebase config
 * @returns {Auth} Firebase Auth instance
 */
function getFirebaseAuth(env) {
	if (!env.FIREBASE_PROJECT_ID) {
		throw new Error('FIREBASE_PROJECT_ID not configured');
	}

	return Auth.getOrInitialize(
		env.FIREBASE_PROJECT_ID,
		env.FIREBASE_KEYS || env.KVDB // Use dedicated KV for keys or fallback to main KV
	);
}

/**
 * Verify Firebase ID token
 * @param {string} idToken - Firebase ID token from Authorization header
 * @param {object} env - Worker environment with Firebase config
 * @returns {Promise<object|null>} Decoded token or null if invalid
 */
export async function verifyIdToken(idToken, env) {
	try {
		const auth = getFirebaseAuth(env);
		const decodedToken = await auth.verifyIdToken(idToken);
		return decodedToken;
	} catch (err) {
		console.error('Token verification error:', err);
		return null;
	}
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
				name: decodedToken.name,
				picture: decodedToken.picture,
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
