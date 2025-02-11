const LaneParser = {
	// Convert cell background color and text to lane count
	getLaneCount(backgroundColor, text) {
		if (backgroundColor === 'rgb(255, 130, 130)' ||
			backgroundColor === 'rgb(255, 133, 133)' ||
			text.toLowerCase().includes('closed')) {
			return "Closed";
		}

		const match = text.match(/(\d+)\s*lanes?/);
		if (match) {
			return parseInt(match[1]);
		}
		return "Closed";
	},

	// Convert time format (e.g., "5:45am - 6am" -> "05:45")
	normalizeTime(timeText) {
		const timeMatch = timeText.match(/(\d{1,2}):?(\d{2})?(?:am|pm)?/i);
		if (!timeMatch) return null;

		let hours = parseInt(timeMatch[1]);
		const minutes = timeMatch[2] ? timeMatch[2] : "00";

		// Handle 24-hour format
		if (timeText.toLowerCase().includes('pm') && hours < 12) {
			hours += 12;
		}
		if (timeText.toLowerCase().includes('am') && hours === 12) {
			hours = 0;
		}

		return `${hours.toString().padStart(2, '0')}:${minutes}`;
	},

	// Extract time slots from a row
	extractTimeSlots(row) {
		const cells = this.extractCells(row);
		if (!cells || cells.length < 2) return null;

		const timeText = cells[0].text;
		const time = this.normalizeTime(timeText);
		if (!time) return null;

		// Create slots for each day
		const slots = {};
		['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach((day, index) => {
			const cell = cells[index + 1];
			if (cell) {
				slots[day] = this.getLaneCount(cell.backgroundColor, cell.text);
			}
		});

		return { time, slots };
	},

	// Parse table rows into time slots
	parseTimeSlots(rows) {
		const timeSlots = {};

		rows.forEach(row => {
			const slotData = this.extractTimeSlots(row);
			if (slotData) {
				// For each day, add this time slot
				Object.entries(slotData.slots).forEach(([day, lanes]) => {
					if (!timeSlots[day]) {
						timeSlots[day] = {
							name: `${day} ${new Date().getDate()}`, // This is a simplification
							timeSlots: {}
						};
					}
					timeSlots[day].timeSlots[slotData.time] = lanes;
				});
			}
		});

		return timeSlots;
	},

	// Extract cells from a row
	extractCells(row, cellType = 'td') {
		const cells = row.match(new RegExp(`<${cellType}[^>]*>([\\s\\S]*?)<\/${cellType}>`, 'gi')) || [];
		return cells.map(cell => {
			const styleMatch = cell.match(/style="[^"]*background-color:\s*(rgb\(\d+,\s*\d+,\s*\d+\))/i);
			const backgroundColor = styleMatch ? styleMatch[1] : null;
			const textMatch = cell.match(new RegExp(`<${cellType}[^>]*>([\\s\\S]*?)<\/${cellType}>`, 'i'));
			const text = textMatch ?
				textMatch[1]
					.replace(/<[^>]+>/g, '')
					.replace(/&nbsp;/g, ' ')
					.trim() : '';
			return { backgroundColor, text };
		});
	},

	// Extract table rows
	extractRows(table) {
		return table.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
	},

	// Find table by header text
	findTableByHeader(html, headerText) {
		const headerPattern = new RegExp(`<h2[^>]*>[^<]*${headerText}[^<]*<\/h2>([\\s\\S]*?)<table[^>]*>([\\s\\S]*?)<\/table>`);
		const match = html.match(headerPattern);
		return match ? `<table>${match[2]}</table>` : null;
	},

	// Parse HTML content
	parseHTML(htmlContent) {
		const result = {
			timestamp: new Date().toISOString(),
			haroldHolt: { days: {} },
			prahran: { days: {} }
		};

		// Find and parse indoor pool table
		const haroldHolt = this.findTableByHeader(htmlContent, 'Harold Holt 50m pool');
		if (haroldHolt) {
			const rows = this.extractRows(haroldHolt);
			if (rows.length > 1) { // Skip header row
				result.haroldHolt.days = this.parseTimeSlots(rows.slice(1));
			}
		}

		// Find and parse outdoor pool table
		const prahran = this.findTableByHeader(htmlContent, 'Prahran Aquatic 50m Pool');
		if (prahran) {
			const rows = this.extractRows(prahran);
			if (rows.length > 1) { // Skip header row
				result.prahran.days = this.parseTimeSlots(rows.slice(1));
			}
		}

		return result;
	}
};

module.exports = LaneParser;
