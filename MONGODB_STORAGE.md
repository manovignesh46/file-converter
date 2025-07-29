# MongoDB File Storage Implementation

## Overview

The file conversion platform now stores processed files in MongoDB instead of the local file system. This provides better scalability, persistence, and management capabilities.

## Key Features

### ✅ **Persistent Storage**
- Files are stored directly in MongoDB as binary data
- Survives server restarts and deployments
- No dependency on local file system storage

### ✅ **Automatic Cleanup**
- Files auto-expire after 24 hours (configurable TTL)
- Prevents database bloat
- Background cleanup available via admin API

### ✅ **Rich Metadata**
- Original file information preserved
- Processing operation details stored
- Compression ratios, dimensions, and format info
- Job association for bulk operations

### ✅ **Backward Compatibility**
- Download routes check MongoDB first, then file system
- Existing file system files can be migrated
- No breaking changes to existing functionality

## Database Schema

### ProcessedFile Collection
```typescript
{
  filename: String,           // Generated filename
  originalName: String,       // User's original filename
  mimeType: String,          // File MIME type
  size: Number,              // File size in bytes
  data: Buffer,              // Actual file content
  operation: String,         // Processing operation (compress, resize, etc.)
  jobId: String,             // Associated job ID
  sessionId: String,         // Optional session tracking
  metadata: {
    originalSize: Number,
    compressionRatio: Number,
    dimensions: { width: Number, height: Number },
    format: String,
    pageCount: Number,       // For PDFs
    watermarkText: String,   // For watermarked images
    // ... other operation-specific metadata
  },
  createdAt: Date,           // Auto-expires after 24 hours
}
```

### Updated Job Collection
```typescript
{
  // ... existing fields ...
  storedFiles: [ObjectId],   // References to ProcessedFile documents
}
```

## API Endpoints

### File Processing
- `POST /api/process` - Now stores results in MongoDB
- Files are processed and immediately stored with metadata
- Job references stored files for easy retrieval

### File Downloads
- `GET /api/download/[filename]` - Downloads from MongoDB or file system
- `POST /api/download-all` - Creates ZIP from MongoDB files or fallback

### Admin Operations
- `POST /api/admin` - Migration and cleanup utilities
  ```json
  { "action": "migrate" }   // Migrate file system files to MongoDB
  { "action": "cleanup" }   // Clean up expired files
  ```

## Storage Benefits

### **Production Ready**
- No file system dependencies
- Scales with MongoDB infrastructure
- Built-in replication and backup
- TTL-based automatic cleanup

### **Performance**
- Direct binary storage in database
- No file I/O operations
- Efficient ZIP creation from memory
- Metadata queries without file access

### **Management**
- Centralized file storage
- Easy backup and restore
- File analytics and reporting
- User/session tracking capabilities

## Usage Examples

### Manual Migration
```bash
curl -X POST http://localhost:3000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"action":"migrate"}'
```

### Cleanup Expired Files
```bash
curl -X POST http://localhost:3000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"action":"cleanup"}'
```

### File Statistics
Files automatically track:
- Compression efficiency
- Original vs processed sizes
- Processing timestamps
- Operation types and settings

## Environment Configuration

Files are stored with a 24-hour TTL by default. This can be adjusted in the `ProcessedFileSchema`:

```typescript
createdAt: {
  type: Date,
  default: Date.now,
  expires: 86400 // 24 hours in seconds
}
```

## Migration Path

1. **Immediate**: New files are stored in MongoDB
2. **Backward Compatibility**: Existing files remain accessible
3. **Migration**: Use admin API to move existing files to MongoDB
4. **Cleanup**: Remove old file system files after migration

The implementation provides a smooth transition from file system to database storage while maintaining all existing functionality.
