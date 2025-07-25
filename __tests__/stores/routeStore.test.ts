import { createRouteStore, RouteStore } from '../../stores/routeStore';
import { Route } from '../../types/route';
import { LocationPoint } from '../../types/location';
import { StoreApi, UseBoundStore } from 'zustand';

// Mock location point data for testing
const mockLocationPoint1: LocationPoint = {
  latitude: 35.6762,
  longitude: 139.6503,
  timestamp: new Date('2024-01-01T10:00:00Z'),
  accuracy: 5.0,
  speed: 2.5,
  heading: 45.0
};

const mockLocationPoint2: LocationPoint = {
  latitude: 35.6800,
  longitude: 139.6550,
  timestamp: new Date('2024-01-01T10:01:00Z'),
  accuracy: 4.0,
  speed: 3.0,
  heading: 50.0
};

const mockRoute1: Route = {
  id: 'route-1',
  name: 'Morning Walk',
  locationPoints: [mockLocationPoint1, mockLocationPoint2],
  startTime: new Date('2024-01-01T10:00:00Z'),
  endTime: new Date('2024-01-01T10:30:00Z'),
  pointCount: 2
};

const mockRoute2: Route = {
  id: 'route-2',
  name: 'Evening Jog',
  locationPoints: [mockLocationPoint1],
  startTime: new Date('2024-01-02T18:00:00Z'),
  endTime: new Date('2024-01-02T18:45:00Z'),
  pointCount: 1
};

const mockRoute3: Route = {
  id: 'route-3',
  name: 'Weekend Hike',
  locationPoints: [mockLocationPoint1, mockLocationPoint2],
  startTime: new Date('2024-01-03T09:00:00Z'),
  endTime: new Date('2024-01-03T12:00:00Z'),
  pointCount: 2
};

describe('routeStore', () => {
  let store: UseBoundStore<StoreApi<RouteStore>>;

  beforeEach(() => {
    // Create fresh store instance for each test
    store = createRouteStore();
  });

  describe('Route operations (original app features)', () => {
    test('should add routes and get all routes (createFootprint + fetchFootprints)', () => {
      // Initial state - no routes
      expect(store.getState().getAllRoutes()).toHaveLength(0);

      // Add route (createFootprint)
      store.getState().addRoute(mockRoute1);
      expect(store.getState().getAllRoutes()).toHaveLength(1);
      expect(store.getState().getAllRoutes()[0]).toEqual(mockRoute1);

      // Add multiple routes
      store.getState().addRoute(mockRoute2);
      store.getState().addRoute(mockRoute3);
      expect(store.getState().getAllRoutes()).toHaveLength(3);
      
      // Should be sorted by newest first
      const routes = store.getState().getAllRoutes();
      expect(routes[0].id).toBe('route-3'); // newest
      expect(routes[1].id).toBe('route-2');
      expect(routes[2].id).toBe('route-1'); // oldest
    });

    test('should get routes by title (fetchFootprintsByTitle)', () => {
      store.getState().addRoute(mockRoute1); // Morning Walk
      store.getState().addRoute(mockRoute2); // Evening Jog
      store.getState().addRoute(mockRoute3); // Weekend Hike
      
      // Search by exact title
      const morningWalkRoutes = store.getState().getRoutesByTitle('Morning Walk');
      expect(morningWalkRoutes).toHaveLength(1);
      expect(morningWalkRoutes[0].name).toBe('Morning Walk');
      
      // Search non-existent title
      const nonExistentRoutes = store.getState().getRoutesByTitle('Non-existent');
      expect(nonExistentRoutes).toHaveLength(0);
    });

    test('should delete routes by title (delete)', () => {
      store.getState().addRoute(mockRoute1); // Morning Walk
      store.getState().addRoute(mockRoute2); // Evening Jog
      store.getState().addRoute(mockRoute3); // Weekend Hike
      
      // Delete existing route by title
      const deleted = store.getState().deleteRouteByTitle('Evening Jog');
      expect(deleted).toBe(true);
      expect(store.getState().getAllRoutes()).toHaveLength(2);
      expect(store.getState().getRoutesByTitle('Evening Jog')).toHaveLength(0);
      
      // Try to delete non-existent route
      const notDeleted = store.getState().deleteRouteByTitle('Non-existent');
      expect(notDeleted).toBe(false);
      expect(store.getState().getAllRoutes()).toHaveLength(2);
    });

    test('should get route count (countFootprints)', () => {
      expect(store.getState().getRouteCount()).toBe(0);
      
      store.getState().addRoute(mockRoute1);
      expect(store.getState().getRouteCount()).toBe(1);
      
      store.getState().addRoute(mockRoute2);
      expect(store.getState().getRouteCount()).toBe(2);
      
      store.getState().deleteRouteByTitle('Morning Walk');
      expect(store.getState().getRouteCount()).toBe(1);
    });
  });

});