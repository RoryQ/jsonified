const fs = require('fs');
const path = require('path');
const StonningtonParser = require('../src/stonnington');

describe('Stonnington Parser', () => {
  let htmlContent;

  beforeAll(() => {
    // Load the fixture
    htmlContent = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'stonnington.html'),
      'utf8'
    );
  });

  test('should parse HTML content correctly', () => {
      const result = StonningtonParser.parseHTML(htmlContent);

      // Check Harold Holt pool data
      expect(result.haroldHolt).toBeDefined();

      // Check specific date (Monday, May 15, 2023)
      const mondayKey = '2023-05-15';
      expect(result.haroldHolt[mondayKey]).toBeDefined();
      expect(result.haroldHolt[mondayKey].name).toBe('Monday 15 May');
      expect(result.haroldHolt[mondayKey].total).toBe(8);

      // Check time slots for Monday
      expect(result.haroldHolt[mondayKey].timeSlots['05:45']).toBe(4);
      expect(result.haroldHolt[mondayKey].timeSlots['06:00']).toBe(8);

      // Check Prahran pool data
      expect(result.prahran).toBeDefined();

      // Check specific date for Prahran
      expect(result.prahran[mondayKey]).toBeDefined();
      expect(result.prahran[mondayKey].name).toBe('Monday 15 May');
      expect(result.prahran[mondayKey].total).toBe(8);

      // Check time slots for Monday at Prahran
      expect(result.prahran[mondayKey].timeSlots['05:45']).toBe(3);
      expect(result.prahran[mondayKey].timeSlots['06:00']).toBe(6);

      // Check Saturday (should be closed at 5:45am)
      const saturdayKey = '2023-05-20';
      expect(result.haroldHolt[saturdayKey].timeSlots['05:45']).toBe(0);
      expect(result.prahran[saturdayKey].timeSlots['05:45']).toBe(0);
  });

  test('getLaneCount should correctly interpret cell data', () => {
    // Test with closed background color
    expect(StonningtonParser.getLaneCount('rgb(255, 130, 130)', '')).toBe(0);

    // Test with "closed" text
    expect(StonningtonParser.getLaneCount('', 'Closed')).toBe(0);
    expect(StonningtonParser.getLaneCount('', 'closed')).toBe(0);

    // Test with lane counts
    expect(StonningtonParser.getLaneCount('', '4 lanes')).toBe(4);
    expect(StonningtonParser.getLaneCount('', '1 lane')).toBe(1);
    expect(StonningtonParser.getLaneCount('', '8 lanes available')).toBe(8);

    // Test with invalid data
    expect(StonningtonParser.getLaneCount('', 'No information')).toBe(0);
  });

  test('normalizeTime should correctly format time strings', () => {
    // Test AM times
    expect(StonningtonParser.normalizeTime('5:45am - 6am')).toBe('05:45');
    expect(StonningtonParser.normalizeTime('6am - 7am')).toBe('06:00');
    expect(StonningtonParser.normalizeTime('12am')).toBe('00:00');

    // Test PM times
    expect(StonningtonParser.normalizeTime('1:30pm')).toBe('13:30');
    expect(StonningtonParser.normalizeTime('12pm')).toBe('12:00');

    // Test invalid formats
    expect(StonningtonParser.normalizeTime('invalid')).toBe(null);
  });
});
