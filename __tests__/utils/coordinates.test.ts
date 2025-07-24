import {
  isValidCoordinate,
  isValidLatitude,
  isValidLongitude
} from '../../utils/coordinates';

describe('coordinates validation utilities', () => {
  describe('isValidLatitude', () => {

    test('should accept boundary latitude values', () => {
      expect(isValidLatitude(90)).toBe(true);
      expect(isValidLatitude(-90)).toBe(true);
    });

    test('should reject out-of-range latitude values', () => {
      expect(isValidLatitude(91)).toBe(false);
      expect(isValidLatitude(-91)).toBe(false);
    });

    test('should reject invalid latitude values', () => {
      expect(isValidLatitude(NaN)).toBe(false);
      expect(isValidLatitude(Infinity)).toBe(false);
      expect(isValidLatitude(-Infinity)).toBe(false);
    });
  });

  describe('isValidLongitude', () => {

    test('should accept boundary longitude values', () => {
      expect(isValidLongitude(180)).toBe(true);
      expect(isValidLongitude(-180)).toBe(true);
    });

    test('should reject out-of-range longitude values', () => {
      expect(isValidLongitude(181)).toBe(false);
      expect(isValidLongitude(-181)).toBe(false);
    });

    test('should reject invalid longitude values', () => {
      expect(isValidLongitude(NaN)).toBe(false);
      expect(isValidLongitude(Infinity)).toBe(false);
      expect(isValidLongitude(-Infinity)).toBe(false);
    });
  });

  describe('isValidCoordinate', () => {
    test('should accept valid coordinate pairs', () => {
      expect(isValidCoordinate(90, 180)).toBe(true);
      expect(isValidCoordinate(-90, -180)).toBe(true);
    });

    test('should reject coordinate pairs with invalid latitude', () => {
      expect(isValidCoordinate(91, 0)).toBe(false);
      expect(isValidCoordinate(-91, 0)).toBe(false);
    });

    test('should reject coordinate pairs with invalid longitude', () => {
      expect(isValidCoordinate(0, 181)).toBe(false);
      expect(isValidCoordinate(0, -181)).toBe(false);
    });

    test('should reject coordinate pairs with both invalid values', () => {
      expect(isValidCoordinate(91, 181)).toBe(false);
      expect(isValidCoordinate(-91, -181)).toBe(false);
    });

    test('should reject coordinate pairs with NaN values', () => {
      expect(isValidCoordinate(NaN, 0)).toBe(false);
      expect(isValidCoordinate(0, NaN)).toBe(false);
      expect(isValidCoordinate(NaN, NaN)).toBe(false);
    });
  });
});