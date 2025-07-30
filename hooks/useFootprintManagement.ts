import { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storageService';
import { ExportService } from '../services/exportService';
import { Route } from '../types/route';
import { LocationPoint } from '../types/location';

/**
 * Hook state interface for footprint management
 */
interface FootprintManagementState {
  routes: Route[];
  isLoading: boolean;
  error: string | null;
  selectedRoute: { title: string; locationPoints: LocationPoint[] } | null;
}


/**
 * Hook for managing footprint/route data operations
 * Equivalent to original app's FootprintRecordViewModel + HistoryMapViewModel functionality
 * Handles route CRUD operations, data transformation, and export functionality
 */
export function useFootprintManagement() {

  // Service instances (stable references)
  const storageServiceRef = useRef<StorageService | null>(null);
  const exportServiceRef = useRef<ExportService | null>(null);
  
  // Hook state
  const [state, setState] = useState<FootprintManagementState>({
    routes: [],
    isLoading: false,
    error: null,
    selectedRoute: null,
  });

  // Initialize services on hook initialization
  useEffect(() => {
    storageServiceRef.current = new StorageService();
    exportServiceRef.current = new ExportService();
  }, []);

  /**
   * Clear error state helper
   */
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  /**
   * Set loading state helper
   */
  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };


  /**
   * Validate route name before operations
   * @param name Route name to validate
   * @returns Validation result with error message if invalid
   */
  const validateRouteName = (name?: string): { isValid: boolean; error?: string } => {
    // Check route name
    if (!name || name.trim() === '') {
      return { isValid: false, error: 'Invalid route data: name is required' };
    }
    
    return { isValid: true };
  };

  /**
   * Ensure storage service is initialized
   */
  const ensureStorageService = (): StorageService => {
    if (!storageServiceRef.current) {
      throw new Error('Storage service not initialized');
    }
    return storageServiceRef.current;
  };

  /**
   * Ensure export service is initialized
   */
  const ensureExportService = (): ExportService => {
    if (!exportServiceRef.current) {
      throw new Error('Export service not initialized');
    }
    return exportServiceRef.current;
  };

  /**
   * Load all routes from storage
   * Equivalent to original fetchFootprints functionality
   */
  const loadRoutes = async (): Promise<void> => {
    try {
      clearError();
      setLoading(true);

      const storageService = ensureStorageService();
      const routes = await storageService.fetchFootprints();
      
      setState(prev => ({
        ...prev,
        routes,
        isLoading: false,
      }));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        routes: [],
        isLoading: false,
      }));
    }
  };

  /**
   * Save a new route to storage
   * Equivalent to original createFootprint functionality
   * @param route Route data to save
   */
  const saveRoute = async (route: Route): Promise<void> => {
    try {
      clearError();

      // Validate route name
      const validation = validateRouteName(route.name);
      if (!validation.isValid) {
        setState(prev => ({ ...prev, error: validation.error! }));
        return;
      }

      const storageService = ensureStorageService();
      await storageService.createFootprint(route.name, route.locationPoints);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  };

  /**
   * Delete a route by title
   * Equivalent to original delete functionality
   * @param title Route title to delete
   */
  const deleteRoute = async (title: string): Promise<void> => {
    try {
      clearError();

      // Validate title
      if (!title || title.trim() === '') {
        setState(prev => ({ ...prev, error: 'Route title is required for deletion' }));
        return;
      }

      const storageService = ensureStorageService();
      await storageService.delete(title);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  };

  /**
   * Select a specific route for detailed view
   * Equivalent to original fetchFootprintsByTitle functionality
   * @param title Route title to select
   */
  const selectRoute = async (title: string): Promise<void> => {
    try {
      clearError();

      const storageService = ensureStorageService();
      const routes = await storageService.fetchFootprintsByTitle(title);
      const locationPoints = routes.length > 0 ? routes[0].locationPoints : [];
      
      setState(prev => ({
        ...prev,
        selectedRoute: {
          title,
          locationPoints,
        },
      }));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        selectedRoute: null,
      }));
    }
  };

  /**
   * Get detailed route information
   * @param title Route title to get details for
   * @returns Route details with location points
   */
  const getRouteDetails = async (title: string): Promise<{ title: string; locationPoints: LocationPoint[] } | null> => {
    try {
      clearError();

      const storageService = ensureStorageService();
      const routes = await storageService.fetchFootprintsByTitle(title);
      const locationPoints = routes.length > 0 ? routes[0].locationPoints : [];

      return {
        title,
        locationPoints,
      };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, error: errorMessage }));
      return null;
    }
  };

  /**
   * Export route data to CSV and send via email
   * Equivalent to original makeCSVData + sendMailWithCSV functionality
   * @param title Route title to export
   * @param recipientEmail Optional recipient email address
   * @returns Success status
   */
  const exportRouteToCSV = async (title: string, recipientEmail: string = ''): Promise<boolean> => {
    try {
      clearError();

      const storageService = ensureStorageService();
      const exportService = ensureExportService();
      const routes = await storageService.fetchFootprintsByTitle(title);
      if (routes.length === 0) {
        setState(prev => ({ ...prev, error: 'No route found with the specified title' }));
        return false;
      }

      const result = await exportService.sendMailWithCSV(routes, recipientEmail);
      
      if (!result.success) {
        setState(prev => ({ ...prev, error: result.error || 'Failed to send email' }));
        return false;
      }
      
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  };

  /**
   * Get total count of stored routes
   * Equivalent to original countFootprints functionality
   * @returns Total route count
   */
  const getTotalRouteCount = async (): Promise<number> => {
    try {
      clearError();
      const storageService = ensureStorageService();
      return await storageService.countFootprints();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setState(prev => ({ ...prev, error: errorMessage }));
      return 0;
    }
  };

  /**
   * Refresh routes by reloading from storage
   */
  const refreshRoutes = async (): Promise<void> => {
    await loadRoutes();
  };

  return {
    // State
    routes: state.routes,
    isLoading: state.isLoading,
    error: state.error,
    selectedRoute: state.selectedRoute,
    
    // Route operations
    loadRoutes,
    saveRoute,
    deleteRoute,
    selectRoute,
    getRouteDetails,
    refreshRoutes,
    
    // Export functionality
    exportRouteToCSV,
    
    // Utility functions
    getTotalRouteCount,
  };
}

// Default export for convenience
export default useFootprintManagement;


/**
 * Usage examples:
 * 
 * // Basic usage
 * const footprints = useFootprintManagement();
 * 
 * // Access state and operations
 * const { routes, isLoading, error, loadRoutes, saveRoute, deleteRoute } = footprints;
 */