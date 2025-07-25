import { createFootprintStore, FootprintStore } from '../../stores/footprintStore';
import { LocationPoint } from '../../types/location';
import { StoreApi, UseBoundStore } from 'zustand';

// Mock LocationPoint data for testing
const mockLocationPoint: LocationPoint = {
  latitude: 35.6762,
  longitude: 139.6503,
  timestamp: new Date('2023-01-01T10:00:00Z'),
  accuracy: 5.0,
  speed: 2.5,
  heading: 45.0
};

const mockLocationPoint2: LocationPoint = {
  latitude: 35.6800,
  longitude: 139.6550, 
  timestamp: new Date('2023-01-01T10:01:00Z'),
  accuracy: 4.0,
  speed: 3.0,
  heading: 50.0
};

describe('footprintStore', () => {
  let store: UseBoundStore<StoreApi<FootprintStore>>;

  beforeEach(() => {
    // Create fresh store instance for each test
    store = createFootprintStore();
  });

  describe('Start/stop collection state changes', () => {
    test('should handle startCollecting with proper state changes', () => {
      const startTime = new Date();
      
      // Initial state verification
      expect(store.getState().isCollecting).toBe(false);
      expect(store.getState().startTime).toBeNull();
      
      // Start collecting
      store.getState().startCollecting();
      
      // Verify all state changes after start
      expect(store.getState().isCollecting).toBe(true);
      expect(store.getState().startTime).toBeInstanceOf(Date);
      expect(store.getState().startTime!.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
    });

    test('should handle stopCollecting with complete state reset', () => {
      // Setup: start collecting and add data
      store.getState().startCollecting();
      store.getState().addLocationPoint(mockLocationPoint);
      
      // Verify data exists before stopping
      expect(store.getState().isCollecting).toBe(true);
      expect(store.getState().startTime).not.toBeNull();
      expect(store.getState().locationPoints).toHaveLength(1);
      
      // Stop collecting
      store.getState().stopCollecting();
      
      // Verify complete state reset
      expect(store.getState().isCollecting).toBe(false);
      expect(store.getState().startTime).toBeNull();
      expect(store.getState().locationPoints).toHaveLength(0);
      expect(store.getState().currentLocation).toBeNull();
      expect(store.getState().currentSpeed).toBeNull();
    });
  });

  describe('Location data addition to state', () => {
    test('should handle location point addition with proper state management', () => {
      // Test 1: Should not add location point when not collecting
      store.getState().addLocationPoint(mockLocationPoint);
      expect(store.getState().locationPoints).toHaveLength(0);
      expect(store.getState().currentLocation).toBeNull();
      expect(store.getState().currentSpeed).toBeNull();
      
      // Test 2: Should add single location point and update current location and speed
      store.getState().startCollecting();
      store.getState().addLocationPoint(mockLocationPoint);
      
      expect(store.getState().locationPoints).toHaveLength(1);
      expect(store.getState().locationPoints[0]).toEqual(mockLocationPoint);
      expect(store.getState().currentLocation).toEqual(mockLocationPoint);
      expect(store.getState().currentSpeed).toBe(mockLocationPoint.speed);
      
      // Test 3: Should add multiple location points maintaining order and update speed
      store.getState().addLocationPoint(mockLocationPoint2);
      
      expect(store.getState().locationPoints).toHaveLength(2);
      expect(store.getState().locationPoints[0]).toEqual(mockLocationPoint);
      expect(store.getState().locationPoints[1]).toEqual(mockLocationPoint2);
      expect(store.getState().currentLocation).toEqual(mockLocationPoint2);
      expect(store.getState().currentSpeed).toBe(mockLocationPoint2.speed);
    });
  });

  describe('Store reset functionality', () => {
    test('should reset all state to initial values when reset is called', () => {
      // Setup: start collecting and add data
      store.getState().startCollecting();
      store.getState().addLocationPoint(mockLocationPoint);
      store.getState().addLocationPoint(mockLocationPoint2);
      
      // Verify state has data before reset
      expect(store.getState().isCollecting).toBe(true);
      expect(store.getState().startTime).not.toBeNull();
      expect(store.getState().locationPoints).toHaveLength(2);
      expect(store.getState().currentLocation).toEqual(mockLocationPoint2);
      expect(store.getState().currentSpeed).toBe(mockLocationPoint2.speed);
      
      // Call reset
      store.getState().reset();
      
      // Verify complete state reset
      expect(store.getState().isCollecting).toBe(false);
      expect(store.getState().startTime).toBeNull();
      expect(store.getState().locationPoints).toHaveLength(0);
      expect(store.getState().currentLocation).toBeNull();
      expect(store.getState().currentSpeed).toBeNull();
    });
  });

});