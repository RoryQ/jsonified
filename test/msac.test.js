const fs = require('fs');
const path = require('path');
const MsacParser = require('../src/msac');

const RealDate = Date;

describe('MSAC Parser', () => {
  let htmlContent;

  beforeAll(() => {
    // Set the fake system time to Thursday July 9, 2026 at 10:00 AM Melbourne time
    const mockDate = new RealDate('2026-07-09T10:00:00+10:00');
    global.Date = class extends RealDate {
      constructor(...args) {
        if (args.length) {
          return new RealDate(...args);
        }
        return mockDate;
      }
    };

    htmlContent = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'msac.html'),
      'utf8'
    );
  });

  afterAll(() => {
    global.Date = RealDate;
  });

  test('should parse HTML content correctly', async () => {
    const result = await MsacParser(htmlContent);

    expect(result).toBeDefined();
    expect(result.timestamp).toBe(new Date().toISOString());

    // Check indoor pool data exists
    expect(result.msacIndoor).toBeDefined();
    // Check outdoor pool data exists
    expect(result.msacOutdoor).toBeDefined();

    // Check specific date (Thursday, 9 July 2026)
    const firstDayKey = '2026-07-09';
    
    // Check Indoor 50m data
    expect(result.msacIndoor[firstDayKey]).toBeDefined();
    expect(result.msacIndoor[firstDayKey].name).toBe('Thursday 9 July');
    expect(result.msacIndoor[firstDayKey].total).toBe(10);
    expect(result.msacIndoor[firstDayKey].timeSlots['05:30']).toBe(7);
    expect(result.msacIndoor[firstDayKey].timeSlots['06:00']).toBe(5);
    expect(result.msacIndoor[firstDayKey].timeSlots['06:30']).toBe(1);
    expect(result.msacIndoor[firstDayKey].timeSlots['07:00']).toBe(3);
    expect(result.msacIndoor[firstDayKey].timeSlots['21:30']).toBe(0); // closed

    // Check Outdoor 50m data
    expect(result.msacOutdoor[firstDayKey]).toBeDefined();
    expect(result.msacOutdoor[firstDayKey].name).toBe('Thursday 9 July');
    expect(result.msacOutdoor[firstDayKey].total).toBe(10);
    expect(result.msacOutdoor[firstDayKey].timeSlots['05:30']).toBe(4);
    expect(result.msacOutdoor[firstDayKey].timeSlots['07:30']).toBe(7);
    expect(result.msacOutdoor[firstDayKey].timeSlots['08:30']).toBe(6);
    expect(result.msacOutdoor[firstDayKey].timeSlots['09:00']).toBe(7);
    expect(result.msacOutdoor[firstDayKey].timeSlots['09:30']).toBe(10);
    expect(result.msacOutdoor[firstDayKey].timeSlots['21:00']).toBe(0); // closed
  });

  test('should parse consecutive days correctly', async () => {
    const result = await MsacParser(htmlContent);

    // Should contain 7 days of availability
    const indoorDays = Object.keys(result.msacIndoor);
    expect(indoorDays.length).toBe(7);

    // Verify day names are sorted or match the accordion
    expect(indoorDays).toEqual([
      '2026-07-09',
      '2026-07-10',
      '2026-07-11',
      '2026-07-12',
      '2026-07-13',
      '2026-07-14',
      '2026-07-15'
    ]);

    // Check one day in the middle (e.g. Sunday July 12, 2026)
    const sundayKey = '2026-07-12';
    expect(result.msacIndoor[sundayKey].name).toBe('Sunday 12 July');
  });
});

