// Note: expo-location and expo-task-manager imports will be available when modules are installed
// These are temporarily typed as 'any' for development
let Location: any;
let TaskManager: any;

try {
  // Try to import the actual modules
  Location = require('expo-location');
  TaskManager = require('expo-task-manager');
} catch {
  // Fallback to empty objects for testing
  Location = {};
  TaskManager = {};
}
import { LocationPoint, GPSAccuracy, GPS_ACCURACY } from '../types/location';
import { isValidCoordinate } from '../utils/coordinates';
import {
  LocationServiceConfig,
  LocationServiceStatus,
  LocationServiceEvents,
  LocationPermissionStatus
} from '../types/locationService';
import {
  LocationServiceError,
  LOCATION_SERVICE_ERROR_CODES,
  createLocationServiceError
} from '../utils/errors';

const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

/**
 * Location service class for managing GPS tracking functionality
 * Equivalent to original app's MapViewModel + CLLocationManager functionality
 * Optimized for performance with caching and efficient error handling
 */
export class LocationService {
  private config: LocationServiceConfig | null = null;
  private status: LocationServiceStatus = LocationServiceStatus.STOPPED;
  private events: LocationServiceEvents | null = null;
  private locationSubscription: any | null = null;
  private locationAPI: any;
  private taskManagerAPI: any;
  
  // Performance optimization: Cache accuracy mapping
  private readonly accuracyMap: Record<GPSAccuracy, any> = {
    [GPS_ACCURACY.BEST_FOR_NAVIGATION]: 1, // Location.LocationAccuracy.BestForNavigation
    [GPS_ACCURACY.BEST]: 2, // Location.LocationAccuracy.Best
    [GPS_ACCURACY.NEAREST_TEN_METERS]: 3, // Location.LocationAccuracy.NearestTenMeters
    [GPS_ACCURACY.HUNDRED_METERS]: 4, // Location.LocationAccuracy.HundredMeters
    [GPS_ACCURACY.KILOMETER]: 5, // Location.LocationAccuracy.Kilometer
    [GPS_ACCURACY.THREE_KILOMETERS]: 6, // Location.LocationAccuracy.ThreeKilometers
  };
  
  // Performance optimization: Cache validation patterns
  private readonly validGPSAccuracies = new Set(Object.values(GPS_ACCURACY));

  constructor(locationAPI: any = Location, taskManagerAPI: any = TaskManager) {
    this.locationAPI = locationAPI;
    this.taskManagerAPI = taskManagerAPI;
  }

  /**
   * Map GPS accuracy constants to expo-location accuracy values (optimized with cached mapping)
   * @param gpsAccuracy GPS accuracy constant
   * @returns Expo location accuracy value
   */
  public mapGPSAccuracyToExpo(gpsAccuracy: GPSAccuracy): any {
    return this.accuracyMap[gpsAccuracy];
  }

  /**
   * Validate location service configuration (optimized with cached validation)
   * @param config Configuration to validate
   * @returns True if configuration is valid
   */
  public validateConfig(config: LocationServiceConfig): boolean {
    if (!config || typeof config !== 'object') {
      return false;
    }

    // Optimized accuracy validation using Set lookup O(1)
    if (!this.validGPSAccuracies.has(config.accuracy)) {
      return false;
    }

    // Validate boolean fields
    if (typeof config.enableBackground !== 'boolean') {
      return false;
    }

    // Validate optional numeric fields with early return
    if (config.distanceInterval !== undefined && 
        (typeof config.distanceInterval !== 'number' || config.distanceInterval < 0)) {
      return false;
    }

    if (config.timeInterval !== undefined && 
        (typeof config.timeInterval !== 'number' || config.timeInterval < 0)) {
      return false;
    }

    return true;
  }

  /**
   * Configure the location service
   * @param config Location service configuration
   */
  public configure(config: LocationServiceConfig): void {
    if (!this.validateConfig(config)) {
      this.emitError(
        createLocationServiceError(
          LOCATION_SERVICE_ERROR_CODES.CONFIGURATION_ERROR,
          'Invalid location service configuration'
        )
      );
      return;
    }

    this.config = { ...config };
  }

  /**
   * Get current configuration
   * @returns Current configuration or null
   */
  public getConfig(): LocationServiceConfig | null {
    return this.config ? { ...this.config } : null;
  }

