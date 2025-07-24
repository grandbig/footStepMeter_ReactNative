import { isValidLatitude, isValidLongitude } from '../utils/coordinates';
import { LOCATION_ERROR_CODES, LocationError } from '../utils/errors';

/**
 * GPS accuracy constants for type-safe usage
 * Single source of truth for all GPS accuracy values
 * Based on LocationAccuracy enum from expo-location
 */
export const GPS_ACCURACY = {
  BEST: 'best',
  NEAREST_TEN_METERS: 'nearest-ten-meters',
  HUNDRED_METERS: 'hundred-meters',
  KILOMETER: 'kilometer',
  THREE_KILOMETERS: 'three-kilometers'
} as const;

/**
 * GPS accuracy type derived from the constants object
 */
export type GPSAccuracy = typeof GPS_ACCURACY[keyof typeof GPS_ACCURACY];

/**
 * Validation result with optional LocationError
 */
export interface ValidationResult {
  isValid: boolean;
  error?: LocationError;
}

/**
 * Represents a single GPS location point with timestamp and metadata
 */
export interface LocationPoint {
  /** Latitude in degrees (-90 to 90) */
  latitude: number;
  /** Longitude in degrees (-180 to 180) */
  longitude: number;
  /** Timestamp when the location was recorded */
  timestamp: Date;
  /** GPS accuracy in meters (0 or positive) */
  accuracy: number;
  /** Speed in m/s (null if unavailable, 0 or positive if available) */
  speed: number | null;
  /** Heading in degrees (null if unavailable, 0-360 if available) */
  heading: number | null;
}

/**
 * Validates a LocationPoint object for data integrity
 * @param location - The LocationPoint to validate
 * @returns true if valid, false otherwise
 */
export function validateLocationPoint(location: LocationPoint): boolean {
  const result = validateLocationPointDetailed(location);
  return result.isValid;
}

/**
 * Set of valid GPS accuracy levels for O(1) lookup performance
 */
const VALID_GPS_ACCURACIES = new Set<GPSAccuracy>(Object.values(GPS_ACCURACY));

/**
 * Validates GPS accuracy level string
 * @param accuracy - The GPS accuracy level to validate
 * @returns true if valid, false otherwise
 */
export function validateGPSAccuracy(accuracy: GPSAccuracy): boolean {
  return VALID_GPS_ACCURACIES.has(accuracy);
}

/**
 * Validates GPS accuracy level with detailed error reporting
 * @param accuracy - The GPS accuracy level to validate (any value for runtime validation)
 * @returns ValidationResult with LocationError
 */
export function validateGPSAccuracyDetailed(accuracy: unknown): ValidationResult {
  if (!validateGPSAccuracy(accuracy as GPSAccuracy)) {
    return {
      isValid: false,
      error: new LocationError(
        LOCATION_ERROR_CODES.INVALID_GPS_ACCURACY,
        `Invalid GPS accuracy: ${accuracy}. Must be one of: ${Object.values(GPS_ACCURACY).join(', ')}.`,
        'accuracy'
      )
    };
  }

  return { isValid: true };
}

/**
 * Validates a LocationPoint object with detailed error reporting
 * @param location - The LocationPoint to validate
 * @returns ValidationResult with LocationError
 */
export function validateLocationPointDetailed(location: LocationPoint): ValidationResult {
  // Check each field individually to provide detailed error
  if (!isValidLatitude(location.latitude)) {
    return { 
      isValid: false, 
      error: new LocationError(
        LOCATION_ERROR_CODES.LATITUDE_OUT_OF_RANGE,
        `Invalid latitude: ${location.latitude}. Must be between -90 and 90.`,
        'latitude'
      )
    };
  }

  if (!isValidLongitude(location.longitude)) {
    return { 
      isValid: false, 
      error: new LocationError(
        LOCATION_ERROR_CODES.LONGITUDE_OUT_OF_RANGE,
        `Invalid longitude: ${location.longitude}. Must be between -180 and 180.`,
        'longitude'
      )
    };
  }

  if (location.accuracy < 0) {
    return { 
      isValid: false, 
      error: new LocationError(
        LOCATION_ERROR_CODES.NEGATIVE_ACCURACY,
        `Invalid accuracy: ${location.accuracy}. Must be non-negative.`,
        'accuracy'
      )
    };
  }

  if (location.speed !== null && location.speed < 0) {
    return { 
      isValid: false, 
      error: new LocationError(
        LOCATION_ERROR_CODES.NEGATIVE_SPEED,
        `Invalid speed: ${location.speed}. Must be non-negative or null.`,
        'speed'
      )
    };
  }

  if (location.heading !== null && (location.heading < 0 || location.heading > 360)) {
    return { 
      isValid: false, 
      error: new LocationError(
        LOCATION_ERROR_CODES.INVALID_HEADING,
        `Invalid heading: ${location.heading}. Must be between 0 and 360 or null.`,
        'heading'
      )
    };
  }

  // All validations passed
  return { isValid: true };
}