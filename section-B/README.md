# Property Import Service - Production Ready

This is the refactored, production-ready version of the CSV property import endpoint that addresses all performance, security, and reliability issues from the original implementation.

## 🚀 Key Improvements

### ✅ **Performance & Scalability**
- **Streaming Processing**: Handles files of any size without memory issues
- **Batch Database Operations**: Processes 100 records at a time for optimal performance
- **Background Job Queue**: Non-blocking operations with Redis-backed queue
- **Connection Pooling**: Efficient database connection management

### ✅ **Security & Validation**
- **File Type Validation**: Only accepts CSV files with proper MIME type checking
- **Size Limits**: 50MB file size limit to prevent DoS attacks
- **Input Sanitization**: Comprehensive XSS and injection protection
- **Rate Limiting**: 5 imports per hour per user
- **Permission Checks**: Verified broker-only access

### ✅ **Error Handling & Reliability**
- **Comprehensive Validation**: Field-level validation with detailed error reporting
- **Transaction Management**: Database transactions ensure data consistency
- **Graceful Failure Handling**: Partial import support with detailed error logs
- **Retry Mechanisms**: Automatic retry with exponential backoff

### ✅ **Monitoring & Observability**
- **Structured Logging**: JSON logs with correlation IDs for tracking
- **Progress Tracking**: Real-time progress updates via job status endpoint
- **Performance Metrics**: Processing time and success rate monitoring
- **Audit Trail**: Complete import activity logging

## 📋 Prerequisites

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **PostgreSQL**: >= 12.0
- **Redis**: >= 6.0 (for job queue)

## 🛠️ Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd property-import-service
npm install
```

2. **Environment Configuration:**
Create a `.env` file with the following variables:
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=property_platform
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Application Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret

# File Upload Configuration
UPLOAD_DIR=./uploads/temp
MAX_FILE_SIZE=52428800  # 50MB in bytes

# Logging Configuration
LOG_LEVEL=info
LOG_DIR=./logs
```

3. **Database Setup:**
```bash
# Run database migrations
npm run migrate

# Seed initial data (optional)
npm run seed
```

4. **Start Redis Server:**
```bash

redis-server
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```


### Background Worker (Job Processing)
```bash
# Start the job processor worker
node job-processor.js
```

## 📡 API Endpoints

### 1. **Import Properties** 
```http
POST /api/properties/import
Content-Type: multipart/form-data

Headers:
- Authorization: Bearer <jwt-token>

Body:
- properties-csv: CSV file
- importMode: "strict" | "partial" (optional, default: "strict")
- skipDuplicates: boolean (optional, default: false)
```

**Response:**
```json
{
  "success": true,
  "message": "Import job queued successfully",
  "data": {
    "jobId": "12345",
    "correlationId": "uuid-v4",
    "estimatedProcessingTime": "5 minutes",
    "estimatedRows": 500,
    "status": "queued",
    "trackingUrl": "/api/properties/import/12345/status"
  }
}
```

### 2. **Check Import Status**
```http
GET /api/properties/import/{jobId}/status

Headers:
- Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "12345",
    "status": "completed",
    "progress": 100,
    "createdAt": "2023-06-01T10:00:00Z",
    "finishedAt": "2023-06-01T10:05:30Z",
    "results": {
      "stats": {
        "totalRows": 500,
        "successfulRows": 485,
        "failedRows": 15,
        "duplicateRows": 3,
        "warnings": []
      },
      "message": "Successfully imported 485 properties. 15 rows failed validation. 3 potential duplicates skipped"
    }
  }
}
```

## 📊 CSV File Format

Your CSV file must include these **required** columns:
- `title` - Property title (3-300 characters)
- `price` - Property price (positive number)
- `projectId` - Project identifier (3-50 alphanumeric characters)

**Optional** columns:
- `propertyType` - apartment, villa, townhouse, office, retail, land
- `bedrooms` - Number of bedrooms (0-20)
- `bathrooms` - Number of bathrooms (0-20)
- `areaSqft` - Property area in square feet
- `description` - Property description (max 2000 characters)
- `city` - City name
- `address` - Full address
- `latitude` - GPS latitude (-90 to 90)
- `longitude` - GPS longitude (-180 to 180)

**Sample CSV:**
```csv
title,price,projectId,propertyType,bedrooms,bathrooms,areaSqft,city
"Luxury Apartment in Downtown",500000,proj_001,apartment,2,2,1200,"Dubai"
"Beachfront Villa",2000000,proj_002,villa,4,5,3500,"Dubai"
```

## 🔧 Configuration Options

### File Processing Settings
```javascript
// In server.js
const BATCH_SIZE = 100;           // Records per batch
const MAX_FILE_SIZE = 50MB;       // Maximum file size
const MAX_ERRORS_THRESHOLD = 50;  // Stop if too many errors
```

### Rate Limiting
- **5 imports per hour** per user/IP
- Configurable in the rate limiting middleware

## 📈 Monitoring & Logging

### Log Files
- `logs/import-activity.log` - All import activities
- `logs/import-errors.log` - Error-level events only
- `logs/job-processing.log` - Background job processing

### Log Format
```json
{
  "timestamp": "2023-06-01T10:00:00.000Z",
  "level": "info",
  "message": "CSV import initiated",
  "correlationId": "uuid-v4",
  "userId": "broker-123",
  "filename": "properties.csv",
  "fileSize": 1024000
}
```

### Performance Metrics
- Import success/failure rates
- Processing time per batch
- Memory usage during processing
- Queue depth and processing speed

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```



## 🔒 Security Features

- **File Type Validation**: Only CSV files accepted
- **Size Limits**: Prevents DoS attacks
- **Input Sanitization**: XSS protection
- **Rate Limiting**: Prevents abuse
- **Permission Checks**: Role-based access
- **Audit Logging**: Complete activity trail
- **Transaction Security**: ACID compliance

## 🚨 Error Handling

The system provides detailed error information:

### Validation Errors
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Row 5: Price must be greater than 0",
    "Row 12: Title is required and must be a string"
  ]
}
```

### Processing Errors
```json
{
  "success": false,
  "error": "Processing failed",
  "correlationId": "uuid-v4",
  "message": "Database connection timeout"
}
```
