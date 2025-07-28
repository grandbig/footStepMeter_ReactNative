import { StorageService } from '../../services/storageService';
import { LocationPoint } from '../../types/location';

// Mock expo-sqlite
const mockExpoSQLite = {
  SQLiteDatabase: {
    openDatabaseAsync: jest.fn(),
  },
};

const mockDatabase = {
  execAsync: jest.fn(),
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
  closeAsync: jest.fn(),
  withTransactionAsync: jest.fn(),
};

jest.mock('expo-sqlite', () => mockExpoSQLite, { virtual: true });

describe('StorageService', () => {
  let storageService: StorageService;
  let mockLocationPoints: LocationPoint[];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default successful mocks
    mockExpoSQLite.SQLiteDatabase.openDatabaseAsync.mockResolvedValue(mockDatabase);
    mockDatabase.execAsync.mockResolvedValue(undefined);
    mockDatabase.getAllAsync.mockResolvedValue([]);
    mockDatabase.runAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 2 });
    mockDatabase.withTransactionAsync.mockImplementation(async (callback) => {
      await callback();
    });

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

    storageService = new StorageService(mockExpoSQLite.SQLiteDatabase);
  });

  describe('Database initialization', () => {
    test('should initialize database and create footprints table', async () => {
      await storageService.initialize();

      expect(mockExpoSQLite.SQLiteDatabase.openDatabaseAsync).toHaveBeenCalledWith('footprints.db');
      expect(mockDatabase.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS footprints')
      );
      expect(mockDatabase.execAsync).toHaveBeenCalledTimes(1);
    });

    test('should handle database initialization errors', async () => {
      const initError = new Error('Database initialization failed');
      mockExpoSQLite.SQLiteDatabase.openDatabaseAsync.mockRejectedValue(initError);

      await expect(storageService.initialize()).rejects.toThrow('Database initialization failed');
    });
  });

  describe('CRUD operations - createFootprint', () => {
    test('should throw error when database not initialized', async () => {
      // Do not call initialize() to test error case
      await expect(storageService.createFootprint(
        'Morning Walk',
        mockLocationPoints
      )).rejects.toThrow('Database not initialized');
    });

    describe('with initialized database', () => {
      beforeEach(async () => {
        await storageService.initialize();
      });

      test('should create footprints from location points', async () => {
      const insertedCount = await storageService.createFootprint(
        'Morning Walk',
        mockLocationPoints
      );

      expect(insertedCount).toBe(2);
      expect(mockDatabase.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO footprints'),
        expect.arrayContaining([
          'Morning Walk',
          mockLocationPoints[0].latitude,
          mockLocationPoints[0].longitude,
          mockLocationPoints[0].accuracy,
          mockLocationPoints[0].speed,
          mockLocationPoints[0].heading,
          mockLocationPoints[0].timestamp.toISOString()
        ])
      );
      expect(mockDatabase.runAsync).toHaveBeenCalledTimes(2); // Once for each location point
    });

    test('should handle create footprint database errors', async () => {
      const dbError = new Error('Database insert failed');
      mockDatabase.runAsync.mockRejectedValue(dbError);

      await expect(storageService.createFootprint(
        'Morning Walk',
        mockLocationPoints
      )).rejects.toThrow('Database insert failed');
      });
    });
  });

  describe('CRUD operations - fetchFootprints', () => {
    test('should throw error when database not initialized', async () => {
      await expect(storageService.fetchFootprints()).rejects.toThrow('Database not initialized');
    });

    describe('with initialized database', () => {
      beforeEach(async () => {
        await storageService.initialize();
      });

      test('should fetch all footprints grouped by title as routes', async () => {
      // Mock footprint data in database format
      const mockFootprintRows = [
        {
          id: 1,
          title: 'Morning Walk',
          latitude: 35.6762,
          longitude: 139.6503,
          timestamp: '2022-01-01T10:00:00.000Z',
          accuracy: 5.0,
          speed: 2.5,
          direction: 45.0
        },
        {
          id: 2,
          title: 'Morning Walk',
          latitude: 35.6763,
          longitude: 139.6504,
          timestamp: '2022-01-01T10:01:00.000Z',
          accuracy: 5.0,
          speed: 2.0,
          direction: 50.0
        }
      ];

      mockDatabase.getAllAsync.mockResolvedValue(mockFootprintRows);

      const routes = await storageService.fetchFootprints();

      expect(routes).toHaveLength(1);
      expect(routes[0]).toEqual({
        id: 'morning-walk-1',
        name: 'Morning Walk',
        startTime: new Date('2022-01-01T10:00:00.000Z'),
        endTime: new Date('2022-01-01T10:01:00.000Z'),
        pointCount: 2,
        locationPoints: [
          {
            latitude: 35.6762,
            longitude: 139.6503,
            timestamp: new Date('2022-01-01T10:00:00.000Z'),
            accuracy: 5.0,
            speed: 2.5,
            heading: 45.0
          },
          {
            latitude: 35.6763,
            longitude: 139.6504,
            timestamp: new Date('2022-01-01T10:01:00.000Z'),
            accuracy: 5.0,
            speed: 2.0,
            heading: 50.0
          }
        ]
      });
    });

    test('should return empty array when no footprints exist', async () => {
      mockDatabase.getAllAsync.mockResolvedValue([]);

      const routes = await storageService.fetchFootprints();

      expect(routes).toEqual([]);
    });

    test('should handle fetch footprints database errors', async () => {
      const dbError = new Error('Database query failed');
      mockDatabase.getAllAsync.mockRejectedValue(dbError);

      await expect(storageService.fetchFootprints()).rejects.toThrow('Database query failed');
      });
    });
  });

  describe('CRUD operations - fetchFootprintsByTitle', () => {
    test('should throw error when database not initialized', async () => {
      await expect(storageService.fetchFootprintsByTitle('Morning Walk')).rejects.toThrow('Database not initialized');
    });

    describe('with initialized database', () => {
      beforeEach(async () => {
        await storageService.initialize();
      });

      test('should fetch footprints filtered by title', async () => {
      const mockFootprintRows = [
        {
          id: 1,
          title: 'Morning Walk',
          latitude: 35.6762,
          longitude: 139.6503,
          timestamp: '2022-01-01T10:00:00.000Z',
          accuracy: 5.0,
          speed: 2.5,
          direction: 45.0
        }
      ];

      mockDatabase.getAllAsync.mockResolvedValue(mockFootprintRows);

      const routes = await storageService.fetchFootprintsByTitle('Morning Walk');

      expect(mockDatabase.getAllAsync).toHaveBeenCalledWith(
        'SELECT * FROM footprints WHERE title = ? ORDER BY timestamp ASC',
        ['Morning Walk']
      );
      expect(routes).toHaveLength(1);
      expect(routes[0].name).toBe('Morning Walk');
    });

    test('should return empty array when no footprints match title', async () => {
      mockDatabase.getAllAsync.mockResolvedValue([]);

      const routes = await storageService.fetchFootprintsByTitle('Non-existent Route');

      expect(routes).toEqual([]);
    });

    test('should handle fetch footprints by title database errors', async () => {
      const dbError = new Error('Database query failed');
      mockDatabase.getAllAsync.mockRejectedValue(dbError);

      await expect(storageService.fetchFootprintsByTitle('Morning Walk')).rejects.toThrow('Database query failed');
      });
    });
  });

  describe('CRUD operations - delete', () => {
    test('should throw error when database not initialized', async () => {
      await expect(storageService.delete('Morning Walk')).rejects.toThrow('Database not initialized');
    });

    describe('with initialized database', () => {
      beforeEach(async () => {
        await storageService.initialize();
      });

      test('should delete footprints by title', async () => {
      const deletedCount = await storageService.delete('Morning Walk');

      expect(mockDatabase.runAsync).toHaveBeenCalledWith(
        'DELETE FROM footprints WHERE title = ?',
        ['Morning Walk']
      );
      expect(deletedCount).toBe(2); // Based on mockDatabase.runAsync changes: 2
    });

    test('should handle delete operation database errors', async () => {
      const dbError = new Error('Database delete failed');
      mockDatabase.runAsync.mockRejectedValue(dbError);

      await expect(storageService.delete('Morning Walk')).rejects.toThrow('Database delete failed');
      });
    });
  });

  describe('CRUD operations - countFootprints', () => {
    test('should throw error when database not initialized', async () => {
      await expect(storageService.countFootprints()).rejects.toThrow('Database not initialized');
    });

    describe('with initialized database', () => {
      beforeEach(async () => {
        await storageService.initialize();
      });

      test('should return total count of unique footprint titles', async () => {
      const mockCountResult = [{ count: 5 }];
      mockDatabase.getAllAsync.mockResolvedValue(mockCountResult);

      const count = await storageService.countFootprints();

      expect(mockDatabase.getAllAsync).toHaveBeenCalledWith('SELECT COUNT(DISTINCT title) as count FROM footprints');
      expect(count).toBe(5);
    });

    test('should handle count operation database errors', async () => {
      const dbError = new Error('Database count failed');
      mockDatabase.getAllAsync.mockRejectedValue(dbError);

      await expect(storageService.countFootprints()).rejects.toThrow('Database count failed');
      });
    });
  });
});