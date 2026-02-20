/**
 * Pokémon TCG Companion Backend
 * Cloudflare Worker - Public API Layer
 */

const LIMITLESS_API_BASE = 'https://play.limitlesstcg.com/api';
const POKEMONTCG_API = 'https://api.pokemontcg.io/v2';

// Cache for card images to avoid repeated lookups
const imageCache = new Map();

/**
 * Fetch tournaments from Limitless API
 */
async function fetchTournaments(days = 7, format = 'standard', limit = 50) {
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
		if (!res.ok) throw new Error(`API error: ${res.status}`);

		const data = await res.json();
		// Filter tournaments from last N days
		// API returns array directly, not wrapped in .tournaments
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
 */
async function fetchStandings(tournamentId, retries = 3) {
	for (let i = 0; i < retries; i++) {
		try {
			const res = await fetch(`${LIMITLESS_API_BASE}/tournaments/${tournamentId}/standings`);

			// Check for rate limit
			if (res.status === 429) {
				const retryAfter = res.headers.get('Retry-After');
				const delay = retryAfter ? parseInt(retryAfter) * 1000 : (1000 * Math.pow(2, i));
				console.log(`Rate limited, waiting ${delay}ms before retry ${i + 1}/${retries}`);
				await new Promise(resolve => setTimeout(resolve, delay));
				continue;
			}

			if (!res.ok) throw new Error(`API error: ${res.status}`);
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

/**
 * Extract main card from deck (prioritize "ex" cards, then first pokemon)
 */
function extractMainCard(decklist) {
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
 * Get card image URL using Limitless CDN (no API call needed)
 * URL format: https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/[SET]/[SET]_[CARD_ID]_R_EN_[SIZE].png
 */
function getCardImageUrl(cardSet, cardNumber, size = 'SM') {
	if (!cardSet || !cardNumber) return null;
	const url = `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${cardSet}/${cardSet}_${cardNumber}_R_EN_${size}.png`;
	return url;
}

/**
 * Get Pokemon artwork URL from official Pokémon API
 */
function getPokemonImageUrl(iconName) {
	// Icons come as "pokemon-name" or "pokemon-mega", convert to PokéAPI format
	const cleanName = iconName
		.toLowerCase()
		.replace(/-/g, '_')
		.replace(/mega|ex|v$/i, '')
		.trim();

	// PokéAPI official artwork
	return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${cleanName}.png`;
}

/**
 * Get set color/brand - returns a color code for each Pokemon TCG set
 * Used for visual identification instead of images
 */
function getSetColor(cardSet) {
	const setColors = {
		// Current era
		'TWM': '#8B4789', // Twilight Masquerade - Purple
		'PRE': '#22B14C', // Primal Energy - Green
		'OBF': '#FF8C00', // Obsidian Flames - Orange
		'PAL': '#1E90FF', // Paldean Fates - Blue
		'SVI': '#DC143C', // Scarlet & Violet - Red
		'MEG': '#FFD700', // Magneton Meta - Gold
		'TEF': '#20B2AA', // Temporal Forces - Teal
		'ASC': '#9370DB', // Ancient Roar - Indigo
		'DRI': '#FF6347', // Dragon Tera - Coral
		'MEW': '#00CED1', // Mewtwo - Cyan
		'PAF': '#FF69B4', // Paldean Future - Pink
		'PFL': '#8B7355', // Paldean Fates - Brown
		'SCR': '#4169E1', // Scarlet - Royal Blue
		'SLV': '#C0C0C0', // Silver - Silver
		'SHF': '#FF4500', // Shining Fates - Red-Orange
		'SVP': '#DA70D6', // Sword/Shield Purple
	};

	return setColors[cardSet.toUpperCase()] || '#808080'; // Default gray
}

/**
 * Enhance card list with images from Limitless CDN
 */
function enhanceCardListWithImages(decklist) {
	if (!decklist) return decklist;

	const enhanced = { ...decklist };

	// Function to add images to cards
	const addImagesToCards = (cards) => {
		if (!Array.isArray(cards)) return cards;

		return cards.map(card => {
			// Use Limitless CDN for images - construct URL directly from card set and number
			card.image = getCardImageUrl(card.set, card.number, 'SM');
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
async function aggregateDecks(standingsArray) {
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
		}
		// Limitless deck URL
		deck.deckUrl = `https://play.limitlesstcg.com/deck/${deck.deckId}`;

		// Get Pokémon images (up to 3)
		if (deck.icons && deck.icons.length > 0) {
			deck.pokemonImages = deck.icons.slice(0, 3).map(icon => getPokemonImageUrl(icon));
			// Primary image is first Pokémon
			deck.image = deck.pokemonImages[0];
		}
	});

	const decks = Object.values(deckMap);

	// Sort by count descending
	return decks.sort((a, b) => b.count - a.count);
}

/**
 * GET /v1/meta/top - Return top meta decks
 */
async function handleMetaTop(request, env, ctx) {
	const url = new URL(request.url);
	const days = parseInt(url.searchParams.get('days')) || 7;
	const format = (url.searchParams.get('format') || 'standard').toLowerCase();
	const limit = parseInt(url.searchParams.get('limit')) || 10;

	// Cache key
	const cacheKey = `meta:top:${format}:${days}:${limit}`;

	try {
		// Check cache first
		const cached = await env.KVDB.get(cacheKey);
		if (cached) {
			return new Response(cached, {
				headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
			});
		}

		// Fetch tournaments
		const tournaments = await fetchTournaments(days, format, 50);
		console.log(`Found ${tournaments.length} tournaments in last ${days} days`);

		if (tournaments.length === 0) {
			return new Response(JSON.stringify({
				updated_at: new Date().toISOString(),
				format,
				days,
				decks: [],
				message: 'No tournaments found'
			}), {
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// MVP: Process only first 15 tournaments to avoid rate limiting
		// In production, this would be better with pagination or background jobs
		const tournamentsToProcess = tournaments.slice(0, 15);
		console.log(`Processing ${tournamentsToProcess.length} tournaments (rate limit protection)`);

		// Fetch standings for each tournament with delays
		const allStandings = [];
		for (let i = 0; i < tournamentsToProcess.length; i++) {
			const tournament = tournamentsToProcess[i];
			const standings = await fetchStandings(tournament.id);
			allStandings.push(...standings);

			// Delay between requests to respect rate limiting (MVP: 500ms)
			if (i < tournamentsToProcess.length - 1) {
				await new Promise(resolve => setTimeout(resolve, 500));
			}
		}

		// Aggregate and sort decks (now async to fetch images)
		const allDecks = await aggregateDecks(allStandings);
		const decks = allDecks.slice(0, limit);

		const response = {
			updated_at: new Date().toISOString(),
			format,
			days,
			decks,
		};

		const responseJson = JSON.stringify(response);

		// Cache for 12 hours (43200 seconds)
		ctx.waitUntil(env.KVDB.put(cacheKey, responseJson, { expirationTtl: 43200 }));

		return new Response(responseJson, {
			headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
		});
	} catch (err) {
		console.error('handleMetaTop error:', err);
		return new Response(JSON.stringify({
			error: 'Internal server error',
			message: err.message,
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

/**
 * GET /v1/tournaments/recent - Return recent tournaments
 */
async function handleTournamentsRecent(request, env, ctx) {
	const url = new URL(request.url);
	const days = parseInt(url.searchParams.get('days')) || 7;
	const format = (url.searchParams.get('format') || 'standard').toLowerCase();
	const limit = parseInt(url.searchParams.get('limit')) || 50;

	const cacheKey = `tournaments:recent:${format}:${days}:${limit}`;

	try {
		const cached = await env.KVDB.get(cacheKey);
		if (cached) {
			return new Response(cached, {
				headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
			});
		}

		const tournaments = await fetchTournaments(days, format, limit);

		const response = {
			updated_at: new Date().toISOString(),
			format,
			days,
			count: tournaments.length,
			tournaments: tournaments.map(t => ({
				id: t.id,
				name: t.name,
				date: t.date,
				players: t.players || 0,
				format: t.format,
			})),
		};

		const responseJson = JSON.stringify(response);
		ctx.waitUntil(env.KVDB.put(cacheKey, responseJson, { expirationTtl: 21600 }));

		return new Response(responseJson, {
			headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
		});
	} catch (err) {
		console.error('handleTournamentsRecent error:', err);
		return new Response(JSON.stringify({
			error: 'Internal server error',
			message: err.message,
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

/**
 * Fetch deck details by aggregating tournament standings
 */
async function fetchDeckDetails(deckName, days = 7, format = 'standard') {
	const tournaments = await fetchTournaments(days, format, 50);

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

	const tournamentsToProcess = tournaments.slice(0, 15);

	for (let i = 0; i < tournamentsToProcess.length; i++) {
		const tournament = tournamentsToProcess[i];
		const standings = await fetchStandings(tournament.id);

		standings.forEach(standing => {
			if (standing.deck && standing.deck.name === deckName) {
				deckInfo.appearances++;

				if (standing.placing <= 8) {
					deckInfo.topPlacements.push({
						placing: standing.placing,
						player: standing.name,
						tournament: tournament.name,
						date: tournament.date,
						record: standing.record,
					});
				}

				if (standing.decklist && !deckInfo.cardList) {
					deckInfo.cardList = standing.decklist;
					deckInfo.mainCard = extractMainCard(standing.decklist);
				}
			}
		});

		if (i < tournamentsToProcess.length - 1) {
			await new Promise(resolve => setTimeout(resolve, 500));
		}
	}

	// Enhance card list with images if we found one
	if (deckInfo.cardList) {
		console.log(`Adding card images for ${deckInfo.name}...`);
		deckInfo.cardList = enhanceCardListWithImages(deckInfo.cardList);
	}

	return deckInfo.appearances > 0 ? deckInfo : null;
}

/**
 * GET /v1/meta/deck/:deckName - Get detailed deck info
 */
async function handleDeckDetails(request, env, ctx, deckName) {
	const url = new URL(request.url);
	const days = parseInt(url.searchParams.get('days')) || 7;
	const format = (url.searchParams.get('format') || 'standard').toLowerCase();

	const decodedDeckName = decodeURIComponent(deckName);
	const cacheKey = `deck:${decodedDeckName}:${format}:${days}`;

	try {
		const cached = await env.KVDB.get(cacheKey);
		if (cached) {
			return new Response(cached, {
				headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
			});
		}

		const deckInfo = await fetchDeckDetails(decodedDeckName, days, format);

		if (!deckInfo) {
			return new Response(JSON.stringify({
				error: 'Deck not found',
				message: `No recent data found for deck: ${decodedDeckName}`,
			}), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		if (deckInfo.mainCard) {
			deckInfo.setColor = getSetColor(deckInfo.mainCard.set);
			deckInfo.setCode = deckInfo.mainCard.set;
		}

		const response = {
			updated_at: new Date().toISOString(),
			format,
			days,
			deck: deckInfo,
		};

		const responseJson = JSON.stringify(response);
		ctx.waitUntil(env.KVDB.put(cacheKey, responseJson, { expirationTtl: 43200 }));

		return new Response(responseJson, {
			headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
		});
	} catch (err) {
		console.error('handleDeckDetails error:', err);
		return new Response(JSON.stringify({
			error: 'Internal server error',
			message: err.message,
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

/**
 * Generate demo HTML page
 */
function generateDemoHTML() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Pokemon TCG Meta - Demo</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			min-height: 100vh;
			padding: 20px;
			color: #333;
		}
		.container { max-width: 1200px; margin: 0 auto; }
		header {
			background: white;
			border-radius: 12px;
			padding: 30px;
			margin-bottom: 30px;
			box-shadow: 0 4px 6px rgba(0,0,0,0.1);
		}
		h1 { color: #667eea; margin-bottom: 10px; }
		.subtitle { color: #666; font-size: 14px; }
		.controls {
			background: white;
			border-radius: 12px;
			padding: 20px;
			margin-bottom: 30px;
			box-shadow: 0 4px 6px rgba(0,0,0,0.1);
			display: flex;
			gap: 15px;
			flex-wrap: wrap;
			align-items: flex-end;
		}
		.control-group {
			display: flex;
			flex-direction: column;
			gap: 5px;
		}
		label {
			font-size: 12px;
			font-weight: 600;
			color: #666;
			text-transform: uppercase;
		}
		select, input {
			padding: 8px 12px;
			border: 2px solid #e0e0e0;
			border-radius: 6px;
			font-size: 14px;
		}
		select:focus, input:focus {
			outline: none;
			border-color: #667eea;
		}
		button {
			padding: 10px 20px;
			background: #667eea;
			color: white;
			border: none;
			border-radius: 6px;
			font-weight: 600;
			cursor: pointer;
		}
		button:hover { background: #5568d3; }
		button:disabled { background: #ccc; cursor: not-allowed; }
		.section {
			background: white;
			border-radius: 12px;
			padding: 25px;
			margin-bottom: 30px;
			box-shadow: 0 4px 6px rgba(0,0,0,0.1);
		}
		h2 { color: #667eea; margin-bottom: 20px; font-size: 22px; }
		.loading { text-align: center; padding: 40px; color: #999; }
		.error {
			background: #fee;
			border: 2px solid #fcc;
			border-radius: 8px;
			padding: 15px;
			color: #c33;
			margin-bottom: 20px;
		}
		.deck-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
			gap: 20px;
		}
		.deck-card {
			background: #f8f9fa;
			border-radius: 10px;
			padding: 15px;
			cursor: pointer;
			border: 2px solid transparent;
			transition: all 0.2s;
		}
		.deck-card:hover {
			transform: translateY(-4px);
			box-shadow: 0 6px 12px rgba(0,0,0,0.15);
			border-color: #667eea;
		}
		.deck-image {
			width: 100%;
			height: 200px;
			object-fit: contain;
			border-radius: 8px;
			margin-bottom: 12px;
			background: white;
		}
		.deck-name { font-weight: 600; font-size: 16px; margin-bottom: 8px; }
		.deck-count { color: #667eea; font-size: 14px; font-weight: 600; }
		.tournament-list { display: flex; flex-direction: column; gap: 12px; }
		.tournament-item {
			background: #f8f9fa;
			padding: 15px;
			border-radius: 8px;
			border-left: 4px solid #667eea;
		}
		.tournament-name { font-weight: 600; margin-bottom: 5px; }
		.tournament-meta { font-size: 13px; color: #666; }
		.modal {
			display: none;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0,0,0,0.7);
			z-index: 1000;
			padding: 20px;
			overflow-y: auto;
		}
		.modal.active {
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.modal-content {
			background: white;
			border-radius: 12px;
			padding: 30px;
			max-width: 900px;
			width: 100%;
			max-height: 90vh;
			overflow-y: auto;
			position: relative;
		}
		.close-modal {
			position: absolute;
			top: 15px;
			right: 15px;
			background: #f0f0f0;
			border: none;
			width: 32px;
			height: 32px;
			border-radius: 50%;
			cursor: pointer;
			font-size: 20px;
		}
		.close-modal:hover { background: #e0e0e0; }
		.card-section { margin-bottom: 25px; }
		.card-section h3 { color: #667eea; margin-bottom: 12px; font-size: 16px; text-transform: uppercase; }
		.card-list { display: flex; flex-direction: column; gap: 8px; }
		.card-item {
			background: #f8f9fa;
			padding: 10px 15px;
			border-radius: 6px;
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 15px;
		}
		.card-image-thumb {
			width: 50px;
			height: 70px;
			border-radius: 4px;
			background: white;
			border: 1px solid #ddd;
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
		}
		.card-image-thumb img {
			max-width: 100%;
			max-height: 100%;
			object-fit: contain;
		}
		.card-count {
			background: #667eea;
			color: white;
			padding: 4px 10px;
			border-radius: 12px;
			font-size: 12px;
			font-weight: 600;
		}
		.cache-badge {
			display: inline-block;
			padding: 4px 8px;
			border-radius: 4px;
			font-size: 11px;
			font-weight: 600;
			margin-left: 10px;
		}
		.cache-hit { background: #d4edda; color: #155724; }
		.cache-miss { background: #fff3cd; color: #856404; }
	</style>
</head>
<body>
	<div class="container">
		<header>
			<h1>Pokemon TCG Meta Dashboard</h1>
			<p class="subtitle">Live tournament data powered by Cloudflare Workers + Limitless API</p>
		</header>

		<div class="controls">
			<div class="control-group">
				<label>Days</label>
				<select id="days">
					<option value="3">Last 3 Days</option>
					<option value="7" selected>Last 7 Days</option>
					<option value="14">Last 14 Days</option>
					<option value="30">Last 30 Days</option>
				</select>
			</div>

			<div class="control-group">
				<label>Format</label>
				<select id="format">
					<option value="standard" selected>Standard</option>
					<option value="expanded">Expanded</option>
				</select>
			</div>

			<div class="control-group">
				<label>Limit</label>
				<input type="number" id="limit" value="10" min="5" max="20">
			</div>

			<button id="refreshBtn" onclick="loadData()">Refresh Data</button>
		</div>

		<div id="errorContainer"></div>

		<div class="section">
			<h2>Top Meta Decks <span id="metaCacheBadge"></span></h2>
			<div id="metaDecks" class="loading">Loading...</div>
		</div>

		<div class="section">
			<h2>Recent Tournaments <span id="tournamentCacheBadge"></span></h2>
			<div id="tournaments" class="loading">Loading...</div>
		</div>
	</div>

	<div id="deckModal" class="modal">
		<div class="modal-content">
			<button class="close-modal" onclick="closeModal()">&times;</button>
			<div id="modalContent"></div>
		</div>
	</div>

	<script>
		async function loadData() {
			const days = document.getElementById('days').value;
			const format = document.getElementById('format').value;
			const limit = document.getElementById('limit').value;
			const refreshBtn = document.getElementById('refreshBtn');

			refreshBtn.disabled = true;
			document.getElementById('errorContainer').innerHTML = '';

			try {
				await Promise.all([
					loadMetaDecks(days, format, limit),
					loadTournaments(days, format)
				]);
			} catch (error) {
				showError('Failed to load data: ' + error.message);
			} finally {
				refreshBtn.disabled = false;
			}
		}

		async function loadMetaDecks(days, format, limit) {
			const container = document.getElementById('metaDecks');
			container.innerHTML = '<div class="loading">Loading meta decks...</div>';

			try {
				const res = await fetch(\`/v1/meta/top?days=\${days}&format=\${format}&limit=\${limit}\`);
				if (!res.ok) throw new Error(\`HTTP \${res.status}\`);

				const cacheStatus = res.headers.get('X-Cache');
				updateCacheBadge('metaCacheBadge', cacheStatus);

				const data = await res.json();

				if (data.decks.length === 0) {
					container.innerHTML = '<p class="loading">No decks found for this period.</p>';
					return;
				}

				container.innerHTML = '';
				const grid = document.createElement('div');
				grid.className = 'deck-grid';

				data.decks.forEach(deck => {
					const card = document.createElement('div');
					card.className = 'deck-card';
					card.onclick = () => showDeckDetails(deck.name, days, format);

					const setColor = deck.setColor || '#808080';
					let imageHtml = '';
					if (deck.image) {
						imageHtml = '<img src="' + deck.image + '" alt="' + deck.name + '" style="height: 100%; width: auto; object-fit: contain;">';
					} else {
						imageHtml = '<span style="color: white; font-size: 12px; font-weight: bold; text-transform: uppercase;">' + (deck.setCode || 'Unknown') + '</span>';
					}

					card.innerHTML = '<div class="deck-image" style="background-color: ' + setColor + '; display: flex; align-items: center; justify-content: center; position: relative;">' +
						imageHtml +
						'</div>' +
						'<div class="deck-name">' + deck.name + '</div>' +
						'<div class="deck-count">' + deck.count + ' appearances</div>' +
						'<a href="' + deck.deckUrl + '" target="_blank" style="display: inline-block; margin-top: 8px; padding: 4px 8px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; font-size: 11px; font-weight: 600;">Ver Deck</a>';

					grid.appendChild(card);
				});

				container.appendChild(grid);
			} catch (error) {
				container.innerHTML = \`<div class="error">Failed to load meta decks: \${error.message}</div>\`;
			}
		}

		async function loadTournaments(days, format) {
			const container = document.getElementById('tournaments');
			container.innerHTML = '<div class="loading">Loading tournaments...</div>';

			try {
				const res = await fetch(\`/v1/tournaments/recent?days=\${days}&format=\${format}&limit=50\`);
				if (!res.ok) throw new Error(\`HTTP \${res.status}\`);

				const cacheStatus = res.headers.get('X-Cache');
				updateCacheBadge('tournamentCacheBadge', cacheStatus);

				const data = await res.json();

				if (data.tournaments.length === 0) {
					container.innerHTML = '<p class="loading">No tournaments found for this period.</p>';
					return;
				}

				container.innerHTML = '';
				const list = document.createElement('div');
				list.className = 'tournament-list';

				data.tournaments.slice(0, 10).forEach(tournament => {
					const item = document.createElement('div');
					item.className = 'tournament-item';

					item.innerHTML = \`
						<div class="tournament-name">\${tournament.name}</div>
						<div class="tournament-meta">
							\${new Date(tournament.date).toLocaleDateString()}
							• \${tournament.players || 'N/A'} players
							• \${tournament.format}
						</div>
					\`;

					list.appendChild(item);
				});

				container.appendChild(list);
			} catch (error) {
				container.innerHTML = \`<div class="error">Failed to load tournaments: \${error.message}</div>\`;
			}
		}

		async function showDeckDetails(deckName, days, format) {
			const modal = document.getElementById('deckModal');
			const content = document.getElementById('modalContent');

			modal.classList.add('active');
			content.innerHTML = '<div class="loading">Loading deck details...</div>';

			try {
				const res = await fetch(\`/v1/meta/deck/\${encodeURIComponent(deckName)}?days=\${days}&format=\${format}\`);
				if (!res.ok) {
					if (res.status === 404) {
						throw new Error('Deck details not available');
					}
					throw new Error(\`HTTP \${res.status}\`);
				}

				const data = await res.json();
				const deck = data.deck;

				const setColor = deck.setColor || '#808080';
				let imageHtml = '';
				if (deck.image) {
					imageHtml = '<img src="' + deck.image + '" alt="' + deck.name + '" style="height: 100%; width: auto; object-fit: contain;">';
				} else {
					imageHtml = '<span style="color: white; font-size: 18px; font-weight: bold; text-transform: uppercase;">' + (deck.setCode || 'Unknown') + '</span>';
				}

				let html = '<h2>' + deck.name + '</h2>' +
					'<p style="color: #666; margin-bottom: 10px;">' +
					deck.appearances + ' appearances in last ' + days + ' days' +
					'</p>' +
					'<a href="' + deck.deckUrl + '" target="_blank" style="display: inline-block; margin-bottom: 20px; padding: 8px 16px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">📋 Ver Deck Completo en Limitless</a>' +
					'<div style="width: 200px; height: 200px; background-color: ' + setColor + '; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center;">' +
					imageHtml +
					'</div>';

				if (deck.topPlacements && deck.topPlacements.length > 0) {
					html += '<div class="card-section"><h3>Top Placements</h3><div class="card-list">';
					deck.topPlacements.slice(0, 5).forEach(placement => {
						html += \`
							<div class="card-item">
								<div>
									<strong>#\${placement.placing}</strong> - \${placement.player} at \${placement.tournament}
									<div style="font-size: 12px; color: #666; margin-top: 4px;">
										\${placement.record.wins}-\${placement.record.losses}-\${placement.record.ties}
										• \${new Date(placement.date).toLocaleDateString()}
									</div>
								</div>
							</div>
						\`;
					});
					html += '</div></div>';
				}

				if (deck.cardList) {
					const cardList = deck.cardList;

					if (cardList.pokemon && cardList.pokemon.length > 0) {
						html += \`<div class="card-section"><h3>Pokemon (\${cardList.pokemon.length})</h3><div class="card-list">\`;
						cardList.pokemon.forEach(card => {
							const imageHtml = card.image
								? \`<div class="card-image-thumb"><img src="\${card.image}" alt="\${card.name}" /></div>\`
								: '';
							html += \`
								<div class="card-item">
									\${imageHtml}
									<span>\${card.name}</span>
									<span class="card-count">\${card.count}x</span>
								</div>
							\`;
						});
						html += '</div></div>';
					}

					if (cardList.trainer && cardList.trainer.length > 0) {
						html += \`<div class="card-section"><h3>Trainers (\${cardList.trainer.length})</h3><div class="card-list">\`;
						cardList.trainer.forEach(card => {
							const imageHtml = card.image
								? \`<div class="card-image-thumb"><img src="\${card.image}" alt="\${card.name}" /></div>\`
								: '';
							html += \`
								<div class="card-item">
									\${imageHtml}
									<span>\${card.name}</span>
									<span class="card-count">\${card.count}x</span>
								</div>
							\`;
						});
						html += '</div></div>';
					}

					if (cardList.energy && cardList.energy.length > 0) {
						html += \`<div class="card-section"><h3>Energy (\${cardList.energy.length})</h3><div class="card-list">\`;
						cardList.energy.forEach(card => {
							const imageHtml = card.image
								? \`<div class="card-image-thumb"><img src="\${card.image}" alt="\${card.name}" /></div>\`
								: '';
							html += \`
								<div class="card-item">
									\${imageHtml}
									<span>\${card.name}</span>
									<span class="card-count">\${card.count}x</span>
								</div>
							\`;
						});
						html += '</div></div>';
					}
				}

				content.innerHTML = html;
			} catch (error) {
				content.innerHTML = \`<div class="error">Failed to load deck details: \${error.message}</div>\`;
			}
		}

		function closeModal() {
			document.getElementById('deckModal').classList.remove('active');
		}

		function updateCacheBadge(badgeId, cacheStatus) {
			const badge = document.getElementById(badgeId);
			if (cacheStatus === 'HIT') {
				badge.innerHTML = '<span class="cache-badge cache-hit">CACHED</span>';
			} else if (cacheStatus === 'MISS') {
				badge.innerHTML = '<span class="cache-badge cache-miss">FRESH</span>';
			}
		}

		function showError(message) {
			const container = document.getElementById('errorContainer');
			container.innerHTML = \`<div class="error">\${message}</div>\`;
		}

		loadData();

		document.getElementById('deckModal').addEventListener('click', (e) => {
			if (e.target.id === 'deckModal') {
				closeModal();
			}
		});
	</script>
</body>
</html>`;
}

/**
 * GET / or /demo - Serve demo HTML page
 */
async function handleDemo(request, env, ctx) {
	return new Response(generateDemoHTML(), {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Cache-Control': 'public, max-age=300',
		},
	});
}

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Demo page
		if ((url.pathname === '/' || url.pathname === '/demo') && request.method === 'GET') {
			return await handleDemo(request, env, ctx);
		}

		// Health check
		if (url.pathname === '/health') {
			return new Response('OK', { status: 200 });
		}

		// GET /v1/meta/top
		if (url.pathname === '/v1/meta/top' && request.method === 'GET') {
			return await handleMetaTop(request, env, ctx);
		}

		// GET /v1/tournaments/recent
		if (url.pathname === '/v1/tournaments/recent' && request.method === 'GET') {
			return await handleTournamentsRecent(request, env, ctx);
		}

		// GET /v1/meta/deck/:deckName
		const deckMatch = url.pathname.match(/^\/v1\/meta\/deck\/([^/]+)$/);
		if (deckMatch && request.method === 'GET') {
			return await handleDeckDetails(request, env, ctx, deckMatch[1]);
		}

		// Not found
		return new Response('Not Found', { status: 404 });
	},
};
