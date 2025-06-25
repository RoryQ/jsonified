const StonningtonParser = {
	// Convert cell background color and text to lane count
	getLaneCount(backgroundColor, text) {
		if (backgroundColor === 'rgb(255, 130, 130)' ||
			backgroundColor === 'rgb(255, 133, 133)' ||
			text.toLowerCase().includes('closed')) {
			return 0;
		}

		const match = text.match(/(\d+)\s*lanes?/);
		if (match) {
			return parseInt(match[1]);
		}
		return 0;
	},

	// Convert time format (e.g., "5:45am - 6am" -> "05:45")
	normalizeTime(timeText) {
		// Extract just the first time from any range
		const firstTime = timeText.split('-')[0].trim();

		const timeMatch = firstTime.match(/(\d{1,2}):?(\d{2})?(?:am|pm)?/i);
		if (!timeMatch) return null;

		let hours = parseInt(timeMatch[1]);
		const minutes = timeMatch[2] ? timeMatch[2] : "00";
		const isPM = firstTime.toLowerCase().endsWith('pm');

		// Special handling for 12am/12pm
		if (hours === 12) {
			hours = isPM ? 12 : 0;
		}
		// Convert PM times (excluding 12pm which is already handled)
		else if (isPM) {
			hours += 12;
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
	}, formatDateString(date) {
		return `${date.toLocaleDateString('en-US', { weekday: 'long' })} ${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'long' })}`;
	},

	// Parse table rows into time slots
	parseTimeSlots(rows, date = new Date()) {
		const timeSlots = {};

		rows.forEach(row => {
			const slotData = this.extractTimeSlots(row);
			if (slotData) {
				const weekDays = this.getWeekDates(date)
				// For each day, add this time slot
				Object.entries(slotData.slots).forEach(([shortDay, lanes], i) => {
					const day = this.toLocalDateISO(weekDays[i]);
					if (!timeSlots[day]) {
						timeSlots[day] = {
							name: this.formatDateString(weekDays[i]),
							timeSlots: {},
							total: 8,
						};
					}
					timeSlots[day].timeSlots[slotData.time] = lanes;
				});
			}
		});

		return timeSlots;
	},

	getWeekDates(inputDate) {
		var dates = Array.from({ length: 7 }, (_, i) => {
			const dayDate = new Date(inputDate);
			dayDate.setDate(inputDate.getDate() + i);
			return dayDate;
		});

		// sort by day of week starting on monday
		dates.sort((a, b) => {
			// Convert Sunday (0) to 7 to make it the last day of the week
			const dayA = a.getDay() === 0 ? 7 : a.getDay();
			const dayB = b.getDay() === 0 ? 7 : b.getDay();
			return dayA - dayB;
		});

		return dates;
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


	findUpdatedDate(html) {
		const updatedPattern = new RegExp(`Updated: (.*?20\\d\\d)`);
		const match = html.match(updatedPattern);

		return match ? new Date(match[1]) : null;
	},

	toLocalDateISO(date) {
		return date.getFullYear() + '-' +
			(date.getMonth() + 1).toString().padStart(2, '0') + '-' +
			date.getDate().toString().padStart(2, '0');

	},

	// Parse HTML content
	parseHTML(htmlContent) {
		const result = {
			timestamp: this.toLocalDateISO(new Date()),
			haroldHolt: {  },
			prahran: {  }
		};

		var updatedDate = this.findUpdatedDate(htmlContent);

		// Find and parse harold holt outdoor pool table
		const haroldHolt = this.findTableByHeader(htmlContent, 'Harold Holt 50m pool');
		if (haroldHolt) {
			const rows = this.extractRows(haroldHolt);
			if (rows.length > 1) { // Skip header row
				result.haroldHolt = this.parseTimeSlots(rows.slice(1), updatedDate || new Date());
			}
		}

		// Find and parse prahran outdoor pool table
		const prahran = this.findTableByHeader(htmlContent, 'Prahran Aquatic 50m Pool');
		if (prahran) {
			const rows = this.extractRows(prahran);
			if (rows.length > 1) { // Skip header row
				result.prahran = this.parseTimeSlots(rows.slice(1), updatedDate || new Date());
			}
		}

		return result;
	}
};

module.exports = StonningtonParser;
