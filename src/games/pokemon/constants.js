/**
 * Pokemon TCG constants
 */

export const LIMITLESS_API_BASE = 'https://play.limitlesstcg.com/api';
export const LIMITLESS_CDN_BASE = 'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci';

export const FORMATS = {
	STANDARD: 'standard',
	EXPANDED: 'expanded',
};

/**
 * Pokemon TCG set colors for visual identification
 * Used when card images fail to load
 */
export const SET_COLORS = {
	// Current era (Scarlet & Violet)
	'TWM': '#8B4789',  // Twilight Masquerade - Purple
	'PRE': '#22B14C',  // Primal Energy - Green
	'OBF': '#FF8C00',  // Obsidian Flames - Orange
	'PAL': '#1E90FF',  // Paldean Fates - Blue
	'SVI': '#DC143C',  // Scarlet & Violet - Red
	'MEG': '#FFD700',  // Magneton Meta - Gold
	'TEF': '#20B2AA',  // Temporal Forces - Teal
	'ASC': '#9370DB',  // Ancient Roar - Indigo
	'DRI': '#FF6347',  // Dragon Tera - Coral
	'MEW': '#00CED1',  // Mewtwo - Cyan
	'PAF': '#FF69B4',  // Paldean Future - Pink
	'PFL': '#8B7355',  // Paldean Fates - Brown
	'SCR': '#4169E1',  // Scarlet - Royal Blue
	'SLV': '#C0C0C0',  // Silver - Silver
	'SHF': '#FF4500',  // Shining Fates - Red-Orange
	'SVP': '#DA70D6',  // Sword/Shield Purple
};

export const DEFAULT_SET_COLOR = '#808080'; // Gray
