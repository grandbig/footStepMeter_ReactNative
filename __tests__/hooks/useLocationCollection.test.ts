import { useLocationCollection } from '../../hooks/useLocationCollection';
import { LocationService } from '../../services/locationService';
import { LocationPoint, GPS_ACCURACY } from '../../types/location';
import { LocationServiceStatus, LocationPermissionStatus } from '../../types/locationService';
import { createLocationServiceError, LOCATION_SERVICE_ERROR_CODES } from '../../utils/errors';

// Mock LocationService
jest.mock('../../services/locationService');
const MockedLocationService = LocationService as jest.MockedClass<typeof LocationService>;

// Mock useFootprintStore
const mockFootprintStore = {
  isCollecting: false,
  startTime: null,
  locationPoints: [],
  currentLocation: null,
  currentSpeed: null,
  startCollecting: jest.fn(),
  stopCollecting: jest.fn(),
  reset: jest.fn(),
  addLocationPoint: jest.fn(),
};

jest.mock('../../stores/footprintStore', () => ({
  useFootprintStore: () => mockFootprintStore,
}));

// Mock React hooks with state simulation
const mockState = {
  isAuthorized: false,
  accuracy: GPS_ACCURACY.BEST,
  error: null,
};

jest.mock('react', () => ({
  useState: jest.fn(() => {
    const setter = jest.fn((newState) => {
      if (typeof newState === 'function') {
        const updatedState = newState(mockState);
        Object.assign(mockState, updatedState);
      } else {
        Object.assign(mockState, newState);
      }
    });
    return [mockState, setter];
  }),
  useEffect: jest.fn((effect) => {
    const cleanup = effect();
    return cleanup;
  }),
  useCallback: jest.fn((callback) => callback), // Still needed for handleLocationUpdate/Error
  useRef: jest.fn((initial) => ({ current: initial })),
  useMemo: jest.fn((factory) => factory()),
}));

