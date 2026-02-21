#!/usr/bin/env node
/**
 * Image Validation Script
 * Scans all decks and validates every card image URL
 */

const API = 'http://127.0.0.1:8787';

async function validateAllImages() {
	console.log('🔍 Starting image validation scan...\n');

	const results = {
		totalDecks: 0,
		totalImages: 0,
		successImages: 0,
		failedImages: 0,
		failures: []
	};

	try {
		// Get all decks from meta
		console.log('📊 Fetching meta decks...');
		const metaRes = await fetch(`${API}/v1/meta/top?days=14`);
		const metaData = await metaRes.json();
		const decks = metaData.decks || [];

		results.totalDecks = decks.length;
		console.log(`✅ Found ${decks.length} decks\n`);

		// Validate each deck's images
		for (let i = 0; i < decks.length; i++) {
			const deck = decks[i];
			console.log(`\n[${i + 1}/${decks.length}] Validating deck: ${deck.name}`);

			// Validate main deck image
			if (deck.image) {
				results.totalImages++;
				const status = await checkImage(deck.image);
				if (status === 200) {
					results.successImages++;
					console.log(`  ✅ Main image: OK`);
				} else {
					results.failedImages++;
					results.failures.push({
						deck: deck.name,
						card: 'Main Image',
						url: deck.image,
						status
					});
					console.log(`  ❌ Main image: FAILED (${status})`);
				}
			}

			// Get deck details to check all card images
			const deckRes = await fetch(`${API}/v1/meta/deck/${encodeURIComponent(deck.name)}?days=14`);

			if (!deckRes.ok) {
				console.log(`  ⚠️  Could not fetch deck details (${deckRes.status})`);
				continue;
			}

			const deckData = await deckRes.json();
			const cardList = deckData.deck?.cardList;

			if (!cardList) {
				console.log(`  ⚠️  No card list available`);
				continue;
			}

			// Validate all card images
			const allCards = [
				...(cardList.pokemon || []),
				...(cardList.trainer || []),
				...(cardList.energy || [])
			];

			console.log(`  🃏 Checking ${allCards.length} cards...`);

			let deckSuccess = 0;
			let deckFailed = 0;

			for (const card of allCards) {
				if (card.image) {
					results.totalImages++;
					const status = await checkImage(card.image);
					if (status === 200) {
						results.successImages++;
						deckSuccess++;
					} else {
						results.failedImages++;
						deckFailed++;
						results.failures.push({
							deck: deck.name,
							card: card.name,
							set: card.set,
							number: card.number,
							url: card.image,
							status
						});
					}
				}
			}

			if (deckFailed > 0) {
				console.log(`  ⚠️  ${deckSuccess} OK, ${deckFailed} FAILED`);
			} else {
				console.log(`  ✅ All ${deckSuccess} cards OK`);
			}

			// Small delay to avoid hammering the CDN
			await new Promise(resolve => setTimeout(resolve, 200));
		}

		// Print summary
		console.log('\n' + '='.repeat(60));
		console.log('📊 VALIDATION SUMMARY');
		console.log('='.repeat(60));
		console.log(`Total decks scanned:    ${results.totalDecks}`);
		console.log(`Total images checked:   ${results.totalImages}`);
		console.log(`✅ Successful:          ${results.successImages} (${((results.successImages / results.totalImages) * 100).toFixed(1)}%)`);
		console.log(`❌ Failed:              ${results.failedImages} (${((results.failedImages / results.totalImages) * 100).toFixed(1)}%)`);

		if (results.failures.length > 0) {
			console.log('\n' + '='.repeat(60));
			console.log('❌ FAILED IMAGES DETAILS');
			console.log('='.repeat(60));

			// Group failures by deck
			const byDeck = {};
			results.failures.forEach(f => {
				if (!byDeck[f.deck]) byDeck[f.deck] = [];
				byDeck[f.deck].push(f);
			});

			for (const [deckName, failures] of Object.entries(byDeck)) {
				console.log(`\n${deckName}:`);
				failures.forEach(f => {
					console.log(`  ❌ ${f.card} (${f.set} ${f.number})`);
					console.log(`     ${f.url}`);
					console.log(`     Status: ${f.status}`);
				});
			}
		}

		console.log('\n✅ Scan complete!');
		process.exit(results.failedImages > 0 ? 1 : 0);

	} catch (error) {
		console.error('❌ Fatal error:', error);
		process.exit(1);
	}
}

async function checkImage(url) {
	try {
		const res = await fetch(url, { method: 'HEAD' });
		return res.status;
	} catch (error) {
		return 'ERROR';
	}
}

validateAllImages();
