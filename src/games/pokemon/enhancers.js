/**
 * Pokemon TCG card enhancement utilities
 */

import { LIMITLESS_CDN_BASE, SET_COLORS, DEFAULT_SET_COLOR } from './constants.js';

/**
 * Extract main card from deck (prioritize "ex" cards, then first pokemon)
 */
export function extractMainCard(decklist) {
	if (!decklist || !decklist.pokemon || decklist.pokemon.length === 0) {
		return null;
	}

	// First, try to find an "ex" card
	const exCard = decklist.pokemon.find(card => card.name && card.name.includes('ex'));
	if (exCard) {
		return { name: exCard.name, set: exCard.set, number: exCard.number };
	}

	// Otherwise, return first pokemon
	const firstCard = decklist.pokemon[0];
	return { name: firstCard.name, set: firstCard.set, number: firstCard.number };
}

/**
 * Get card image URL using Limitless CDN
 * No API call needed - construct URL directly
 * Format: https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/[SET]/[SET]_[CARD_ID]_R_EN_[SIZE].png
 */
export function getCardImageUrl(cardSet, cardNumber, size = 'SM') {
	if (!cardSet || !cardNumber) return null;
	// Zero-pad card number to 3 digits (MEG_086 not MEG_86)
	const paddedNumber = cardNumber.toString().padStart(3, '0');
	return `${LIMITLESS_CDN_BASE}/${cardSet}/${cardSet}_${paddedNumber}_R_EN_${size}.png`;
}

/**
 * Get set color for visual identification
 * Returns a color code for each Pokemon TCG set
 */
export function getSetColor(cardSet) {
	if (!cardSet) return DEFAULT_SET_COLOR;
	return SET_COLORS[cardSet.toUpperCase()] || DEFAULT_SET_COLOR;
}

/**
 * Enhance card list with images from Limitless CDN
 */
export function enhanceCardListWithImages(decklist) {
	if (!decklist) return decklist;

	const enhanced = { ...decklist };

	// Function to add images to cards
	const addImagesToCards = (cards) => {
		if (!Array.isArray(cards)) return cards;

		return cards.map(card => {
			// Use Limitless CDN for images
			if (card.set && card.number) {
				card.image = getCardImageUrl(card.set, card.number, 'SM');
			}
			return card;
		});
	};

	// Add images to all card types
	if (enhanced.pokemon) {
		enhanced.pokemon = addImagesToCards(enhanced.pokemon);
	}
	if (enhanced.trainer) {
		enhanced.trainer = addImagesToCards(enhanced.trainer);
	}
	if (enhanced.energy) {
		enhanced.energy = addImagesToCards(enhanced.energy);
	}

	return enhanced;
}

/**
 * Aggregate decks from standings with main card info
 */
export async function aggregateDecks(standingsArray) {
	const deckMap = {};

	// Aggregate deck info
	standingsArray.forEach(standing => {
		if (standing.deck && standing.deck.name) {
			const deckName = standing.deck.name;
			if (!deckMap[deckName]) {
				deckMap[deckName] = {
					name: deckName,
					count: 0,
					mainCard: extractMainCard(standing.decklist),
					deckId: standing.deck.id,
					icons: standing.deck.icons || [],
				};
			}
			deckMap[deckName].count++;
		}
	});

	// Add URLs and images for visual identification
	Object.values(deckMap).forEach(deck => {
		if (deck.mainCard) {
			deck.setColor = getSetColor(deck.mainCard.set);
			deck.setCode = deck.mainCard.set;
			// Use main card image from Limitless CDN (large size)
			deck.image = getCardImageUrl(deck.mainCard.set, deck.mainCard.number, 'LG');
		}
		// Limitless deck URL
		deck.deckUrl = `https://play.limitlesstcg.com/deck/${deck.deckId}`;
	});

	const decks = Object.values(deckMap);

	// Sort by count descending
	return decks.sort((a, b) => b.count - a.count);
}
