import { LocationPoint, GPSAccuracy } from './location';
import { LocationServiceError } from '../utils/errors';

/**
 * Location service configuration interface
 */
export interface LocationServiceConfig {
  /** GPS accuracy level */
  accuracy: GPSAccuracy;
  /** Enable background location updates */
  enableBackground: boolean;
  /** Minimum distance between location updates (meters) */
  distanceInterval?: number;
  /** Maximum time between location updates (milliseconds) */
  timeInterval?: number;
}

/**
 * Location service status
 */
export enum LocationServiceStatus {
  STOPPED = 'stopped',
  STARTING = 'starting', 
  RUNNING = 'running',
  STOPPING = 'stopping',
  ERROR = 'error'
}

/**
 * Location service events
 */
export interface LocationServiceEvents {
  /** New location data received */
  onLocationUpdate: (location: LocationPoint) => void;
  /** Location service status changed */
  onStatusChange: (status: LocationServiceStatus) => void;
  /** Location service error occurred */
  onError: (error: LocationServiceError) => void;
}


/**
 * Location permission status
 */
export enum LocationPermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  UNDETERMINED = 'undetermined'
}