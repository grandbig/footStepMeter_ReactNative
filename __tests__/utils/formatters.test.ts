import {
  formatDateTime,
  formatDistance,
  formatDuration,
  formatSpeed,
  Locale,
} from '../../utils/formatters';

describe('formatters', () => {
  describe('formatDateTime', () => {
    it('should format date in default locale (en-US)', () => {
      const date = new Date('2023-12-25T14:30:45.123Z');
      
      const formatted = formatDateTime(date);
      
      expect(formatted).toBe('Dec 25, 2023, 11:30 PM');
    });

    it('should format date in Japanese locale', () => {
      const date = new Date('2023-12-25T14:30:45.123Z');
      
      const formatted = formatDateTime(date, Locale.JA_JP);
      
      expect(formatted).toBe('2023年12月25日 23:30');
    });

    it('should throw error for null date', () => {
      expect(() => formatDateTime(null as any)).toThrow('Invalid date provided');
    });

    it('should throw error for undefined date', () => {
      expect(() => formatDateTime(undefined as any)).toThrow('Invalid date provided');
    });

    it('should throw error for non-Date object', () => {
      expect(() => formatDateTime('invalid' as any)).toThrow('Invalid date provided');
    });

    it('should throw error for invalid Date object', () => {
      const invalidDate = new Date('invalid');
      
      expect(() => formatDateTime(invalidDate)).toThrow('Invalid date provided');
    });
  });

  describe('formatDistance', () => {
    it('should format distance in meters for short distances', () => {
      const distanceInMeters = 250;
      
      const formatted = formatDistance(distanceInMeters);
      
      expect(formatted).toBe('250 m');
    });

    it('should format distance in kilometers for long distances', () => {
      const distanceInMeters = 1500;
      
      const formatted = formatDistance(distanceInMeters);
      
      expect(formatted).toBe('1.5 km');
    });

    it('should throw error for negative distance', () => {
      const negativeDistance = -100;
      
      expect(() => formatDistance(negativeDistance)).toThrow('Distance must be non-negative');
    });

    it('should throw error for invalid distance', () => {
      expect(() => formatDistance(NaN)).toThrow('Distance must be a valid number');
      expect(() => formatDistance(Infinity)).toThrow('Distance must be a valid number');
    });
  });

  describe('formatSpeed', () => {
    it('should format speed with one decimal place', () => {
      const speedInKmh = 12.5;
      
      const formatted = formatSpeed(speedInKmh);
      
      expect(formatted).toBe('12.5 km/h');
    });

    it('should throw error for negative speed', () => {
      const negativeSpeed = -10;
      
      expect(() => formatSpeed(negativeSpeed)).toThrow('Speed must be non-negative');
    });

    it('should throw error for invalid speed', () => {
      expect(() => formatSpeed(NaN)).toThrow('Speed must be a valid number');
      expect(() => formatSpeed(Infinity)).toThrow('Speed must be a valid number');
    });
  });

  describe('formatDuration', () => {
    it('should format duration in seconds only (default locale)', () => {
      const durationInSeconds = 45;
      
      const formatted = formatDuration(durationInSeconds);
      
      expect(formatted).toBe('45s');
    });

    it('should format duration in seconds only (Japanese locale)', () => {
      const durationInSeconds = 45;
      
      const formatted = formatDuration(durationInSeconds, Locale.JA_JP);
      
      expect(formatted).toBe('45秒');
    });

    it('should format duration in minutes and seconds (default locale)', () => {
      const durationInSeconds = 125; // 2:05
      
      const formatted = formatDuration(durationInSeconds);
      
      expect(formatted).toBe('2m 5s');
    });

    it('should format duration in minutes and seconds (Japanese locale)', () => {
      const durationInSeconds = 125; // 2:05
      
      const formatted = formatDuration(durationInSeconds, Locale.JA_JP);
      
      expect(formatted).toBe('2分 5秒');
    });

    it('should format duration in hours, minutes and seconds (default locale)', () => {
      const durationInSeconds = 3665; // 1:01:05
      
      const formatted = formatDuration(durationInSeconds);
      
      expect(formatted).toBe('1h 1m 5s');
    });

    it('should format duration in hours, minutes and seconds (Japanese locale)', () => {
      const durationInSeconds = 3665; // 1:01:05
      
      const formatted = formatDuration(durationInSeconds, Locale.JA_JP);
      
      expect(formatted).toBe('1時間 1分 5秒');
    });

    it('should format exact hour without minutes/seconds', () => {
      const durationInSeconds = 3600; // 1:00:00
      
      const formatted = formatDuration(durationInSeconds);
      
      expect(formatted).toBe('1h');
    });

    it('should format exact minute without seconds', () => {
      const durationInSeconds = 180; // 3:00
      
      const formatted = formatDuration(durationInSeconds);
      
      expect(formatted).toBe('3m');
    });

    it('should handle zero duration (default locale)', () => {
      const durationInSeconds = 0;
      
      const formatted = formatDuration(durationInSeconds);
      
      expect(formatted).toBe('0s');
    });

    it('should handle zero duration (Japanese locale)', () => {
      const durationInSeconds = 0;
      
      const formatted = formatDuration(durationInSeconds, Locale.JA_JP);
      
      expect(formatted).toBe('0秒');
    });

    it('should throw error for negative duration', () => {
      const negativeDuration = -60;
      
      expect(() => formatDuration(negativeDuration)).toThrow('Duration must be non-negative');
    });

    it('should throw error for invalid duration', () => {
      expect(() => formatDuration(NaN)).toThrow('Duration must be a valid number');
      expect(() => formatDuration(Infinity)).toThrow('Duration must be a valid number');
    });
  });
});