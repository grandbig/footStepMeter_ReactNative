import {
  CALCULATION_ERROR_CODES,
  CalculationError,
  createCalculationError,
  createFormatError,
  createLocationError,
  createValidationError,
  FORMAT_ERROR_CODES,
  FormatError,
  LOCATION_ERROR_CODES,
  LocationError,
  VALIDATION_ERROR_CODES,
  ValidationError,
} from '../../utils/errors';

describe('errors', () => {
  describe('Error Code Constants', () => {
    it('should have correct VALIDATION_ERROR_CODES', () => {
      expect(VALIDATION_ERROR_CODES.INVALID_VALUE).toBe('INVALID_VALUE');
      expect(VALIDATION_ERROR_CODES.NEGATIVE_VALUE).toBe('NEGATIVE_VALUE');
      expect(VALIDATION_ERROR_CODES.ZERO_OR_NEGATIVE_VALUE).toBe('ZERO_OR_NEGATIVE_VALUE');
      expect(VALIDATION_ERROR_CODES.OUT_OF_RANGE).toBe('OUT_OF_RANGE');
      expect(VALIDATION_ERROR_CODES.INVALID_TYPE).toBe('INVALID_TYPE');
    });

    it('should have correct LOCATION_ERROR_CODES', () => {
      expect(LOCATION_ERROR_CODES.INVALID_COORDINATES).toBe('LOCATION.INVALID_COORDINATES');
      expect(LOCATION_ERROR_CODES.LATITUDE_OUT_OF_RANGE).toBe('LOCATION.LATITUDE_OUT_OF_RANGE');
      expect(LOCATION_ERROR_CODES.LONGITUDE_OUT_OF_RANGE).toBe('LOCATION.LONGITUDE_OUT_OF_RANGE');
      expect(LOCATION_ERROR_CODES.IDENTICAL_POINTS).toBe('LOCATION.IDENTICAL_POINTS');
      expect(LOCATION_ERROR_CODES.NEGATIVE_ACCURACY).toBe('LOCATION.NEGATIVE_ACCURACY');
      expect(LOCATION_ERROR_CODES.NEGATIVE_SPEED).toBe('LOCATION.NEGATIVE_SPEED');
      expect(LOCATION_ERROR_CODES.INVALID_HEADING).toBe('LOCATION.INVALID_HEADING');
      expect(LOCATION_ERROR_CODES.INVALID_GPS_ACCURACY).toBe('LOCATION.INVALID_GPS_ACCURACY');
    });

    it('should have correct FORMAT_ERROR_CODES', () => {
      expect(FORMAT_ERROR_CODES.INVALID_DATE).toBe('FORMAT.INVALID_DATE');
      expect(FORMAT_ERROR_CODES.UNSUPPORTED_LOCALE).toBe('FORMAT.UNSUPPORTED_LOCALE');
      expect(FORMAT_ERROR_CODES.INVALID_DURATION).toBe('FORMAT.INVALID_DURATION');
      expect(FORMAT_ERROR_CODES.INVALID_DISTANCE).toBe('FORMAT.INVALID_DISTANCE');
      expect(FORMAT_ERROR_CODES.INVALID_SPEED).toBe('FORMAT.INVALID_SPEED');
    });

    it('should have correct CALCULATION_ERROR_CODES', () => {
      expect(CALCULATION_ERROR_CODES.INVALID_INPUT).toBe('CALCULATION.INVALID_INPUT');
      expect(CALCULATION_ERROR_CODES.DIVISION_BY_ZERO).toBe('CALCULATION.DIVISION_BY_ZERO');
      expect(CALCULATION_ERROR_CODES.COMPUTATION_ERROR).toBe('CALCULATION.COMPUTATION_ERROR');
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with all properties', () => {
      const error = new ValidationError(
        VALIDATION_ERROR_CODES.NEGATIVE_VALUE,
        'Value must be positive',
        'testField'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe(VALIDATION_ERROR_CODES.NEGATIVE_VALUE);
      expect(error.message).toBe('Value must be positive');
      expect(error.field).toBe('testField');
    });
  });

  describe('LocationError', () => {
    it('should create LocationError with all properties', () => {
      const error = new LocationError(
        LOCATION_ERROR_CODES.LONGITUDE_OUT_OF_RANGE,
        'Longitude out of range',
        'coordinates.longitude'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LocationError);
      expect(error.name).toBe('LocationError');
      expect(error.code).toBe(LOCATION_ERROR_CODES.LONGITUDE_OUT_OF_RANGE);
      expect(error.message).toBe('Longitude out of range');
      expect(error.field).toBe('coordinates.longitude');
    });
  });

  describe('FormatError', () => {
    it('should create FormatError with all properties', () => {
      const error = new FormatError(
        FORMAT_ERROR_CODES.UNSUPPORTED_LOCALE,
        'Unsupported locale',
        'locale'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(FormatError);
      expect(error.name).toBe('FormatError');
      expect(error.code).toBe(FORMAT_ERROR_CODES.UNSUPPORTED_LOCALE);
      expect(error.message).toBe('Unsupported locale');
      expect(error.field).toBe('locale');
    });
  });

  describe('CalculationError', () => {
    it('should create CalculationError with all properties', () => {
      const error = new CalculationError(
        CALCULATION_ERROR_CODES.INVALID_INPUT,
        'Invalid calculation input',
        'operand'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CalculationError);
      expect(error.name).toBe('CalculationError');
      expect(error.code).toBe(CALCULATION_ERROR_CODES.INVALID_INPUT);
      expect(error.message).toBe('Invalid calculation input');
      expect(error.field).toBe('operand');
    });
  });

  describe('Helper Functions', () => {
    describe('createValidationError', () => {
      it('should create ValidationError with all properties', () => {
        const error = createValidationError(
          VALIDATION_ERROR_CODES.OUT_OF_RANGE,
          'Value out of range',
          'value'
        );

        expect(error).toBeInstanceOf(ValidationError);
        expect(error.code).toBe(VALIDATION_ERROR_CODES.OUT_OF_RANGE);
        expect(error.message).toBe('Value out of range');
        expect(error.field).toBe('value');
      });
    });

    describe('createLocationError', () => {
      it('should create LocationError with all properties', () => {
        const error = createLocationError(
          LOCATION_ERROR_CODES.INVALID_COORDINATES,
          'Invalid coordinates',
          'point'
        );

        expect(error).toBeInstanceOf(LocationError);
        expect(error.code).toBe(LOCATION_ERROR_CODES.INVALID_COORDINATES);
        expect(error.message).toBe('Invalid coordinates');
        expect(error.field).toBe('point');
      });
    });

    describe('createFormatError', () => {
      it('should create FormatError with all properties', () => {
        const error = createFormatError(
          FORMAT_ERROR_CODES.INVALID_SPEED,
          'Invalid speed format',
          'speed'
        );

        expect(error).toBeInstanceOf(FormatError);
        expect(error.code).toBe(FORMAT_ERROR_CODES.INVALID_SPEED);
        expect(error.message).toBe('Invalid speed format');
        expect(error.field).toBe('speed');
      });
    });

    describe('createCalculationError', () => {
      it('should create CalculationError with all properties', () => {
        const error = createCalculationError(
          CALCULATION_ERROR_CODES.DIVISION_BY_ZERO,
          'Cannot divide by zero',
          'divisor'
        );

        expect(error).toBeInstanceOf(CalculationError);
        expect(error.code).toBe(CALCULATION_ERROR_CODES.DIVISION_BY_ZERO);
        expect(error.message).toBe('Cannot divide by zero');
        expect(error.field).toBe('divisor');
      });
    });
  });

  describe('BaseError Stack Trace Handling', () => {
    it('should handle environment without Error.captureStackTrace', () => {
      // Save original captureStackTrace
      const originalCaptureStackTrace = Error.captureStackTrace;
      
      // Temporarily remove captureStackTrace to test the else branch
      delete (Error as any).captureStackTrace;
      
      try {
        // Test BaseError behavior through ValidationError (BaseError is abstract)
        const error = new ValidationError(
          VALIDATION_ERROR_CODES.INVALID_VALUE,
          'Test BaseError without captureStackTrace'
        );
        
        // Should still work fine without captureStackTrace
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe('Test BaseError without captureStackTrace');
        expect(error.stack).toBeDefined(); // Stack should still exist from Error constructor
      } finally {
        // Restore original captureStackTrace
        if (originalCaptureStackTrace) {
          Error.captureStackTrace = originalCaptureStackTrace;
        }
      }
    });

    it('should use Error.captureStackTrace when available (BaseError behavior)', () => {
      // Test BaseError behavior through ValidationError (any concrete class works)
      const error = new ValidationError(
        VALIDATION_ERROR_CODES.NEGATIVE_VALUE,
        'Test BaseError with captureStackTrace'
      );
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Test BaseError with captureStackTrace');
      expect(error.stack).toBeDefined();
      
      // In V8 environments, captureStackTrace should be available
      if (Error.captureStackTrace) {
        expect(typeof Error.captureStackTrace).toBe('function');
      }
    });
  });
});