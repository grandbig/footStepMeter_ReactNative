// Note: expo-sqlite imports will be available when modules are installed
// These are temporarily typed as 'any' for development
let SQLite: any;

try {
  // Try to import the actual module
  SQLite = require('expo-sqlite');
} catch {
  // Fallback to empty object for testing
  SQLite = {};
}

import { Route } from '../types/route';
import { LocationPoint } from '../types/location';

/**
 * Storage service for managing footprint data persistence
 * Equivalent to original app's Realm database functionality using SQLite
 * Uses single footprints table to match original Realm structure
 */
export class StorageService {
  private database: any | null = null;
  private sqliteAPI: any;

  constructor(sqliteAPI: any = SQLite.SQLiteDatabase) {
    this.sqliteAPI = sqliteAPI;
  }

  /**
   * Initialize the database and create required table
   * Single footprints table matching original Realm structure
   */
  public async initialize(): Promise<void> {
    try {
      this.database = await this.sqliteAPI.openDatabaseAsync('footprints.db');
      
      // Create single footprints table matching original Realm structure
      await this.database.execAsync(`
        CREATE TABLE IF NOT EXISTS footprints (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          accuracy REAL,
          speed REAL,
          direction REAL,
          timestamp TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create footprint records from location points
   * Equivalent to original app's createFootprint functionality
   * Each location point becomes individual footprint record
   * @param title Footprint title (route name)
   * @param locationPoints Array of GPS location points
   * @returns Number of footprints created
   */
  public async createFootprint(
    title: string,
    locationPoints: LocationPoint[]
  ): Promise<number> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      let insertedCount = 0;
      
      // Use transaction for atomicity and better performance
      await this.database.withTransactionAsync(async () => {
        // Insert each location point as individual footprint record
        for (const point of locationPoints) {
          await this.database.runAsync(
            'INSERT INTO footprints (title, latitude, longitude, accuracy, speed, direction, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              title,
              point.latitude,
              point.longitude,
              point.accuracy,
              point.speed,
              point.heading, // heading maps to direction in original
              point.timestamp.toISOString()
            ]
          );
          insertedCount++;
        }
      });

      return insertedCount;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch all footprints grouped by title as routes
   * Equivalent to original app's fetchFootprints functionality
   * Groups individual footprint records by title to create Route objects
   * @returns Array of routes with location points
   */
  public async fetchFootprints(): Promise<Route[]> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      // Get all footprints ordered by title and timestamp
      const footprints = await this.database.getAllAsync(
        'SELECT * FROM footprints ORDER BY title, timestamp ASC'
      );

      if (footprints.length === 0) {
        return [];
      }

      // Group footprints by title to create Route objects
      return this.groupFootprintsByTitle(footprints);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch footprints filtered by title
   * Equivalent to original app's fetchFootprintsByTitle functionality
   * @param title Footprint title to filter by
   * @returns Array of matching routes with location points
   */
  public async fetchFootprintsByTitle(title: string): Promise<Route[]> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      // Get footprints filtered by title
      const footprints = await this.database.getAllAsync(
        'SELECT * FROM footprints WHERE title = ? ORDER BY timestamp ASC',
        [title]
      );

      if (footprints.length === 0) {
        return [];
      }

      // Group footprints by title to create Route objects
      return this.groupFootprintsByTitle(footprints);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete footprints by title
   * Equivalent to original app's delete functionality
   * @param title Footprint title to delete
   * @returns Number of deleted footprints
   */
  public async delete(title: string): Promise<number> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      // Delete footprints by title
      const result = await this.database.runAsync(
        'DELETE FROM footprints WHERE title = ?',
        [title]
      );

      return result.changes || 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get total count of unique footprint titles (routes)
   * Equivalent to original app's countFootprints functionality
   * @returns Total number of unique footprint titles
   */
  public async countFootprints(): Promise<number> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.database.getAllAsync('SELECT COUNT(DISTINCT title) as count FROM footprints');
      return result[0]?.count || 0;
    } catch (error) {
      throw error;
    }
  }

  // Private helper methods

  /**
   * Group individual footprint records by title to create Route objects
   * Matches original app's structure where footprints are grouped by title
   */
  private groupFootprintsByTitle(footprints: any[]): Route[] {
    const grouped: Record<string, any[]> = {};
    
    // Group footprints by title
    for (const footprint of footprints) {
      if (!grouped[footprint.title]) {
        grouped[footprint.title] = [];
      }
      grouped[footprint.title].push(footprint);
    }
    
    // Convert groups to Route objects
    return Object.entries(grouped).map(([title, titleFootprints]) => {
      const locationPoints = titleFootprints.map(this.transformFootprintToLocationPoint);
      const timestamps = locationPoints.map(p => p.timestamp);
      
      return {
        id: this.generateRouteId(title, titleFootprints[0].id),
        name: title,
        startTime: new Date(Math.min(...timestamps.map(t => t.getTime()))),
        endTime: new Date(Math.max(...timestamps.map(t => t.getTime()))),
        pointCount: locationPoints.length,
        locationPoints
      };
    });
  }

  /**
   * Transform footprint database row to LocationPoint
   */
  private transformFootprintToLocationPoint = (footprint: any): LocationPoint => ({
    latitude: footprint.latitude,
    longitude: footprint.longitude,
    timestamp: new Date(footprint.timestamp),
    accuracy: footprint.accuracy,
    speed: footprint.speed,
    heading: footprint.direction // direction maps back to heading
  });

  /**
   * Generate route ID from title and first footprint ID
   */
  private generateRouteId(title: string, firstFootprintId: number): string {
    return `${title.replace(/\s+/g, '-').toLowerCase()}-${firstFootprintId}`;
  }
}