async function MsacParser(html) {
	const msacIndoor = {};
	const msacOutdoor = {};

	const daySections = html.split(/<details class="msac-day-accordion"/i).slice(1);

	for (const daySection of daySections) {
		const summaryMatch = daySection.match(/<summary>([^<]+)<\/summary>/i);
		if (!summaryMatch) continue;
		const dateStr = summaryMatch[1].trim();

		const dayName = parseDayName(dateStr);
		if (!dayName) continue;

		const dateObj = parseDateStr(dateStr);
		const formattedName = dateObj.toLocaleDateString('en-GB', {
			timeZone: 'Australia/Melbourne',
			weekday: 'long',
			day: 'numeric',
			month: 'long'
		});

		const poolSections = daySection.split(/<div class="msac-public-pool"/i).slice(1);

		for (const poolSection of poolSections) {
			const poolNameMatch = poolSection.match(/data-pool="([^"]+)"/i);
			if (!poolNameMatch) continue;
			const poolName = poolNameMatch[1].trim();

			if (poolName !== 'Indoor 50m' && poolName !== 'Outdoor 50m') {
				continue;
			}

			const timeSlots = {};
			const cards = poolSection.split(/<div class="msac-slot-card/i).slice(1);

			for (const card of cards) {
				const timeMatch = card.match(/<div class="msac-slot-time">([^<]+)<\/div>/i);
				const statusMatch = card.match(/<div class="msac-slot-status[^>]*>([\s\S]*?)<\/div>/i);

				if (timeMatch && statusMatch) {
					const timeRangeStr = timeMatch[1].trim();
					const statusText = statusMatch[1].replace(/<[^>]*>/g, '').trim();

					const timeSlot = parseTime(timeRangeStr);
					if (timeSlot) {
						const laneCount = parseLaneCount(statusText);
						timeSlots[timeSlot] = laneCount;
					}
				}
			}

			if (Object.keys(timeSlots).length > 0) {
				const target = poolName === 'Indoor 50m' ? msacIndoor : msacOutdoor;
				target[dayName] = {
					name: formattedName,
					timeSlots: timeSlots,
					total: 10
				};
			}
		}
	}

	return {
		timestamp: new Date().toISOString(),
		msacIndoor,
		msacOutdoor
	};
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
	const dayDate = dateStr.split(' ');
	if (dayDate.length < 2) {
		return;
	}
	let num = parseInt(dayDate[1]);

	// Get current time in Melbourne to establish baseline date/month/year
	let today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Melbourne' }));
	today.setHours(12, 0, 0, 0); // set to noon to avoid day shifts

	if (num < today.getDate()) {
		today.setMonth(today.getMonth() + 1);
	}

	today.setDate(num);
	return today;
}

function parseDayName(dateStr) {
	const date = parseDateStr(dateStr);
	if (!date) return "";
	const year = date.toLocaleString('en-US', { timeZone: 'Australia/Melbourne', year: 'numeric' });
	const month = date.toLocaleString('en-US', { timeZone: 'Australia/Melbourne', month: '2-digit' });
	const day = date.toLocaleString('en-US', { timeZone: 'Australia/Melbourne', day: '2-digit' });
	return `${year}-${month}-${day}`;
}

function parseLaneCount(value) {
	if (!value) {
		return 0;
	}
	const lower = value.toLowerCase();
	if (lower.includes('closed') || lower === 'closed') {
		return 0;
	}

	const ratioMatch = value.match(/(\d+)\/\d+/);
	if (ratioMatch) {
		return parseInt(ratioMatch[1]);
	}

	const match = value.match(/(\d+)/);
	if (match) {
		return parseInt(match[1]);
	}

	return 0;
}

module.exports = MsacParser;
