import { create } from 'zustand';
import { Route } from '../types/route';

/**
 * Route state interface for route management
 */
export interface RouteState {
  /** Array of saved routes (sorted by startTime, newest first) */
  routes: Route[];
  /** Map for fast route lookup by ID */
  routeMap: Map<string, Route>;
}

/**
 * Route actions interface for route management operations (original app features only)
 */
export interface RouteActions {
  /** Add a new route (createFootprint) */
  addRoute: (route: Route) => void;
  /** Get all routes (fetchFootprints) */
  getAllRoutes: () => Route[];
  /** Get routes by title (fetchFootprintsByTitle) */
  getRoutesByTitle: (title: string) => Route[];
  /** Delete route by title (delete) */
  deleteRouteByTitle: (title: string) => boolean;
  /** Get total route count (countFootprints) */
  getRouteCount: () => number;
}

/**
 * Complete route store interface combining state and actions
 */
export type RouteStore = RouteState & RouteActions;

/**
 * Initial state for route store
 */
const initialState: RouteState = {
  routes: [],
  routeMap: new Map(),
};

/**
 * Sort routes by start time (newest first) - matches original fetchFootprints ordering
 * @param routes Array of routes to sort
 * @returns Sorted routes array
 */
function sortRoutesByTime(routes: Route[]): Route[] {
  return routes.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}

/**
 * Creates a new route store instance for route management
 */
export const createRouteStore = () =>
  create<RouteStore>((set, get) => ({
    ...initialState,

    addRoute: (route: Route) =>
      set((state) => {
        const updatedRoutes = [...state.routes, route];
        const sortedRoutes = sortRoutesByTime(updatedRoutes);
        
        // Update both array and map
        const newRouteMap = new Map(state.routeMap);
        newRouteMap.set(route.id, route);
        
        return {
          ...state,
          routes: sortedRoutes,
          routeMap: newRouteMap,
        };
      }),

    getAllRoutes: () => {
      const state = get();
      return state.routes;
    },

    getRoutesByTitle: (title: string) => {
      const state = get();
      return state.routes.filter(route => route.name === title);
    },

    deleteRouteByTitle: (title: string) => {
      const state = get();
      const routesToDelete = state.routes.filter(route => route.name === title);
      
      if (routesToDelete.length === 0) {
        return false;
      }

      set((state) => {
        const newRouteMap = new Map(state.routeMap);
        routesToDelete.forEach(route => newRouteMap.delete(route.id));
        
        return {
          ...state,
          routes: state.routes.filter(route => route.name !== title),
          routeMap: newRouteMap,
        };
      });

      return true;
    },


    getRouteCount: () => {
      const state = get();
      return state.routes.length;
    },
  }));

/**
 * Default store instance for use in React components
 * This provides a singleton store that can be used across the application
 */
export const useRouteStore = createRouteStore();