  /**
   * Set event handlers for location service events
   * @param events Event handlers
   */
  public setEventHandlers(events: LocationServiceEvents): void {
    this.events = events;
  }

  /**
   * Get current service status
   * @returns Current status
   */
  public getStatus(): LocationServiceStatus {
    return this.status;
  }

  /**
   * Request location permissions
   * @param enableBackground Whether to request background location permissions
   * @returns Permission status for foreground and background
   */
  public async requestPermissions(enableBackground: boolean): Promise<{
    foreground: LocationPermissionStatus;
    background?: LocationPermissionStatus;
  }> {
    try {
      // Request foreground permissions
      const foregroundPermission = await this.locationAPI.requestForegroundPermissionsAsync();
      const foregroundStatus = this.mapPermissionStatus(foregroundPermission.status);

      const result: {
        foreground: LocationPermissionStatus;
        background?: LocationPermissionStatus;
      } = { foreground: foregroundStatus };

      // Request background permissions if needed
      if (enableBackground && foregroundStatus === LocationPermissionStatus.GRANTED) {
        const backgroundPermission = await this.locationAPI.requestBackgroundPermissionsAsync();
        result.background = this.mapPermissionStatus(backgroundPermission.status);
      }

      return result;
    } catch (error) {
      this.emitError(
        createLocationServiceError(
          LOCATION_SERVICE_ERROR_CODES.PERMISSION_DENIED,
          'Failed to request location permissions',
          error as Error
        )
      );
      
      return {
        foreground: LocationPermissionStatus.DENIED,
        background: LocationPermissionStatus.DENIED
      };
    }
  }

