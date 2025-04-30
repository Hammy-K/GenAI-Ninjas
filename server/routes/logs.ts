/**
 * Logs Routes
 * Handles log export operations including CSV generation
 */
import { Router, Request, Response } from 'express';
import { createObjectCsvWriter } from 'csv-writer';
import { db } from '../db';
import { assistantLogs } from '@shared/schema';
import path from 'path';
import fs from 'fs';
import os from 'os';

export function registerLogsRoutes(router: Router) {
  const logsRoutes = Router();

  /**
   * Export all assistant logs as CSV
   * This streams data from the database to minimize memory usage
   */
  logsRoutes.get('/export', async (req: Request, res: Response) => {
    try {
      // Create a temporary file for the CSV
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `assistant_logs_${Date.now()}.csv`);
      
      // Configure CSV writer with all columns
      const csvWriter = createObjectCsvWriter({
        path: tempFilePath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'timestamp', title: 'Timestamp' },
          { id: 'sessionId', title: 'Session ID' },
          { id: 'threadId', title: 'Thread ID' },
          { id: 'assistantId', title: 'Assistant ID' },
          { id: 'model', title: 'Model' },
          { id: 'promptContent', title: 'Prompt Content' },
          { id: 'responseContent', title: 'Response Content' },
          { id: 'errorMessage', title: 'Error Message' },
          { id: 'promptTokens', title: 'Prompt Tokens' },
          { id: 'completionTokens', title: 'Completion Tokens' },
          { id: 'totalTokens', title: 'Total Tokens' }
        ]
      });

      // Retrieve logs from database
      const logs = await db.select().from(assistantLogs).orderBy(assistantLogs.timestamp);
      
      // Process logs for CSV export
      const csvRecords = logs.map(log => {
        return {
          id: log.id,
          timestamp: log.timestamp.toISOString(),
          sessionId: log.sessionId,
          threadId: log.threadId,
          assistantId: log.assistantId,
          model: log.model,
          // Convert objects to strings for CSV
          promptContent: JSON.stringify(log.promptContent),
          responseContent: JSON.stringify(log.responseContent),
          errorMessage: log.errorMessage || '',
          promptTokens: log.tokens ? (log.tokens as any).prompt || 0 : 0,
          completionTokens: log.tokens ? (log.tokens as any).completion || 0 : 0,
          totalTokens: log.tokens ? (log.tokens as any).total || 0 : 0
        };
      });

      // Write data to CSV file
      await csvWriter.writeRecords(csvRecords);
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=assistant_logs.csv');
      
      // Stream the file to the response
      const fileStream = fs.createReadStream(tempFilePath);
      fileStream.pipe(res);
      
      // Clean up temp file after streaming is complete
      fileStream.on('end', () => {
        fs.unlink(tempFilePath, (err) => {
          if (err) console.error('Error deleting temporary CSV file:', err);
        });
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      res.status(500).json({ 
        error: 'Failed to export logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Mount logs routes
  router.use('/logs', logsRoutes);
}