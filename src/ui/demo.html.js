/**
 * Demo HTML template with multi-game support
 */

export function generateDemoHTML() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>TCG Companion - Multi-Game Meta Dashboard</title>
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
			<h1>TCG Companion</h1>
			<p class="subtitle">Multi-game meta tracker powered by Cloudflare Workers</p>
		</header>

		<div class="controls">
			<div class="control-group">
				<label>Game</label>
				<select id="game" onchange="loadData()">
					<option value="pokemon" selected>Pokémon TCG</option>
					<option value="magic" disabled>Magic: The Gathering (Coming Soon)</option>
					<option value="riftbound" disabled>Riftbound (Coming Soon)</option>
				</select>
			</div>

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
			const game = document.getElementById('game').value;
			const days = document.getElementById('days').value;
			const format = document.getElementById('format').value;
			const limit = document.getElementById('limit').value;
			const refreshBtn = document.getElementById('refreshBtn');

			refreshBtn.disabled = true;
			document.getElementById('errorContainer').innerHTML = '';

			try {
				await Promise.all([
					loadMetaDecks(game, days, format, limit),
					loadTournaments(game, days, format)
				]);
			} catch (error) {
				console.error('Error loading data:', error);
				showError('Failed to load data: ' + error.message);
			} finally {
				refreshBtn.disabled = false;
			}
		}

		async function loadMetaDecks(game, days, format, limit) {
			const container = document.getElementById('metaDecks');
			container.innerHTML = '<div class="loading">Loading meta decks...</div>';

			try {
				const res = await fetch(\`/v1/\${game}/meta/top?days=\${days}&format=\${format}&limit=\${limit}\`);

				if (res.status === 501) {
					container.innerHTML = '<div class="loading">🚧 This game is not yet supported. Currently only Pokémon TCG is available.</div>';
					return;
				}

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

				data.decks.forEach((deck, index) => {
					const card = document.createElement('div');
					card.className = 'deck-card';
					card.onclick = () => showDeckDetails(game, deck.name, days, format);

					const setColor = deck.setColor || '#808080';
					const deckUrl = deck.deckUrl || '#';
					const deckName = deck.name || 'Unknown';
					const deckCount = deck.count || 0;
					const setCode = deck.setCode || 'Unknown';

					let imageHtml = '';
					if (deck.image) {
						imageHtml = '<img src="' + deck.image + '" alt="' + deckName + '" style="height: 100%; width: auto; object-fit: contain;" onerror="this.style.display=\'none\'">';
					} else {
						imageHtml = '<span style="color: white; font-size: 12px; font-weight: bold; text-transform: uppercase;">' + setCode + '</span>';
					}

					card.innerHTML = '<div class="deck-image" style="background-color: ' + setColor + '; display: flex; align-items: center; justify-content: center; position: relative;">' +
						imageHtml +
						'</div>' +
						'<div class="deck-name">' + deckName + '</div>' +
						'<div class="deck-count">' + deckCount + ' appearances</div>' +
						'<a href="' + deckUrl + '" target="_blank" style="display: inline-block; margin-top: 8px; padding: 4px 8px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; font-size: 11px; font-weight: 600;">View Deck</a>';

					grid.appendChild(card);
				});

				container.appendChild(grid);
			} catch (error) {
				console.error('loadMetaDecks error:', error);
				container.innerHTML = \`<div class="error">Failed to load meta decks: \${error.message}</div>\`;
			}
		}

		async function loadTournaments(game, days, format) {
			const container = document.getElementById('tournaments');
			container.innerHTML = '<div class="loading">Loading tournaments...</div>';

			try {
				const res = await fetch(\`/v1/\${game}/tournaments/recent?days=\${days}&format=\${format}&limit=50\`);

				if (res.status === 501) {
					container.innerHTML = '<div class="loading">🚧 This game is not yet supported. Currently only Pokémon TCG is available.</div>';
					return;
				}

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

				data.tournaments.slice(0, 10).forEach((tournament, index) => {
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
				console.error('loadTournaments error:', error);
				container.innerHTML = \`<div class="error">Failed to load tournaments: \${error.message}</div>\`;
			}
		}

		async function showDeckDetails(game, deckName, days, format) {
			const modal = document.getElementById('deckModal');
			const content = document.getElementById('modalContent');

			modal.classList.add('active');
			content.innerHTML = '<div class="loading">Loading deck details...</div>';

			try {
				const res = await fetch(\`/v1/\${game}/meta/deck/\${encodeURIComponent(deckName)}?days=\${days}&format=\${format}\`);

				if (res.status === 501) {
					content.innerHTML = '<div class="loading">🚧 Deck details not available for this game yet.</div>';
					return;
				}

				if (!res.ok) {
					if (res.status === 404) {
						throw new Error('Deck details not available');
					}
					throw new Error(\`HTTP \${res.status}\`);
				}

				const data = await res.json();
				const deck = data.deck;

				if (!deck || !deck.name) {
					throw new Error('Invalid deck data received');
				}

				const setColor = deck.setColor || '#808080';
				const deckName = deck.name || 'Unknown';
				const deckAppearances = deck.appearances || 0;
				const deckUrl = deck.deckUrl || '#';
				const setCode = deck.setCode || 'Unknown';

				let imageHtml = '';
				if (deck.image) {
					imageHtml = '<img src="' + deck.image + '" alt="' + deckName + '" style="height: 100%; width: auto; object-fit: contain;" onerror="this.style.display=\'none\'">';
				} else {
					imageHtml = '<span style="color: white; font-size: 18px; font-weight: bold; text-transform: uppercase;">' + setCode + '</span>';
				}

				let html = '<h2>' + deckName + '</h2>' +
					'<p style="color: #666; margin-bottom: 10px;">' +
					deckAppearances + ' appearances in last ' + days + ' days' +
					'</p>' +
					'<a href="' + deckUrl + '" target="_blank" style="display: inline-block; margin-bottom: 20px; padding: 8px 16px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">📋 View Full Deck</a>' +
					'<div style="width: 200px; height: 200px; background-color: ' + setColor + '; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center;">' +
					imageHtml +
					'</div>';

				if (deck.topPlacements && deck.topPlacements.length > 0) {
					html += '<div class="card-section"><h3>Top Placements</h3><div class="card-list">';
					deck.topPlacements.slice(0, 5).forEach(placement => {
						const placing = placement.placing || '?';
						const player = placement.player || 'Unknown';
						const tournament = placement.tournament || 'Unknown';
						const record = placement.record || {wins: 0, losses: 0, ties: 0};
						const date = placement.date ? new Date(placement.date).toLocaleDateString() : 'Unknown';

						html += \`
							<div class="card-item">
								<div>
									<strong>#\${placing}</strong> - \${player} at \${tournament}
									<div style="font-size: 12px; color: #666; margin-top: 4px;">
										\${record.wins}-\${record.losses}-\${record.ties}
										• \${date}
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
								? \`<div class="card-image-thumb"><img src="\${card.image}" alt="\${card.name}" onerror="this.style.display=\'none\'" /></div>\`
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
								? \`<div class="card-image-thumb"><img src="\${card.image}" alt="\${card.name}" onerror="this.style.display=\'none\'" /></div>\`
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
								? \`<div class="card-image-thumb"><img src="\${card.image}" alt="\${card.name}" onerror="this.style.display=\'none\'" /></div>\`
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
