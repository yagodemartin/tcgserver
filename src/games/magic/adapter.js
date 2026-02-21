/**
 * Magic: The Gathering Game Adapter (Stub - Phase 2)
 */

import { GameAdapter } from '../registry.js';

export class MagicAdapter extends GameAdapter {
	constructor() {
		super('magic');
	}

	async fetchTournaments(days, format, limit) {
		throw new Error('Magic: The Gathering support coming soon (Phase 2)');
	}

	async fetchStandings(tournamentId) {
		throw new Error('Magic: The Gathering support coming soon (Phase 2)');
	}

	async fetchDeckDetails(deckName, days, format) {
		throw new Error('Magic: The Gathering support coming soon (Phase 2)');
	}

	extractMainCard(decklist) {
		throw new Error('Magic: The Gathering support coming soon (Phase 2)');
	}

	enhanceCardListWithImages(decklist) {
		throw new Error('Magic: The Gathering support coming soon (Phase 2)');
	}

	getCardImageUrl(cardSet, cardNumber, size) {
		throw new Error('Magic: The Gathering support coming soon (Phase 2)');
	}

	getDeckUrl(deckId) {
		throw new Error('Magic: The Gathering support coming soon (Phase 2)');
	}
}
