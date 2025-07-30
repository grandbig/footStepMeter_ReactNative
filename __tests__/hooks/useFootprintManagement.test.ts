import { useFootprintManagement } from '../../hooks/useFootprintManagement';
import { StorageService } from '../../services/storageService';
import { ExportService } from '../../services/exportService';
import { Route } from '../../types/route';
import { LocationPoint } from '../../types/location';

// Mock StorageService
jest.mock('../../services/storageService');
const MockedStorageService = StorageService as jest.MockedClass<typeof StorageService>;

// Mock ExportService
jest.mock('../../services/exportService');
const MockedExportService = ExportService as jest.MockedClass<typeof ExportService>;

// Mock React hooks with state simulation
const mockState = {
  routes: [] as Route[],
  isLoading: false,
  error: null as string | null,
  selectedRoute: null as Route | null,
};

jest.mock('react', () => ({
  useState: jest.fn(() => {
    const setter = jest.fn((newState) => {
      if (typeof newState === 'function') {
        const updatedState = newState(mockState);
        Object.assign(mockState, updatedState);
      } else {
        Object.assign(mockState, newState);
      }
    });
    return [mockState, setter];
  }),
  useEffect: jest.fn((effect) => {
    const cleanup = effect();
    return cleanup;
  }),
  useCallback: jest.fn((callback) => callback),
  useRef: jest.fn(() => ({ current: null })),
}));

