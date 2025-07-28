// Note: expo modules imports will be available when modules are installed
// These are temporarily typed as 'any' for development
let FileSystem: any;
let MailComposer: any;

try {
  // Try to import the actual modules
  FileSystem = require('expo-file-system');
  MailComposer = require('expo-mail-composer');
} catch {
  // Fallback to empty objects for testing
  FileSystem = {};
  MailComposer = {};
}

import { Route } from '../types/route';

/**
 * Result of export operation
 */
export interface ExportResult {
  success: boolean;
  error?: string;
}

/**
 * Export service for managing route data export functionality  
 * Equivalent to original app's CSV export and email functionality using Expo modules
 * Implements makeCSVData and sendMailWithCSV functionality
 */
export class ExportService {
  private fileSystemAPI: any;
  private mailComposerAPI: any;

  constructor(
    fileSystemAPI: any = FileSystem,
    mailComposerAPI: any = MailComposer
  ) {
    this.fileSystemAPI = fileSystemAPI;
    this.mailComposerAPI = mailComposerAPI;
  }

  /**
   * Generate CSV data from route array
   * Equivalent to original app's makeCSVData functionality  
   * Optimized for memory efficiency with large datasets
   * @param routes Array of routes to export
   * @returns CSV formatted string
   */
  public async makeCSVData(routes: Route[]): Promise<string> {
    const headers = 'Route,Latitude,Longitude,Timestamp,Accuracy,Speed,Heading\n';
    
    if (routes.length === 0) {
      return headers;
    }

    // Pre-calculate total rows for better memory allocation
    const totalPoints = routes.reduce((sum, route) => sum + route.locationPoints.length, 0);
    const csvRows: string[] = new Array(totalPoints + 1);
    csvRows[0] = headers;
    
    let rowIndex = 1;
    for (const route of routes) {
      const escapedRouteName = this.escapeCsvValue(route.name);
      
      for (const point of route.locationPoints) {
        csvRows[rowIndex++] = this.formatCsvRow(
          escapedRouteName,
          point.latitude,
          point.longitude,
          point.timestamp,
          point.accuracy,
          point.speed,
          point.heading
        );
      }
    }

    return csvRows.join('\n') + '\n';
  }

  /**
   * Send email with CSV attachment
   * Equivalent to original app's sendMailWithCSV functionality
   * Optimized with better error handling and resource cleanup
   * @param routes Array of routes to export  
   * @param recipientEmail Email address to send to
   * @returns Export result with success status
   */
  public async sendMailWithCSV(routes: Route[], recipientEmail: string): Promise<ExportResult> {
    let tempFilePath: string | null = null;

    try {
      // Check if mail composer is available
      const isMailAvailable = await this.mailComposerAPI.isAvailableAsync();
      if (!isMailAvailable) {
        return this.createErrorResult('Mail service is not available on this device');
      }

      // Generate CSV data
      const csvData = await this.makeCSVData(routes);

      // Create temporary file with timestamp for uniqueness
      const timestamp = Date.now();
      tempFilePath = `${this.fileSystemAPI.documentDirectory}routes_${timestamp}.csv`;
      
      await this.fileSystemAPI.writeAsStringAsync(tempFilePath, csvData, {
        encoding: 'utf8'
      });

      // Compose email
      const result = await this.mailComposerAPI.composeAsync({
        recipients: [recipientEmail],
        subject: 'Route Export',
        body: 'Please find attached route data in CSV format.',
        attachments: [tempFilePath]
      });

      // Check result status
      if (result.status === 'cancelled') {
        return this.createErrorResult('Email composition was cancelled');
      }

      return { success: true };

    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      // Clean up temporary file
      await this.cleanupTempFile(tempFilePath);
    }
  }

  /**
   * Format a single CSV row with optimized string operations
   * @param routeName Already escaped route name
   * @param latitude Point latitude 
   * @param longitude Point longitude
   * @param timestamp Point timestamp
   * @param accuracy Point accuracy (nullable)
   * @param speed Point speed (nullable) 
   * @param heading Point heading (nullable)
   * @returns Formatted CSV row string
   */
  private formatCsvRow(
    routeName: string,
    latitude: number,
    longitude: number, 
    timestamp: Date,
    accuracy: number | null,
    speed: number | null,
    heading: number | null
  ): string {
    return [
      routeName,
      latitude.toString(),
      longitude.toString(),
      timestamp.toISOString(),
      accuracy?.toString() || '',
      speed?.toString() || '',
      heading?.toString() || ''
    ].join(',');
  }

  /**
   * Escape CSV values to handle special characters
   * Handles quotes, commas, and newlines according to CSV specification
   * Optimized with regex for better performance
   * @param value Value to escape
   * @returns Escaped CSV value
   */
  private escapeCsvValue(value: string): string {
    // Check if escaping is needed using regex for better performance
    if (/[,"\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Create standardized error result
   * @param error Error message
   * @returns ExportResult with error
   */
  private createErrorResult(error: string): ExportResult {
    return { success: false, error };
  }

  /**
   * Clean up temporary file with proper error handling
   * @param tempFilePath Path to temporary file (nullable)
   */
  private async cleanupTempFile(tempFilePath: string | null): Promise<void> {
    if (tempFilePath) {
      try {
        await this.fileSystemAPI.deleteAsync(tempFilePath);
      } catch (deleteError) {
        // Log error but don't fail the operation
        console.warn('Failed to delete temporary file:', deleteError);
      }
    }
  }
}