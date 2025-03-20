

export function parseBeachReport(html) {
	// Find the Beach Report section
	const sectionMatch = html.match(/<h2>Beach Report<\/h2>.*?<table.*?<\/table>/s);
	if (!sectionMatch) return { error: "Beach Report section not found" };

	const tableHtml = sectionMatch[0];
	const sites = {};

	// Extract rows
	const rowRegex = /<tr>.*?<td.*?>(.*?)<\/td>.*?<td.*?>(.*?)<\/td>.*?<td.*?>(.*?)<\/td>.*?<td.*?>(.*?)<\/td>.*?<\/tr>/gs;
	let match;

	while ((match = rowRegex.exec(tableHtml)) !== null) {
		const [_, site, today, tomorrow, info] = match;
		if (site === 'Site') continue; // Skip header row

		// Parse water quality status
		const todayData = parseWaterQuality(today);
		const tomorrowData = parseWaterQuality(tomorrow);

		// Parse links and alerts
		const links = parseLinks(info);

		// Clean site name
		const siteName = site.trim();

		sites[siteName] = {
			slugName: slugName(siteName),
			name: siteName,
			today: todayData,
			tomorrow: tomorrowData,
			links
		};
	}

	return {
		lastUpdated: extractUpdateTime(html),
		sites
	};
}

export function parseYarraWatch(html) {
	// Find the Yarra Watch section
	const sectionMatch = html.match(/<h2>Yarra Watch<\/h2>.*?<table.*?<\/table>/s);
	if (!sectionMatch) return { error: "Yarra Watch section not found" };

	const tableHtml = sectionMatch[0];
	const sites = {};

	// Extract rows
	const rowRegex = /<tr>.*?<td.*?>(.*?)<\/td>.*?<td.*?>(.*?)<\/td>.*?<td.*?>(.*?)<\/td>.*?<td.*?>(.*?)<\/td>.*?<\/tr>/gs;
	let match;

	while ((match = rowRegex.exec(tableHtml)) !== null) {
		const [_, site, today, tomorrow, info] = match;
		if (site === 'Site') continue; // Skip header row

		// Parse water quality status
		const todayData = parseWaterQuality(today);
		const tomorrowData = parseWaterQuality(tomorrow);

		// Parse links and alerts
		const links = parseLinks(info);

		// Clean site name
		const siteName = site.trim();

		sites[siteName] = {
			slugName: slugName(siteName),
			name: siteName,
			today: todayData,
			tomorrow: tomorrowData,
			links
		};
	}

	return {
		lastUpdated: extractUpdateTime(html),
		sites
	};
}

function parseWaterQuality(html) {
	if (!html) return null;

	// Extract rating class
	const ratingMatch = html.match(/indicator\s+([\w-]+)/);
	const rating = ratingMatch ? ratingMatch[1].replace(/-/g, ' ').trim() : null;

	// Extract status message
	const messageMatch = html.match(/<p>(.*?)<\/p>/);
	const message = messageMatch ?
		messageMatch[1].replace(/&nbsp;/g, ' ').trim() : null;

	return {
		rating,
		message
	};
}

function parseLinks(html) {
	if (!html) return [];

	const links = [];
	const linkRegex = /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
	let match;

	while ((match = linkRegex.exec(html)) !== null) {
		const [_, url, text] = match;
		links.push({
			url: url.trim(),
			text: text.trim()
		});
	}

	return links;
}

function extractUpdateTime(html) {
	const timeMatch = html.match(/Updated\s+(\d{1,2}(?::\d{2})?[ap]m\s+\d{1,2}\s+\w+\s+\d{4}\s+[A-Z]+)/i);
	return timeMatch ? timeMatch[1] : null;
}

export function slugName(str) {
	if (!str) return '';

	return str
		// Convert to lowercase
		.toLowerCase()
		// Replace all spaces and underscores with hyphens
		.replace(/[\s_]+/g, '-')
		// Remove special characters except hyphens
		.replace(/[^a-z0-9-]/g, '')
		// Replace multiple consecutive hyphens with a single hyphen
		.replace(/-+/g, '-')
		// Remove leading and trailing hyphens
		.replace(/^-+|-+$/g, '');
}
