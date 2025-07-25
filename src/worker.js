/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */


import apiRouter from './router.js';


// Export a default object containing event handlers
export default {
  // The fetch handler is invoked when this worker receives a HTTP(S) request
  // and should return a Response (optionally wrapped in a Promise)
  async fetch(request, env, ctx) {
    // You'll find it helpful to parse the request.url string into a URL object. Learn more at https://developer.mozilla.org/en-US/docs/Web/API/URL
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      // You can also use more robust routing
      return apiRouter.handle(request);
    }

		return new Response(
			`Try making requests to:
      <ul>
      <li><code><a href="/api/lap-lanes">/api/lap-lanes</a></code></li>
      <li><code><a href="/api/msac/tomorrow/morning">/api/msac/tomorrow/morning</a></code></li>
			<li><code><a href="/api/epa-vic/elwood">/api/epa-vic/elwood</a></code></li>
			<li><code><a href="/api/public-holidays/victoria/2025">/api/public-holidays/victoria/2025</a></code></li>
			<li><code><a href="/api/public-holidays/new-south-wales/2025">/api/public-holidays/new-south-wales/2025</a></code></li>
			`,
			{ headers: { "Content-Type": "text/html" } }
		);
  },
};
