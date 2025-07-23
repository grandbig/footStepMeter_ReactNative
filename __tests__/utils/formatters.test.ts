import {
  formatDateTime,
  formatDistance,
  formatDuration,
  formatSpeed,
  Locale,
} from '../../utils/formatters';
import { ValidationError, FormatError, VALIDATION_ERROR_CODES, FORMAT_ERROR_CODES } from '../../utils/errors';

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

    it('should throw ValidationError with INVALID_TYPE for null date', () => {
      let thrownError: any;
      
      try {
        formatDateTime(null as any);
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.INVALID_TYPE);
      expect(thrownError.field).toBe('date');
    });

    it('should throw ValidationError with INVALID_TYPE for undefined date', () => {
      let thrownError: any;
      
      try {
        formatDateTime(undefined as any);
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.INVALID_TYPE);
      expect(thrownError.field).toBe('date');
    });

    it('should throw ValidationError with INVALID_TYPE for non-Date object', () => {
      let thrownError: any;
      
      // Test string input
      try {
        formatDateTime('invalid' as any);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.INVALID_TYPE);
      expect(thrownError.field).toBe('date');
      
      // Test number input
      thrownError = undefined;
      try {
        formatDateTime(123 as any);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
      
      // Test object input
      thrownError = undefined;
      try {
        formatDateTime({} as any);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
    });

    it('should throw FormatError with INVALID_DATE for invalid Date object', () => {
      const invalidDate = new Date('invalid');
      let thrownError: any;
      
      try {
        formatDateTime(invalidDate);
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeInstanceOf(FormatError);
      expect(thrownError.code).toBe(FORMAT_ERROR_CODES.INVALID_DATE);
      expect(thrownError.field).toBe('date');
    });

    it('should fallback to en-US format for unsupported locale', () => {
      const date = new Date('2023-12-25T14:30:45.123Z');
      
      // Type assertion to test unsupported locale fallback
      // Using 'en-US' as the locale but with an invalid key to trigger fallback
      const formatted = formatDateTime(date, 'invalid-locale' as any);
      
      // Should fallback to exactly the same format as en-US default
      expect(formatted).toBe('Dec 25, 2023, 11:30 PM');
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

    it('should throw ValidationError with NEGATIVE_VALUE for negative distance', () => {
      const negativeDistance = -100;
      let thrownError: any;
      
      try {
        formatDistance(negativeDistance);
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.NEGATIVE_VALUE);
      expect(thrownError.field).toBe('distanceInMeters');
    });

    it('should throw ValidationError with INVALID_VALUE for invalid distance', () => {
      let thrownError: any;
      
      // Test NaN
      try {
        formatDistance(NaN);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.INVALID_VALUE);
      expect(thrownError.field).toBe('distanceInMeters');
      
      // Test Infinity
      thrownError = undefined;
      try {
        formatDistance(Infinity);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
    });
  });

  describe('formatSpeed', () => {
    it('should format speed with one decimal place', () => {
      const speedInKmh = 12.5;
      
      const formatted = formatSpeed(speedInKmh);
      
      expect(formatted).toBe('12.5 km/h');
    });

    it('should throw ValidationError with NEGATIVE_VALUE for negative speed', () => {
      const negativeSpeed = -10;
      let thrownError: any;
      
      try {
        formatSpeed(negativeSpeed);
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.NEGATIVE_VALUE);
      expect(thrownError.field).toBe('speedInKmh');
    });

    it('should throw ValidationError with INVALID_VALUE for invalid speed', () => {
      let thrownError: any;
      
      // Test NaN
      try {
        formatSpeed(NaN);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.INVALID_VALUE);
      expect(thrownError.field).toBe('speedInKmh');
      
      // Test Infinity
      thrownError = undefined;
      try {
        formatSpeed(Infinity);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
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

    it('should throw ValidationError with NEGATIVE_VALUE for negative duration', () => {
      const negativeDuration = -60;
      let thrownError: any;
      
      try {
        formatDuration(negativeDuration);
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.NEGATIVE_VALUE);
      expect(thrownError.field).toBe('durationInSeconds');
    });

    it('should throw ValidationError with INVALID_VALUE for invalid duration', () => {
      let thrownError: any;
      
      // Test NaN
      try {
        formatDuration(NaN);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.INVALID_VALUE);
      expect(thrownError.field).toBe('durationInSeconds');
      
      // Test Infinity
      thrownError = undefined;
      try {
        formatDuration(Infinity);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
    });
  });
});