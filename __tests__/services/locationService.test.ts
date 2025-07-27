import { LocationService } from '../../services/locationService';
import { GPS_ACCURACY } from '../../types/location';
import {
  LocationPermissionStatus,
  LocationServiceConfig,
  LocationServiceStatus
} from '../../types/locationService';
import { LOCATION_SERVICE_ERROR_CODES } from '../../utils/errors';

// Mock expo-location
const mockExpoLocation = {
  LocationAccuracy: {
    BestForNavigation: 1,
    Best: 2,
    NearestTenMeters: 3,
    HundredMeters: 4,
    Kilometer: 5,
    ThreeKilometers: 6,
  },
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined'
  },
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
};

// Mock expo-task-manager  
const mockTaskManager = {
  defineTask: jest.fn(),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
};

jest.mock('expo-location', () => mockExpoLocation, { virtual: true });
jest.mock('expo-task-manager', () => mockTaskManager, { virtual: true });

describe('LocationService', () => {
  let locationService: LocationService;
  let mockEvents: {
    onLocationUpdate: jest.Mock;
    onStatusChange: jest.Mock;
    onError: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set default successful mocks
    mockExpoLocation.hasServicesEnabledAsync.mockResolvedValue(true);
    mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
      status: 'granted'
    });
    mockExpoLocation.requestBackgroundPermissionsAsync.mockResolvedValue({
      status: 'granted'
    });
    mockExpoLocation.watchPositionAsync.mockResolvedValue({
      remove: jest.fn()
    });
    
    mockEvents = {
      onLocationUpdate: jest.fn(),
      onStatusChange: jest.fn(),
      onError: jest.fn(),
    };
    
    locationService = new LocationService(mockExpoLocation, mockTaskManager);
  });

  describe('GPS accuracy settings configuration', () => {
    test('should map GPS accuracy levels to expo-location values correctly', () => {
      const accuracyMappings = [
        { gpsAccuracy: GPS_ACCURACY.BEST_FOR_NAVIGATION, expected: mockExpoLocation.LocationAccuracy.BestForNavigation },
        { gpsAccuracy: GPS_ACCURACY.BEST, expected: mockExpoLocation.LocationAccuracy.Best },
        { gpsAccuracy: GPS_ACCURACY.NEAREST_TEN_METERS, expected: mockExpoLocation.LocationAccuracy.NearestTenMeters },
        { gpsAccuracy: GPS_ACCURACY.HUNDRED_METERS, expected: mockExpoLocation.LocationAccuracy.HundredMeters },
        { gpsAccuracy: GPS_ACCURACY.KILOMETER, expected: mockExpoLocation.LocationAccuracy.Kilometer },
        { gpsAccuracy: GPS_ACCURACY.THREE_KILOMETERS, expected: mockExpoLocation.LocationAccuracy.ThreeKilometers },
      ];

      accuracyMappings.forEach(({ gpsAccuracy, expected }) => {
        const expoAccuracy = locationService.mapGPSAccuracyToExpo(gpsAccuracy);
        expect(expoAccuracy).toBe(expected);
      });
    });

    test('should validate GPS accuracy configuration', () => {
      const validConfig: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: false
      };
      
      expect(locationService.validateConfig(validConfig)).toBe(true);
    });

    test('should validate configuration with comprehensive edge cases', () => {
      // Test null/undefined config
      expect(locationService.validateConfig(null as any)).toBe(false);
      expect(locationService.validateConfig(undefined as any)).toBe(false);
      
      // Test non-object config
      expect(locationService.validateConfig('string' as any)).toBe(false);
      expect(locationService.validateConfig(123 as any)).toBe(false);
      expect(locationService.validateConfig([] as any)).toBe(false);
      
      // Test invalid accuracy
      const invalidAccuracyConfig = {
        accuracy: 'invalid-accuracy' as any,
        enableBackground: false
      };
      
      expect(locationService.validateConfig(invalidAccuracyConfig)).toBe(false);

      // Test invalid enableBackground type
      const invalidBooleanConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: 'true' as any // string instead of boolean
      };
      expect(locationService.validateConfig(invalidBooleanConfig)).toBe(false);
      
      // Test invalid distanceInterval type
      const invalidDistanceTypeConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: false,
        distanceInterval: 'invalid' as any
      };
      expect(locationService.validateConfig(invalidDistanceTypeConfig)).toBe(false);
      
      // Test negative distanceInterval
      const negativeDistanceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: false,
        distanceInterval: -10
      };
      expect(locationService.validateConfig(negativeDistanceConfig)).toBe(false);
      
      // Test invalid timeInterval type
      const invalidTimeTypeConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: false,
        timeInterval: 'invalid' as any
      };
      expect(locationService.validateConfig(invalidTimeTypeConfig)).toBe(false);
      
      // Test negative timeInterval
      const negativeTimeConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: false,
        timeInterval: -5000
      };
      expect(locationService.validateConfig(negativeTimeConfig)).toBe(false);
      
      // Test valid config with optional fields
      const validCompleteConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: true,
        distanceInterval: 10,
        timeInterval: 5000
      };
      expect(locationService.validateConfig(validCompleteConfig)).toBe(true);
      
      // Test valid config with zero values (should be valid)
      const validZeroConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: false,
        distanceInterval: 0,
        timeInterval: 0
      };
      expect(locationService.validateConfig(validZeroConfig)).toBe(true);
    });

    test('should handle invalid configuration with error emission', () => {
      locationService.setEventHandlers(mockEvents);

      // Test with null config
      locationService.configure(null as any);
      
      expect(mockEvents.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: LOCATION_SERVICE_ERROR_CODES.CONFIGURATION_ERROR,
          message: 'Invalid location service configuration'
        })
      );
      
      // Config should remain null after invalid configuration
      expect(locationService.getConfig()).toBeNull();
      
      // Clear mock calls for next test
      mockEvents.onError.mockClear();
    });

    test('should apply GPS accuracy settings correctly', async () => {
      const config: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST_FOR_NAVIGATION,
        enableBackground: true,
        distanceInterval: 10,
        timeInterval: 5000
      };

      locationService.configure(config);
      const appliedConfig = locationService.getConfig();

      expect(appliedConfig).not.toBeNull();
      expect(appliedConfig!.accuracy).toBe(GPS_ACCURACY.BEST_FOR_NAVIGATION);
      expect(appliedConfig!.enableBackground).toBe(true);
      expect(appliedConfig!.distanceInterval).toBe(10);
      expect(appliedConfig!.timeInterval).toBe(5000);
    });
  });

  describe('Location permissions management', () => {
    test('should request background permissions when background tracking is enabled', async () => {
      mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted'
      });
      mockExpoLocation.requestBackgroundPermissionsAsync.mockResolvedValue({
        status: 'granted'
      });

      const config: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: true
      };

      const result = await locationService.requestPermissions(config);

      expect(mockExpoLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(mockExpoLocation.requestBackgroundPermissionsAsync).toHaveBeenCalled();
      expect(result.foreground).toBe(LocationPermissionStatus.GRANTED);
      expect(result.background).toBe(LocationPermissionStatus.GRANTED);
    });

    test('should only request foreground permissions when background tracking is disabled', async () => {
      mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted'
      });

      const config: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: false
      };

      const result = await locationService.requestPermissions(config);

      expect(mockExpoLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(mockExpoLocation.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
      expect(result.foreground).toBe(LocationPermissionStatus.GRANTED);
      expect(result.background).toBeUndefined();
    });

    test('should not request background permissions when foreground is denied', async () => {
      mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied'
      });

      const config: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: true
      };

      const result = await locationService.requestPermissions(config);

      expect(mockExpoLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(mockExpoLocation.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
      expect(result.foreground).toBe(LocationPermissionStatus.DENIED);
      expect(result.background).toBeUndefined();
    });

    test('should handle foreground permission undetermined status', async () => {
      mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'undetermined'
      });

      const config: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: true
      };

      const result = await locationService.requestPermissions(config);

      expect(mockExpoLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(mockExpoLocation.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
      expect(result.foreground).toBe(LocationPermissionStatus.UNDETERMINED);
      expect(result.background).toBeUndefined();
    });

    test('should handle background permission request errors', async () => {
      mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted'
      });
      const backgroundError = new Error('Background permission failed');
      mockExpoLocation.requestBackgroundPermissionsAsync.mockRejectedValue(backgroundError);

      locationService.setEventHandlers(mockEvents);

      const config: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: true
      };

      const result = await locationService.requestPermissions(config);

      expect(mockEvents.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: LOCATION_SERVICE_ERROR_CODES.PERMISSION_DENIED,
          message: 'Failed to request location permissions'
        })
      );
      expect(result.foreground).toBe(LocationPermissionStatus.DENIED);
      expect(result.background).toBe(LocationPermissionStatus.DENIED);
    });
  });

  describe('Background task management', () => {
    test('should configure background task when background tracking is enabled', async () => {
      const config: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: true
      };

      locationService.configure(config);
      await locationService.setupBackgroundTask();

      expect(mockTaskManager.defineTask).toHaveBeenCalledWith(
        'BACKGROUND_LOCATION_TASK',
        expect.any(Function)
      );
    });

    test('should handle background task callback scenarios', async () => {
      locationService.setEventHandlers(mockEvents);

      // Setup the background task and capture the callback
      let backgroundTaskCallback: any;
      mockTaskManager.defineTask.mockImplementation((_taskName: string, callback: any) => {
        backgroundTaskCallback = callback;
      });

      await locationService.setupBackgroundTask();
      expect(backgroundTaskCallback).toBeDefined();

      // Test 1: Callback with error
      const taskError = new Error('Background task execution error');
      backgroundTaskCallback({ error: taskError });

      expect(mockEvents.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: LOCATION_SERVICE_ERROR_CODES.LOCATION_UNAVAILABLE,
          message: 'Background location task error'
        })
      );

      // Clear mock calls
      mockEvents.onError.mockClear();
      mockEvents.onLocationUpdate.mockClear();

      // Test 2: Callback with valid location data
      const mockLocationData = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
          accuracy: 5.0,
          speed: 2.5,
          heading: 45.0
        },
        timestamp: 1640995200000
      };

      backgroundTaskCallback({ 
        data: { 
          locations: [mockLocationData] 
        } 
      });

      expect(mockEvents.onLocationUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 35.6762,
          longitude: 139.6503,
          accuracy: 5.0,
          speed: 2.5,
          heading: 45.0
        })
      );

      // Clear mock calls
      mockEvents.onLocationUpdate.mockClear();

      // Test 3: Callback with empty locations array
      backgroundTaskCallback({ 
        data: { 
          locations: [] 
        } 
      });

      expect(mockEvents.onLocationUpdate).not.toHaveBeenCalled();

      // Test 4: Callback with null/undefined locations
      backgroundTaskCallback({ 
        data: { 
          locations: null 
        } 
      });

      expect(mockEvents.onLocationUpdate).not.toHaveBeenCalled();

      // Test 5: Callback with no data
      backgroundTaskCallback({});

      expect(mockEvents.onLocationUpdate).not.toHaveBeenCalled();

      // Test 6: Callback with data but no locations property
      backgroundTaskCallback({ 
        data: { 
          someOtherProperty: 'value' 
        } 
      });

      expect(mockEvents.onLocationUpdate).not.toHaveBeenCalled();
    });

    test('should handle background task setup errors', async () => {
      const taskError = new Error('Background task setup failed');
      mockTaskManager.defineTask.mockImplementation(() => {
        throw taskError;
      });

      locationService.setEventHandlers(mockEvents);

      await locationService.setupBackgroundTask();

      expect(mockEvents.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: LOCATION_SERVICE_ERROR_CODES.CONFIGURATION_ERROR,
          message: 'Failed to setup background location task'
        })
      );
    });
  });

  describe('Location data transformation and validation', () => {
    test('should transform expo-location data to LocationPoint', () => {
      const expoLocationData = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
          accuracy: 5.0,
          speed: 2.5,
          heading: 45.0
        },
        timestamp: 1640995200000 // 2022-01-01T10:00:00Z
      };

      const locationPoint = locationService.transformLocationData(expoLocationData);

      expect(locationPoint.latitude).toBe(35.6762);
      expect(locationPoint.longitude).toBe(139.6503);
      expect(locationPoint.accuracy).toBe(5.0);
      expect(locationPoint.speed).toBe(2.5);
      expect(locationPoint.heading).toBe(45.0);
      expect(locationPoint.timestamp).toEqual(new Date(1640995200000));
    });

    test('should default accuracy to 0 when coords.accuracy is undefined', () => {
      const expoLocationData = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
          // accuracy is undefined
          speed: 2.5,
          heading: 45.0
        },
        timestamp: 1640995200000
      };

      const locationPoint = locationService.transformLocationData(expoLocationData);

      expect(locationPoint.latitude).toBe(35.6762);
      expect(locationPoint.longitude).toBe(139.6503);
      expect(locationPoint.accuracy).toBe(0); // Test the fallback logic
      expect(locationPoint.speed).toBe(2.5);
      expect(locationPoint.heading).toBe(45.0);
      expect(locationPoint.timestamp).toEqual(new Date(1640995200000));
    });

    test('should handle various invalid location data formats', () => {
      // Test with undefined coords
      expect(locationService.validateLocationData({ timestamp: 123456 })).toBe(false);
      
      // Test with string latitude (typeof coords.latitude === 'number' false)
      expect(locationService.validateLocationData({
        coords: { latitude: "35.6762", longitude: 139.6503 },
        timestamp: 1640995200000
      })).toBe(false);
      
      // Test with string longitude (typeof coords.longitude === 'number' false)
      expect(locationService.validateLocationData({
        coords: { latitude: 35.6762, longitude: "139.6503" },
        timestamp: 1640995200000
      })).toBe(false);
      
      // Test with string timestamp (typeof timestamp === 'number' false)
      expect(locationService.validateLocationData({
        coords: { latitude: 35.6762, longitude: 139.6503 },
        timestamp: "1640995200000"
      })).toBe(false);
      
      // Test with negative timestamp (timestamp > 0 false)
      expect(locationService.validateLocationData({
        coords: { latitude: 35.6762, longitude: 139.6503 },
        timestamp: -1
      })).toBe(false);
      
      // Test with zero timestamp (timestamp > 0 false)
      expect(locationService.validateLocationData({
        coords: { latitude: 35.6762, longitude: 139.6503 },
        timestamp: 0
      })).toBe(false);
    });


    test('should handle valid location updates', () => {
      locationService.setEventHandlers(mockEvents);

      const validLocationData = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
          accuracy: 5.0,
          speed: 2.5,
          heading: 45.0
        },
        timestamp: 1640995200000
      };

      locationService.handleLocationUpdate(validLocationData);

      expect(mockEvents.onLocationUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 35.6762,
          longitude: 139.6503,
          accuracy: 5.0,
          speed: 2.5,
          heading: 45.0,
          timestamp: new Date(1640995200000)
        })
      );
      expect(mockEvents.onError).not.toHaveBeenCalled();
    });

    test('should filter out invalid location updates', () => {
      locationService.setEventHandlers(mockEvents);

      const invalidLocationData = {
        coords: {
          latitude: 200,
          longitude: 139.6503,
          accuracy: 5.0,
          speed: 2.5,
          heading: 45.0
        },
        timestamp: 1640995200000
      };

      locationService.handleLocationUpdate(invalidLocationData);

      expect(mockEvents.onLocationUpdate).not.toHaveBeenCalled();
      expect(mockEvents.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: LOCATION_SERVICE_ERROR_CODES.LOCATION_UNAVAILABLE,
          message: 'Invalid location data received'
        })
      );
    });
  });

  describe('Location services checking', () => {
    test('should return true when location services are enabled', async () => {
      mockExpoLocation.hasServicesEnabledAsync.mockResolvedValue(true);

      locationService.setEventHandlers(mockEvents);

      const result = await locationService.checkLocationServices();

      expect(result).toBe(true);
      expect(mockEvents.onError).not.toHaveBeenCalled();
    });

    test('should handle location service unavailable error', async () => {
      mockExpoLocation.hasServicesEnabledAsync.mockResolvedValue(false);

      locationService.setEventHandlers(mockEvents);

      const result = await locationService.checkLocationServices();

      expect(result).toBe(false);
      expect(mockEvents.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: LOCATION_SERVICE_ERROR_CODES.SERVICE_UNAVAILABLE,
          message: 'Location services are disabled'
        })
      );
    });

    test('should handle checkLocationServices API error', async () => {
      const serviceError = new Error('Location service check failed');
      mockExpoLocation.hasServicesEnabledAsync.mockRejectedValue(serviceError);

      locationService.setEventHandlers(mockEvents);

      const result = await locationService.checkLocationServices();

      expect(result).toBe(false);
      expect(mockEvents.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: LOCATION_SERVICE_ERROR_CODES.SERVICE_UNAVAILABLE,
          message: 'Failed to check location services'
        })
      );
    });
  });

  describe('Current location retrieval', () => {
    test('should return transformed location data for valid location', async () => {
      const validLocationData = {
        coords: {
          latitude: 35.6762,
          longitude: 139.6503,
          accuracy: 5.0,
          speed: 2.5,
          heading: 45.0
        },
        timestamp: 1640995200000
      };

      mockExpoLocation.getCurrentPositionAsync.mockResolvedValue(validLocationData);

      const result = await locationService.getCurrentLocation();

      expect(result).not.toBeNull();
      expect(result).toEqual({
        latitude: 35.6762,
        longitude: 139.6503,
        accuracy: 5.0,
        speed: 2.5,
        heading: 45.0,
        timestamp: new Date(1640995200000)
      });
    });

    test('should handle getCurrentPosition timeout', async () => {
      const timeoutError = new Error('Location request timed out');
      mockExpoLocation.getCurrentPositionAsync.mockRejectedValue(timeoutError);

      locationService.setEventHandlers(mockEvents);

      const result = await locationService.getCurrentLocation();

      expect(result).toBeNull();
      expect(mockEvents.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: LOCATION_SERVICE_ERROR_CODES.LOCATION_UNAVAILABLE,
          message: 'Failed to get current location'
        })
      );
    });

    test('should handle getCurrentLocation with invalid data', async () => {
      const invalidLocationData = {
        coords: {
          latitude: 999, // Invalid latitude
          longitude: 139.6503,
          accuracy: 5.0
        },
        timestamp: 1640995200000
      };

      mockExpoLocation.getCurrentPositionAsync.mockResolvedValue(invalidLocationData);

      const result = await locationService.getCurrentLocation();

      expect(result).toBeNull();
    });
  });

  describe('Location tracking lifecycle', () => {
    test('should setup background task when background tracking is enabled', async () => {
      const config: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: true
      };

      const mockSubscription = { remove: jest.fn() };
      mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted'
      });
      mockExpoLocation.requestBackgroundPermissionsAsync.mockResolvedValue({
        status: 'granted'
      });
      mockExpoLocation.watchPositionAsync.mockResolvedValue(mockSubscription);

      await locationService.startTracking(config);

      expect(mockTaskManager.defineTask).toHaveBeenCalledWith(
        'BACKGROUND_LOCATION_TASK',
        expect.any(Function)
      );
      // Verify watchPositionAsync was called with correct parameters
      expect(mockExpoLocation.watchPositionAsync).toHaveBeenCalledWith(
        expect.any(Object), // Watch options
        expect.any(Function) // Callback function for location updates
      );
      
      // Get the actual call arguments to verify the watch options
      const watchCall = mockExpoLocation.watchPositionAsync.mock.calls[0];
      const watchOptions = watchCall[0];
      const callbackFunction = watchCall[1];
      
      expect(watchOptions.accuracy).toBe(2); // Default value when config validation fails
      expect(typeof callbackFunction).toBe('function');
      expect(locationService.getStatus()).toBe(LocationServiceStatus.RUNNING);
    });

    test('should handle watch position errors', async () => {
      const watchError = new Error('Watch position failed');
      mockExpoLocation.watchPositionAsync.mockRejectedValue(watchError);

      locationService.setEventHandlers(mockEvents);

      const config: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: false
      };

      await locationService.startTracking(config);

      expect(mockEvents.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: LOCATION_SERVICE_ERROR_CODES.LOCATION_UNAVAILABLE,
          message: 'Failed to start location tracking'
        })
      );
    });

    test('should handle startTracking without configuration', async () => {
      locationService.setEventHandlers(mockEvents);

      await locationService.startTracking(null as any);

      expect(mockEvents.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: LOCATION_SERVICE_ERROR_CODES.CONFIGURATION_ERROR,
          message: 'Configuration required to start tracking'
        })
      );
    });

    test('should handle startTracking with disabled location services', async () => {
      mockExpoLocation.hasServicesEnabledAsync.mockResolvedValue(false);
      locationService.setEventHandlers(mockEvents);

      const config: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: false
      };

      await locationService.startTracking(config);

      expect(locationService.getStatus()).toBe(LocationServiceStatus.ERROR);
    });

    test('should handle startTracking with denied permissions', async () => {
      mockExpoLocation.hasServicesEnabledAsync.mockResolvedValue(true);
      mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied'
      });
      
      locationService.setEventHandlers(mockEvents);

      const config: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: false
      };

      await locationService.startTracking(config);

      expect(locationService.getStatus()).toBe(LocationServiceStatus.ERROR);
    });

    test('should track service status correctly during startTracking', async () => {
      locationService.setEventHandlers(mockEvents);

      expect(locationService.getStatus()).toBe(LocationServiceStatus.STOPPED);

      const config: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: false
      };

      // Mock successful permissions and location watch
      mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted'
      });
      mockExpoLocation.watchPositionAsync.mockResolvedValue({
        remove: jest.fn()
      });

      await locationService.startTracking(config);

      expect(mockEvents.onStatusChange).toHaveBeenCalledWith(LocationServiceStatus.STARTING);
      expect(mockEvents.onStatusChange).toHaveBeenCalledWith(LocationServiceStatus.RUNNING);
      expect(locationService.getStatus()).toBe(LocationServiceStatus.RUNNING);
    });
  });

  describe('Stop tracking functionality', () => {
    test('should handle stop tracking correctly without background', async () => {
      locationService.setEventHandlers(mockEvents);

      // First start tracking
      const config: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: false
      };

      const mockSubscription = { remove: jest.fn() };
      mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted'
      });
      mockExpoLocation.watchPositionAsync.mockResolvedValue(mockSubscription);

      await locationService.startTracking(config);

      // Then stop tracking
      await locationService.stopTracking();

      expect(mockEvents.onStatusChange).toHaveBeenCalledWith(LocationServiceStatus.STOPPING);
      expect(mockEvents.onStatusChange).toHaveBeenCalledWith(LocationServiceStatus.STOPPED);
      expect(mockSubscription.remove).toHaveBeenCalled();
      expect(mockTaskManager.stopLocationUpdatesAsync).not.toHaveBeenCalled();
      expect(locationService.getStatus()).toBe(LocationServiceStatus.STOPPED);
    });

    test('should stop background task when background tracking is enabled', async () => {
      locationService.setEventHandlers(mockEvents);

      // First start tracking with background enabled
      const config: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: true
      };

      const mockSubscription = { remove: jest.fn() };
      mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted'
      });
      mockExpoLocation.requestBackgroundPermissionsAsync.mockResolvedValue({
        status: 'granted'
      });
      mockExpoLocation.watchPositionAsync.mockResolvedValue(mockSubscription);

      await locationService.startTracking(config);

      // Then stop tracking
      await locationService.stopTracking();

      expect(mockEvents.onStatusChange).toHaveBeenCalledWith(LocationServiceStatus.STOPPING);
      expect(mockEvents.onStatusChange).toHaveBeenCalledWith(LocationServiceStatus.STOPPED);
      expect(mockSubscription.remove).toHaveBeenCalled();
      expect(mockTaskManager.stopLocationUpdatesAsync).toHaveBeenCalledWith('BACKGROUND_LOCATION_TASK');
      expect(locationService.getStatus()).toBe(LocationServiceStatus.STOPPED);
    });

    test('should handle stop tracking errors', async () => {
      locationService.setEventHandlers(mockEvents);

      // First start tracking
      const config: LocationServiceConfig = {
        accuracy: GPS_ACCURACY.BEST,
        enableBackground: true
      };

      const mockSubscription = { remove: jest.fn() };
      mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted'
      });
      mockExpoLocation.requestBackgroundPermissionsAsync.mockResolvedValue({
        status: 'granted'
      });
      mockExpoLocation.watchPositionAsync.mockResolvedValue(mockSubscription);

      await locationService.startTracking(config);

      // Mock error in stopLocationUpdatesAsync
      const stopError = new Error('Failed to stop background task');
      mockTaskManager.stopLocationUpdatesAsync.mockRejectedValue(stopError);

      // Then stop tracking
      await locationService.stopTracking();

      expect(mockEvents.onStatusChange).toHaveBeenCalledWith(LocationServiceStatus.STOPPING);
      expect(mockEvents.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          code: LOCATION_SERVICE_ERROR_CODES.CONFIGURATION_ERROR,
          message: 'Failed to stop location tracking'
        })
      );
      expect(locationService.getStatus()).toBe(LocationServiceStatus.ERROR);
    });
  });
});