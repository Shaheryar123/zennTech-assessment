const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const Bull = require('bull');

const { ImportJobProcessor } = require('./job-processor');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/import-errors.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/import-activity.log' })
  ]
});

// Configure file upload with security restrictions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    const allowedMimeTypes = ['text/csv', 'application/csv', 'text/plain'];
    const allowedExtensions = ['.csv'];
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
    }
  }
});

// Rate limiting middleware
const importRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 imports per hour per IP
  message: {
    error: 'Too many import requests. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Initialize job queue
const importQueue = new Bull('property import queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Job processor
const jobProcessor = new ImportJobProcessor();
importQueue.process('process-csv-import', 5, jobProcessor.processImportJob.bind(jobProcessor));


app.post('/api/properties/import',
  importRateLimit,
  upload.single('properties-csv'),
  [
    // Additional validation middleware
    body('importMode').optional().isIn(['strict', 'partial']).withMessage('Invalid import mode'),
    body('skipDuplicates').optional().isBoolean().withMessage('Skip duplicates must be boolean')
  ],
  async (req, res) => {
    const correlationId = uuidv4();
    const startTime = Date.now();
    
    // Log import attempt
    logger.info('CSV import initiated', {
      correlationId,
      userId: req.user.id,
      filename: req.file?.originalname,
      fileSize: req.file?.size,
      importMode: req.body.importMode || 'strict'
    });

    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          correlationId
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No CSV file provided',
          correlationId
        });
      }

      // Verify broker permissions
      if (!await verifyBrokerPermissions(req.user.id)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to import properties',
          correlationId
        });
      }

      // Quick file validation
      const fileValidation = await validateCsvFile(req.file.path);
      if (!fileValidation.isValid) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        return res.status(400).json({
          success: false,
          error: 'Invalid CSV file format',
          details: fileValidation.errors,
          correlationId
        });
      }

      // Create import job
      const importJob = await importQueue.add('process-csv-import', {
        correlationId,
        filePath: req.file.path,
        filename: req.file.originalname,
        brokerId: req.user.id,
        importMode: req.body.importMode || 'strict',
        skipDuplicates: req.body.skipDuplicates === 'true',
        metadata: {
          uploadTime: new Date().toISOString(),
          fileSize: req.file.size,
          estimatedRows: fileValidation.estimatedRows
        }
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 10,
        removeOnFail: 50
      });

      // Return immediate response with job tracking info
      const response = {
        success: true,
        message: 'Import job queued successfully',
        data: {
          jobId: importJob.id,
          correlationId,
          estimatedProcessingTime: Math.ceil(fileValidation.estimatedRows / 100) + ' minutes',
          estimatedRows: fileValidation.estimatedRows,
          status: 'queued',
          trackingUrl: `/api/properties/import/${importJob.id}/status`
        }
      };

      logger.info('Import job created', {
        correlationId,
        jobId: importJob.id,
        processingTime: Date.now() - startTime
      });

      res.status(202).json(response);

    } catch (error) {
      logger.error('Import endpoint error', {
        correlationId,
        error: error.message,
        stack: error.stack,
        userId: req.user.id
      });

      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error during import processing',
        correlationId,
        message: process.env.NODE_ENV === 'development' ? error.message : 'Please contact support'
      });
    }
  }
);

/**
 * Job Status Tracking Endpoint
 */
app.get('/api/properties/import/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await importQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Import job not found'
      });
    }

    // Verify user owns this job
    if (job.data.brokerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const jobState = await job.getState();
    const progress = job.progress();

    const response = {
      success: true,
      data: {
        jobId: job.id,
        status: jobState,
        progress: progress,
        createdAt: new Date(job.timestamp).toISOString(),
        processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : null,
        finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        results: job.returnvalue || null,
        errors: job.failedReason || null
      }
    };

    res.json(response);

  } catch (error) {
    logger.error('Status check error', {
      jobId: req.params.jobId,
      error: error.message,
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve job status'
    });
  }
});


async function verifyBrokerPermissions(userId) {
  try {
    // Check if user is verified broker with import permissions
    const broker = await Broker.findOne({
      where: { userId },
      include: ['permissions']
    });

    return broker && 
           broker.verificationStatus === 'verified' && 
           broker.permissions?.includes('property_import');
  } catch (error) {
    logger.error('Permission check failed', { userId, error: error.message });
    return false;
  }
}

async function validateCsvFile(filePath) {
  return new Promise((resolve) => {
    let rowCount = 0;
    let headerValidated = false;
    const errors = [];
    const requiredHeaders = ['title', 'price', 'projectId'];

    const stream = fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('headers', (headers) => {
        // Validate required headers exist
        const missingHeaders = requiredHeaders.filter(header => 
          !headers.map(h => h.toLowerCase()).includes(header.toLowerCase())
        );

        if (missingHeaders.length > 0) {
          errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
        }
        headerValidated = true;
      })
      .on('data', (data) => {
        rowCount++;
        // Stop counting after reasonable sample
        if (rowCount > 1000) {
          stream.destroy();
        }
      })
      .on('end', () => {
        resolve({
          isValid: errors.length === 0,
          errors,
          estimatedRows: rowCount > 1000 ? 'Large file (1000+ rows)' : rowCount
        });
      })
      .on('error', (error) => {
        resolve({
          isValid: false,
          errors: [`File parsing error: ${error.message}`],
          estimatedRows: 0
        });
      });

    // Timeout for large files
    setTimeout(() => {
      if (!headerValidated) {
        stream.destroy();
        resolve({
          isValid: false,
          errors: ['File validation timeout - file may be corrupted or too large'],
          estimatedRows: 0
        });
      }
    }, 10000);
  });
}

module.exports = {
  importQueue,
  validateCsvFile
}; 