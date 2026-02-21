/**
 * Error response utilities
 */

export function errorResponse(message, status = 500, details = null) {
	const body = { error: message };
	if (details) {
		body.details = details;
	}

	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
		},
	});
}

export function notFoundResponse(message = 'Not found') {
	return errorResponse(message, 404);
}

export function unauthorizedResponse(message = 'Unauthorized') {
	return errorResponse(message, 401);
}

export function badRequestResponse(message = 'Bad request', details = null) {
	return errorResponse(message, 400, details);
}

export function rateLimitResponse(retryAfter = 3600) {
	return new Response(JSON.stringify({
		error: 'Rate limit exceeded',
		retryAfter,
	}), {
		status: 429,
		headers: {
			'Content-Type': 'application/json',
			'Retry-After': String(retryAfter),
			'Access-Control-Allow-Origin': '*',
		},
	});
}

export function methodNotAllowedResponse(allowed = ['GET']) {
	return new Response(JSON.stringify({
		error: 'Method not allowed',
	}), {
		status: 405,
		headers: {
			'Content-Type': 'application/json',
			'Allow': allowed.join(', '),
			'Access-Control-Allow-Origin': '*',
		},
	});
}

export function comingSoonResponse(game) {
	return new Response(JSON.stringify({
		error: 'Coming soon',
		message: `${game} support is not yet implemented. Currently only Pokemon TCG is available.`,
	}), {
		status: 501,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
		},
	});
}
