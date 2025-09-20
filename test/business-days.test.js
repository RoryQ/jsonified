const { calculate } = require('../src/business-days');

describe('businessDays.calculate', () => {
  test('counts business days from start of month to given weekday date', () => {
    const { businessDaysToToday, startOfMonth, today, holidays } = calculate({ date: '2025-09-05' }); // Friday

    // From Mon 1st to Fri 5th = 5 business days
    expect(businessDaysToToday).toBe(5);

    // Start date should be the first of the same month
    expect(startOfMonth instanceof Date).toBe(true);
    expect(startOfMonth.toISOString().slice(0, 10)).toBe('2025-09-01');

    // End date should be the provided date
    expect(today instanceof Date).toBe(true);
    expect(today.toISOString().slice(0, 10)).toBe('2025-09-05');

    // Holidays currently passes through unchanged (default undefined)
    expect(holidays).toBeUndefined();
  });

  test('excludes weekends when target date is on a weekend', () => {
    const { businessDaysToToday, startOfMonth, today } = calculate({ date: '2025-09-20' }); // Saturday

    // Mon 1st -> Fri 19th = 15 business days; 20th is Saturday, not counted
    expect(businessDaysToToday).toBe(15);

    expect(startOfMonth.toISOString().slice(0, 10)).toBe('2025-09-01');
    expect(today.toISOString().slice(0, 10)).toBe('2025-09-20');
  });

  test('passes through holidays value unchanged', () => {
    const holidays = { '2025-12-25': 'Christmas Day' };
    const res = calculate({ date: '2025-09-05', holidays });
    expect(res.holidays).toEqual(holidays);
  });

  test('excludes holidays that fall on weekdays from the business day count', () => {
    const holidays = { '2025-09-03': 'Test Holiday' }; // Wednesday
    const { businessDaysToToday } = calculate({ date: '2025-09-05', holidays });
    // Normally 5 business days (Mon 1 to Fri 5), minus holiday on Wed 3 = 4
    expect(businessDaysToToday).toBe(4);
  });

  test('ignores holidays that fall on weekends', () => {
    const holidays = { '2025-09-20': 'Weekend Holiday' }; // Saturday
    const { businessDaysToToday } = calculate({ date: '2025-09-20', holidays });
    // Should remain 15 as weekends are excluded already
    expect(businessDaysToToday).toBe(15);
  });
});
