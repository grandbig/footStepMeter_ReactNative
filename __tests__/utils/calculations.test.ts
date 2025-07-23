import {
  calculateDistance,
  calculateSpeed,
  calculateDirection,
  validateLocationPoint,
  arePointsEqual,
} from '../../utils/calculations';

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


    it('should throw error for invalid first argument', () => {
      const validPoint = { latitude: 35.6812, longitude: 139.7671 };
      const invalidPoint = { latitude: 91, longitude: 139.7671 };
      
      expect(() => calculateDistance(invalidPoint, validPoint)).toThrow('Invalid latitude');
    });

    it('should throw error for invalid second argument', () => {
      const validPoint = { latitude: 35.6812, longitude: 139.7671 };
      const invalidPoint = { latitude: 35.6812, longitude: 181 };
      
      expect(() => calculateDistance(validPoint, invalidPoint)).toThrow('Invalid longitude');
    });
  });

  describe('calculateSpeed', () => {
    it('should calculate speed in km/h from distance and time', () => {
      const distanceInMeters = 1000; // 1km
      const timeInSeconds = 600; // 10 minutes
      
      const speed = calculateSpeed(distanceInMeters, timeInSeconds);
      
      expect(speed).toBe(6); // 6 km/h
    });

    it('should throw error for invalid distance (NaN/Infinity)', () => {
      expect(() => calculateSpeed(NaN, 600))
        .toThrow('Distance must be a valid finite number');
      
      expect(() => calculateSpeed(Infinity, 600))
        .toThrow('Distance must be a valid finite number');
    });

    it('should throw error for invalid time (NaN/Infinity)', () => {
      expect(() => calculateSpeed(1000, NaN))
        .toThrow('Time must be a valid finite number');
      
      expect(() => calculateSpeed(1000, Infinity))
        .toThrow('Time must be a valid finite number');
    });

    it('should throw error for negative distance', () => {
      expect(() => calculateSpeed(-1000, 600))
        .toThrow('Distance must be non-negative');
    });

    it('should throw error for zero or negative time', () => {
      expect(() => calculateSpeed(1000, 0))
        .toThrow('Time must be greater than 0');
      
      expect(() => calculateSpeed(1000, -600))
        .toThrow('Time must be greater than 0');
    });
  });

  describe('calculateDirection', () => {
    it('should throw error for invalid from argument', () => {
      const validPoint = { latitude: 35.6812, longitude: 139.7671 };
      const invalidPoint = { latitude: 91, longitude: 139.7671 };
      
      expect(() => calculateDirection(invalidPoint, validPoint))
        .toThrow('Invalid latitude');
    });

    it('should throw error for invalid to argument', () => {
      const validPoint = { latitude: 35.6812, longitude: 139.7671 };
      const invalidPoint = { latitude: 35.6812, longitude: 181 };
      
      expect(() => calculateDirection(validPoint, invalidPoint))
        .toThrow('Invalid longitude');
    });

    it('should throw error for identical points', () => {
      const point = { latitude: 35.6812, longitude: 139.7671 };
      
      expect(() => calculateDirection(point, point))
        .toThrow('Cannot calculate direction for identical points');
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
    it('should throw error for null or undefined point', () => {
      expect(() => validateLocationPoint(null as any, 'testPoint'))
        .toThrow('testPoint must be a valid LocationPoint object');
      
      expect(() => validateLocationPoint(undefined as any, 'testPoint'))
        .toThrow('testPoint must be a valid LocationPoint object');
    });

    it('should throw error for non-object point', () => {
      expect(() => validateLocationPoint('invalid' as any, 'testPoint'))
        .toThrow('testPoint must be a valid LocationPoint object');
    });

    it('should throw error for NaN coordinates', () => {
      const nanLatPoint = { latitude: NaN, longitude: 139.7671 };
      const nanLonPoint = { latitude: 35.6812, longitude: NaN };
      
      expect(() => validateLocationPoint(nanLatPoint, 'testPoint'))
        .toThrow('testPoint.latitude must be a valid finite number');
      
      expect(() => validateLocationPoint(nanLonPoint, 'testPoint'))
        .toThrow('testPoint.longitude must be a valid finite number');
    });

    it('should throw error for infinite coordinates', () => {
      const infLatPoint = { latitude: Infinity, longitude: 139.7671 };
      const infLonPoint = { latitude: 35.6812, longitude: -Infinity };
      
      expect(() => validateLocationPoint(infLatPoint, 'testPoint'))
        .toThrow('testPoint.latitude must be a valid finite number');
      
      expect(() => validateLocationPoint(infLonPoint, 'testPoint'))
        .toThrow('testPoint.longitude must be a valid finite number');
    });

    it('should throw error for out-of-range latitude', () => {
      const highLatPoint = { latitude: 91, longitude: 139.7671 };
      const lowLatPoint = { latitude: -91, longitude: 139.7671 };
      
      expect(() => validateLocationPoint(highLatPoint, 'testPoint'))
        .toThrow('Invalid latitude');
      
      expect(() => validateLocationPoint(lowLatPoint, 'testPoint'))
        .toThrow('Invalid latitude');
    });

    it('should throw error for out-of-range longitude', () => {
      const highLonPoint = { latitude: 35.6812, longitude: 181 };
      const lowLonPoint = { latitude: 35.6812, longitude: -181 };
      
      expect(() => validateLocationPoint(highLonPoint, 'testPoint'))
        .toThrow('Invalid longitude');
      
      expect(() => validateLocationPoint(lowLonPoint, 'testPoint'))
        .toThrow('Invalid longitude');
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