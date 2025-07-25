import { create } from 'zustand';
import { LocationPoint } from '../types/location';

/**
 * Footprint state interface for GPS footprint collection
 */
export interface FootprintState {
  /** Whether GPS footprint collection is currently active */
  isCollecting: boolean;
  /** Timestamp when collection started */
  startTime: Date | null;
  
  /** Array of recorded GPS location points */
  locationPoints: LocationPoint[];
  /** Most recently recorded location */
  currentLocation: LocationPoint | null;
  
  /** Current speed from latest location point in m/s */
  currentSpeed: number | null;
}

/**
 * Footprint actions interface for GPS footprint collection operations
 */
export interface FootprintActions {
  /** Start GPS footprint collection session */
  startCollecting: () => void;
  /** Stop GPS footprint collection and clear session data */
  stopCollecting: () => void;
  /** Reset all footprint data to initial state */
  reset: () => void;
  
  /** Add new GPS location point to collection session */
  addLocationPoint: (location: LocationPoint) => void;
}

/**
 * Complete footprint store interface combining state and actions
 */
export type FootprintStore = FootprintState & FootprintActions;

/**
 * Initial state for footprint store
 */
const initialState: FootprintState = {
  isCollecting: false,
  startTime: null,
  locationPoints: [],
  currentLocation: null,
  currentSpeed: null,
};


/**
 * Creates a new footprint store instance for GPS footprint collection
 */
export const createFootprintStore = () =>
  create<FootprintStore>((set) => ({
    ...initialState,
    
    startCollecting: () =>
      set((state) => ({
        ...state,
        isCollecting: true,
        startTime: new Date(),
      })),
    
    stopCollecting: () =>
      set(() => ({
        ...initialState, // Reset to initial state
      })),
    
    reset: () =>
      set(() => ({
        ...initialState,
      })),
    
    addLocationPoint: (location: LocationPoint) =>
      set((state) => {
        // Guard clause: only add location points when collecting
        if (!state.isCollecting) {
          return state;
        }
        
        const updatedLocationPoints = [...state.locationPoints, location];
        
        return {
          ...state,
          locationPoints: updatedLocationPoints,
          currentLocation: location,
          currentSpeed: location.speed,
        };
      }),
  }));

/**
 * Default store instance for use in React components
 * This provides a singleton store that can be used across the application
 */
export const useFootprintStore = createFootprintStore();