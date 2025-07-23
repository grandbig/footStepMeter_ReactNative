import { VALIDATION_ERROR_CODES, LOCATION_ERROR_CODES, createValidationError, createLocationError } from './errors';

/**
 * GPS location point interface
 */
export interface LocationPoint {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two GPS points using Haversine formula
 * @param from Starting GPS point
 * @param to Destination GPS point
 * @returns Distance in meters
 * @throws {Error} When coordinates are invalid or NaN
 */
export function calculateDistance(from: LocationPoint, to: LocationPoint): number {
  // Input validation
  validateLocationPoint(from, 'from');
  validateLocationPoint(to, 'to');

  // Return 0 for identical points (with floating-point precision tolerance)
  if (arePointsEqual(from, to)) {
    return 0;
  }

  // Earth's radius in meters (WGS84 ellipsoid mean radius)
  const R = 6371008.8;
  
  const fromLatRad = toRadians(from.latitude);
  const toLatRad = toRadians(to.latitude);
  const deltaLatRad = toRadians(to.latitude - from.latitude);
  const deltaLonRad = toRadians(to.longitude - from.longitude);

  // Haversine formula
  const sinDeltaLat = Math.sin(deltaLatRad / 2);
  const sinDeltaLon = Math.sin(deltaLonRad / 2);
  
  const angularDistanceFactor = sinDeltaLat * sinDeltaLat +
                                Math.cos(fromLatRad) * Math.cos(toLatRad) * sinDeltaLon * sinDeltaLon;
  
  const centralAngleRad = 2 * Math.atan2(Math.sqrt(angularDistanceFactor), Math.sqrt(1 - angularDistanceFactor));
  
  const distance = R * centralAngleRad;
  
  // Ensure non-negative result
  return Math.max(0, distance);
}

/**
 * Calculate speed in km/h from distance and time
 * @param distanceInMeters Distance in meters
 * @param timeInSeconds Time in seconds
 * @returns Speed in km/h
 * @throws {Error} When inputs are invalid, negative, or NaN
 */
export function calculateSpeed(distanceInMeters: number, timeInSeconds: number): number {
  // Input validation
  if (!isFinite(distanceInMeters) || isNaN(distanceInMeters)) {
    throw createValidationError(VALIDATION_ERROR_CODES.INVALID_VALUE, 'Distance must be a valid finite number', 'distanceInMeters');
  }
  if (!isFinite(timeInSeconds) || isNaN(timeInSeconds)) {
    throw createValidationError(VALIDATION_ERROR_CODES.INVALID_VALUE, 'Time must be a valid finite number', 'timeInSeconds');
  }
  if (distanceInMeters < 0) {
    throw createValidationError(VALIDATION_ERROR_CODES.NEGATIVE_VALUE, 'Distance must be non-negative', 'distanceInMeters');
  }
  if (timeInSeconds <= 0) {
    throw createValidationError(VALIDATION_ERROR_CODES.ZERO_OR_NEGATIVE_VALUE, 'Time must be greater than 0', 'timeInSeconds');
  }

  // Convert meters/second to km/h with precision handling
  const metersPerSecond = distanceInMeters / timeInSeconds;
  const kmPerHour = (metersPerSecond * 3600) / 1000;
  
  // Round to reasonable precision (6 decimal places)
  return Math.round(kmPerHour * 1000000) / 1000000;
}

/**
 * Calculate direction (bearing) from starting point to destination point
 * @param from Starting GPS point
 * @param to Destination GPS point
 * @returns Bearing in degrees (0-360)
 * @throws {Error} When coordinates are invalid or points are identical
 */
export function calculateDirection(from: LocationPoint, to: LocationPoint): number {
  // Input validation
  validateLocationPoint(from, 'from');
  validateLocationPoint(to, 'to');

  // Check for identical points (with floating-point tolerance)
  if (arePointsEqual(from, to)) {
    throw createLocationError(LOCATION_ERROR_CODES.IDENTICAL_POINTS, 'Cannot calculate direction for identical points');
  }

  const fromLatRad = toRadians(from.latitude);
  const toLatRad = toRadians(to.latitude);
  const deltaLonRad = toRadians(to.longitude - from.longitude);

  const y = Math.sin(deltaLonRad) * Math.cos(toLatRad);
  const x = Math.cos(fromLatRad) * Math.sin(toLatRad) - 
            Math.sin(fromLatRad) * Math.cos(toLatRad) * Math.cos(deltaLonRad);

  const bearingRad = Math.atan2(y, x);
  const bearingDeg = toDegrees(bearingRad);

  // Normalize to 0-360 degrees with precision handling
  const normalizedBearing = (bearingDeg + 360) % 360;
  
  // Round to reasonable precision (6 decimal places)
  return Math.round(normalizedBearing * 1000000) / 1000000;
}

// === Helper Functions ===

/**
 * Validate a GPS location point
 * @param point Location point to validate
 * @param paramName Parameter name for error messages
 * @throws {Error} When coordinates are invalid or NaN
 */
export function validateLocationPoint(point: LocationPoint, paramName: string): void {
  if (!point || typeof point !== 'object') {
    throw createValidationError(VALIDATION_ERROR_CODES.INVALID_TYPE, `${paramName} must be a valid LocationPoint object`, paramName);
  }
  
  if (!isFinite(point.latitude) || isNaN(point.latitude)) {
    throw createValidationError(VALIDATION_ERROR_CODES.INVALID_VALUE, `${paramName}.latitude must be a valid finite number`, `${paramName}.latitude`);
  }
  
  if (!isFinite(point.longitude) || isNaN(point.longitude)) {
    throw createValidationError(VALIDATION_ERROR_CODES.INVALID_VALUE, `${paramName}.longitude must be a valid finite number`, `${paramName}.longitude`);
  }
  
  if (Math.abs(point.latitude) > 90) {
    throw createLocationError(LOCATION_ERROR_CODES.LATITUDE_OUT_OF_RANGE, 'Invalid latitude', `${paramName}.latitude`);
  }
  
  if (Math.abs(point.longitude) > 180) {
    throw createLocationError(LOCATION_ERROR_CODES.LONGITUDE_OUT_OF_RANGE, 'Invalid longitude', `${paramName}.longitude`);
  }
}

/**
 * Check if two points are equal within floating-point tolerance
 * @param from First point
 * @param to Second point
 * @returns True if points are approximately equal
 */
export function arePointsEqual(from: LocationPoint, to: LocationPoint): boolean {
  const EPSILON = 1e-10; // Very small tolerance for floating-point comparison
  return Math.abs(from.latitude - to.latitude) < EPSILON &&
         Math.abs(from.longitude - to.longitude) < EPSILON;
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param radians Angle in radians
 * @returns Angle in degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}