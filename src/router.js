// An example 'toy' implementation of a router using URLPattern: https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API
// If you're interested in more production-ready routing, you may want to check out one of the following:


// itty-router: https://www.npmjs.com/package/itty-router
// Hono: https://www.npmjs.com/package/hono

import parsePoolData from './msac';

class Router {
	routes = [];


	handle(request) {
		for (const route of this.routes) {
			const match = route[0](request);
			if (match) {
				return route[1]({ ...match, request });
			}
		}
		const match = this.routes.find(([matcher]) => matcher(request));
		if (match) {
			return match[1](request);
		}
	}


	register(handler, path, method) {
		const urlPattern = new URLPattern({ pathname: path });
		this.routes.push([
			(request) => {
				if (method === undefined || request.method.toLowerCase() === method) {
					const match = urlPattern.exec({
						pathname: new URL(request.url).pathname,
					});
					if (match) {
						return { params: match.pathname.groups };
					}
				}
			},
			(args) => handler(args),
		]);
	}


	options(path, handler) {
		this.register(handler, path, "options");
	}
	head(path, handler) {
		this.register(handler, path, "head");
	}
	get(path, handler) {
		this.register(handler, path, "get");
	}
	post(path, handler) {
		this.register(handler, path, "post");
	}
	put(path, handler) {
		this.register(handler, path, "put");
	}
	patch(path, handler) {
		this.register(handler, path, "patch");
	}
	delete(path, handler) {
		this.register(handler, path, "delete");
	}


	all(path, handler) {
		this.register(handler, path);
	}
}


// Setting up our application:


const router = new Router();


// GET collection index
router.get("/api/todos", () => new Response("Todos Index!"));


// GET item
router.get(
	"/api/todos/:id",
	({ params }) => new Response(`Todo #${params.id}`)
);


// POST to the collection (we'll use async here)
router.post("/api/todos", async ({ request }) => {
	const content = await request.json();


	return new Response("Creating Todo: " + JSON.stringify(content));
});


router.get("/api/msac", async ({ request }) => {
	try {
		const response = await fetch('https://statesportcentres.com.au/aquatics/lap-lane-availability/');
		const html = await response.text();

		// Parse the data
		const data = await parsePoolData(html);

		// Return JSON response
		return new Response(JSON.stringify(data, null, 2), {
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		});
	}
})

// 404 for everything else
router.all("*", () => new Response("Not Found.", { status: 404 }));


export default router;
