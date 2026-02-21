/**
 * Demo HTML template with Tournament Tracker
 */

export function generateDemoHTML() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>TCG Companion - Tournament Tracker</title>
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

		/* Header with Auth */
		header {
			background: white;
			border-radius: 12px;
			padding: 30px;
			margin-bottom: 30px;
			box-shadow: 0 4px 6px rgba(0,0,0,0.1);
			display: flex;
			justify-content: space-between;
			align-items: center;
			flex-wrap: wrap;
			gap: 20px;
		}
		h1 { color: #667eea; margin-bottom: 5px; }
		.subtitle { color: #666; font-size: 14px; }

		/* Auth UI */
		#authSection { display: flex; align-items: center; gap: 15px; }
		#loginBtn {
			background: #4285f4;
			padding: 10px 20px;
			border-radius: 6px;
			color: white;
			border: none;
			font-weight: 600;
			cursor: pointer;
			display: flex;
			align-items: center;
			gap: 8px;
		}
		#loginBtn:hover { background: #357ae8; }
		#userProfile {
			display: none;
			align-items: center;
			gap: 12px;
		}
		#userAvatar {
			width: 40px;
			height: 40px;
			border-radius: 50%;
			border: 2px solid #667eea;
		}
		#userName { font-weight: 600; color: #667eea; }
		#logoutBtn {
			background: #f44336;
			padding: 8px 16px;
			border-radius: 6px;
			color: white;
			border: none;
			cursor: pointer;
			font-size: 13px;
		}
		#logoutBtn:hover { background: #d32f2f; }

		/* Controls */
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
		select, input, textarea {
			padding: 8px 12px;
			border: 2px solid #e0e0e0;
			border-radius: 6px;
			font-size: 14px;
			font-family: inherit;
		}
		textarea {
			min-height: 80px;
			resize: vertical;
		}
		select:focus, input:focus, textarea:focus {
			outline: none;
			border-color: #667eea;
		}
		option:disabled {
			color: #999;
			font-style: italic;
		}
		button {
			padding: 10px 20px;
			background: #667eea;
			color: white;
			border: none;
			border-radius: 6px;
			font-weight: 600;
			cursor: pointer;
			transition: background 0.2s;
		}
		button:hover { background: #5568d3; }
		button:disabled { background: #ccc; cursor: not-allowed; }
		button.secondary {
			background: #6c757d;
		}
		button.secondary:hover { background: #5a6268; }
		button.danger {
			background: #dc3545;
		}
		button.danger:hover { background: #c82333; }

		/* Sections */
		.section {
			background: white;
			border-radius: 12px;
			padding: 25px;
			margin-bottom: 30px;
			box-shadow: 0 4px 6px rgba(0,0,0,0.1);
		}
		.section-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20px;
		}
		h2 { color: #667eea; font-size: 22px; }
		.loading { text-align: center; padding: 40px; color: #999; }
		.error {
			background: #fee;
			border: 2px solid #fcc;
			border-radius: 8px;
			padding: 15px;
			color: #c33;
			margin-bottom: 20px;
		}
		.info {
			background: #e7f3ff;
			border: 2px solid #b3d9ff;
			border-radius: 8px;
			padding: 15px;
			color: #004085;
			margin-bottom: 20px;
		}

		/* Deck Grid */
		.deck-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
			gap: 20px;
		}
		@media (max-width: 600px) {
			.deck-grid {
				grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			}
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

		/* Tournament Cards */
		.tournament-card {
			background: #f8f9fa;
			border-radius: 10px;
			padding: 20px;
			margin-bottom: 20px;
			border-left: 4px solid #667eea;
		}
		.tournament-header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 15px;
			flex-wrap: wrap;
			gap: 10px;
		}
		.tournament-title {
			flex: 1;
			min-width: 200px;
		}
		.tournament-title h3 {
			font-size: 20px;
			color: #333;
			margin-bottom: 5px;
		}
		.tournament-meta {
			font-size: 13px;
			color: #666;
		}
		.tournament-actions {
			display: flex;
			gap: 8px;
		}
		.tournament-actions button {
			padding: 6px 12px;
			font-size: 12px;
		}
		.deck-badge {
			display: inline-block;
			background: #667eea;
			color: white;
			padding: 4px 12px;
			border-radius: 12px;
			font-size: 12px;
			font-weight: 600;
			margin-top: 8px;
		}

		/* Matches Grid */
		.matches-grid {
			display: flex;
			flex-direction: column;
			gap: 8px;
			margin: 15px 0;
		}
		.match-item {
			display: grid;
			grid-template-columns: 50px 1fr 1fr 100px auto;
			gap: 12px;
			padding: 12px;
			border-radius: 6px;
			align-items: center;
			font-size: 14px;
		}
		.match-item.win {
			background: #d4edda;
			border-left: 4px solid #28a745;
		}
		.match-item.loss {
			background: #f8d7da;
			border-left: 4px solid #dc3545;
		}
		.match-item.tie {
			background: #fff3cd;
			border-left: 4px solid #ffc107;
		}
		.match-round {
			font-weight: 700;
			color: #667eea;
		}
		.match-opponent {
			font-weight: 600;
		}
		.match-deck {
			color: #666;
			font-size: 13px;
		}
		.match-result {
			font-weight: 700;
			text-transform: uppercase;
		}
		.match-actions button {
			padding: 4px 8px;
			font-size: 11px;
		}

		/* Stats */
		.stats-box {
			background: #f8f9fa;
			padding: 15px;
			border-radius: 8px;
			margin-top: 15px;
		}
		.stats-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
			gap: 15px;
		}
		.stat-item {
			text-align: center;
		}
		.stat-value {
			font-size: 28px;
			font-weight: 700;
			color: #667eea;
		}
		.stat-label {
			font-size: 12px;
			color: #666;
			text-transform: uppercase;
			margin-top: 4px;
		}

		/* Modal */
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
			max-width: 600px;
			width: 100%;
			max-height: 90vh;
			overflow-y: auto;
			position: relative;
		}
		.modal h3 {
			color: #667eea;
			margin-bottom: 20px;
			font-size: 22px;
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
			line-height: 1;
		}
		.close-modal:hover { background: #e0e0e0; }
		.form-group {
			margin-bottom: 20px;
		}
		.form-group label {
			display: block;
			margin-bottom: 8px;
			font-size: 14px;
			font-weight: 600;
			color: #333;
			text-transform: none;
		}
		.form-group input,
		.form-group select,
		.form-group textarea {
			width: 100%;
		}
		.form-actions {
			display: flex;
			gap: 10px;
			justify-content: flex-end;
			margin-top: 25px;
		}

		/* Deck Selector in Modal */
		.deck-selector-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
			gap: 10px;
			max-height: 300px;
			overflow-y: auto;
			padding: 10px;
			border: 2px solid #e0e0e0;
			border-radius: 8px;
		}
		.deck-selector-item {
			cursor: pointer;
			padding: 10px;
			border-radius: 8px;
			border: 2px solid transparent;
			text-align: center;
			transition: all 0.2s;
		}
		.deck-selector-item:hover {
			border-color: #667eea;
			background: #f0f0ff;
		}
		.deck-selector-item.selected {
			border-color: #667eea;
			background: #e7f3ff;
		}
		.deck-selector-image {
			width: 100%;
			height: 80px;
			object-fit: contain;
			margin-bottom: 8px;
		}
		.deck-selector-name {
			font-size: 11px;
			font-weight: 600;
			color: #333;
		}

		/* Result Buttons */
		.result-buttons {
			display: flex;
			gap: 10px;
			margin: 15px 0;
		}
		.result-btn {
			flex: 1;
			padding: 15px;
			font-size: 16px;
			border: 3px solid transparent;
		}
		.result-btn[data-result="win"] {
			background: #d4edda;
			color: #155724;
		}
		.result-btn[data-result="win"]:hover,
		.result-btn[data-result="win"].selected {
			border-color: #28a745;
			background: #c3e6cb;
		}
		.result-btn[data-result="loss"] {
			background: #f8d7da;
			color: #721c24;
		}
		.result-btn[data-result="loss"]:hover,
		.result-btn[data-result="loss"].selected {
			border-color: #dc3545;
			background: #f5c6cb;
		}
		.result-btn[data-result="tie"] {
			background: #fff3cd;
			color: #856404;
		}
		.result-btn[data-result="tie"]:hover,
		.result-btn[data-result="tie"].selected {
			border-color: #ffc107;
			background: #ffeaa7;
		}

		/* Badges */
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

		/* Empty State */
		.empty-state {
			text-align: center;
			padding: 60px 20px;
			color: #999;
		}
		.empty-state-icon {
			font-size: 64px;
			margin-bottom: 20px;
		}
		.empty-state-text {
			font-size: 18px;
			margin-bottom: 10px;
		}
		.empty-state-subtext {
			font-size: 14px;
			color: #aaa;
		}
	</style>
</head>
<body>
	<div class="container">
		<header>
			<div>
				<h1>TCG Companion</h1>
				<p class="subtitle">Multi-game meta tracker + tournament tracker</p>
			</div>
			<div id="authSection">
				<button id="loginBtn" onclick="signInWithGoogle()">
					<span>🔐</span>
					<span>Sign in with Google</span>
				</button>
				<div id="userProfile">
					<img id="userAvatar" src="" alt="User">
					<span id="userName"></span>
					<button id="logoutBtn" onclick="signOut()">Logout</button>
				</div>
			</div>
		</header>

		<div class="controls">
			<div class="control-group">
				<label>Game</label>
				<select id="game" onchange="loadData()">
					<option value="pokemon" selected>Pokémon TCG</option>
					<option value="magic" disabled>Magic (Coming Soon)</option>
					<option value="riftbound" disabled>Riftbound (Coming Soon)</option>
				</select>
			</div>

			<div class="control-group">
				<label>Days</label>
				<select id="days" onchange="loadData()">
					<option value="3">Last 3 Days</option>
					<option value="7" selected>Last 7 Days</option>
					<option value="14">Last 14 Days</option>
					<option value="30">Last 30 Days</option>
				</select>
			</div>

			<div class="control-group">
				<label>Format</label>
				<select id="format" onchange="loadData()">
					<option value="standard" selected>Standard</option>
					<option value="expanded">Expanded</option>
				</select>
			</div>

			<div class="control-group">
				<label>Limit</label>
				<input type="number" id="limit" value="10" min="5" max="20" onchange="loadData()">
			</div>

			<button id="refreshBtn" onclick="loadData()">Refresh</button>
		</div>

		<div id="errorContainer"></div>

		<!-- Tournament Tracker Section (only visible when logged in) -->
		<div class="section" id="myTournamentsSection" style="display: none;">
			<div class="section-header">
				<h2>📋 My Tournaments</h2>
				<button onclick="showCreateTournamentModal()">+ Create Tournament</button>
			</div>
			<div id="myTournamentsList"></div>
		</div>

		<!-- Meta Decks Section -->
		<div class="section">
			<h2>🔥 Top Meta Decks <span id="metaCacheBadge"></span></h2>
			<div id="metaDecks" class="loading">Loading...</div>
		</div>
	</div>

	<!-- Create/Edit Tournament Modal -->
	<div id="tournamentModal" class="modal">
		<div class="modal-content">
			<button class="close-modal" onclick="closeTournamentModal()">&times;</button>
			<h3 id="tournamentModalTitle">Create Tournament</h3>
			<form id="tournamentForm" onsubmit="handleSaveTournament(event)">
				<input type="hidden" id="tournamentId">

				<div class="form-group">
					<label>Tournament Name *</label>
					<input type="text" id="tournamentName" required placeholder="e.g., Regional Detroit">
				</div>

				<div class="form-group">
					<label>Date *</label>
					<input type="date" id="tournamentDate" required>
				</div>

				<div class="form-group">
					<label>Format *</label>
					<select id="tournamentFormat" required>
						<option value="standard">Standard</option>
						<option value="expanded">Expanded</option>
					</select>
				</div>

				<div class="form-group">
					<label>Location (optional)</label>
					<input type="text" id="tournamentLocation" placeholder="e.g., Detroit, MI">
				</div>

				<div class="form-group">
					<label>Your Deck (optional)</label>
					<input type="text" id="selectedDeckName" readonly placeholder="Click to select from meta">
					<input type="hidden" id="selectedDeckImageUrl">
					<div id="deckSelectorContainer" style="display: none; margin-top: 10px;">
						<div class="deck-selector-grid" id="deckSelectorGrid"></div>
					</div>
					<button type="button" onclick="toggleDeckSelector()" style="margin-top: 8px;">
						Select Deck from Meta
					</button>
				</div>

				<div class="form-group">
					<label>Notes (optional)</label>
					<textarea id="tournamentNotes" placeholder="Any notes about this tournament..."></textarea>
				</div>

				<div class="form-actions">
					<button type="button" class="secondary" onclick="closeTournamentModal()">Cancel</button>
					<button type="submit">Save Tournament</button>
				</div>
			</form>
		</div>
	</div>

	<!-- Add/Edit Match Modal -->
	<div id="matchModal" class="modal">
		<div class="modal-content">
			<button class="close-modal" onclick="closeMatchModal()">&times;</button>
			<h3 id="matchModalTitle">Add Match</h3>
			<form id="matchForm" onsubmit="handleSaveMatch(event)">
				<input type="hidden" id="matchId">
				<input type="hidden" id="matchTournamentId">
				<input type="hidden" id="matchResult">
				<input type="hidden" id="matchOpponentDeckImageUrl">

				<div class="form-group">
					<label>Round *</label>
					<input type="number" id="matchRound" required min="1" placeholder="1">
				</div>

				<div class="form-group">
					<label>Opponent *</label>
					<input type="text" id="matchOpponent" required placeholder="John Doe">
				</div>

				<div class="form-group">
					<label>Opponent's Deck *</label>
					<input type="text" id="matchOpponentDeck" readonly required placeholder="Select from meta">
					<div id="matchDeckSelectorContainer" style="display: none; margin-top: 10px;">
						<div class="deck-selector-grid" id="matchDeckSelectorGrid"></div>
					</div>
					<button type="button" onclick="toggleMatchDeckSelector()" style="margin-top: 8px;">
						Select Deck from Meta
					</button>
				</div>

				<div class="form-group">
					<label>Result *</label>
					<div class="result-buttons">
						<button type="button" class="result-btn" data-result="win" onclick="selectResult('win')">
							WIN
						</button>
						<button type="button" class="result-btn" data-result="loss" onclick="selectResult('loss')">
							LOSS
						</button>
						<button type="button" class="result-btn" data-result="tie" onclick="selectResult('tie')">
							TIE
						</button>
					</div>
				</div>

				<div class="form-group">
					<label>Score (optional)</label>
					<div style="display: flex; gap: 10px; align-items: center;">
						<input type="number" id="matchMyScore" min="0" max="3" placeholder="My score">
						<span>-</span>
						<input type="number" id="matchOpponentScore" min="0" max="3" placeholder="Opponent">
					</div>
				</div>

				<div class="form-group">
					<label>Notes (optional)</label>
					<textarea id="matchNotes" placeholder="Quick notes about this match..."></textarea>
				</div>

				<div class="form-actions">
					<button type="button" class="secondary" onclick="closeMatchModal()">Cancel</button>
					<button type="submit">Save Match</button>
				</div>
			</form>
		</div>
	</div>

	<!-- Deck Details Modal -->
	<div id="deckDetailsModal" class="modal">
		<div class="modal-content" style="max-width: 900px;">
			<button class="close-modal" onclick="closeDeckDetailsModal()">&times;</button>
			<div id="deckDetailsContent">
				<div class="loading">Loading deck details...</div>
			</div>
		</div>
	</div>

	<!-- Firebase SDK (ESM imports) -->
	<script type="module">
		import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
		import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut as fbSignOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

		// TODO: Replace with your Firebase config
		// Get from Firebase Console → Project Settings → Web app
		const firebaseConfig = {
			apiKey: "REPLACE_WITH_YOUR_API_KEY",
			authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
			projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
		};

		let app, auth;
		let currentUser = null;
		let idToken = null;

		// Initialize Firebase (only if config is valid)
		if (firebaseConfig.apiKey !== "REPLACE_WITH_YOUR_API_KEY") {
			try {
				app = initializeApp(firebaseConfig);
				auth = getAuth(app);

				// Listen for auth state changes
				onAuthStateChanged(auth, async (user) => {
					if (user) {
						currentUser = user;
						idToken = await user.getIdToken();
						updateAuthUI(user);
						loadMyTournaments();
					} else {
						currentUser = null;
						idToken = null;
						updateAuthUI(null);
					}
				});
			} catch (err) {
				console.error('Firebase init error:', err);
			}
		}

		// Sign in with Google
		window.signInWithGoogle = async function() {
			if (!auth) {
				showError('Firebase not configured. See FIREBASE_SETUP.md');
				return;
			}

			const provider = new GoogleAuthProvider();
			try {
				const result = await signInWithPopup(auth, provider);
				// onAuthStateChanged will handle the UI update
			} catch (error) {
				console.error('Login failed:', error);
				showError('Login failed: ' + error.message);
			}
		};

		// Sign out
		window.signOut = async function() {
			if (!auth) return;
			try {
				await fbSignOut(auth);
				// onAuthStateChanged will handle the UI update
			} catch (error) {
				console.error('Logout failed:', error);
			}
		};

		// Update auth UI
		function updateAuthUI(user) {
			const loginBtn = document.getElementById('loginBtn');
			const userProfile = document.getElementById('userProfile');
			const myTournamentsSection = document.getElementById('myTournamentsSection');

			if (user) {
				loginBtn.style.display = 'none';
				userProfile.style.display = 'flex';
				document.getElementById('userAvatar').src = user.photoURL || '';
				document.getElementById('userName').textContent = user.displayName || user.email;
				myTournamentsSection.style.display = 'block';
			} else {
				loginBtn.style.display = 'flex';
				userProfile.style.display = 'none';
				myTournamentsSection.style.display = 'none';
			}
		}

		// Make functions available globally
		window.getIdToken = () => idToken;
		window.getCurrentUser = () => currentUser;
	</script>

	<script>
		// Global state
		let metaDecksCache = [];
		let myTournaments = [];
		let currentTournamentMatches = {};

		// Load initial data
		loadData();

		// Load meta and (optionally) tournaments
		async function loadData() {
			const game = document.getElementById('game').value;
			const days = document.getElementById('days').value;
			const format = document.getElementById('format').value;
			const limit = document.getElementById('limit').value;
			const refreshBtn = document.getElementById('refreshBtn');

			refreshBtn.disabled = true;
			document.getElementById('errorContainer').innerHTML = '';

			try {
				await loadMetaDecks(game, days, format, limit);
			} catch (error) {
				console.error('Error loading data:', error);
				showError('Failed to load data: ' + error.message);
			} finally {
				refreshBtn.disabled = false;
			}
		}

		// Load meta decks
		async function loadMetaDecks(game, days, format, limit) {
			const container = document.getElementById('metaDecks');
			container.innerHTML = '<div class="loading">Loading meta decks...</div>';

			try {
				const res = await fetch(\`/v1/\${game}/meta/top?days=\${days}&format=\${format}&limit=\${limit}\`);

				if (res.status === 501) {
					container.innerHTML = '<div class="info">🚧 This game is not yet supported. Currently only Pokémon TCG is available.</div>';
					return;
				}

				if (!res.ok) throw new Error(\`HTTP \${res.status}\`);

				const cacheStatus = res.headers.get('X-Cache');
				updateCacheBadge('metaCacheBadge', cacheStatus);

				const data = await res.json();

				if (data.decks.length === 0) {
					container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">No decks found</div><div class="empty-state-subtext">Try adjusting the filters</div></div>';
					return;
				}

				// Cache for deck selector
				metaDecksCache = data.decks;

				container.innerHTML = '';
				const grid = document.createElement('div');
				grid.className = 'deck-grid';

				data.decks.forEach(deck => {
					const card = document.createElement('div');
					card.className = 'deck-card';

					const setColor = deck.setColor || '#808080';
					const deckName = deck.name || 'Unknown';
					const deckCount = deck.count || 0;
					const setCode = deck.setCode || 'Unknown';

					let imageHtml = '';
					if (deck.image) {
						imageHtml = \`<img src="\${deck.image}" alt="\${deckName}" style="height: 100%; width: auto; object-fit: contain;" onerror="this.style.display='none'">\`;
					} else {
						imageHtml = \`<span style="color: white; font-size: 12px; font-weight: bold; text-transform: uppercase;">\${setCode}</span>\`;
					}

					card.innerHTML = \`
						<div class="deck-image" style="background-color: \${setColor}; display: flex; align-items: center; justify-content: center;">
							\${imageHtml}
						</div>
						<div class="deck-name">\${deckName}</div>
						<div class="deck-count">\${deckCount} appearances</div>
					\`;

					// Add click handler to show deck details
					card.style.cursor = 'pointer';
					card.onclick = () => showDeckDetails(deckName);

					grid.appendChild(card);
				});

				container.appendChild(grid);
			} catch (error) {
				console.error('loadMetaDecks error:', error);
				container.innerHTML = \`<div class="error">Failed to load meta decks: \${error.message}</div>\`;
			}
		}

		// Load my tournaments
		async function loadMyTournaments() {
			const idToken = window.getIdToken();
			if (!idToken) return;

			const container = document.getElementById('myTournamentsList');
			container.innerHTML = '<div class="loading">Loading your tournaments...</div>';

			try {
				const game = document.getElementById('game').value;
				const res = await fetch(\`/v1/user/tournaments?game=\${game}\`, {
					headers: { 'Authorization': \`Bearer \${idToken}\` }
				});

				if (!res.ok) {
					if (res.status === 401) {
						throw new Error('Session expired. Please login again.');
					}
					throw new Error(\`HTTP \${res.status}\`);
				}

				const data = await res.json();
				myTournaments = data.tournaments || [];

				if (myTournaments.length === 0) {
					container.innerHTML = \`
						<div class="empty-state">
							<div class="empty-state-icon">🎯</div>
							<div class="empty-state-text">No tournaments yet</div>
							<div class="empty-state-subtext">Click "Create Tournament" to get started</div>
						</div>
					\`;
					return;
				}

				// Load matches for each tournament
				for (const tournament of myTournaments) {
					await loadTournamentMatches(tournament.id);
				}

				// Render tournaments
				container.innerHTML = '';
				myTournaments.forEach(tournament => {
					container.appendChild(renderTournamentCard(tournament));
				});

			} catch (error) {
				console.error('loadMyTournaments error:', error);
				container.innerHTML = \`<div class="error">Failed to load tournaments: \${error.message}</div>\`;
			}
		}

		// Load matches for a tournament
		async function loadTournamentMatches(tournamentId) {
			const idToken = window.getIdToken();
			if (!idToken) return;

			try {
				const res = await fetch(\`/v1/user/matches?tournamentId=\${tournamentId}\`, {
					headers: { 'Authorization': \`Bearer \${idToken}\` }
				});

				if (!res.ok) throw new Error(\`HTTP \${res.status}\`);

				const data = await res.json();
				currentTournamentMatches[tournamentId] = {
					matches: data.matches || [],
					stats: data.stats || { wins: 0, losses: 0, ties: 0, totalGames: 0, winRate: 0 }
				};
			} catch (error) {
				console.error(\`loadTournamentMatches(\${tournamentId}) error:\`, error);
				currentTournamentMatches[tournamentId] = { matches: [], stats: {} };
			}
		}

		// Render tournament card
		function renderTournamentCard(tournament) {
			const card = document.createElement('div');
			card.className = 'tournament-card';

			const matchData = currentTournamentMatches[tournament.id] || { matches: [], stats: {} };
			const matches = matchData.matches;
			const stats = matchData.stats;

			const date = new Date(tournament.date).toLocaleDateString();
			const deckBadge = tournament.deckName
				? \`<span class="deck-badge">🎴 \${tournament.deckName}</span>\`
				: '';

			let matchesHtml = '';
			if (matches.length > 0) {
				matchesHtml = '<div class="matches-grid">';
				matches.forEach(match => {
					matchesHtml += \`
						<div class="match-item \${match.result}">
							<div class="match-round">R\${match.round}</div>
							<div class="match-opponent">\${match.opponent}</div>
							<div class="match-deck">\${match.opponentDeck}</div>
							<div class="match-result">\${match.result.toUpperCase()}</div>
							<div class="match-actions">
								<button class="danger" onclick="deleteMatch('\${tournament.id}', '\${match.id}')">Delete</button>
							</div>
						</div>
					\`;
				});
				matchesHtml += '</div>';
			}

			let statsHtml = '';
			if (stats.totalGames > 0) {
				statsHtml = \`
					<div class="stats-box">
						<div class="stats-grid">
							<div class="stat-item">
								<div class="stat-value">\${stats.wins}</div>
								<div class="stat-label">Wins</div>
							</div>
							<div class="stat-item">
								<div class="stat-value">\${stats.losses}</div>
								<div class="stat-label">Losses</div>
							</div>
							<div class="stat-item">
								<div class="stat-value">\${stats.ties}</div>
								<div class="stat-label">Ties</div>
							</div>
							<div class="stat-item">
								<div class="stat-value">\${stats.winRate.toFixed(1)}%</div>
								<div class="stat-label">Win Rate</div>
							</div>
						</div>
					</div>
				\`;
			}

			card.innerHTML = \`
				<div class="tournament-header">
					<div class="tournament-title">
						<h3>\${tournament.name}</h3>
						<div class="tournament-meta">\${date} • \${tournament.format} • \${tournament.location || 'No location'}</div>
						\${deckBadge}
					</div>
					<div class="tournament-actions">
						<button onclick="showAddMatchModal('\${tournament.id}')">+ Add Match</button>
						<button class="secondary" onclick="editTournament('\${tournament.id}')">Edit</button>
						<button class="danger" onclick="deleteTournament('\${tournament.id}')">Delete</button>
					</div>
				</div>
				\${matchesHtml}
				\${statsHtml}
			\`;

			return card;
		}

		// Show create tournament modal
		function showCreateTournamentModal() {
			document.getElementById('tournamentModalTitle').textContent = 'Create Tournament';
			document.getElementById('tournamentForm').reset();
			document.getElementById('tournamentId').value = '';
			document.getElementById('tournamentModal').classList.add('active');

			// Set default date to today
			document.getElementById('tournamentDate').valueAsDate = new Date();

			// Set game and format from current filters
			document.getElementById('tournamentFormat').value = document.getElementById('format').value;
		}

		// Close tournament modal
		function closeTournamentModal() {
			document.getElementById('tournamentModal').classList.remove('active');
			document.getElementById('deckSelectorContainer').style.display = 'none';
		}

		// Toggle deck selector
		function toggleDeckSelector() {
			const container = document.getElementById('deckSelectorContainer');
			const grid = document.getElementById('deckSelectorGrid');

			if (container.style.display === 'none') {
				// Show and populate
				container.style.display = 'block';
				grid.innerHTML = '';

				metaDecksCache.forEach(deck => {
					const item = document.createElement('div');
					item.className = 'deck-selector-item';
					item.onclick = () => selectDeck(deck);

					let imageHtml = '';
					if (deck.image) {
						imageHtml = \`<img src="\${deck.image}" class="deck-selector-image" alt="\${deck.name}">\`;
					} else {
						imageHtml = \`<div class="deck-selector-image" style="background: \${deck.setColor || '#ccc'}"></div>\`;
					}

					item.innerHTML = \`
						\${imageHtml}
						<div class="deck-selector-name">\${deck.name}</div>
					\`;

					grid.appendChild(item);
				});
			} else {
				container.style.display = 'none';
			}
		}

		// Select deck
		function selectDeck(deck) {
			document.getElementById('selectedDeckName').value = deck.name;
			document.getElementById('selectedDeckImageUrl').value = deck.image || '';
			document.getElementById('deckSelectorContainer').style.display = 'none';

			// Highlight selected
			document.querySelectorAll('#deckSelectorGrid .deck-selector-item').forEach(item => {
				item.classList.remove('selected');
			});
			event.currentTarget.classList.add('selected');
		}

		// Handle save tournament
		async function handleSaveTournament(event) {
			event.preventDefault();

			const idToken = window.getIdToken();
			if (!idToken) {
				showError('Please login first');
				return;
			}

			const tournamentId = document.getElementById('tournamentId').value;
			const isEdit = !!tournamentId;

			const data = {
				game: document.getElementById('game').value,
				name: document.getElementById('tournamentName').value,
				date: new Date(document.getElementById('tournamentDate').value).toISOString(),
				format: document.getElementById('tournamentFormat').value,
				location: document.getElementById('tournamentLocation').value || null,
				deckName: document.getElementById('selectedDeckName').value || null,
				deckImageUrl: document.getElementById('selectedDeckImageUrl').value || null,
				notes: document.getElementById('tournamentNotes').value || null,
			};

			try {
				const url = isEdit
					? \`/v1/user/tournaments/\${tournamentId}\`
					: '/v1/user/tournaments';
				const method = isEdit ? 'PUT' : 'POST';

				const res = await fetch(url, {
					method,
					headers: {
						'Authorization': \`Bearer \${idToken}\`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(data)
				});

				if (!res.ok) {
					const error = await res.json();
					throw new Error(error.error || 'Failed to save tournament');
				}

				closeTournamentModal();
				await loadMyTournaments();
			} catch (error) {
				console.error('handleSaveTournament error:', error);
				showError('Failed to save tournament: ' + error.message);
			}
		}

		// Edit tournament
		async function editTournament(tournamentId) {
			const tournament = myTournaments.find(t => t.id === tournamentId);
			if (!tournament) return;

			document.getElementById('tournamentModalTitle').textContent = 'Edit Tournament';
			document.getElementById('tournamentId').value = tournament.id;
			document.getElementById('tournamentName').value = tournament.name;
			document.getElementById('tournamentDate').value = tournament.date.split('T')[0];
			document.getElementById('tournamentFormat').value = tournament.format;
			document.getElementById('tournamentLocation').value = tournament.location || '';
			document.getElementById('selectedDeckName').value = tournament.deckName || '';
			document.getElementById('selectedDeckImageUrl').value = tournament.deckImageUrl || '';
			document.getElementById('tournamentNotes').value = tournament.notes || '';

			document.getElementById('tournamentModal').classList.add('active');
		}

		// Delete tournament
		async function deleteTournament(tournamentId) {
			if (!confirm('Delete this tournament and all its matches?')) return;

			const idToken = window.getIdToken();
			if (!idToken) return;

			try {
				const res = await fetch(\`/v1/user/tournaments/\${tournamentId}\`, {
					method: 'DELETE',
					headers: { 'Authorization': \`Bearer \${idToken}\` }
				});

				if (!res.ok) throw new Error(\`HTTP \${res.status}\`);

				await loadMyTournaments();
			} catch (error) {
				console.error('deleteTournament error:', error);
				showError('Failed to delete tournament: ' + error.message);
			}
		}

		// Show add match modal
		function showAddMatchModal(tournamentId) {
			document.getElementById('matchModalTitle').textContent = 'Add Match';
			document.getElementById('matchForm').reset();
			document.getElementById('matchId').value = '';
			document.getElementById('matchTournamentId').value = tournamentId;
			document.getElementById('matchResult').value = '';

			// Set next round number
			const matches = currentTournamentMatches[tournamentId]?.matches || [];
			const nextRound = matches.length > 0
				? Math.max(...matches.map(m => m.round)) + 1
				: 1;
			document.getElementById('matchRound').value = nextRound;

			// Clear result selection
			document.querySelectorAll('.result-btn').forEach(btn => btn.classList.remove('selected'));

			document.getElementById('matchModal').classList.add('active');
		}

		// Close match modal
		function closeMatchModal() {
			document.getElementById('matchModal').classList.remove('active');
			document.getElementById('matchDeckSelectorContainer').style.display = 'none';
		}

		// Toggle match deck selector
		function toggleMatchDeckSelector() {
			const container = document.getElementById('matchDeckSelectorContainer');
			const grid = document.getElementById('matchDeckSelectorGrid');

			if (container.style.display === 'none') {
				container.style.display = 'block';
				grid.innerHTML = '';

				metaDecksCache.forEach(deck => {
					const item = document.createElement('div');
					item.className = 'deck-selector-item';
					item.onclick = () => selectMatchDeck(deck);

					let imageHtml = '';
					if (deck.image) {
						imageHtml = \`<img src="\${deck.image}" class="deck-selector-image" alt="\${deck.name}">\`;
					} else {
						imageHtml = \`<div class="deck-selector-image" style="background: \${deck.setColor || '#ccc'}"></div>\`;
					}

					item.innerHTML = \`
						\${imageHtml}
						<div class="deck-selector-name">\${deck.name}</div>
					\`;

					grid.appendChild(item);
				});
			} else {
				container.style.display = 'none';
			}
		}

		// Select match deck
		function selectMatchDeck(deck) {
			document.getElementById('matchOpponentDeck').value = deck.name;
			document.getElementById('matchOpponentDeckImageUrl').value = deck.image || '';
			document.getElementById('matchDeckSelectorContainer').style.display = 'none';

			// Highlight selected
			document.querySelectorAll('#matchDeckSelectorGrid .deck-selector-item').forEach(item => {
				item.classList.remove('selected');
			});
			event.currentTarget.classList.add('selected');
		}

		// Show deck details modal
		async function showDeckDetails(deckName) {
			const modal = document.getElementById('deckDetailsModal');
			const content = document.getElementById('deckDetailsContent');

			modal.classList.add('active');
			content.innerHTML = '<div class="loading">Loading deck details...</div>';

			try {
				const game = document.getElementById('game').value;
				const days = document.getElementById('days').value;
				const format = document.getElementById('format').value;

				const res = await fetch(\`/v1/\${game}/meta/deck/\${encodeURIComponent(deckName)}?days=\${days}&format=\${format}\`);

				if (!res.ok) {
					throw new Error(\`HTTP \${res.status}\`);
				}

				const data = await res.json();
				const deck = data.deck;

				let html = \`<h3>\${deck.name}</h3>\`;
				html += \`<p style="color: #666; margin-bottom: 20px;">\${deck.appearances} appearances in last \${days} days</p>\`;

				// Main card
				if (deck.mainCard && deck.image) {
					html += \`
						<div style="text-align: center; margin-bottom: 30px;">
							<img src="\${deck.image}" alt="\${deck.mainCard.name}" style="max-height: 300px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
							<p style="margin-top: 10px; font-weight: 600;">\${deck.mainCard.name}</p>
						</div>
					\`;
				}

				// Card list
				if (deck.cardList) {
					const renderCardSection = (cards, title) => {
						if (!cards || cards.length === 0) return '';
						let section = \`<h4 style="margin-top: 25px; margin-bottom: 15px; color: #667eea;">\${title} (\${cards.reduce((sum, c) => sum + c.count, 0)})</h4>\`;
						section += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px;">';
						cards.forEach(card => {
							section += \`
								<div style="text-align: center;">
									<img src="\${card.image}" alt="\${card.name}" style="width: 100%; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22140%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22140%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2212%22%3E\${card.set}%3C/text%3E%3C/svg%3E'">
									<div style="font-size: 11px; margin-top: 5px; font-weight: 600;">\${card.count}x</div>
									<div style="font-size: 10px; color: #666;">\${card.name}</div>
								</div>
							\`;
						});
						section += '</div>';
						return section;
					};

					html += renderCardSection(deck.cardList.pokemon, 'Pokémon');
					html += renderCardSection(deck.cardList.trainer, 'Trainer');
					html += renderCardSection(deck.cardList.energy, 'Energy');
				}

				content.innerHTML = html;

			} catch (error) {
				console.error('showDeckDetails error:', error);
				content.innerHTML = \`<div class="error">Failed to load deck details: \${error.message}</div>\`;
			}
		}

		// Close deck details modal
		function closeDeckDetailsModal() {
			document.getElementById('deckDetailsModal').classList.remove('active');
		}

		// Make showDeckDetails available globally
		window.showDeckDetails = showDeckDetails;

		// Select result
		function selectResult(result) {
			document.getElementById('matchResult').value = result;
			document.querySelectorAll('.result-btn').forEach(btn => {
				btn.classList.remove('selected');
			});
			event.currentTarget.classList.add('selected');
		}

		// Handle save match
		async function handleSaveMatch(event) {
			event.preventDefault();

			const idToken = window.getIdToken();
			if (!idToken) {
				showError('Please login first');
				return;
			}

			const result = document.getElementById('matchResult').value;
			if (!result) {
				showError('Please select a result (Win/Loss/Tie)');
				return;
			}

			const matchId = document.getElementById('matchId').value;
			const isEdit = !!matchId;

			const data = {
				tournamentId: document.getElementById('matchTournamentId').value,
				game: document.getElementById('game').value,
				round: parseInt(document.getElementById('matchRound').value),
				opponent: document.getElementById('matchOpponent').value,
				opponentDeck: document.getElementById('matchOpponentDeck').value,
				opponentDeckImageUrl: document.getElementById('matchOpponentDeckImageUrl').value || null,
				result: result,
				myScore: parseInt(document.getElementById('matchMyScore').value) || null,
				opponentScore: parseInt(document.getElementById('matchOpponentScore').value) || null,
				notes: document.getElementById('matchNotes').value || null,
			};

			try {
				const url = isEdit
					? \`/v1/user/matches/\${matchId}\`
					: '/v1/user/matches';
				const method = isEdit ? 'PUT' : 'POST';

				const res = await fetch(url, {
					method,
					headers: {
						'Authorization': \`Bearer \${idToken}\`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(data)
				});

				if (!res.ok) {
					const error = await res.json();
					throw new Error(error.error || 'Failed to save match');
				}

				closeMatchModal();
				await loadMyTournaments();
			} catch (error) {
				console.error('handleSaveMatch error:', error);
				showError('Failed to save match: ' + error.message);
			}
		}

		// Delete match
		async function deleteMatch(tournamentId, matchId) {
			if (!confirm('Delete this match?')) return;

			const idToken = window.getIdToken();
			if (!idToken) return;

			try {
				const res = await fetch(\`/v1/user/matches/\${matchId}\`, {
					method: 'DELETE',
					headers: { 'Authorization': \`Bearer \${idToken}\` }
				});

				if (!res.ok) throw new Error(\`HTTP \${res.status}\`);

				await loadMyTournaments();
			} catch (error) {
				console.error('deleteMatch error:', error);
				showError('Failed to delete match: ' + error.message);
			}
		}

		// Update cache badge
		function updateCacheBadge(badgeId, cacheStatus) {
			const badge = document.getElementById(badgeId);
			if (cacheStatus === 'HIT') {
				badge.innerHTML = '<span class="cache-badge cache-hit">CACHED</span>';
			} else if (cacheStatus === 'MISS') {
				badge.innerHTML = '<span class="cache-badge cache-miss">FRESH</span>';
			}
		}

		// Show error
		function showError(message) {
			const container = document.getElementById('errorContainer');
			container.innerHTML = \`<div class="error">\${message}</div>\`;
			setTimeout(() => container.innerHTML = '', 5000);
		}
	</script>
</body>
</html>`;
}
