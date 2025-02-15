const GlenEiraParser = {
	normaliseDataModel(glenEiraJson) {
		const result = {}

		glenEiraJson.paging.days.forEach(day => {
			const dayBlock = glenEiraJson.dayBlocks.find(block => block.date === day.date);
			if (!dayBlock) return;

			const dayKey = day.date;
			const timeSlots = Object.fromEntries(
				dayBlock.hours.map(hour => [
					hour.fromHour.value.slice(0, -3),
					hour.isAvailable ? hour.totalCountOfOccupancyAvailability : 0
				]).sort(([a], [b]) => a.localeCompare(b))
			);

			result[dayKey] = {
				name: new Date(day.date).toLocaleDateString('en-GB', {
					weekday: 'long',
					day: 'numeric',
					month: 'long'
				}),
				timeSlots,
				total: dayBlock.hours[0].numberOfFacilities,
			};
		});

		return result;
	}
};

module.exports = GlenEiraParser;
