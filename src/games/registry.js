/**
 * Game Adapter Registry
 * Manages different TCG game adapters (Pokemon, Magic, etc.)
 */

/**
 * Base class for game adapters
 * All game adapters must implement these methods
 */
export class GameAdapter {
	constructor(game) {
		this.game = game;
	}

	/**
	 * Fetch recent tournaments
	 * @param {number} days - Number of days to look back
	 * @param {string} format - Game format (standard, expanded, etc.)
	 * @param {number} limit - Max tournaments to fetch
	 * @returns {Promise<Array>} Tournament list
	 */
	async fetchTournaments(days, format, limit) {
		throw new Error('fetchTournaments not implemented');
	}

	/**
	 * Fetch standings for a tournament
	 * @param {string} tournamentId - Tournament ID
	 * @returns {Promise<Array>} Standings array
	 */
	async fetchStandings(tournamentId) {
		throw new Error('fetchStandings not implemented');
	}

	/**
	 * Fetch detailed deck info
	 * @param {string} deckName - Deck name
	 * @param {number} days - Number of days to look back
	 * @param {string} format - Game format
	 * @returns {Promise<object|null>} Deck info or null
	 */
	async fetchDeckDetails(deckName, days, format) {
		throw new Error('fetchDeckDetails not implemented');
	}

	/**
	 * Extract main card from decklist
	 * @param {object} decklist - Decklist object
	 * @returns {object|null} Main card info
	 */
	extractMainCard(decklist) {
		throw new Error('extractMainCard not implemented');
	}

	/**
	 * Enhance card list with images
	 * @param {object} decklist - Decklist object
	 * @returns {object} Enhanced decklist
	 */
	enhanceCardListWithImages(decklist) {
		throw new Error('enhanceCardListWithImages not implemented');
	}

	/**
	 * Get card image URL
	 * @param {string} cardSet - Card set code
	 * @param {string} cardNumber - Card number
	 * @param {string} size - Image size
	 * @returns {string|null} Image URL
	 */
	getCardImageUrl(cardSet, cardNumber, size) {
		throw new Error('getCardImageUrl not implemented');
	}

	/**
	 * Get deck URL on external site
	 * @param {string} deckId - Deck ID
	 * @returns {string} Deck URL
	 */
	getDeckUrl(deckId) {
		throw new Error('getDeckUrl not implemented');
	}

	/**
	 * Build cache key for meta data
	 */
	getMetaCacheKey(format, days, limit) {
		return `${this.game}:meta:top:${format}:${days}:${limit}`;
	}

	/**
	 * Build cache key for tournaments
	 */
	getTournamentsCacheKey(format, days, limit) {
		return `${this.game}:tournaments:recent:${format}:${days}:${limit}`;
	}

	/**
	 * Build cache key for deck details
	 */
	getDeckCacheKey(deckName, format, days) {
		return `${this.game}:deck:${deckName}:${format}:${days}`;
	}
}

/**
 * Game Adapter Registry
 * Singleton that manages all game adapters
 */
class AdapterRegistry {
	constructor() {
		this.adapters = new Map();
	}

	/**
	 * Register a game adapter
	 */
	register(game, adapter) {
		if (!(adapter instanceof GameAdapter)) {
			throw new Error('Adapter must extend GameAdapter class');
		}
		this.adapters.set(game.toLowerCase(), adapter);
	}

	/**
	 * Get adapter for a game
	 */
	get(game) {
		return this.adapters.get(game.toLowerCase());
	}

	/**
	 * Check if game is supported
	 */
	isSupported(game) {
		return this.adapters.has(game.toLowerCase());
	}

	/**
	 * Get list of supported games
	 */
	getSupportedGames() {
		return Array.from(this.adapters.keys());
	}
}

// Export singleton instance
export const gameRegistry = new AdapterRegistry();
