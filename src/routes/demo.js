/**
 * Demo page endpoint
 */

import { htmlResponse } from '../core/response.js';
import { generateDemoHTML } from '../ui/demo.html.js';

/**
 * GET / or /demo - Serve demo HTML page
 */
export async function handleDemo(request, env, ctx) {
	return htmlResponse(generateDemoHTML(), {
		cacheControl: 'public, max-age=300',
	});
}
