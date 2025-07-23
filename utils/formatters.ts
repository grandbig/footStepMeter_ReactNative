import { VALIDATION_ERROR_CODES, FORMAT_ERROR_CODES, createValidationError, createFormatError } from './errors';

/**
 * Supported locales for formatting
 */
export enum Locale {
  EN_US = 'en-US',
  JA_JP = 'ja-JP'
}

export type SupportedLocale = Locale;

/**
 * Date formatting options for different locales
 */
const DATE_FORMAT_OPTIONS: Record<SupportedLocale, Intl.DateTimeFormatOptions> = {
  [Locale.EN_US]: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  },
  [Locale.JA_JP]: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }
};

/**
 * Format a date object to human-readable string
 * @param date Date object to format
 * @param locale Locale string (default: 'en-US')
 * @returns Formatted date string
 * @throws {Error} When date is invalid
 */
export function formatDateTime(date: Date, locale: SupportedLocale = Locale.EN_US): string {
  // Input validation
  if (!date || !(date instanceof Date)) {
    throw createValidationError(VALIDATION_ERROR_CODES.INVALID_TYPE, 'Invalid date provided', 'date');
  }
  
  if (isNaN(date.getTime())) {
    throw createFormatError(FORMAT_ERROR_CODES.INVALID_DATE, 'Invalid date provided', 'date');
  }

  // Custom formatting for Japanese locale to match expected format
  if (locale === Locale.JA_JP) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  }

  // Use Intl.DateTimeFormat for other locales
  const options = DATE_FORMAT_OPTIONS[locale] || DATE_FORMAT_OPTIONS[Locale.EN_US];
  return date.toLocaleString(locale, options);
}

/**
 * Distance unit labels for different locales
 */
const DISTANCE_UNITS: Record<SupportedLocale, { meter: string; kilometer: string }> = {
  [Locale.EN_US]: { meter: 'm', kilometer: 'km' },
  [Locale.JA_JP]: { meter: 'm', kilometer: 'km' }
};

/**
 * Format distance in meters to human-readable string
 * @param distanceInMeters Distance in meters
 * @param locale Locale string (default: 'en-US')
 * @returns Formatted distance string (e.g., "1.5 km" or "250 m")
 * @throws {Error} When distance is invalid or negative
 */
export function formatDistance(distanceInMeters: number, locale: SupportedLocale = Locale.EN_US): string {
  // Input validation
  if (!isFinite(distanceInMeters) || isNaN(distanceInMeters)) {
    throw createValidationError(VALIDATION_ERROR_CODES.INVALID_VALUE, 'Distance must be a valid number', 'distanceInMeters');
  }
  
  if (distanceInMeters < 0) {
    throw createValidationError(VALIDATION_ERROR_CODES.NEGATIVE_VALUE, 'Distance must be non-negative', 'distanceInMeters');
  }

  const units = DISTANCE_UNITS[locale];

  if (distanceInMeters < 1000) {
    return `${distanceInMeters} ${units.meter}`;
  }

  const kilometers = distanceInMeters / 1000;
  const rounded = Math.round(kilometers * 10) / 10;
  return `${rounded} ${units.kilometer}`;
}

/**
 * Speed unit labels for different locales
 */
const SPEED_UNITS: Record<SupportedLocale, string> = {
  [Locale.EN_US]: 'km/h',
  [Locale.JA_JP]: 'km/h'
};

/**
 * Format speed in km/h to human-readable string
 * @param speedInKmh Speed in kilometers per hour
 * @param locale Locale string (default: 'en-US')
 * @returns Formatted speed string (e.g., "12.5 km/h")
 * @throws {Error} When speed is invalid or negative
 */
export function formatSpeed(speedInKmh: number, locale: SupportedLocale = Locale.EN_US): string {
  // Input validation
  if (!isFinite(speedInKmh) || isNaN(speedInKmh)) {
    throw createValidationError(VALIDATION_ERROR_CODES.INVALID_VALUE, 'Speed must be a valid number', 'speedInKmh');
  }
  
  if (speedInKmh < 0) {
    throw createValidationError(VALIDATION_ERROR_CODES.NEGATIVE_VALUE, 'Speed must be non-negative', 'speedInKmh');
  }

  const unit = SPEED_UNITS[locale];
  
  // Round to 1 decimal place, but show integers without decimals
  const rounded = Math.round(speedInKmh * 10) / 10;
  return `${rounded} ${unit}`;
}

/**
 * Duration unit labels for different locales
 */
const DURATION_UNITS: Record<SupportedLocale, { hour: string; minute: string; second: string }> = {
  [Locale.EN_US]: { hour: 'h', minute: 'm', second: 's' },
  [Locale.JA_JP]: { hour: '時間', minute: '分', second: '秒' }
};

/**
 * Format duration in seconds to human-readable string
 * @param durationInSeconds Duration in seconds
 * @param locale Locale string (default: 'en-US')
 * @returns Formatted duration string (e.g., "1h 5m 30s", "2m 15s", "45s")
 * @throws {Error} When duration is invalid or negative
 */
export function formatDuration(durationInSeconds: number, locale: SupportedLocale = Locale.EN_US): string {
  if (!isFinite(durationInSeconds) || isNaN(durationInSeconds)) {
    throw createValidationError(VALIDATION_ERROR_CODES.INVALID_VALUE, 'Duration must be a valid number', 'durationInSeconds');
  }
  
  if (durationInSeconds < 0) {
    throw createValidationError(VALIDATION_ERROR_CODES.NEGATIVE_VALUE, 'Duration must be non-negative', 'durationInSeconds');
  }

  if (durationInSeconds === 0) {
    const units = DURATION_UNITS[locale];
    return `0${units.second}`;
  }

  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = durationInSeconds % 60;

  const units = DURATION_UNITS[locale];
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours}${units.hour}`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes}${units.minute}`);
  }
  
  if (seconds > 0) {
    parts.push(`${seconds}${units.second}`);
  }

  return parts.join(' ');
}