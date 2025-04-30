/**
 * Logs Routes
 * Handles log export operations including CSV generation
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { assistantLogs } from '@shared/schema';
import { createObjectCsvStringifier } from 'csv-writer';
import { Readable } from 'stream';

export function registerLogsRoutes(router: Router) {
  const logsRoutes = Router();
  router.use('/logs', logsRoutes);

  /**
   * Export all assistant logs as CSV
   * This streams data from the database to minimize memory usage
   */
  logsRoutes.get('/export', async (req: Request, res: Response) => {
    try {
      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="assistant-logs.csv"');
      
      // Create CSV header
      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'timestamp', title: 'timestamp' },
          { id: 'userId', title: 'user_id' },
          { id: 'sessionId', title: 'session_id' },
          { id: 'threadId', title: 'thread_id' },
          { id: 'assistantId', title: 'assistant_id' },
          { id: 'model', title: 'model' },
          { id: 'promptContent', title: 'prompt_content' },
          { id: 'responseContent', title: 'response_content' },
          { id: 'tokens', title: 'tokens' },
          { id: 'errorMessage', title: 'error_message' }
        ]
      });
      
      // Write CSV header to response
      res.write(csvStringifier.getHeaderString());
      
      // Fetch logs in batches to avoid memory issues
      const batchSize = 100;
      let offset = 0;
      let hasMoreRecords = true;
      
      while (hasMoreRecords) {
        const logs = await db.select().from(assistantLogs)
          .limit(batchSize)
          .offset(offset)
          .orderBy(assistantLogs.timestamp);
        
        if (logs.length === 0) {
          hasMoreRecords = false;
          break;
        }
        
        // Process each log record
        const recordsForCsv = logs.map(log => ({
          ...log,
          // Stringify JSON fields
          promptContent: JSON.stringify(log.promptContent),
          responseContent: JSON.stringify(log.responseContent),
          tokens: log.tokens ? JSON.stringify(log.tokens) : '',
        }));
        
        // Write CSV records
        res.write(csvStringifier.stringifyRecords(recordsForCsv));
        
        // Move to next batch
        offset += batchSize;
      }
      
      // End the response
      res.end();
    } catch (error) {
      console.error('[LogsExport] Failed to export logs:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          error: 'Failed to export logs. Please try again later.' 
        });
      } else {
        // If headers were already sent, just end the response
        res.end();
      }
    }
  });
}