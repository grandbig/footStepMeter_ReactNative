import { LocationPoint } from './location';

/**
 * Represents a saved route (footprint collection)
 */
export interface Route {
  /** Unique identifier for the route */
  id: string;
  /** User-friendly name for the route */
  name: string;
  /** Array of GPS location points collected during the route */
  locationPoints: LocationPoint[];
  /** Timestamp when the route collection started */
  startTime: Date;
  /** Timestamp when the route collection ended */
  endTime: Date;
  /** Total number of location points collected */
  pointCount: number;
}


