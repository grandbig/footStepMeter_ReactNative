/**
 * Geographic coordinate validation utilities
 * Shared between location types and calculation functions
 */

/**
 * Maximum absolute latitude value: 90 degrees
 */
const MAX_LATITUDE = 90;

/**
 * Maximum absolute longitude value: 180 degrees
 */
const MAX_LONGITUDE = 180;

/**
 * Check if latitude value is within valid range
 * @param latitude - Latitude value to validate
 * @returns true if valid, false otherwise
 */
export function isValidLatitude(latitude: number): boolean {
  return Math.abs(latitude) <= MAX_LATITUDE;
}

/**
 * Check if longitude value is within valid range
 * @param longitude - Longitude value to validate
 * @returns true if valid, false otherwise
 */
export function isValidLongitude(longitude: number): boolean {
  return Math.abs(longitude) <= MAX_LONGITUDE;
}

/**
 * Check if coordinate pair is within valid ranges
 * @param latitude - Latitude value to validate
 * @param longitude - Longitude value to validate
 * @returns true if both coordinates are valid, false otherwise
 */
export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return isValidLatitude(latitude) && isValidLongitude(longitude);
}