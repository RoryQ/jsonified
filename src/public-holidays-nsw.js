/**
 * Parses NSW public holidays HTML and returns a mapping of ISO dates to holiday names
 * @param {string} htmlContent - The HTML content to parse
 * @returns {Object.<string, string>} Object mapping ISO dates to holiday names
 */
function parseNSWPublicHolidays(htmlContent) {
	const holidays = {};
	let lastHolidayName = '';

	// Extract the table with public holidays
	const tableMatch = htmlContent.match(/<table>[\s\S]*?<thead>([\s\S]*?)<\/thead>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>[\s\S]*?<\/table>/);
	if (!tableMatch) {
		throw new Error('Could not find public holidays table');
	}

	// Extract years from table header
	const headerMatch = tableMatch[1].match(/<th>(\d{4})<\/th>/g);
	if (!headerMatch) {
		throw new Error('Could not find years in table header');
	}

	const years = headerMatch.map(th => parseInt(th.match(/\d{4}/)[0]));

	// Get table rows
	const tbody = tableMatch[2];
	const rows = tbody.match(/<tr>[\s\S]*?<\/tr>/g);

	if (!rows) {
		throw new Error('Could not find any rows in the table');
	}

	// Process each row
	rows.forEach(row => {
		// Extract cells
		const cells = row.match(/<td>([\s\S]*?)<\/td>/g);
		if (!cells || cells.length < years.length + 1) return;

		// Clean up the holiday name
		let name = cells[0].replace(/<[^>]+>/g, '').trim()
			.replace(/\s*<sup>.*?<\/sup>\s*/g, '')
			.replace(/[0-9]/g, '').trim();

		const isAdditionalDay = name === 'Additional Day';
		if (isAdditionalDay) {
			name = lastHolidayName;
		}

		// Process each year column
		years.forEach((year, index) => {
			let date = cells[index + 1].replace(/<[^>]+>/g, '').trim();

			// Skip if date is "Not applicable"
			if (date === 'Not applicable') return;

			// Extract and parse the date
			const [dayName, dayNum, monthName] = date.split(' ');

			// Convert month name to month number
			const months = {
				'January': '01', 'February': '02', 'March': '03', 'April': '04',
				'May': '05', 'June': '06', 'July': '07', 'August': '08',
				'September': '09', 'October': '10', 'November': '11', 'December': '12'
			};

			const monthNum = months[monthName];

			if (monthNum && dayNum) {
				// Create ISO date string
				const paddedDay = dayNum.toString().padStart(2, '0');
				const isoDate = `${year}-${monthNum}-${paddedDay}`;

				holidays[isoDate] = isAdditionalDay ? `${name} (Observed)` : name;
			}
		});

		// Store the holiday name if it's not an additional day
		if (!isAdditionalDay) {
			lastHolidayName = name;
		}
	});

	// Sort the holidays by date
	return Object.keys(holidays)
		.sort()
		.reduce((obj, key) => {
			obj[key] = holidays[key];
			return obj;
		}, {});
}

module.exports = { parseNSWPublicHolidays };
