const { parseFairWorkPublicHolidays } = require('../src/fairwork-parser');

describe('parseFairWorkPublicHolidays', () => {
	const html = `
		<h2>Victoria</h2>
		<ul>
			<li>Thursday 1 January: New Year's Day</li>
			<li>Monday 26 January: Australia Day</li>
			<li>Monday 9 March: Labour Day</li>
			<li>Friday 3 April: Good Friday</li>
			<li>Saturday 4 April: Saturday before Easter Sunday</li>
			<li>Sunday 5 April: Easter Sunday</li>
			<li>Monday 6 April: Easter Monday</li>
			<li>Saturday 25 April: Anzac Day</li>
			<li>Monday 8 June: King's Birthday</li>
			<li>Subject to AFL schedule (date TBC): Friday before the AFL Grand Final</li>
			<li>Tuesday 3 November: Melbourne Cup (some regional areas in Victoria hold the Melbourne Cup public holiday on a different date)</li>
			<li>Friday 25 December: Christmas Day</li>
			<li>Saturday 26 December: Boxing Day</li>
			<li>Monday 28 December: Additional public holiday for Boxing Day</li>
		</ul>
	`;

	test('parses Victorian holidays from Fair Work HTML', () => {
		const result = parseFairWorkPublicHolidays(html, 'Victoria', '2026');
		expect(result).toEqual({
			'2026-01-01': "New Year's Day",
			'2026-01-26': 'Australia Day',
			'2026-03-09': 'Labour Day',
			'2026-04-03': 'Good Friday',
			'2026-04-04': 'Saturday before Easter Sunday',
			'2026-04-05': 'Easter Sunday',
			'2026-04-06': 'Easter Monday',
			'2026-04-25': 'Anzac Day',
			'2026-06-08': "King's Birthday",
			'2026-11-03': 'Melbourne Cup',
			'2026-12-25': 'Christmas Day',
			'2026-12-26': 'Boxing Day',
			'2026-12-28': 'Additional public holiday for Boxing Day'
		});
	});

	test('throws error when state is not found', () => {
		expect(() => parseFairWorkPublicHolidays(html, 'Queensland', '2026')).toThrow('Could not find holidays for Queensland in Fair Work content');
	});
});
