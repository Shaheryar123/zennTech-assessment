/**
 * Background Job Processor for CSV Property Import
 * Handles streaming, batch processing, and comprehensive error handling
 */

const fs = require('fs');
const csvParser = require('csv-parser');
const winston = require('winston');
const { validatePropertyData, validateBusinessRules, checkForDuplicates } = require('./validation-utils');
const { createDatabaseTransaction, batchInsertProperties } = require('./database-utils');

// Initialize logger for job processing
const jobLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/job-processing.log' }),
    new winston.transports.Console({ 
      level: 'debug',
      format: winston.format.simple()
    })
  ]
});

class ImportJobProcessor {
  constructor() {
    this.BATCH_SIZE = 100; // Process in batches of 100 records
    this.MAX_ERRORS_THRESHOLD = 50; // Stop processing if too many errors
  }

  /**
   * Main job processing method
   */
  async processImportJob(job) {
    const startTime = Date.now();
    const { correlationId, filePath, brokerId, importMode, skipDuplicates, metadata } = job.data;
    
    jobLogger.info('Starting CSV import job', {
      correlationId,
      jobId: job.id,
      brokerId,
      filename: metadata?.filename,
      importMode
    });

    try {
      // Initialize tracking variables
      const stats = {
        totalRows: 0,
        processedRows: 0,
        successfulRows: 0,
        failedRows: 0,
        duplicateRows: 0,
        warnings: [],
        errors: []
      };

      // Get existing properties for duplicate checking
      const existingProperties = skipDuplicates ? 
        await this.getExistingProperties(brokerId) : [];

      // Process CSV file with streaming
      const result = await this.streamProcessCsv(
        filePath, 
        brokerId, 
        importMode, 
        skipDuplicates, 
        existingProperties,
        stats,
        job // Pass job for progress updates
      );

      // Clean up temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const processingTime = Date.now() - startTime;

      jobLogger.info('CSV import job completed', {
        correlationId,
        jobId: job.id,
        processingTime: `${processingTime}ms`,
        stats: result.stats
      });

      // Return final results
      return {
        success: true,
        stats: result.stats,
        processingTime,
        message: this.generateSuccessMessage(result.stats),
        errors: result.stats.errors.slice(0, 50), // Limit error details
        warnings: result.stats.warnings.slice(0, 20)
      };

    } catch (error) {
      jobLogger.error('CSV import job failed', {
        correlationId,
        jobId: job.id,
        error: error.message,
        stack: error.stack
      });

      // Clean up temporary file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      throw new Error(`Import job failed: ${error.message}`);
    }
  }

