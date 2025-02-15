// An example 'toy' implementation of a router using URLPattern: https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API
// If you're interested in more production-ready routing, you may want to check out one of the following:


// itty-router: https://www.npmjs.com/package/itty-router
// Hono: https://www.npmjs.com/package/hono

import * as R from 'ramda';
import { parseBeachReport, parseYarraWatch, slugName } from './epa-vic';
import { parseVictorianPublicHolidays } from './public-holidays-vic';
import { parseNSWPublicHolidays } from './public-holidays-nsw';
import MsacParser from './msac';
import StonningtonParser from './stonnington';
import GlenEiraParser from './glen-eira';

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
						pathname: trimTrailingSlashes(new URL(request.url).pathname)
					});
					if (match) {
						return { params: match.pathname.groups };
					}
				}
			},
			(args) => handler(args)
		]);
	}

	options(path, handler) {
		this.register(handler, path, 'options');
	}

	head(path, handler) {
		this.register(handler, path, 'head');
	}

	get(path, handler) {
		this.register(handler, path, 'get');
	}

	post(path, handler) {
		this.register(handler, path, 'post');
	}

	put(path, handler) {
		this.register(handler, path, 'put');
	}

	patch(path, handler) {
		this.register(handler, path, 'patch');
	}

	delete(path, handler) {
		this.register(handler, path, 'delete');
	}

	all(path, handler) {
		this.register(handler, path);
	}
}

function trimTrailingSlashes(str) {
	if (typeof str !== 'string') {
		return '';
	}
	return str.replace(/\/+$/, '');
}

// Setting up our application:
const router = new Router();

router.get('/api/msac', msacHandler);
router.get('/api/msac/tomorrow', msacLanesTomorrowHandler);
router.get('/api/msac/tomorrow/:filter', msacLanesTomorrowHandler);
router.get('/api/stonnington', stonningtonHandler);
router.get('/api/glen-eira', glenEiraHandler);
router.get('/api/epa-vic/:name', epaVicNameHandler);
router.get('/api/epa-vic', epaVicHandler);
router.get('/api/public-holidays/victoria/:year', publicHolidaysVictoriaHandler);
router.get('/api/public-holidays/new-south-wales', nswPublicHolidaysHandler);
router.get('/api/public-holidays/new-south-wales/:year', nswPublicHolidaysHandler);

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

async function msacLanesTomorrowHandler({ params }) {
	const data = await getMsacLanes();

	// filter for tomorrow
	let tomorrow = {
		outdoor: Object.values(data.outdoor.days)[1],
		indoor: Object.values(data.indoor.days)[1]
	};

	let timeslotFilters = {
		morning: ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00']
	};

	if (!!params.filter) {
		tomorrow.outdoor.timeSlots = R.pick(timeslotFilters[params.filter], tomorrow.outdoor.timeSlots);
		tomorrow.indoor.timeSlots = R.pick(timeslotFilters[params.filter], tomorrow.indoor.timeSlots);
	}

	return JsonResponse(tomorrow);
}

async function getMsacLanes() {
	const response = await fetch('https://statesportcentres.com.au/aquatics/lap-lane-availability/');
	const html = await response.text();

	// Parse the data
	return await MsacParser(html);
}

async function msacHandler({ request }) {
	try {
		const data = await getMsacLanes();

		return JsonResponse(data);
	} catch (error) {
		return JsonResponse({ error: error.message }, 500);
	}
}

async function stonningtonHandler({ request }) {
		const response = await fetch('https://www.stonnington.vic.gov.au/active/Swim/Lane-availability');
		const html = await response.text();
		const data = StonningtonParser.parseHTML(html);

		return JsonResponse(data);
}

async function glenEiraHandler({ request }) {
	const carnegieJson = await (await fetch('https://geleisure.perfectgym.com.au/ClientPortal2/api/Calendars/ClubZoneOccupancyCalendar/GetCalendar?calendarId=0bb104dd7&daysPerPage=7')).json()
	const gesacJson = await (await fetch('https://geleisure.perfectgym.com.au/ClientPortal2/api/Calendars/ClubZoneOccupancyCalendar/GetCalendar?calendarId=2c38d8a41&daysPerPage=7')).json()
	const result = {
		timestamp: new Date().toISOString(),
		carnegie: GlenEiraParser.normaliseDataModel(carnegieJson),
		gesac: GlenEiraParser.normaliseDataModel(gesacJson),
	};

	return JsonResponse(result);
}

async function getEpaReport() {
	const response = await fetch('https://www.epa.vic.gov.au/for-community/summer-water-quality/water-quality-across-victoria');
	const html = await response.text();

	return {
		beachReport: parseBeachReport(html),
		yarraWatch: parseYarraWatch(html)
	};
}

async function epaVicNameHandler({ params }) {
	try {
		const data = await getEpaReport();

		let found = (data.beachReport.sites)[Object.keys(data.beachReport.sites).find(key => (data.beachReport.sites)[key].slugName === slugName(params.name))];

		if (!found) {
			return NotFoundResponse();
		}

		return JsonResponse(found);
	} catch (error) {
		return JsonResponse({ error: error.message }, 500);
	}
}

async function epaVicHandler({ request }) {
	try {
		const data = await getEpaReport();
		return JsonResponse(data);
	} catch (error) {
		return JsonResponse({ error: error.message }, 500);
	}
}

async function publicHolidaysVictoriaHandler({ params }) {
	const response = await fetch(`https://business.vic.gov.au/business-information/public-holidays/victorian-public-holidays-${params.year}`);
	const html = await response.text();
	return JsonResponse(parseVictorianPublicHolidays(html));
}

async function nswPublicHolidaysHandler({ params }) {
	const response = await fetch(`https://www.nsw.gov.au/about-nsw/public-holidays`);
	const html = await response.text();
	const holidays = parseNSWPublicHolidays(html);
	if (!!params.year) {
		return JsonResponse(R.pickBy((_, k) => k.startsWith(params.year), holidays));
	}
	return JsonResponse(holidays);
}

function JsonResponse(data, status = 200) {
	return new Response(JSON.stringify(data, null, 2), {
		status: status,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*'
		}
	});
}

function NotFoundResponse() {
	return new Response('Not Found.', { status: 404 });
}

export default router;
