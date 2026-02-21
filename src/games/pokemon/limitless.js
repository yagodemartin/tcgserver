/**
 * Limitless TCG API client for Pokemon
 */

import { LIMITLESS_API_BASE } from './constants.js';

/**
 * Fetch tournaments from Limitless API
 * @param {number} days - Number of days to look back
 * @param {string} format - Format (standard, expanded)
 * @param {number} limit - Max tournaments to fetch
 * @returns {Promise<Array>} Tournament array
 */
export async function fetchTournaments(days = 7, format = 'standard', limit = 50) {
	const now = new Date();
	const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

	const params = new URLSearchParams({
		game: 'PTCG',
		format: format.toUpperCase(),
		limit,
		page: 0,
	});

	try {
		const res = await fetch(`${LIMITLESS_API_BASE}/tournaments?${params}`);
		if (!res.ok) throw new Error(`Limitless API error: ${res.status}`);

		const data = await res.json();

		// Filter tournaments from last N days
		// API returns array directly, not wrapped
		return (Array.isArray(data) ? data : data.tournaments || []).filter(t => {
			const tDate = new Date(t.date);
			return tDate >= startDate;
		});
	} catch (err) {
		console.error('fetchTournaments error:', err);
		throw err;
	}
}

/**
 * Fetch standings for a specific tournament (with retries on rate limit)
 * @param {string} tournamentId - Tournament ID
 * @param {number} retries - Max retries
 * @returns {Promise<Array>} Standings array
 */
export async function fetchStandings(tournamentId, retries = 3) {
	for (let i = 0; i < retries; i++) {
		try {
			const res = await fetch(`${LIMITLESS_API_BASE}/tournaments/${tournamentId}/standings`);

			// Check for rate limit
			if (res.status === 429) {
				const retryAfter = res.headers.get('Retry-After');
				const delay = retryAfter ? parseInt(retryAfter) * 1000 : (1000 * Math.pow(2, i));
				console.warn(`Rate limited, retrying after ${delay}ms`);
				await new Promise(resolve => setTimeout(resolve, delay));
				continue;
			}

			if (!res.ok) throw new Error(`Limitless API error: ${res.status}`);
			return await res.json();
		} catch (err) {
			if (i === retries - 1) {
				console.error(`fetchStandings(${tournamentId}) failed after ${retries} retries:`, err);
				return [];
			}
			await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
		}
	}
	return [];
}