  /**
   * Stream process CSV file with batch operations
   */
  async streamProcessCsv(filePath, brokerId, importMode, skipDuplicates, existingProperties, stats, job) {
    return new Promise((resolve, reject) => {
      const batch = [];
      let rowIndex = 0;
      let headerProcessed = false;

      const stream = fs.createReadStream(filePath)
        .pipe(csvParser({
          skipEmptyLines: true,
          headers: true
        }))
        .on('headers', (headers) => {
          jobLogger.info('CSV headers detected', { 
            headers, 
            jobId: job.id 
          });
          headerProcessed = true;
        })
        .on('data', async (row) => {
          try {
            rowIndex++;
            stats.totalRows = rowIndex;

            // Pause stream for batch processing
            stream.pause();

            // Validate and process row
            const processedRow = await this.processRow(
              row, 
              rowIndex, 
              brokerId, 
              skipDuplicates, 
              existingProperties,
              stats
            );

            if (processedRow.isValid) {
              batch.push(processedRow.data);
              
              // Process batch when it reaches BATCH_SIZE
              if (batch.length >= this.BATCH_SIZE) {
                await this.processBatch(batch, brokerId, stats, importMode);
                batch.length = 0; // Clear batch
                
                // Update job progress
                const progress = Math.round((stats.processedRows / stats.totalRows) * 100);
                job.progress(progress);
              }
            }

            // Check error threshold
            if (stats.errors.length > this.MAX_ERRORS_THRESHOLD) {
              stream.destroy(new Error('Too many validation errors - stopping import'));
              return;
            }

            // Resume stream
            stream.resume();

          } catch (error) {
            stats.errors.push(`Row ${rowIndex}: Processing error - ${error.message}`);
            stats.failedRows++;
            stream.resume();
          }
        })
        .on('end', async () => {
          try {
            // Process remaining batch
            if (batch.length > 0) {
              await this.processBatch(batch, brokerId, stats, importMode);
            }

            job.progress(100);
            resolve({ stats });

          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          jobLogger.error('CSV parsing error', {
            error: error.message,
            jobId: job.id
          });
          reject(new Error(`CSV parsing failed: ${error.message}`));
        });

      // Timeout protection
      setTimeout(() => {
        if (!headerProcessed) {
          stream.destroy(new Error('CSV processing timeout - file may be corrupted'));
        }
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Process individual CSV row
   */
  async processRow(row, rowIndex, brokerId, skipDuplicates, existingProperties, stats) {
    try {
      // Basic validation
      const validation = validatePropertyData(row, rowIndex);
      if (!validation.isValid) {
        stats.errors.push(...validation.errors);
        stats.failedRows++;
        return { isValid: false };
      }

      const propertyData = validation.sanitizedData;
      propertyData.brokerId = brokerId;
      propertyData.status = 'active';
      propertyData.createdAt = new Date();
      propertyData.updatedAt = new Date();

      // Business rules validation
      const businessValidation = validateBusinessRules(propertyData, brokerId);
      if (!businessValidation.isValid) {
        stats.errors.push(...businessValidation.errors);
        stats.failedRows++;
        return { isValid: false };
      }

      if (businessValidation.warnings.length > 0) {
        stats.warnings.push(`Row ${rowIndex}: ${businessValidation.warnings.join(', ')}`);
      }

      // Duplicate check
      if (skipDuplicates) {
        const duplicateCheck = await checkForDuplicates(propertyData, brokerId, existingProperties);
        if (duplicateCheck.isDuplicate) {
          stats.duplicateRows++;
          stats.warnings.push(`Row ${rowIndex}: Potential duplicate detected (${Math.round(duplicateCheck.duplicateScore * 100)}% similarity)`);
          return { isValid: false };
        }
      }

      return {
        isValid: true,
        data: propertyData
      };

    } catch (error) {
      stats.errors.push(`Row ${rowIndex}: Processing error - ${error.message}`);
      stats.failedRows++;
      return { isValid: false };
    }
  }

  /**
   * Process batch of validated properties
   */
  async processBatch(batch, brokerId, stats, importMode) {
    if (batch.length === 0) return;

    try {
      jobLogger.debug(`Processing batch of ${batch.length} properties`, { brokerId });

      // Create database transaction for batch
      const transaction = await createDatabaseTransaction();

      try {
        // Batch insert properties
        const insertResult = await batchInsertProperties(batch, transaction);
        
        await transaction.commit();

        // Update statistics
        stats.processedRows += batch.length;
        stats.successfulRows += insertResult.successCount;
        stats.failedRows += insertResult.failCount;

        if (insertResult.errors.length > 0) {
          stats.errors.push(...insertResult.errors);
        }

        jobLogger.debug(`Batch processed successfully`, {
          batchSize: batch.length,
          successful: insertResult.successCount,
          failed: insertResult.failCount
        });

      } catch (error) {
        await transaction.rollback();
        
        // In strict mode, fail entire batch
        if (importMode === 'strict') {
          throw error;
        } else {
          // In partial mode, try individual inserts
          await this.processBatchIndividually(batch, brokerId, stats);
        }
      }

    } catch (error) {
      jobLogger.error('Batch processing error', {
        error: error.message,
        batchSize: batch.length,
        brokerId
      });

      // Update error statistics
      stats.failedRows += batch.length;
      stats.errors.push(`Batch processing error: ${error.message}`);

      if (importMode === 'strict') {
        throw error;
      }
    }
  }

  /**
   * Process batch individually when batch insert fails
   */
  async processBatchIndividually(batch, brokerId, stats) {
    for (const property of batch) {
      try {
        const transaction = await createDatabaseTransaction();
        await batchInsertProperties([property], transaction);
        await transaction.commit();
        
        stats.successfulRows++;
        stats.processedRows++;

      } catch (error) {
        stats.failedRows++;
        stats.errors.push(`Property "${property.title}": ${error.message}`);
      }
    }
  }

  /**
   * Get existing properties for duplicate checking
   */
  async getExistingProperties(brokerId) {
    try {
      // Implement based on your ORM/database layer
      const properties = await Property.findAll({
        where: { brokerId },
        attributes: ['id', 'title', 'price', 'projectId'],
        limit: 10000 // Reasonable limit for duplicate checking
      });

      return properties.map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        projectId: p.projectId
      }));

    } catch (error) {
      jobLogger.error('Failed to fetch existing properties', {
        error: error.message,
        brokerId
      });
      return [];
    }
  }

  /**
   * Generate success message based on statistics
   */
  generateSuccessMessage(stats) {
    const messages = [];
    
    if (stats.successfulRows > 0) {
      messages.push(`Successfully imported ${stats.successfulRows} properties`);
    }
    
    if (stats.failedRows > 0) {
      messages.push(`${stats.failedRows} rows failed validation`);
    }
    
    if (stats.duplicateRows > 0) {
      messages.push(`${stats.duplicateRows} potential duplicates skipped`);
    }
    
    if (stats.warnings.length > 0) {
      messages.push(`${stats.warnings.length} warnings generated`);
    }

    return messages.join('. ') || 'Import completed';
  }
}

module.exports = {
  ImportJobProcessor
}; 