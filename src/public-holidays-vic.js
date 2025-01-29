/**
 * Parses Victorian public holidays HTML into a date-to-name mapping
 * @param {string} htmlContent - The HTML content to parse
 * @returns {Object.<string, string>} Object mapping ISO dates to holiday names
 */
function parseVictorianPublicHolidays(htmlContent) {
	const holidays = {};

	// Extract year from heading
	const yearMatch = htmlContent.match(/Public holidays in Victoria for (\d{4})/);
	if (!yearMatch) {
		throw new Error('Could not find year in HTML content');
	}
	const year = yearMatch[1];

	// Find the table with the correct summary
	const tableMatch = htmlContent.match(/<table[^>]*summary="Public holidays in Victoria for[^>]*>[\s\S]*?<\/table>/);
	if (!tableMatch) {
		throw new Error('Could not find public holidays table');
	}

	// Extract table rows
	const tableContent = tableMatch[0];
	const rows = tableContent.match(/<tr>[\s\S]*?<\/tr>/g);

	if (!rows) {
		throw new Error('Could not find any rows in the table');
	}

	// Skip header row
	for (let i = 1; i < rows.length; i++) {
		const row = rows[i];

		// Extract cells
		const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g);
		if (cells && cells.length >= 2) {
			// Clean up the cell content
			const name = cells[0].replace(/<[^>]+>/g, '').trim()
				.replace(/\s*<sup>.*?<\/sup>\s*/g, '')
				.replace(/1$/, '')
				.trim();

			let date = cells[1].replace(/<[^>]+>/g, '').trim()
				.replace(/\s*<sup>.*?<\/sup>\s*/g, '')
				.replace(/[234]$/, '')
				.trim();

			// Skip AFL Grand Final if date is not set
			if (date.toLowerCase().includes('subject to')) {
				continue;
			}

			// Parse the date
			const [dayName, day, month] = date.split(' ');

			// Convert month name to month number (1-12)
			const months = {
				'January': '01', 'February': '02', 'March': '03', 'April': '04',
				'May': '05', 'June': '06', 'July': '07', 'August': '08',
				'September': '09', 'October': '10', 'November': '11', 'December': '12'
			};

			const monthNum = months[month];

			if (monthNum && day) {
				// Create ISO date string using extracted year
				const paddedDay = day.toString().padStart(2, '0');
				const isoDate = `${year}-${monthNum}-${paddedDay}`;

				holidays[isoDate] = name;
			}
		}
	}

	return holidays;
}

module.exports = { parseVictorianPublicHolidays };
