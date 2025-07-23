import {
  calculateDistance,
  calculateSpeed,
  calculateDirection,
  validateLocationPoint,
  arePointsEqual,
} from '../../utils/calculations';
import { ValidationError, LocationError, VALIDATION_ERROR_CODES, LOCATION_ERROR_CODES } from '../../utils/errors';

describe('calculations', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two GPS points using Haversine formula', () => {
      // Tokyo Station to Shibuya Station (approximately 6.5km)
      const tokyoStation = { latitude: 35.6812, longitude: 139.7671 };
      const shibuyaStation = { latitude: 35.6580, longitude: 139.7016 };
      
      const distance = calculateDistance(tokyoStation, shibuyaStation);
      
      // Test with exact expected value
      expect(distance).toBe(6454.8044191691315);
    });

    it('should return 0 for identical points', () => {
      const point = { latitude: 35.6812, longitude: 139.7671 };
      
      const distance = calculateDistance(point, point);
      
      expect(distance).toBe(0);
    });


    it('should throw LocationError with LATITUDE_OUT_OF_RANGE for invalid first argument', () => {
      const validPoint = { latitude: 35.6812, longitude: 139.7671 };
      const invalidPoint = { latitude: 91, longitude: 139.7671 };
      let thrownError: any;
      
      try {
        calculateDistance(invalidPoint, validPoint);
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeInstanceOf(LocationError);
      expect(thrownError.code).toBe(LOCATION_ERROR_CODES.LATITUDE_OUT_OF_RANGE);
      expect(thrownError.field).toBe('from.latitude');
    });

    it('should throw LocationError with LONGITUDE_OUT_OF_RANGE for invalid second argument', () => {
      const validPoint = { latitude: 35.6812, longitude: 139.7671 };
      const invalidPoint = { latitude: 35.6812, longitude: 181 };
      let thrownError: any;
      
      try {
        calculateDistance(validPoint, invalidPoint);
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeInstanceOf(LocationError);
      expect(thrownError.code).toBe(LOCATION_ERROR_CODES.LONGITUDE_OUT_OF_RANGE);
      expect(thrownError.field).toBe('to.longitude');
    });
  });

  describe('calculateSpeed', () => {
    it('should calculate speed in km/h from distance and time', () => {
      const distanceInMeters = 1000; // 1km
      const timeInSeconds = 600; // 10 minutes
      
      const speed = calculateSpeed(distanceInMeters, timeInSeconds);
      
      expect(speed).toBe(6); // 6 km/h
    });

    it('should throw ValidationError with INVALID_VALUE for invalid distance (NaN/Infinity)', () => {
      let thrownError: any;
      
      // Test NaN
      try {
        calculateSpeed(NaN, 600);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.INVALID_VALUE);
      expect(thrownError.field).toBe('distanceInMeters');
      
      // Test Infinity
      thrownError = undefined;
      try {
        calculateSpeed(Infinity, 600);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
    });

    it('should throw ValidationError with INVALID_VALUE for invalid time (NaN/Infinity)', () => {
      let thrownError: any;
      
      // Test NaN
      try {
        calculateSpeed(1000, NaN);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.INVALID_VALUE);
      expect(thrownError.field).toBe('timeInSeconds');
      
      // Test Infinity
      thrownError = undefined;
      try {
        calculateSpeed(1000, Infinity);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
    });

    it('should throw ValidationError with NEGATIVE_VALUE for negative distance', () => {
      let thrownError: any;
      
      try {
        calculateSpeed(-1000, 600);
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.NEGATIVE_VALUE);
      expect(thrownError.field).toBe('distanceInMeters');
    });

    it('should throw ValidationError with ZERO_OR_NEGATIVE_VALUE for zero or negative time', () => {
      let thrownError: any;
      
      // Test zero
      try {
        calculateSpeed(1000, 0);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.ZERO_OR_NEGATIVE_VALUE);
      expect(thrownError.field).toBe('timeInSeconds');
      
      // Test negative
      thrownError = undefined;
      try {
        calculateSpeed(1000, -600);
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
    });
  });

  describe('calculateDirection', () => {
    it('should throw LocationError with LATITUDE_OUT_OF_RANGE for invalid from argument', () => {
      const validPoint = { latitude: 35.6812, longitude: 139.7671 };
      const invalidPoint = { latitude: 91, longitude: 139.7671 };
      let thrownError: any;
      
      try {
        calculateDirection(invalidPoint, validPoint);
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeInstanceOf(LocationError);
      expect(thrownError.code).toBe(LOCATION_ERROR_CODES.LATITUDE_OUT_OF_RANGE);
      expect(thrownError.field).toBe('from.latitude');
    });

    it('should throw LocationError with LONGITUDE_OUT_OF_RANGE for invalid to argument', () => {
      const validPoint = { latitude: 35.6812, longitude: 139.7671 };
      const invalidPoint = { latitude: 35.6812, longitude: 181 };
      let thrownError: any;
      
      try {
        calculateDirection(validPoint, invalidPoint);
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeInstanceOf(LocationError);
      expect(thrownError.code).toBe(LOCATION_ERROR_CODES.LONGITUDE_OUT_OF_RANGE);
      expect(thrownError.field).toBe('to.longitude');
    });

    it('should throw LocationError with IDENTICAL_POINTS for identical points', () => {
      const point = { latitude: 35.6812, longitude: 139.7671 };
      let thrownError: any;
      
      try {
        calculateDirection(point, point);
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeInstanceOf(LocationError);
      expect(thrownError.code).toBe(LOCATION_ERROR_CODES.IDENTICAL_POINTS);
    });

    it('should calculate bearing from starting point to destination', () => {
      // Tokyo Station to Ueno Station (roughly northward)
      const tokyoStation = { latitude: 35.6812, longitude: 139.7671 };
      const uenoStation = { latitude: 35.7138, longitude: 139.7774 };
      
      const direction = calculateDirection(tokyoStation, uenoStation);
      
      // Exact calculated bearing value (northeast direction)
      expect(direction).toBe(14.387869000000001);
    });
  });

  describe('validateLocationPoint', () => {
    it('should throw ValidationError with INVALID_TYPE for null or undefined point', () => {
      let thrownError: any;
      
      // Test null
      try {
        validateLocationPoint(null as any, 'testPoint');
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.INVALID_TYPE);
      expect(thrownError.field).toBe('testPoint');
      
      // Test undefined
      thrownError = undefined;
      try {
        validateLocationPoint(undefined as any, 'testPoint');
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
    });

    it('should throw ValidationError with INVALID_TYPE for non-object point', () => {
      let thrownError: any;
      
      try {
        validateLocationPoint('invalid' as any, 'testPoint');
      } catch (error) {
        thrownError = error;
      }
      
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.INVALID_TYPE);
      expect(thrownError.field).toBe('testPoint');
    });

    it('should throw ValidationError with INVALID_VALUE for NaN coordinates', () => {
      const nanLatPoint = { latitude: NaN, longitude: 139.7671 };
      const nanLonPoint = { latitude: 35.6812, longitude: NaN };
      let thrownError: any;
      
      // Test NaN latitude
      try {
        validateLocationPoint(nanLatPoint, 'testPoint');
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.INVALID_VALUE);
      expect(thrownError.field).toBe('testPoint.latitude');
      
      // Test NaN longitude
      thrownError = undefined;
      try {
        validateLocationPoint(nanLonPoint, 'testPoint');
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
    });

    it('should throw ValidationError with INVALID_VALUE for infinite coordinates', () => {
      const infLatPoint = { latitude: Infinity, longitude: 139.7671 };
      const infLonPoint = { latitude: 35.6812, longitude: -Infinity };
      let thrownError: any;
      
      // Test Infinity latitude
      try {
        validateLocationPoint(infLatPoint, 'testPoint');
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(VALIDATION_ERROR_CODES.INVALID_VALUE);
      expect(thrownError.field).toBe('testPoint.latitude');
      
      // Test -Infinity longitude
      thrownError = undefined;
      try {
        validateLocationPoint(infLonPoint, 'testPoint');
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(ValidationError);
    });

    it('should throw LocationError with LATITUDE_OUT_OF_RANGE for out-of-range latitude', () => {
      const highLatPoint = { latitude: 91, longitude: 139.7671 };
      const lowLatPoint = { latitude: -91, longitude: 139.7671 };
      let thrownError: any;
      
      // Test high latitude
      try {
        validateLocationPoint(highLatPoint, 'testPoint');
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(LocationError);
      expect(thrownError.code).toBe(LOCATION_ERROR_CODES.LATITUDE_OUT_OF_RANGE);
      expect(thrownError.field).toBe('testPoint.latitude');
      
      // Test low latitude
      thrownError = undefined;
      try {
        validateLocationPoint(lowLatPoint, 'testPoint');
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(LocationError);
    });

    it('should throw LocationError with LONGITUDE_OUT_OF_RANGE for out-of-range longitude', () => {
      const highLonPoint = { latitude: 35.6812, longitude: 181 };
      const lowLonPoint = { latitude: 35.6812, longitude: -181 };
      let thrownError: any;
      
      // Test high longitude
      try {
        validateLocationPoint(highLonPoint, 'testPoint');
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(LocationError);
      expect(thrownError.code).toBe(LOCATION_ERROR_CODES.LONGITUDE_OUT_OF_RANGE);
      expect(thrownError.field).toBe('testPoint.longitude');
      
      // Test low longitude
      thrownError = undefined;
      try {
        validateLocationPoint(lowLonPoint, 'testPoint');
      } catch (error) {
        thrownError = error;
      }
      expect(thrownError).toBeInstanceOf(LocationError);
    });

    it('should accept edge case coordinates', () => {
      const northPole = { latitude: 90, longitude: 0 };
      const southPole = { latitude: -90, longitude: 0 };
      const dateLine = { latitude: 0, longitude: 180 };
      const antiMeridian = { latitude: 0, longitude: -180 };
      
      expect(() => validateLocationPoint(northPole, 'northPole')).not.toThrow();
      expect(() => validateLocationPoint(southPole, 'southPole')).not.toThrow();
      expect(() => validateLocationPoint(dateLine, 'dateLine')).not.toThrow();
      expect(() => validateLocationPoint(antiMeridian, 'antiMeridian')).not.toThrow();
    });
  });

  describe('arePointsEqual', () => {
    it('should return true when both latitude and longitude are within epsilon tolerance', () => {
      const point1 = { latitude: 35.6812, longitude: 139.7671 };
      const point2 = { latitude: 35.6812 + 1e-11, longitude: 139.7671 + 1e-11 };
      
      expect(arePointsEqual(point1, point2)).toBe(true);
    });

    it('should return false when latitude is within epsilon but longitude exceeds epsilon', () => {
      const point1 = { latitude: 35.6812, longitude: 139.7671 };
      const point2 = { latitude: 35.6812 + 1e-11, longitude: 139.7671 + 1e-9 };
      
      expect(arePointsEqual(point1, point2)).toBe(false);
    });

    it('should return false when latitude exceeds epsilon but longitude is within epsilon', () => {
      const point1 = { latitude: 35.6812, longitude: 139.7671 };
      const point2 = { latitude: 35.6812 + 1e-9, longitude: 139.7671 + 1e-11 };
      
      expect(arePointsEqual(point1, point2)).toBe(false);
    });

    it('should return false when both latitude and longitude exceed epsilon tolerance', () => {
      const point1 = { latitude: 35.6812, longitude: 139.7671 };
      const point2 = { latitude: 35.6812 + 1e-9, longitude: 139.7671 + 1e-9 };
      
      expect(arePointsEqual(point1, point2)).toBe(false);
    });
  });

});