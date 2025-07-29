import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationService } from '../services/locationService';
import { useFootprintStore } from '../stores/footprintStore';
import { LocationPoint, GPS_ACCURACY, GPSAccuracy } from '../types/location';
import { LocationServiceStatus, LocationPermissionStatus } from '../types/locationService';

/**
 * Hook state interface for better type safety
 */
interface LocationCollectionState {
  isAuthorized: boolean;
  accuracy: GPSAccuracy;
  error: string | null;
}

/**
 * Hook for managing location collection functionality
 * Provides GPS authorization, accuracy control, and location tracking
 * Equivalent to original app's MapViewModel location management
 * Optimized with memoization and better error handling
 */
export function useLocationCollection() {
  // Location service instance (stable reference)
  const locationServiceRef = useRef<LocationService | null>(null);
  
  // Hook state with better organization
  const [state, setState] = useState<LocationCollectionState>({
    isAuthorized: false,
    accuracy: GPS_ACCURACY.BEST,
    error: null,
  });

  // Store integration
  const footprintStore = useFootprintStore();
  
  // Memoized location update handler (footprintStore is singleton, no dependency needed)
  const handleLocationUpdate = useCallback((location: LocationPoint) => {
    footprintStore.addLocationPoint(location);
  }, []);

  // Memoized error handler
  const handleLocationError = useCallback((err: Error) => {
    setState(prev => ({ ...prev, error: err.message }));
  }, []);

  // Initialize location service and set event handlers once on mount
  useEffect(() => {
    locationServiceRef.current = new LocationService();
    
    // Set event handlers immediately after initialization
    locationServiceRef.current.setEventHandlers({
      onLocationUpdate: handleLocationUpdate,
      onError: handleLocationError,
      onStatusChange: () => {} // Empty handler for now
    });

    // Cleanup on unmount
    return () => {
      if (locationServiceRef.current) {
        locationServiceRef.current.stopTracking().catch(() => {
          // Ignore cleanup errors during unmount
        });
      }
    };
  }, []); // Empty dependency - run once on mount, handlers are stable

  /**
   * Clear error state helper
   */
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  /**
   * Ensure location service is initialized
   */
  const ensureLocationService = (): LocationService => {
    if (!locationServiceRef.current) {
      throw new Error('Location service not initialized');
    }
    return locationServiceRef.current;
  };

  /**
   * Request location permissions from the user
   * Optimized with better error handling and state management
   */
  const requestPermissions = async (): Promise<void> => {
    try {
      clearError();
      
      const locationService = ensureLocationService();
      
      const result = await locationService.requestPermissions(false);
      const isGranted = result.foreground === LocationPermissionStatus.GRANTED;
      
      setState(prev => ({
        ...prev,
        isAuthorized: isGranted,
      }));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isAuthorized: false,
      }));
    }
  };

  /**
   * Set GPS accuracy level and configure the location service
   * Optimized with configuration constants and better validation
   * @param newAccuracy GPS accuracy level to set
   */
  const setAccuracyLevel = async (newAccuracy: GPSAccuracy): Promise<void> => {
    try {
      clearError();
      
      const locationService = ensureLocationService();

      // Configuration constants for better maintainability
      const locationConfig = {
        accuracy: newAccuracy,
        distanceInterval: 5, // meters - minimum distance between updates
        timeInterval: 1000, // milliseconds - minimum time between updates
        enableBackground: false
      };

      // Configure location service with new accuracy
      locationService.configure(locationConfig);
      
      setState(prev => ({ ...prev, accuracy: newAccuracy }));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  };

  /**
   * Start location collection with improved validation and error handling
   */
  const startCollection = async (): Promise<void> => {
    try {
      clearError();
      
      // Service layer will handle permission validation
      
      const locationService = ensureLocationService();

      // Start store collection first
      footprintStore.startCollecting();
      
      // Then start location service
      await locationService.startTracking({
        accuracy: state.accuracy,
        distanceInterval: 5,
        timeInterval: 1000,
        enableBackground: false
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  };

  /**
   * Stop location collection with improved order and error handling
   */
  const stopCollection = async (): Promise<void> => {
    try {
      clearError();
      
      const locationService = ensureLocationService();

      // Stop location service first
      await locationService.stopTracking();
      
      // Then stop store collection
      footprintStore.stopCollecting();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  };

  /**
   * Get current location without starting continuous tracking
   * Optimized with better error handling
   */
  const getCurrentLocation = async (): Promise<LocationPoint | null> => {
    try {
      clearError();
      
      const locationService = ensureLocationService();

      return await locationService.getCurrentLocation();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  };

  /**
   * Get current location service status
   */
  const getStatus = (): LocationServiceStatus => {
    try {
      const locationService = ensureLocationService();
      return locationService.getStatus();
    } catch {
      return LocationServiceStatus.STOPPED;
    }
  };

  // Simple return object without unnecessary memoization
  return {
    // State
    isCollecting: footprintStore.isCollecting,
    isAuthorized: state.isAuthorized,
    accuracy: state.accuracy,
    error: state.error,
    status: getStatus(),
    
    // Actions
    requestPermissions,
    setAccuracy: setAccuracyLevel,
    startCollection,
    stopCollection,
    getCurrentLocation,
  };
}