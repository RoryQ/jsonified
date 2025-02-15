const GlenEiraParser = {
	convertCarnegieToStonnington(carnegieData) {
		const result = {
			timestamp: new Date().toISOString(),
			carnegie: { days: {} }
		};


		carnegieData.paging.days.forEach(day => {
			const dayBlock = carnegieData.dayBlocks.find(block => block.date === day.date);
			if (!dayBlock) return;

			const dayKey = day.displayWeekDay.toLowerCase();
			let timeSlots = {};

			// Group slots by hour
			const hourlySlots = {};
			dayBlock.hours.forEach(hour => {
				const time = hour.fromHour.value;
				const hourKey = time.slice(0, 2);
				const isHalfHour = time.slice(3, 5) === "30";
				const availability = hour.isAvailable ? hour.totalCountOfOccupancyAvailability : 0;

				if (!hourlySlots[hourKey]) {
					hourlySlots[hourKey] = { first: null, second: null };
				}

				if (isHalfHour) {
					hourlySlots[hourKey].second = availability;
				} else {
					hourlySlots[hourKey].first = availability;
				}
			});

			// Create and sort time slots
			const sortedTimeSlots = [];
			Object.entries(hourlySlots).forEach(([hour, slots]) => {
				if (slots.first === slots.second) {
					// If both half hours have same availability, create one hourly slot
					sortedTimeSlots.push([`${hour}:00`, slots.first]);
				} else {
					// If different, create two half-hour slots
					if (slots.first !== null) sortedTimeSlots.push([`${hour}:00`, slots.first]);
					if (slots.second !== null) sortedTimeSlots.push([`${hour}:30`, slots.second]);
				}
			});

			// Sort lexicographically and convert to object
			timeSlots = Object.fromEntries(sortedTimeSlots.sort(([a], [b]) => a.localeCompare(b)));

			result.carnegie.days[dayKey] = {
				name: new Date(day.date).toLocaleDateString('en-GB', {
					weekday: 'long',
					day: 'numeric',
					month: 'long'
				}),
				timeSlots
			};
		});

		return result;
	}
};

module.exports = GlenEiraParser;
