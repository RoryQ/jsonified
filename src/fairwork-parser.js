/**
 * Parses Fair Work public holidays HTML for a specific state and year
 * @param {string} htmlContent - The HTML content from Fair Work
 * @param {string} state - The state name (e.g., "Victoria", "New South Wales")
 * @param {string} year - The year (e.g., "2026")
 * @returns {Object.<string, string>} Object mapping ISO dates to holiday names
 */
function parseFairWorkPublicHolidays(htmlContent, stateInput, year) {
	const holidays = {};

	// Map input to Fair Work's H2 headings
	const stateMap = {
		'vic': 'Victoria',
		'victoria': 'Victoria',
		'nsw': 'New South Wales',
		'new-south-wales': 'New South Wales',
		'new south wales': 'New South Wales',
		'qld': 'Queensland',
		'queensland': 'Queensland',
		'sa': 'South Australia',
		'south-australia': 'South Australia',
		'south australia': 'South Australia',
		'wa': 'Western Australia',
		'western-australia': 'Western Australia',
		'western australia': 'Western Australia',
		'tas': 'Tasmania',
		'tasmania': 'Tasmania',
		'nt': 'Northern Territory',
		'northern-territory': 'Northern Territory',
		'northern territory': 'Northern Territory',
		'act': 'Australian Capital Territory',
		'australian-capital-territory': 'Australian Capital Territory',
		'australian capital territory': 'Australian Capital Territory'
	};

	const state = stateMap[stateInput.toLowerCase()];
	if (!state) {
		throw new Error(`Unsupported state or territory: ${stateInput}`);
	}

	// Find the section for the state. We look for the <h2> then the following <ul>
	const stateRegex = new RegExp(`<h2>(?:<a[^>]*><\/a>)?${state}<\/h2>\\s*<ul>([\\s\\S]*?)<\/ul>`, 'i');
	const stateMatch = htmlContent.match(stateRegex);

	if (!stateMatch) {
		throw new Error(`Could not find holidays for ${state} in Fair Work content`);
	}

	const listContent = stateMatch[1];
	const liRegex = /<li>(.*?)<\/li>/g;
	let liMatch;

	while ((liMatch = liRegex.exec(listContent)) !== null) {
		const text = liMatch[1].replace(/<[^>]+>/g, '').trim();
		
		if (text.toLowerCase().includes('subject to')) {
			continue;
		}
		
		const parts = text.split(':');
		if (parts.length >= 2) {
			const dateStr = parts[0].trim();
			const name = parts[1].trim().split('(')[0].trim(); 
			
			const dateMatch = dateStr.match(/(\d+)\s+(January|February|March|April|May|June|July|August|September|October|November|December)/i);
			
			if (dateMatch) {
				const day = dateMatch[1];
				const monthName = dateMatch[2];
				
				const months = {
					'January': '01', 'February': '02', 'March': '03', 'April': '04',
					'May': '05', 'June': '06', 'July': '07', 'August': '08',
					'September': '09', 'October': '10', 'November': '11', 'December': '12'
				};
				
				const monthNum = months[monthName.charAt(0).toUpperCase() + monthName.slice(1).toLowerCase()];
				if (monthNum) {
					const paddedDay = day.toString().padStart(2, '0');
					const isoDate = `${year}-${monthNum}-${paddedDay}`;
					holidays[isoDate] = name;
				}
			}
		}
	}

	return holidays;
}

module.exports = { parseFairWorkPublicHolidays };
