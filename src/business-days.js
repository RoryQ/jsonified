/**
 * Calculate the number of business days between two dates (inclusive), excluding weekends.
 * Optionally accepts a holidays map for future public holiday support.
 *
 * @param {Object} params
 * @param {string} params.date - Start date in ISO format (YYYY-MM-DD)
 * @param {Object.<string,string>} [params.holidays] - Optional map of ISO date (YYYY-MM-DD) to holiday name.
 */
function calculate({ date, holidays } = {}) {
	if (!date) {
		date = new Date().toLocaleDateString('en-US', { timeZone: 'Australia/Melbourne', year: 'numeric', month: '2-digit', day: '2-digit' }) ;
	}
	// Parse dates and validate format
	const today = parseISODate(date);
	const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
	let businessDaysToToday = businessDaysBetween(startOfMonth, today, holidays);
	const endOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
	let businessDaysTotal = businessDaysBetween(startOfMonth, endOfMonth, holidays)

	return { startOfMonth, today, holidays, businessDaysToToday, businessDaysTotal };
}

function businessDaysBetween(startOfMonth, endDate, holidays) {
	let count = 0;
	const holidaySet = holidays && typeof holidays === 'object'
		? new Set(Object.keys(holidays))
		: undefined;
	for (let d = new Date(startOfMonth); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
		const day = d.getUTCDay(); // 0 Sun .. 6 Sat
		if (day !== 0 && day !== 6) {
			// Derive ISO date string in UTC
			const iso = d.toISOString().slice(0, 10);
			if (!holidaySet || !holidaySet.has(iso)) {
				count += 1;
			}
		}
	}
	return count;
}

function parseISODate(iso) {
	// Accept YYYY-MM-DD; construct date in UTC to avoid TZ off-by-one across environments
	const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(iso);
	if (!m) return new Date(NaN);
	const [_, y, mo, d] = m;
	return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
}

// Export as CommonJS for Jest, while remaining importable from ESM via default import
module.exports = { calculate };
