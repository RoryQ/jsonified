// An example 'toy' implementation of a router using URLPattern: https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API
// If you're interested in more production-ready routing, you may want to check out one of the following:


// itty-router: https://www.npmjs.com/package/itty-router
// Hono: https://www.npmjs.com/package/hono

import parsePoolData from './msac';
import { parseBeachReport, parseYarraWatch, slugName } from './epa-vic';
import * as R from 'ramda';

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


const msacLanesTomorrowHandler = async ({ params }) => {
	const data = await getMsacLanes();

	// filter for tomorrow
	let tomorrow = {
		outdoor: Object.values(data.outdoor.days)[1],
		indoor: Object.values(data.indoor.days)[1],
	}

	let timeslotFilters = {
		morning: ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00"],
	}

	if (!!params.filter) {
		tomorrow.outdoor.timeSlots = R.pick(timeslotFilters[params.filter], tomorrow.outdoor.timeSlots)
		tomorrow.indoor.timeSlots = R.pick(timeslotFilters[params.filter], tomorrow.indoor.timeSlots)
	}

	return new Response(JSON.stringify(tomorrow, null, 2), {
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*'
		}
	});
};

router.get("/api/msac/tomorrow", msacLanesTomorrowHandler);
router.get("/api/msac/tomorrow/:filter", msacLanesTomorrowHandler);

async function getMsacLanes() {
	const response = await fetch('https://statesportcentres.com.au/aquatics/lap-lane-availability/');
	const html = await response.text();

	// Parse the data
	return await parsePoolData(html);
}

router.get("/api/msac", async ({ request }) => {
	try {
		const data = await getMsacLanes();

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

async function getEpaReport() {
	const response = await fetch('https://www.epa.vic.gov.au/for-community/summer-water-quality/water-quality-across-victoria');
	const html = await response.text();

	return {
		beachReport: parseBeachReport(html),
		yarraWatch: parseYarraWatch(html)
	};
}

router.get("/api/epa-vic/:name", async ({ params }) => {
	try {
		const data = await getEpaReport()

		let found = (data.beachReport.sites)[Object.keys(data.beachReport.sites).find(key => (data.beachReport.sites)[key].slugName === slugName(params.name))];

		if (!found) {
			return NotFoundResponse()
		}

		return JsonResponse(found)
	} catch (error) {
		return JsonResponse({error: error.message }, 500)
	}
})

router.get("/api/epa-vic", async ({ request }) => {
	try {
		const data = await getEpaReport()
		return JsonResponse(data)
	} catch (error) {
		return JsonResponse({error: error.message }, 500)
	}
})

// 404 for everything else
router.all("*", () => new Response("Not Found.", { status: 404 }));

function JsonResponse(data, status=200) {
	return new Response(JSON.stringify(data, null, 2), {
		status: status,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*'
		}
	})
}

function NotFoundResponse() {
	return new Response("Not Found.", { status: 404 });
}

export default router;
