/**
 * Validation error codes for input validation
 */
export const VALIDATION_ERROR_CODES = {
  INVALID_VALUE: 'INVALID_VALUE',
  NEGATIVE_VALUE: 'NEGATIVE_VALUE', 
  ZERO_OR_NEGATIVE_VALUE: 'ZERO_OR_NEGATIVE_VALUE',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  INVALID_TYPE: 'INVALID_TYPE',
} as const;

export type ValidationErrorCode = typeof VALIDATION_ERROR_CODES[keyof typeof VALIDATION_ERROR_CODES];

/**
 * Location/GPS specific error codes
 */
export const LOCATION_ERROR_CODES = {
  INVALID_COORDINATES: 'LOCATION.INVALID_COORDINATES',
  LATITUDE_OUT_OF_RANGE: 'LOCATION.LATITUDE_OUT_OF_RANGE',
  LONGITUDE_OUT_OF_RANGE: 'LOCATION.LONGITUDE_OUT_OF_RANGE',
  IDENTICAL_POINTS: 'LOCATION.IDENTICAL_POINTS',
  NEGATIVE_ACCURACY: 'LOCATION.NEGATIVE_ACCURACY',
  NEGATIVE_SPEED: 'LOCATION.NEGATIVE_SPEED',
  INVALID_HEADING: 'LOCATION.INVALID_HEADING',
  INVALID_GPS_ACCURACY: 'LOCATION.INVALID_GPS_ACCURACY',
} as const;

export type LocationErrorCode = typeof LOCATION_ERROR_CODES[keyof typeof LOCATION_ERROR_CODES];

/**
 * Formatting specific error codes
 */
export const FORMAT_ERROR_CODES = {
  INVALID_DATE: 'FORMAT.INVALID_DATE',
  UNSUPPORTED_LOCALE: 'FORMAT.UNSUPPORTED_LOCALE',
  INVALID_DURATION: 'FORMAT.INVALID_DURATION',
  INVALID_DISTANCE: 'FORMAT.INVALID_DISTANCE',
  INVALID_SPEED: 'FORMAT.INVALID_SPEED',
} as const;

export type FormatErrorCode = typeof FORMAT_ERROR_CODES[keyof typeof FORMAT_ERROR_CODES];

/**
 * Calculation specific error codes
 */
export const CALCULATION_ERROR_CODES = {
  INVALID_INPUT: 'CALCULATION.INVALID_INPUT',
  DIVISION_BY_ZERO: 'CALCULATION.DIVISION_BY_ZERO',
  COMPUTATION_ERROR: 'CALCULATION.COMPUTATION_ERROR',
} as const;

export type CalculationErrorCode = typeof CALCULATION_ERROR_CODES[keyof typeof CALCULATION_ERROR_CODES];

/**
 * Base error class for all domain-specific errors
 */
abstract class BaseError extends Error {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BaseError);
    }
  }
}

/**
 * Validation error for input validation scenarios
 */
export class ValidationError extends BaseError {
  public readonly code: ValidationErrorCode;

  constructor(code: ValidationErrorCode, message: string, field?: string) {
    super(message, field);
    this.name = 'ValidationError';
    this.code = code;
  }
}

/**
 * Location error for GPS/coordinate scenarios
 */
export class LocationError extends BaseError {
  public readonly code: LocationErrorCode;

  constructor(code: LocationErrorCode, message: string, field?: string) {
    super(message, field);
    this.name = 'LocationError';
    this.code = code;
  }
}

/**
 * Format error for formatting scenarios
 */
export class FormatError extends BaseError {
  public readonly code: FormatErrorCode;

  constructor(code: FormatErrorCode, message: string, field?: string) {
    super(message, field);
    this.name = 'FormatError';
    this.code = code;
  }
}

/**
 * Calculation error for mathematical computation scenarios
 */
export class CalculationError extends BaseError {
  public readonly code: CalculationErrorCode;

  constructor(code: CalculationErrorCode, message: string, field?: string) {
    super(message, field);
    this.name = 'CalculationError';
    this.code = code;
  }
}

/**
 * Helper functions to create domain-specific errors
 */
export function createValidationError(
  code: ValidationErrorCode,
  message: string,
  field?: string
): ValidationError {
  return new ValidationError(code, message, field);
}

export function createLocationError(
  code: LocationErrorCode,
  message: string,
  field?: string
): LocationError {
  return new LocationError(code, message, field);
}

export function createFormatError(
  code: FormatErrorCode,
  message: string,
  field?: string
): FormatError {
  return new FormatError(code, message, field);
}

export function createCalculationError(
  code: CalculationErrorCode,
  message: string,
  field?: string
): CalculationError {
  return new CalculationError(code, message, field);
}