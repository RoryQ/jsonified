export default MsacParser;

async function MsacParser(html) {
    return {
        timestamp: new Date().toISOString(),
        msacIndoor: parsePoolTable(html, "indoor competition pool"),
        msacOutdoor: parsePoolTable(html, "outdoor competition pool")
    };
}


function parsePoolTable(html, poolType) {
	const accordionRegex = new RegExp(`<h3[^>]*>${poolType}</h3>.*?<table.*?>(.*?)</table>`, 'is');
	const tableMatch = accordionRegex.exec(html);

	if (!tableMatch) {
		return { error: `Table not found for ${poolType}` };
	}

	const tableHtml = tableMatch[1];

	// Parse headers (dates)
	const headerRegex = /<th.*?>(.*?)<\/th>/gi;
	const dates = [];
	let headerMatch;

	while ((headerMatch = headerRegex.exec(tableHtml)) !== null) {
		const date = headerMatch[1].trim().toLowerCase();
		if (date !== '') {
			dates.push(date);
		}
	}
	dates.shift(); // Remove first column header (time)
	dates.length = Math.min(dates.length, 7); // Limit to 7 days

	const days = {};

	// Initialize each day
	dates.forEach(dateStr => {
		const dayName = dateStr.split(' ')[0];
		if (!dayName) return;

		days[dayName] = {
			name: parseDateStr(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
			timeSlots: {}
		};
	});

	// Parse table rows
	const rowRegex = /<tr>(.*?)<\/tr>/gs;
	let rowMatch;

	while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
		const rowHtml = rowMatch[1];
		const cellRegex = /<td.*?>(.*?)<\/td>/gi;
		const cells = [];
		let cellMatch;

		while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
			cells.push(cellMatch[1].replace(/<[^>]*>/g, '').trim());
		}

		if (cells.length > 0) {
			const timeSlot = parseTime(cells[0]);
			if (timeSlot) {
				dates.forEach((dateStr, index) => {
					const dayName = dateStr.split(' ')[0];
					if (!dayName) return;

					const laneCount = parseLaneCount(cells[index + 1]);
					days[dayName].timeSlots[timeSlot] = laneCount;
				});
			}
		}
	}

	return { days };
}

function parseTime(timeStr) {
	timeStr = timeStr.replace(/\s+/g, ' ').trim();

	const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
	if (!match) return null;

	let [_, hours, minutes, period] = match;
	hours = parseInt(hours);
	minutes = minutes ? parseInt(minutes) : 0;

	if (period) {
		period = period.toLowerCase();
		if (period === 'pm' && hours !== 12) hours += 12;
		if (period === 'am' && hours === 12) hours = 0;
	}

	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function parseDateStr(dateStr) {
	let today = new Date();
	let num = parseInt(dateStr.split(' ')[1])

	if (num < today.getDay()) {
		today.setMonth(today.getMonth() + 1)
	}

	today.setDate(num);
	return today;
}

function parseLaneCount(value) {
	if (!value || value.toLowerCase() === 'closed') {
		return 0;
	}

	const match = value.match(/^(\d+)/);
	if (match) {
		return parseInt(match[1]);
	}

	return value;
}
