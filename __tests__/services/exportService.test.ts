import { ExportService } from '../../services/exportService';
import { Route } from '../../types/route';
import { LocationPoint } from '../../types/location';

// Mock expo-file-system
const mockExpoFileSystem = {
  documentDirectory: '/mock/documents/',
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
};

// Mock expo-mail-composer
const mockExpoMailComposer = {
  isAvailableAsync: jest.fn(),
  composeAsync: jest.fn(),
};

jest.mock('expo-file-system', () => mockExpoFileSystem, { virtual: true });
jest.mock('expo-mail-composer', () => mockExpoMailComposer, { virtual: true });

describe('ExportService', () => {
  let exportService: ExportService;
  let mockRoute: Route;
  let mockLocationPoints: LocationPoint[];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default successful mocks
    mockExpoFileSystem.writeAsStringAsync.mockResolvedValue(undefined);
    mockExpoFileSystem.deleteAsync.mockResolvedValue(undefined);
    mockExpoMailComposer.isAvailableAsync.mockResolvedValue(true);
    mockExpoMailComposer.composeAsync.mockResolvedValue({ status: 'sent' });

    // Create test data
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
        latitude: 35.6763,
        longitude: 139.6504,
        timestamp: new Date('2022-01-01T10:01:00Z'),
        accuracy: 5.0,
        speed: 2.0,
        heading: 50.0
      }
    ];

    mockRoute = {
      id: 'route-123',
      name: 'Morning Walk',
      locationPoints: mockLocationPoints,
      startTime: new Date('2022-01-01T10:00:00Z'),
      endTime: new Date('2022-01-01T10:30:00Z'),
      pointCount: 2
    };

    exportService = new ExportService(mockExpoFileSystem, mockExpoMailComposer);
  });

  describe('CSV data generation - makeCSVData equivalent', () => {
    test('should generate CSV data from footprint array', async () => {
      const csvData = await exportService.makeCSVData([mockRoute]);

      expect(csvData).toContain('Route,Latitude,Longitude,Timestamp,Accuracy,Speed,Heading');
      expect(csvData).toContain('Morning Walk,35.6762,139.6503');
      expect(csvData).toContain('Morning Walk,35.6763,139.6504');
      expect(csvData).toContain('2022-01-01T10:00:00.000Z');
      expect(csvData).toContain('2022-01-01T10:01:00.000Z');
    });

    test('should handle empty routes array', async () => {
      const csvData = await exportService.makeCSVData([]);

      expect(csvData).toBe('Route,Latitude,Longitude,Timestamp,Accuracy,Speed,Heading\n');
    });

    test('should handle routes with null speed and heading values', async () => {
      const routeWithNulls: Route = {
        ...mockRoute,
        locationPoints: [{
          latitude: 35.6762,
          longitude: 139.6503,
          timestamp: new Date('2022-01-01T10:00:00Z'),
          accuracy: 5.0,
          speed: null,
          heading: null
        }]
      };

      const csvData = await exportService.makeCSVData([routeWithNulls]);

      expect(csvData).toContain('Morning Walk,35.6762,139.6503,2022-01-01T10:00:00.000Z,5,,');
    });

    test('should handle multiple routes with different names', async () => {
      const route2: Route = {
        ...mockRoute,
        id: 'route-456',
        name: 'Evening Jog',
        locationPoints: [mockLocationPoints[0]]
      };

      const csvData = await exportService.makeCSVData([mockRoute, route2]);

      expect(csvData).toContain('Morning Walk');
      expect(csvData).toContain('Evening Jog');
    });
  });

  describe('Email composition - sendMailWithCSV equivalent', () => {
    test('should compose email with CSV attachment', async () => {
      const result = await exportService.sendMailWithCSV([mockRoute], 'test@example.com');

      expect(mockExpoMailComposer.isAvailableAsync).toHaveBeenCalled();
      expect(mockExpoFileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringMatching(/routes_\d+\.csv$/),
        expect.stringContaining('Route,Latitude,Longitude'),
        { encoding: 'utf8' }
      );
      expect(mockExpoMailComposer.composeAsync).toHaveBeenCalledWith({
        recipients: ['test@example.com'],
        subject: 'Route Export',
        body: 'Please find attached route data in CSV format.',
        attachments: [expect.stringMatching(/routes_\d+\.csv$/)]
      });
      expect(result.success).toBe(true);
    });

    test('should handle mail service unavailability', async () => {
      mockExpoMailComposer.isAvailableAsync.mockResolvedValue(false);

      const result = await exportService.sendMailWithCSV([mockRoute], 'test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Mail service is not available on this device');
      expect(mockExpoMailComposer.composeAsync).not.toHaveBeenCalled();
    });

    test('should handle email composition cancellation', async () => {
      mockExpoMailComposer.composeAsync.mockResolvedValue({ status: 'cancelled' });

      const result = await exportService.sendMailWithCSV([mockRoute], 'test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email composition was cancelled');
    });

    test('should handle email composition errors', async () => {
      const composerError = new Error('Email composer failed');
      mockExpoMailComposer.composeAsync.mockRejectedValue(composerError);

      const result = await exportService.sendMailWithCSV([mockRoute], 'test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Email composer failed');
    });

    test('should clean up temporary file after sending', async () => {
      await exportService.sendMailWithCSV([mockRoute], 'test@example.com');

      expect(mockExpoFileSystem.deleteAsync).toHaveBeenCalledWith(
        expect.stringMatching(/routes_\d+\.csv$/)
      );
    });

    test('should clean up temporary file even on error', async () => {
      mockExpoMailComposer.composeAsync.mockRejectedValue(new Error('Test error'));

      await exportService.sendMailWithCSV([mockRoute], 'test@example.com');

      expect(mockExpoFileSystem.deleteAsync).toHaveBeenCalledWith(
        expect.stringMatching(/routes_\d+\.csv$/)
      );
    });
  });

  describe('File encoding and MIME type handling', () => {
    test('should use UTF-8 encoding for CSV file', async () => {
      await exportService.sendMailWithCSV([mockRoute], 'test@example.com');

      expect(mockExpoFileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringMatching(/routes_\d+\.csv$/),
        expect.any(String),
        { encoding: 'utf8' }
      );
    });

    test('should handle special characters in route names', async () => {
      const routeWithSpecialChars: Route = {
        ...mockRoute,
        name: 'Route with "quotes" and, commas'
      };

      const csvData = await exportService.makeCSVData([routeWithSpecialChars]);

      expect(csvData).toContain('"Route with ""quotes"" and, commas"');
    });

    test('should properly escape CSV data', async () => {
      const routeWithNewlines: Route = {
        ...mockRoute,
        name: 'Route with\nnewlines'
      };

      const csvData = await exportService.makeCSVData([routeWithNewlines]);

      expect(csvData).toContain('"Route with\nnewlines"');
    });
  });

  describe('Error handling', () => {
    test('should handle file system write errors', async () => {
      const writeError = new Error('File system write failed');
      mockExpoFileSystem.writeAsStringAsync.mockRejectedValue(writeError);

      const result = await exportService.sendMailWithCSV([mockRoute], 'test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('File system write failed');
    });

    test('should handle file system delete errors gracefully', async () => {
      const deleteError = new Error('File delete failed');
      mockExpoFileSystem.deleteAsync.mockRejectedValue(deleteError);

      // Should not throw error, just log and continue
      const result = await exportService.sendMailWithCSV([mockRoute], 'test@example.com');

      expect(result.success).toBe(true); // Main operation should still succeed
    });

    test('should handle mail availability check errors', async () => {
      const availabilityError = new Error('Availability check failed');
      mockExpoMailComposer.isAvailableAsync.mockRejectedValue(availabilityError);

      const result = await exportService.sendMailWithCSV([mockRoute], 'test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Availability check failed');
    });
  });
});