describe('useFootprintManagement', () => {
  let mockStorageService: jest.Mocked<StorageService>;
  let mockExportService: jest.Mocked<ExportService>;
  let mockRoute: Route;
  let mockLocationPoints: LocationPoint[];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock state
    mockState.routes = [];
    mockState.isLoading = false;
    mockState.error = null;
    mockState.selectedRoute = null;
    
    // Create mock storage service instance
    mockStorageService = {
      fetchFootprints: jest.fn(),
      fetchFootprintsByTitle: jest.fn(),
      createFootprint: jest.fn(),
      delete: jest.fn(),
      countFootprints: jest.fn(),
    } as any;
    
    MockedStorageService.mockImplementation(() => mockStorageService);
    
    // Create mock export service instance
    mockExportService = {
      makeCSVData: jest.fn(),
      sendMailWithCSV: jest.fn(),
    } as any;
    
    MockedExportService.mockImplementation(() => mockExportService);

    // Set up default mock behaviors
    mockStorageService.fetchFootprints.mockResolvedValue([]);
    mockStorageService.fetchFootprintsByTitle.mockResolvedValue([{
      id: 'test-1',
      name: 'Test Route',
      locationPoints: mockLocationPoints,
      startTime: new Date('2022-01-01T10:00:00Z'),
      endTime: new Date('2022-01-01T10:30:00Z'),
      pointCount: 2,
    }]);
    mockStorageService.createFootprint.mockResolvedValue(1);
    mockStorageService.delete.mockResolvedValue(1);
    mockStorageService.countFootprints.mockResolvedValue(0);
    mockExportService.makeCSVData.mockResolvedValue('csv,data\n1,2');
    mockExportService.sendMailWithCSV.mockResolvedValue({ success: true });

    // Create test location points
    mockLocationPoints = [
      {
        latitude: 35.6762,
        longitude: 139.6503,
        timestamp: new Date('2022-01-01T10:00:00Z'),
        accuracy: 5.0,
        speed: 2.5,
        heading: 45.0
      },
      {
        latitude: 35.6765,
        longitude: 139.6505,
        timestamp: new Date('2022-01-01T10:01:00Z'),
        accuracy: 4.0,
        speed: 3.0,
        heading: 50.0
      }
    ];

    // Create test route
    mockRoute = {
      id: 'test-route-1',
      name: 'Test Route',
      startTime: new Date('2022-01-01T10:00:00Z'),
      endTime: new Date('2022-01-01T10:30:00Z'),
      locationPoints: mockLocationPoints,
      pointCount: 2,
    };
  });

  describe('Hook interface', () => {
    test('should return all required properties and methods', () => {
      const hook = useFootprintManagement();

      // Services are initialized in useEffect, so they should be called
      expect(MockedStorageService).toHaveBeenCalled();
      expect(MockedExportService).toHaveBeenCalled();

      // Check that all expected properties exist
      expect(Array.isArray(hook.routes)).toBe(true);
      expect(typeof hook.isLoading).toBe('boolean');
      expect(hook.error === null || typeof hook.error === 'string').toBe(true);
      expect(hook.selectedRoute === null || typeof hook.selectedRoute === 'object').toBe(true);
      
      // Check that all expected methods exist
      expect(typeof hook.loadRoutes).toBe('function');
      expect(typeof hook.saveRoute).toBe('function');
      expect(typeof hook.deleteRoute).toBe('function');
      expect(typeof hook.selectRoute).toBe('function');
      expect(typeof hook.getRouteDetails).toBe('function');
      expect(typeof hook.exportRouteToCSV).toBe('function');
      expect(typeof hook.getTotalRouteCount).toBe('function');
      expect(typeof hook.refreshRoutes).toBe('function');
    });
  });

  describe('loadRoutes', () => {
    test('should load all routes successfully', async () => {
      const routes = [mockRoute];
      mockStorageService.fetchFootprints.mockResolvedValue(routes);

      const hook = useFootprintManagement();
      await hook.loadRoutes();

      expect(mockStorageService.fetchFootprints).toHaveBeenCalledTimes(1);
      expect(mockState.routes).toEqual(routes);
      expect(mockState.error).toBe(null);
    });

    test('should handle route loading errors', async () => {
      const loadError = new Error('Failed to load routes');
      mockStorageService.fetchFootprints.mockRejectedValue(loadError);

      const hook = useFootprintManagement();
      await hook.loadRoutes();

      expect(mockStorageService.fetchFootprints).toHaveBeenCalledTimes(1);
      expect(mockState.error).toBe('Failed to load routes');
      expect(mockState.routes).toEqual([]);
    });

    test('should handle non-Error exceptions with unknown error message', async () => {
      const nonErrorException = { code: 500, message: 'Server error' };
      mockStorageService.fetchFootprints.mockRejectedValue(nonErrorException);

      const hook = useFootprintManagement();
      await hook.loadRoutes();

      expect(mockStorageService.fetchFootprints).toHaveBeenCalledTimes(1);
      expect(mockState.error).toBe('Unknown error occurred');
      expect(mockState.routes).toEqual([]);
    });

    test('should set loading state during route loading', async () => {
      let resolvePromise: (value: Route[]) => void;
      const loadPromise = new Promise<Route[]>((resolve) => {
        resolvePromise = resolve;
      });
      mockStorageService.fetchFootprints.mockReturnValue(loadPromise);

      const hook = useFootprintManagement();
      const loadPromiseResult = hook.loadRoutes();

      // During loading
      expect(mockState.isLoading).toBe(true);

      // Complete loading
      resolvePromise!([mockRoute]);
      await loadPromiseResult;

      expect(mockState.isLoading).toBe(false);
    });
  });

  describe('saveRoute', () => {
    test('should save route successfully', async () => {
      const hook = useFootprintManagement();
      await hook.saveRoute(mockRoute);

      expect(mockStorageService.createFootprint).toHaveBeenCalledWith(
        mockRoute.name,
        mockRoute.locationPoints
      );
      expect(mockState.error).toBe(null);
    });

    test('should handle route saving errors', async () => {
      const saveError = new Error('Failed to save route');
      mockStorageService.createFootprint.mockRejectedValue(saveError);

      const hook = useFootprintManagement();
      await hook.saveRoute(mockRoute);

      expect(mockStorageService.createFootprint).toHaveBeenCalledTimes(1);
      expect(mockState.error).toBe('Failed to save route');
    });

    test('should handle non-Error exceptions with unknown error message', async () => {
      const nonErrorException = 'String error';
      mockStorageService.createFootprint.mockRejectedValue(nonErrorException);

      const hook = useFootprintManagement();
      await hook.saveRoute(mockRoute);

      expect(mockStorageService.createFootprint).toHaveBeenCalledTimes(1);
      expect(mockState.error).toBe('Unknown error occurred');
    });

    test('should validate route data before saving', async () => {
      const invalidRoute = {
        ...mockRoute,
        name: '', // Invalid empty name
      };

      const hook = useFootprintManagement();
      await hook.saveRoute(invalidRoute);

      expect(mockStorageService.createFootprint).not.toHaveBeenCalled();
      expect(mockState.error).toBe('Invalid route data: name is required');
    });
  });

  describe('deleteRoute', () => {
    test('should delete route successfully', async () => {
      const routeTitle = 'Test Route';

      const hook = useFootprintManagement();
      await hook.deleteRoute(routeTitle);

      expect(mockStorageService.delete).toHaveBeenCalledWith(routeTitle);
      expect(mockState.error).toBe(null);
    });

    test('should handle route deletion errors', async () => {
      const deleteError = new Error('Failed to delete route');
      mockStorageService.delete.mockRejectedValue(deleteError);

      const hook = useFootprintManagement();
      await hook.deleteRoute('Test Route');

      expect(mockStorageService.delete).toHaveBeenCalledTimes(1);
      expect(mockState.error).toBe('Failed to delete route');
    });

    test('should handle non-Error exceptions with unknown error message', async () => {
      const nonErrorException = null;
      mockStorageService.delete.mockRejectedValue(nonErrorException);

      const hook = useFootprintManagement();
      await hook.deleteRoute('Test Route');

      expect(mockStorageService.delete).toHaveBeenCalledTimes(1);
      expect(mockState.error).toBe('Unknown error occurred');
    });

    test('should validate route title before deletion', async () => {
      const hook = useFootprintManagement();
      await hook.deleteRoute('');

      expect(mockStorageService.delete).not.toHaveBeenCalled();
      expect(mockState.error).toBe('Route title is required for deletion');
    });
  });

  describe('selectRoute', () => {
    test('should select route successfully', async () => {
      const mockRoutes = [{
        id: 'test-1',
        name: 'Test Route',
        locationPoints: mockLocationPoints,
        startTime: new Date('2022-01-01T10:00:00Z'),
        endTime: new Date('2022-01-01T10:30:00Z'),
        pointCount: 2,
      }];
      mockStorageService.fetchFootprintsByTitle.mockResolvedValue(mockRoutes);

      const hook = useFootprintManagement();
      await hook.selectRoute('Test Route');

      expect(mockStorageService.fetchFootprintsByTitle).toHaveBeenCalledWith('Test Route');
      expect(mockState.selectedRoute).toEqual({
        title: 'Test Route',
        locationPoints: mockLocationPoints
      });
      expect(mockState.error).toBe(null);
    });

    test('should handle route selection errors', async () => {
      const selectError = new Error('Failed to select route');
      mockStorageService.fetchFootprintsByTitle.mockRejectedValue(selectError);

      const hook = useFootprintManagement();
      await hook.selectRoute('Test Route');

      expect(mockStorageService.fetchFootprintsByTitle).toHaveBeenCalledTimes(1);
      expect(mockState.error).toBe('Failed to select route');
      expect(mockState.selectedRoute).toBe(null);
    });

    test('should handle non-Error exceptions with unknown error message', async () => {
      const nonErrorException = { status: 500, data: 'Server error' };
      mockStorageService.fetchFootprintsByTitle.mockRejectedValue(nonErrorException);

      const hook = useFootprintManagement();
      await hook.selectRoute('Test Route');

      expect(mockStorageService.fetchFootprintsByTitle).toHaveBeenCalledTimes(1);
      expect(mockState.error).toBe('Unknown error occurred');
      expect(mockState.selectedRoute).toBe(null);
    });

    test('should handle empty routes array', async () => {
      mockStorageService.fetchFootprintsByTitle.mockResolvedValue([]);

      const hook = useFootprintManagement();
      await hook.selectRoute('NonExistent Route');

      expect(mockStorageService.fetchFootprintsByTitle).toHaveBeenCalledWith('NonExistent Route');
      expect(mockState.selectedRoute).toEqual({
        title: 'NonExistent Route',
        locationPoints: []
      });
      expect(mockState.error).toBe(null);
    });
  });

  describe('getRouteDetails', () => {
    test('should get route details with location points', async () => {
      const hook = useFootprintManagement();
      const details = await hook.getRouteDetails('Test Route');

      expect(mockStorageService.fetchFootprintsByTitle).toHaveBeenCalledWith('Test Route');
      expect(details).toEqual({
        title: 'Test Route',
        locationPoints: mockLocationPoints
      });
    });

    test('should handle errors and return null', async () => {
      const getDetailsError = new Error('Failed to get route details');
      mockStorageService.fetchFootprintsByTitle.mockRejectedValue(getDetailsError);

      const hook = useFootprintManagement();
      const details = await hook.getRouteDetails('Test Route');

      expect(mockStorageService.fetchFootprintsByTitle).toHaveBeenCalledWith('Test Route');
      expect(details).toBe(null);
      expect(mockState.error).toBe('Failed to get route details');
    });

    test('should handle non-Error exceptions with unknown error message', async () => {
      const nonErrorException = ['array', 'error'];
      mockStorageService.fetchFootprintsByTitle.mockRejectedValue(nonErrorException);

      const hook = useFootprintManagement();
      const details = await hook.getRouteDetails('Test Route');

      expect(mockStorageService.fetchFootprintsByTitle).toHaveBeenCalledWith('Test Route');
      expect(details).toBe(null);
      expect(mockState.error).toBe('Unknown error occurred');
    });

    test('should handle empty routes array', async () => {
      mockStorageService.fetchFootprintsByTitle.mockResolvedValue([]);

      const hook = useFootprintManagement();
      const details = await hook.getRouteDetails('NonExistent Route');

      expect(mockStorageService.fetchFootprintsByTitle).toHaveBeenCalledWith('NonExistent Route');
      expect(details).toEqual({
        title: 'NonExistent Route',
        locationPoints: []
      });
      expect(mockState.error).toBe(null);
    });
  });

  describe('exportRouteToCSV', () => {
    test('should export route to CSV successfully', async () => {
      const mockRoutes = [{
        id: 'test-1',
        name: 'Test Route',
        locationPoints: mockLocationPoints,
        startTime: new Date('2022-01-01T10:00:00Z'),
        endTime: new Date('2022-01-01T10:30:00Z'),
        pointCount: 2,
      }];
      mockStorageService.fetchFootprintsByTitle.mockResolvedValue(mockRoutes);
      mockExportService.sendMailWithCSV.mockResolvedValue({ success: true });

      const hook = useFootprintManagement();
      const result = await hook.exportRouteToCSV('Test Route', 'test@example.com');

      expect(mockStorageService.fetchFootprintsByTitle).toHaveBeenCalledWith('Test Route');
      expect(mockExportService.sendMailWithCSV).toHaveBeenCalledWith(mockRoutes, 'test@example.com');
      expect(result).toBe(true);
      expect(mockState.error).toBe(null);
    });

    test('should handle CSV export errors', async () => {
      const exportError = new Error('Failed to export CSV');
      mockExportService.sendMailWithCSV.mockRejectedValue(exportError);

      const hook = useFootprintManagement();
      const result = await hook.exportRouteToCSV('Test Route');

      expect(result).toBe(false);
      expect(mockState.error).toBe('Failed to export CSV');
    });

    test('should handle export service failures', async () => {
      const mockRoutes = [{
        id: 'test-1',
        name: 'Test Route',
        locationPoints: mockLocationPoints,
        startTime: new Date('2022-01-01T10:00:00Z'),
        endTime: new Date('2022-01-01T10:30:00Z'),
        pointCount: 2,
      }];
      mockStorageService.fetchFootprintsByTitle.mockResolvedValue(mockRoutes);
      mockExportService.sendMailWithCSV.mockResolvedValue({ success: false, error: 'Email not available' });

      const hook = useFootprintManagement();
      const result = await hook.exportRouteToCSV('Test Route');

      expect(result).toBe(false);
      expect(mockState.error).toBe('Email not available');
    });

    test('should handle export service failures without error message', async () => {
      const mockRoutes = [{
        id: 'test-1',
        name: 'Test Route',
        locationPoints: mockLocationPoints,
        startTime: new Date('2022-01-01T10:00:00Z'),
        endTime: new Date('2022-01-01T10:30:00Z'),
        pointCount: 2,
      }];
      mockStorageService.fetchFootprintsByTitle.mockResolvedValue(mockRoutes);
      mockExportService.sendMailWithCSV.mockResolvedValue({ success: false });

      const hook = useFootprintManagement();
      const result = await hook.exportRouteToCSV('Test Route');

      expect(result).toBe(false);
      expect(mockState.error).toBe('Failed to send email');
    });

    test('should handle no routes found', async () => {
      mockStorageService.fetchFootprintsByTitle.mockResolvedValue([]);

      const hook = useFootprintManagement();
      const result = await hook.exportRouteToCSV('NonExistent Route');

      expect(result).toBe(false);
      expect(mockState.error).toBe('No route found with the specified title');
    });

    test('should handle non-Error exceptions with unknown error message', async () => {
      const nonErrorException = 123;
      mockExportService.sendMailWithCSV.mockRejectedValue(nonErrorException);

      const hook = useFootprintManagement();
      const result = await hook.exportRouteToCSV('Test Route');

      expect(result).toBe(false);
      expect(mockState.error).toBe('Unknown error occurred');
    });
  });

  describe('getTotalRouteCount', () => {
    test('should get total route count', async () => {
      mockStorageService.countFootprints.mockResolvedValue(5);

      const hook = useFootprintManagement();
      const count = await hook.getTotalRouteCount();

      expect(mockStorageService.countFootprints).toHaveBeenCalledTimes(1);
      expect(count).toBe(5);
    });

    test('should handle count errors', async () => {
      const countError = new Error('Failed to count routes');
      mockStorageService.countFootprints.mockRejectedValue(countError);

      const hook = useFootprintManagement();
      const count = await hook.getTotalRouteCount();

      expect(count).toBe(0);
      expect(mockState.error).toBe('Failed to count routes');
    });

    test('should handle non-Error exceptions with unknown error message', async () => {
      const nonErrorException = 'string error';
      mockStorageService.countFootprints.mockRejectedValue(nonErrorException);

      const hook = useFootprintManagement();
      const count = await hook.getTotalRouteCount();

      expect(count).toBe(0);
      expect(mockState.error).toBe('Unknown error occurred');
    });
  });

  describe('refreshRoutes', () => {
    test('should refresh routes by reloading', async () => {
      const routes = [mockRoute];
      mockStorageService.fetchFootprints.mockResolvedValue(routes);

      const hook = useFootprintManagement();
      await hook.refreshRoutes();

      expect(mockStorageService.fetchFootprints).toHaveBeenCalledTimes(1);
      expect(mockState.routes).toEqual(routes);
    });
  });


  describe('Service initialization errors', () => {
    test('should handle ensureStorageService error when not initialized', async () => {
      // Save original mocks
      const originalMocks = {
        useRef: require('react').useRef,
        useEffect: require('react').useEffect
      };
      
      // Mock useRef to return { current: null } for storageServiceRef
      require('react').useRef = jest.fn()
        .mockReturnValueOnce({ current: null }) // storageServiceRef
        .mockReturnValueOnce({ current: null }); // exportServiceRef
      
      // Mock useEffect to do nothing (skip initialization)
      require('react').useEffect = jest.fn();
      
      try {
        // Clear module cache and re-import
        delete require.cache[require.resolve('../../hooks/useFootprintManagement')];
        const { useFootprintManagement: TestHook } = require('../../hooks/useFootprintManagement');
        
        const hook = TestHook();
        await hook.loadRoutes();
        
        // Verify the error was caught and set
        expect(mockState.error).toBe('Storage service not initialized');
        expect(mockState.routes).toEqual([]);
        
      } finally {
        // Restore original mocks
        require('react').useRef = originalMocks.useRef;
        require('react').useEffect = originalMocks.useEffect;
        
        // Clear module cache and re-import original
        delete require.cache[require.resolve('../../hooks/useFootprintManagement')];
        require('../../hooks/useFootprintManagement');
      }
    });

    test('should handle ensureExportService error when not initialized', async () => {
      // Save original mocks
      const originalMocks = {
        useRef: require('react').useRef,
        useEffect: require('react').useEffect
      };
      
      // Mock useRef to return initialized storage but null export service
      require('react').useRef = jest.fn()
        .mockReturnValueOnce({ current: mockStorageService }) // storageServiceRef
        .mockReturnValueOnce({ current: null }); // exportServiceRef
      
      // Mock useEffect to do nothing (skip initialization)
      require('react').useEffect = jest.fn();
      
      try {
        // Clear module cache and re-import
        delete require.cache[require.resolve('../../hooks/useFootprintManagement')];
        const { useFootprintManagement: TestHook } = require('../../hooks/useFootprintManagement');
        
        const hook = TestHook();
        const result = await hook.exportRouteToCSV('Test Route');
        
        // Verify the error was caught and set
        expect(result).toBe(false);
        expect(mockState.error).toBe('Export service not initialized');
        
      } finally {
        // Restore original mocks
        require('react').useRef = originalMocks.useRef;
        require('react').useEffect = originalMocks.useEffect;
        
        // Clear module cache and re-import original
        delete require.cache[require.resolve('../../hooks/useFootprintManagement')];
        require('../../hooks/useFootprintManagement');
      }
    });
  });

  describe('Error state management', () => {
    test('should clear error state when operations succeed', async () => {
      // Set initial error state
      mockState.error = 'Previous error';

      const hook = useFootprintManagement();
      await hook.loadRoutes();

      expect(mockState.error).toBe(null);
    });

    test('should maintain error state separation across operations', async () => {
      const hook = useFootprintManagement();
      
      // First operation fails
      mockStorageService.fetchFootprints.mockRejectedValueOnce(new Error('Load failed'));
      await hook.loadRoutes();
      expect(mockState.error).toBe('Load failed');

      // Second operation succeeds and clears error
      mockStorageService.createFootprint.mockResolvedValueOnce(1);
      await hook.saveRoute(mockRoute);
      expect(mockState.error).toBe(null);
    });
  });
});