/**
 * Pokemon TCG Game Adapter
 */

import { GameAdapter } from '../registry.js';
import { fetchTournaments, fetchStandings } from './limitless.js';
import {
	extractMainCard,
	getCardImageUrl,
	getSetColor,
	enhanceCardListWithImages,
	aggregateDecks,
} from './enhancers.js';

export class PokemonAdapter extends GameAdapter {
	constructor() {
		super('pokemon');
	}

	/**
	 * Fetch recent tournaments from Limitless API
	 */
	async fetchTournaments(days, format, limit) {
		return await fetchTournaments(days, format, limit);
	}

	/**
	 * Fetch standings for a tournament
	 */
	async fetchStandings(tournamentId) {
		return await fetchStandings(tournamentId);
	}

	/**
	 * Fetch detailed deck info by aggregating tournament standings
	 */
	async fetchDeckDetails(deckName, days = 7, format = 'standard') {
		const tournaments = await this.fetchTournaments(days, format, 50);

		if (tournaments.length === 0) {
			return null;
		}

		const deckInfo = {
			name: deckName,
			appearances: 0,
			topPlacements: [],
			cardList: null,
			mainCard: null,
		};

		// Process only first 5 tournaments to avoid rate limiting
		const tournamentsToProcess = tournaments.slice(0, 5);

		for (let i = 0; i < tournamentsToProcess.length; i++) {
			const tournament = tournamentsToProcess[i];
			const standings = await this.fetchStandings(tournament.id);

			standings.forEach(standing => {
				if (standing.deck && standing.deck.name === deckName) {
					deckInfo.appearances++;

					// Record top 8 placements
					if (standing.placing <= 8) {
						deckInfo.topPlacements.push({
							placing: standing.placing,
							player: standing.name,
							tournament: tournament.name,
							date: tournament.date,
							record: standing.record,
						});
					}

					// Get card list from first occurrence
					if (standing.decklist && !deckInfo.cardList) {
						deckInfo.cardList = standing.decklist;
						deckInfo.mainCard = this.extractMainCard(standing.decklist);
					}
				}
			});

			// Delay between requests to respect rate limiting
			if (i < tournamentsToProcess.length - 1) {
				await new Promise(resolve => setTimeout(resolve, 500));
			}
		}

		// Enhance card list with images if found
		if (deckInfo.cardList) {
			deckInfo.cardList = this.enhanceCardListWithImages(deckInfo.cardList);
		}

		return deckInfo.appearances > 0 ? deckInfo : null;
	}

	/**
	 * Extract main card from decklist
	 */
	extractMainCard(decklist) {
		return extractMainCard(decklist);
	}

	/**
	 * Enhance card list with images
	 */
	enhanceCardListWithImages(decklist) {
		return enhanceCardListWithImages(decklist);
	}

	/**
	 * Get card image URL
	 */
	getCardImageUrl(cardSet, cardNumber, size = 'SM') {
		return getCardImageUrl(cardSet, cardNumber, size);
	}

	/**
	 * Get deck URL on Limitless
	 */
	getDeckUrl(deckId) {
		return `https://play.limitlesstcg.com/deck/${deckId}`;
	}

	/**
	 * Get set color for visual identification
	 */
	getSetColor(cardSet) {
		return getSetColor(cardSet);
	}

	/**
	 * Aggregate decks from standings
	 */
	async aggregateDecks(standingsArray) {
		return await aggregateDecks(standingsArray);
	}
}
