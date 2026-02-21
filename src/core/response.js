/**
 * Response helper utilities
 */

export function jsonResponse(data, options = {}) {
	const {
		status = 200,
		cache = null,
		cacheControl = null,
		cors = true,
	} = options;

	const headers = {
		'Content-Type': 'application/json',
	};

	if (cors) {
		headers['Access-Control-Allow-Origin'] = '*';
		headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
		headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
	}

	if (cache) {
		headers['X-Cache'] = cache;
	}

	if (cacheControl) {
		headers['Cache-Control'] = cacheControl;
	}

	return new Response(JSON.stringify(data), {
		status,
		headers,
	});
}

export function corsOptionsResponse() {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Max-Age': '86400',
		},
	});
}

export function htmlResponse(html, options = {}) {
	const { cacheControl = 'public, max-age=300' } = options;

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Cache-Control': cacheControl,
		},
	});
}