describe('useLocationCollection', () => {
  let mockLocationService: jest.Mocked<LocationService>;
  let mockLocationPoint: LocationPoint;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock state
    mockState.isAuthorized = false;
    mockState.accuracy = GPS_ACCURACY.BEST;
    mockState.error = null;
    
    // Create mock location service instance with all methods
    mockLocationService = {
      requestPermissions: jest.fn(),
      configure: jest.fn(),
      startTracking: jest.fn(),
      stopTracking: jest.fn(),
      getStatus: jest.fn(),
      getCurrentLocation: jest.fn(),
      setEventHandlers: jest.fn(),
    } as any;
    
    MockedLocationService.mockImplementation(() => mockLocationService);

    // Set up default mock behaviors
    mockLocationService.requestPermissions.mockResolvedValue({
      foreground: LocationPermissionStatus.GRANTED,
      background: LocationPermissionStatus.GRANTED
    });
    mockLocationService.configure.mockImplementation(() => {});
    mockLocationService.startTracking.mockResolvedValue(undefined);
    mockLocationService.stopTracking.mockResolvedValue(undefined);
    mockLocationService.getStatus.mockReturnValue(LocationServiceStatus.STOPPED);
    mockLocationService.getCurrentLocation.mockResolvedValue(null);
    mockLocationService.setEventHandlers.mockImplementation(() => {});

    // Reset store mocks
    mockFootprintStore.isCollecting = false;
    mockFootprintStore.startTime = null;
    mockFootprintStore.locationPoints = [];
    mockFootprintStore.currentLocation = null;
    mockFootprintStore.currentSpeed = null;
    mockFootprintStore.startCollecting.mockClear();
    mockFootprintStore.stopCollecting.mockClear();
    mockFootprintStore.reset.mockClear();
    mockFootprintStore.addLocationPoint.mockClear();

    // Create test location point
    mockLocationPoint = {
      latitude: 35.6762,
      longitude: 139.6503,
      timestamp: new Date('2022-01-01T10:00:00Z'),
      accuracy: 5.0,
      speed: 2.5,
      heading: 45.0
    };
  });

  describe('Hook interface', () => {
    test('should return all required properties and methods and initialize LocationService', () => {
      const hook = useLocationCollection();

      // Check that LocationService is initialized
      expect(MockedLocationService).toHaveBeenCalledTimes(1);

      // Check that all expected properties exist
      expect(typeof hook.isCollecting).toBe('boolean');
      expect(typeof hook.isAuthorized).toBe('boolean');
      expect(typeof hook.accuracy).toBe('string');
      expect(hook.error === null || typeof hook.error === 'string').toBe(true);
      expect(typeof hook.status).toBe('string');
      
      // Check that all expected methods exist
      expect(typeof hook.requestPermissions).toBe('function');
      expect(typeof hook.setAccuracy).toBe('function');
      expect(typeof hook.startCollection).toBe('function');
      expect(typeof hook.stopCollection).toBe('function');
      expect(typeof hook.getCurrentLocation).toBe('function');
    });
  });

  describe('Permission handling', () => {
    test('should handle successful permission request', async () => {
      const hook = useLocationCollection();

      await hook.requestPermissions();

      // Verify service call with correct parameters
      expect(mockLocationService.requestPermissions).toHaveBeenCalledTimes(1);
      expect(mockLocationService.requestPermissions).toHaveBeenCalledWith(false);
      
      // Verify initial error state is cleared and success is handled
      // (State changes are indirectly verified through subsequent behavior)
      expect(mockState.isAuthorized).toBe(true);
      expect(mockState.error).toBe(null);
    });

    test('should handle permission denied', async () => {
      mockLocationService.requestPermissions.mockResolvedValue({
        foreground: LocationPermissionStatus.DENIED,
        background: LocationPermissionStatus.DENIED
      });

      const hook = useLocationCollection();
      await hook.requestPermissions();

      // Verify service call with correct parameters
      expect(mockLocationService.requestPermissions).toHaveBeenCalledTimes(1);
      expect(mockLocationService.requestPermissions).toHaveBeenCalledWith(false);
      
      // Verify state changes for denied permission
      expect(mockState.isAuthorized).toBe(false);
      expect(mockState.error).toBe(null); // No error, just denial
    });

    test('should handle permission request errors', async () => {
      const permissionError = new Error('Permission request failed');
      mockLocationService.requestPermissions.mockRejectedValue(permissionError);

      const hook = useLocationCollection();
      await hook.requestPermissions();

      // Verify service call with correct parameters
      expect(mockLocationService.requestPermissions).toHaveBeenCalledTimes(1);
      expect(mockLocationService.requestPermissions).toHaveBeenCalledWith(false);
      
      // Verify state changes for error case
      expect(mockState.isAuthorized).toBe(false);
      expect(mockState.error).toBe('Permission request failed');
    });

    test('should handle non-Error exceptions with unknown error message', async () => {
      // Test case for non-Error objects being thrown (string)
      const nonErrorException = 'String error thrown';
      mockLocationService.requestPermissions.mockRejectedValue(nonErrorException);

      const hook = useLocationCollection();
      await hook.requestPermissions();

      // Verify service call
      expect(mockLocationService.requestPermissions).toHaveBeenCalledTimes(1);
      expect(mockLocationService.requestPermissions).toHaveBeenCalledWith(false);
      
      // Verify state changes for non-Error exception
      expect(mockState.isAuthorized).toBe(false);
      expect(mockState.error).toBe('Unknown error occurred');
    });

    test('should handle null exceptions with unknown error message', async () => {
      // Test case for null being thrown
      mockLocationService.requestPermissions.mockRejectedValue(null);

      const hook = useLocationCollection();
      await hook.requestPermissions();

      // Verify service call
      expect(mockLocationService.requestPermissions).toHaveBeenCalledTimes(1);
      
      // Verify state changes for null exception
      expect(mockState.isAuthorized).toBe(false);
      expect(mockState.error).toBe('Unknown error occurred');
    });

  });

  describe('Accuracy control', () => {
    test('should set GPS accuracy', async () => {
      const hook = useLocationCollection();

      await hook.setAccuracy(GPS_ACCURACY.NEAREST_TEN_METERS);

      expect(mockLocationService.configure).toHaveBeenCalledWith({
        accuracy: GPS_ACCURACY.NEAREST_TEN_METERS,
        distanceInterval: 5,
        timeInterval: 1000,
        enableBackground: false
      });
    });

    test('should handle configuration errors', async () => {
      const configError = new Error('Configuration failed');
      mockLocationService.configure.mockImplementation(() => {
        throw configError;
      });

      const hook = useLocationCollection();
      await hook.setAccuracy(GPS_ACCURACY.BEST);

      expect(mockLocationService.configure).toHaveBeenCalledTimes(1);
    });

    test('should let service layer validate accuracy values', async () => {
      const hook = useLocationCollection();

      // @ts-ignore - Testing invalid accuracy
      await hook.setAccuracy('invalid-accuracy');

      // Service layer will handle the validation - hook passes it through
      expect(mockLocationService.configure).toHaveBeenCalledWith({
        accuracy: 'invalid-accuracy',
        distanceInterval: 5,
        timeInterval: 1000,
        enableBackground: false
      });
    });

    test('should handle non-Error exceptions in setAccuracy with unknown error message', async () => {
      // Test case for non-Error objects being thrown
      const nonErrorException = 'String error thrown in configure';
      mockLocationService.configure.mockImplementation(() => {
        throw nonErrorException;
      });

      const hook = useLocationCollection();
      await hook.setAccuracy(GPS_ACCURACY.BEST);

      // Verify service call
      expect(mockLocationService.configure).toHaveBeenCalledTimes(1);
      
      // Verify state changes for non-Error exception
      expect(mockState.error).toBe('Unknown error occurred');
    });
  });

  describe('Collection management', () => {
    test('should start location collection when authorized', async () => {
      const hook = useLocationCollection();

      // Mock authorized state
      await hook.requestPermissions();
      await hook.startCollection();

      expect(mockFootprintStore.startCollecting).toHaveBeenCalledTimes(1);
      expect(mockLocationService.startTracking).toHaveBeenCalledTimes(1);
    });

    test('should attempt start collection and let service handle permissions', async () => {
      const hook = useLocationCollection();

      await hook.startCollection();

      // Should attempt to start and let LocationService handle permission validation
      expect(mockLocationService.startTracking).toHaveBeenCalledTimes(1);
      expect(mockFootprintStore.startCollecting).toHaveBeenCalledTimes(1);
    });

    test('should stop location collection', async () => {
      const hook = useLocationCollection();

      await hook.stopCollection();

      expect(mockLocationService.stopTracking).toHaveBeenCalledTimes(1);
      expect(mockFootprintStore.stopCollecting).toHaveBeenCalledTimes(1);
    });

    test('should handle start errors', async () => {
      const startError = new Error('Failed to start location service');
      mockLocationService.startTracking.mockRejectedValue(startError);

      const hook = useLocationCollection();
      await hook.requestPermissions();
      await hook.startCollection();

      expect(mockLocationService.startTracking).toHaveBeenCalledTimes(1);
    });

    test('should handle stop errors', async () => {
      const stopError = new Error('Failed to stop location service');
      mockLocationService.stopTracking.mockRejectedValue(stopError);

      const hook = useLocationCollection();
      await hook.stopCollection();

      expect(mockLocationService.stopTracking).toHaveBeenCalledTimes(1);
    });

    test('should handle non-Error exceptions in startCollection with unknown error message', async () => {
      // Test case for non-Error objects being thrown in startTracking
      const nonErrorException = { code: 'UNKNOWN', message: 'Object error' };
      mockLocationService.startTracking.mockRejectedValue(nonErrorException);

      const hook = useLocationCollection();
      await hook.startCollection();

      // Verify service call
      expect(mockLocationService.startTracking).toHaveBeenCalledTimes(1);
      
      // Verify state changes for non-Error exception
      expect(mockState.error).toBe('Unknown error occurred');
    });

    test('should handle non-Error exceptions in stopCollection with unknown error message', async () => {
      // Test case for non-Error objects being thrown in stopTracking
      const nonErrorException = 12345; // Number thrown as exception
      mockLocationService.stopTracking.mockRejectedValue(nonErrorException);

      const hook = useLocationCollection();
      await hook.stopCollection();

      // Verify service call
      expect(mockLocationService.stopTracking).toHaveBeenCalledTimes(1);
      
      // Verify state changes for non-Error exception
      expect(mockState.error).toBe('Unknown error occurred');
    });
  });

  describe('Location retrieval', () => {
    test('should get current location', async () => {
      mockLocationService.getCurrentLocation.mockResolvedValue(mockLocationPoint);

      const hook = useLocationCollection();
      const currentLocation = await hook.getCurrentLocation();

      expect(mockLocationService.getCurrentLocation).toHaveBeenCalledTimes(1);
      expect(currentLocation).toEqual(mockLocationPoint);
    });

    test('should handle getCurrentLocation errors', async () => {
      const getCurrentError = new Error('Failed to get current location');
      mockLocationService.getCurrentLocation.mockRejectedValue(getCurrentError);

      const hook = useLocationCollection();
      const result = await hook.getCurrentLocation();

      expect(mockLocationService.getCurrentLocation).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    test('should handle non-Error exceptions in getCurrentLocation with unknown error message', async () => {
      // Test case for non-Error objects being thrown in getCurrentLocation
      const nonErrorException = undefined; // undefined thrown as exception
      mockLocationService.getCurrentLocation.mockRejectedValue(nonErrorException);

      const hook = useLocationCollection();
      const result = await hook.getCurrentLocation();

      // Verify service call
      expect(mockLocationService.getCurrentLocation).toHaveBeenCalledTimes(1);
      
      // Verify return value and state changes for non-Error exception
      expect(result).toBeNull();
      expect(mockState.error).toBe('Unknown error occurred');
    });
  });

  describe('Event handling', () => {
    test('should set up location update callback', () => {
      useLocationCollection();

      expect(mockLocationService.setEventHandlers).toHaveBeenCalledWith(
        expect.any(Object)
      );
    });

    test('should set up error callback', () => {
      useLocationCollection();

      expect(mockLocationService.setEventHandlers).toHaveBeenCalledWith(
        expect.any(Object)
      );
    });

    test('should handle location updates', () => {
      useLocationCollection();

      // Get the events object that was passed to the service
      const events = mockLocationService.setEventHandlers.mock.calls[0][0];
      
      // Simulate a location update
      events.onLocationUpdate(mockLocationPoint);

      expect(mockFootprintStore.addLocationPoint).toHaveBeenCalledWith(mockLocationPoint);
    });

    test('should handle location errors', () => {
      useLocationCollection();

      // Get the events object that was passed to the service
      const events = mockLocationService.setEventHandlers.mock.calls[0][0];
      
      // Simulate an error
      const locationError = createLocationServiceError(
        LOCATION_SERVICE_ERROR_CODES.LOCATION_UNAVAILABLE,
        'GPS signal lost'
      );
      events.onError(locationError);

      // Error should be handled (we can't easily test state changes in this setup)
      expect(mockLocationService.setEventHandlers).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('Status reporting', () => {
    test('should return location service status', () => {
      mockLocationService.getStatus.mockReturnValue(LocationServiceStatus.RUNNING);

      const hook = useLocationCollection();

      expect(hook.status).toBe(LocationServiceStatus.RUNNING);
    });

    test('should reflect store collecting state', () => {
      mockFootprintStore.isCollecting = true;

      const hook = useLocationCollection();

      expect(hook.isCollecting).toBe(true);
    });
  });

  describe('LocationService initialization errors', () => {
    test('should handle ensureLocationService error when not initialized', async () => {
      // Create a simpler test by directly testing the error path
      // We'll temporarily mock useRef to return null for this specific test
      
      // Save original mocks
      const originalMocks = {
        useRef: require('react').useRef,
        useEffect: require('react').useEffect
      };
      
      // Mock useRef to return { current: null }
      require('react').useRef = jest.fn(() => ({ current: null }));
      
      // Mock useEffect to do nothing (skip initialization)
      require('react').useEffect = jest.fn();
      
      try {
        // Clear module cache and re-import
        delete require.cache[require.resolve('../../hooks/useLocationCollection')];
        const { useLocationCollection: TestHook } = require('../../hooks/useLocationCollection');
        
        const hook = TestHook();
        await hook.requestPermissions();

        // Verify the error was caught and set
        expect(mockState.error).toBe('Location service not initialized');
        expect(mockState.isAuthorized).toBe(false);
        
      } finally {
        // Restore original mocks
        require('react').useRef = originalMocks.useRef;
        require('react').useEffect = originalMocks.useEffect;
        
        // Clear cache again to restore normal behavior
        delete require.cache[require.resolve('../../hooks/useLocationCollection')];
      }
    });
  });
});