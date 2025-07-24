import { LocationPoint, validateGPSAccuracy, validateGPSAccuracyDetailed, validateLocationPoint, validateLocationPointDetailed } from '../../types/location';
import { LOCATION_ERROR_CODES, LocationError } from '../../utils/errors';

describe('location types and validation', () => {
  describe('LocationPoint basic validation (wrapper function)', () => {
    test('should return true for valid LocationPoint', () => {
      const validLocation: LocationPoint = {
        latitude: 35.6762,
        longitude: 139.6503,
        timestamp: new Date('2023-01-01T10:00:00Z'),
        accuracy: 5.0,
        speed: 1.5,
        heading: 45.0
      };

      expect(validateLocationPoint(validLocation)).toBe(true);
    });

    test('should return false for invalid LocationPoint', () => {
      const invalidLocation: LocationPoint = {
        latitude: 91.0, // Invalid latitude
        longitude: 139.6503,
        timestamp: new Date('2023-01-01T10:00:00Z'),
        accuracy: 5.0,
        speed: 1.5,
        heading: 45.0
      };

      expect(validateLocationPoint(invalidLocation)).toBe(false);
    });
  });

  describe('GPS accuracy validation', () => {
    test('should validate best accuracy level', () => {
      expect(validateGPSAccuracy('best')).toBe(true);
    });

    test('should validate nearest-ten-meters accuracy level', () => {
      expect(validateGPSAccuracy('nearest-ten-meters')).toBe(true);
    });

    test('should validate hundred-meters accuracy level', () => {
      expect(validateGPSAccuracy('hundred-meters')).toBe(true);
    });

    test('should validate kilometer accuracy level', () => {
      expect(validateGPSAccuracy('kilometer')).toBe(true);
    });

    test('should validate three-kilometers accuracy level', () => {
      expect(validateGPSAccuracy('three-kilometers')).toBe(true);
    });

    test('should invalidate unknown accuracy level', () => {
      expect(validateGPSAccuracy('unknown' as any)).toBe(false);
    });
  });

  describe('GPS accuracy detailed validation', () => {
    test('should return valid result for valid GPS accuracy', () => {
      const result = validateGPSAccuracyDetailed('best');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should return error for invalid GPS accuracy', () => {
      const result = validateGPSAccuracyDetailed('invalid-accuracy');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeInstanceOf(LocationError);
      expect(result.error!.code).toBe(LOCATION_ERROR_CODES.INVALID_GPS_ACCURACY);
      expect(result.error!.message).toContain('Invalid GPS accuracy: invalid-accuracy');
      expect(result.error!.field).toBe('accuracy');
    });
  });

  describe('LocationPoint detailed validation', () => {
    test('should return valid result for valid LocationPoint', () => {
      const validLocation: LocationPoint = {
        latitude: 35.6762,
        longitude: 139.6503,
        timestamp: new Date('2023-01-01T10:00:00Z'),
        accuracy: 5.0,
        speed: 1.5,
        heading: 45.0
      };

      const result = validateLocationPointDetailed(validLocation);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should return error for invalid latitude (> 90)', () => {
      const invalidLocation: LocationPoint = {
        latitude: 91.0,
        longitude: 139.6503,
        timestamp: new Date('2023-01-01T10:00:00Z'),
        accuracy: 5.0,
        speed: 1.5,
        heading: 45.0
      };

      const result = validateLocationPointDetailed(invalidLocation);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeInstanceOf(LocationError);
      expect(result.error!.code).toBe(LOCATION_ERROR_CODES.LATITUDE_OUT_OF_RANGE);
      expect(result.error!.message).toBe('Invalid latitude: 91. Must be between -90 and 90.');
      expect(result.error!.field).toBe('latitude');
    });

    test('should return error for invalid longitude (< -180)', () => {
      const invalidLocation: LocationPoint = {
        latitude: 35.6762,
        longitude: -181.0,
        timestamp: new Date('2023-01-01T10:00:00Z'),
        accuracy: 5.0,
        speed: 1.5,
        heading: 45.0
      };

      const result = validateLocationPointDetailed(invalidLocation);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeInstanceOf(LocationError);
      expect(result.error!.code).toBe(LOCATION_ERROR_CODES.LONGITUDE_OUT_OF_RANGE);
      expect(result.error!.message).toBe('Invalid longitude: -181. Must be between -180 and 180.');
      expect(result.error!.field).toBe('longitude');
    });

    test('should return error for negative accuracy', () => {
      const invalidLocation: LocationPoint = {
        latitude: 35.6762,
        longitude: 139.6503,
        timestamp: new Date('2023-01-01T10:00:00Z'),
        accuracy: -1.0,
        speed: 1.5,
        heading: 45.0
      };

      const result = validateLocationPointDetailed(invalidLocation);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeInstanceOf(LocationError);
      expect(result.error!.code).toBe(LOCATION_ERROR_CODES.NEGATIVE_ACCURACY);
      expect(result.error!.message).toBe('Invalid accuracy: -1. Must be non-negative.');
      expect(result.error!.field).toBe('accuracy');
    });

    test('should return error for negative speed', () => {
      const invalidLocation: LocationPoint = {
        latitude: 35.6762,
        longitude: 139.6503,
        timestamp: new Date('2023-01-01T10:00:00Z'),
        accuracy: 5.0,
        speed: -1.0,
        heading: 45.0
      };

      const result = validateLocationPointDetailed(invalidLocation);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeInstanceOf(LocationError);
      expect(result.error!.code).toBe(LOCATION_ERROR_CODES.NEGATIVE_SPEED);
      expect(result.error!.message).toBe('Invalid speed: -1. Must be non-negative or null.');
      expect(result.error!.field).toBe('speed');
    });

    test('should return error for invalid heading (> 360)', () => {
      const invalidLocation: LocationPoint = {
        latitude: 35.6762,
        longitude: 139.6503,
        timestamp: new Date('2023-01-01T10:00:00Z'),
        accuracy: 5.0,
        speed: 1.5,
        heading: 361.0
      };

      const result = validateLocationPointDetailed(invalidLocation);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeInstanceOf(LocationError);
      expect(result.error!.code).toBe(LOCATION_ERROR_CODES.INVALID_HEADING);
      expect(result.error!.message).toBe('Invalid heading: 361. Must be between 0 and 360 or null.');
      expect(result.error!.field).toBe('heading');
    });

    test('should return error for invalid heading (< 0)', () => {
      const invalidLocation: LocationPoint = {
        latitude: 35.6762,
        longitude: 139.6503,
        timestamp: new Date('2023-01-01T10:00:00Z'),
        accuracy: 5.0,
        speed: 1.5,
        heading: -1.0
      };

      const result = validateLocationPointDetailed(invalidLocation);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeInstanceOf(LocationError);
      expect(result.error!.code).toBe(LOCATION_ERROR_CODES.INVALID_HEADING);
      expect(result.error!.message).toBe('Invalid heading: -1. Must be between 0 and 360 or null.');
      expect(result.error!.field).toBe('heading');
    });
  });
});