  /**
   * Setup background location task
   */
  public async setupBackgroundTask(): Promise<void> {
    try {
      this.taskManagerAPI.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }: any) => {
        if (error) {
          this.emitError(
            createLocationServiceError(
              LOCATION_SERVICE_ERROR_CODES.LOCATION_UNAVAILABLE,
              'Background location task error',
              error
            )
          );
          return;
        }

        if (data) {
          const { locations } = data;
          if (locations && locations.length > 0) {
            this.handleLocationUpdate(locations[0]);
          }
        }
      });
    } catch (error) {
      this.emitError(
        createLocationServiceError(
          LOCATION_SERVICE_ERROR_CODES.CONFIGURATION_ERROR,
          'Failed to setup background location task',
          error as Error
        )
      );
    }
  }

  /**
   * Transform expo-location data to LocationPoint (optimized for performance)
   * @param locationData Expo location data
   * @returns Transformed LocationPoint
   */
  public transformLocationData(locationData: any): LocationPoint {
    const { coords, timestamp } = locationData;
    
    // Direct assignment for better performance
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      timestamp: new Date(timestamp),
      accuracy: coords.accuracy || 0,
      speed: coords.speed,
      heading: coords.heading
    };
  }

  /**
   * Validate location data before processing (using shared coordinate validation)
   * @param locationData Location data to validate
   * @returns True if data is valid
   */
  public validateLocationData(locationData: any): boolean {
    // Early return for null/undefined
    if (!locationData?.coords) {
      return false;
    }

    const { coords, timestamp } = locationData;
    
    // Use shared coordinate validation from utils/coordinates
    return (
      typeof coords.latitude === 'number' &&
      typeof coords.longitude === 'number' &&
      isValidCoordinate(coords.latitude, coords.longitude) &&
      typeof timestamp === 'number' && timestamp > 0
    );
  }

  /**
   * Handle location update from GPS (optimized with reduced error handling overhead)
   * @param locationData Raw location data
   */
  public handleLocationUpdate(locationData: any): void {
    // Fast path: validate and transform in one step
    if (!this.validateLocationData(locationData)) {
      this.emitError(
        createLocationServiceError(
          LOCATION_SERVICE_ERROR_CODES.LOCATION_UNAVAILABLE,
          'Invalid location data received',
          new Error('Invalid location coordinates or timestamp')
        )
      );
      return;
    }

    // Optimized: direct transformation without try-catch for valid data
    const locationPoint = this.transformLocationData(locationData);
    this.events?.onLocationUpdate(locationPoint);
  }

  /**
   * Check if location services are enabled
   */
  public async checkLocationServices(): Promise<boolean> {
    try {
      const isEnabled = await this.locationAPI.hasServicesEnabledAsync();
      
      if (!isEnabled) {
        this.emitError(
          createLocationServiceError(
            LOCATION_SERVICE_ERROR_CODES.SERVICE_UNAVAILABLE,
            'Location services are disabled'
          )
        );
      }

      return isEnabled;
    } catch (error) {
      this.emitError(
        createLocationServiceError(
          LOCATION_SERVICE_ERROR_CODES.SERVICE_UNAVAILABLE,
          'Failed to check location services',
          error as Error
        )
      );
      return false;
    }
  }

  /**
   * Get current location (one-time request)
   */
  public async getCurrentLocation(): Promise<LocationPoint | null> {
    try {
      const locationData = await this.locationAPI.getCurrentPositionAsync({
        accuracy: this.config ? this.mapGPSAccuracyToExpo(this.config.accuracy) : 2 // Location.LocationAccuracy.Best
      });

      if (this.validateLocationData(locationData)) {
        return this.transformLocationData(locationData);
      }

      return null;
    } catch (error) {
      this.emitError(
        createLocationServiceError(
          LOCATION_SERVICE_ERROR_CODES.LOCATION_UNAVAILABLE,
          'Failed to get current location',
          error as Error
        )
      );
      return null;
    }
  }

  /**
   * Start location tracking
   * @param config Location service configuration
   */
  public async startTracking(config: LocationServiceConfig): Promise<void> {
    if (!config) {
      this.emitError(
        createLocationServiceError(
          LOCATION_SERVICE_ERROR_CODES.CONFIGURATION_ERROR,
          'Configuration required to start tracking'
        )
      );
      return;
    }

    this.configure(config);
    this.setStatus(LocationServiceStatus.STARTING);

    try {
      // Check location services
      const servicesEnabled = await this.checkLocationServices();
      if (!servicesEnabled) {
        this.setStatus(LocationServiceStatus.ERROR);
        return;
      }

      // Request permissions
      const permissions = await this.requestPermissions(config.enableBackground);
      if (permissions.foreground !== LocationPermissionStatus.GRANTED) {
        this.setStatus(LocationServiceStatus.ERROR);
        return;
      }

      // Setup background task if needed
      if (config.enableBackground) {
        await this.setupBackgroundTask();
      }

      // Start watching position
      const watchOptions: any = {
        accuracy: this.mapGPSAccuracyToExpo(config.accuracy),
        distanceInterval: config.distanceInterval,
        timeInterval: config.timeInterval,
      };

      this.locationSubscription = await this.locationAPI.watchPositionAsync(
        watchOptions,
        (locationData: any) => this.handleLocationUpdate(locationData)
      );

      this.setStatus(LocationServiceStatus.RUNNING);

    } catch (error) {
      this.emitError(
        createLocationServiceError(
          LOCATION_SERVICE_ERROR_CODES.LOCATION_UNAVAILABLE,
          'Failed to start location tracking',
          error as Error
        )
      );
      this.setStatus(LocationServiceStatus.ERROR);
    }
  }

  /**
   * Stop location tracking
   */
  public async stopTracking(): Promise<void> {
    this.setStatus(LocationServiceStatus.STOPPING);

    try {
      // Remove location subscription
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      // Stop background task if running
      if (this.config?.enableBackground) {
        await this.taskManagerAPI.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }

      this.setStatus(LocationServiceStatus.STOPPED);
    } catch (error) {
      this.emitError(
        createLocationServiceError(
          LOCATION_SERVICE_ERROR_CODES.CONFIGURATION_ERROR,
          'Failed to stop location tracking',
          error as Error
        )
      );
      this.setStatus(LocationServiceStatus.ERROR);
    }
  }

  // Private helper methods

  private setStatus(status: LocationServiceStatus): void {
    this.status = status;
    this.events?.onStatusChange(status);
  }

  private emitError(error: LocationServiceError): void {
    this.events?.onError(error);
  }

  private mapPermissionStatus(status: string): LocationPermissionStatus {
    switch (status) {
      case 'granted':
        return LocationPermissionStatus.GRANTED;
      case 'denied':
        return LocationPermissionStatus.DENIED;
      default:
        return LocationPermissionStatus.UNDETERMINED;
    }
  }
}