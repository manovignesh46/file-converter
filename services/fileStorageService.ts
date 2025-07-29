import { ProcessedFile, Job } from '../lib/models'
import connectDB from '../lib/mongodb'
import fs from 'fs'
import path from 'path'

export class FileStorageService {
  /**
   * Store a processed file in MongoDB
   */
  static async storeFile(
    fileBuffer: Buffer,
    filename: string,
    originalName: string,
    mimeType: string,
    operation: string,
    jobId: string,
    metadata?: {
      originalSize?: number
      compressionRatio?: number
      dimensions?: { width: number; height: number }
      format?: string
      pageCount?: number
      pageSize?: string
      orientation?: string
      watermarkText?: string
      watermarkPosition?: string
    }
  ): Promise<string> {
    await connectDB()

    const processedFile = new ProcessedFile({
      filename,
      originalName,
      mimeType,
      size: fileBuffer.length,
      data: fileBuffer,
      operation,
      jobId,
      metadata,
      createdAt: new Date(),
    })

    await processedFile.save()

    // Update the job with the stored file reference
    await Job.findOneAndUpdate(
      { id: jobId },
      { 
        $push: { storedFiles: processedFile._id },
        $set: { completedAt: new Date() }
      }
    )

    return processedFile._id.toString()
  }

  /**
   * Retrieve a file from MongoDB
   */
  static async getFile(fileId: string): Promise<{
    buffer: Buffer
    filename: string
    mimeType: string
    originalName: string
  } | null> {
    await connectDB()

    const file = await ProcessedFile.findById(fileId)
    if (!file) {
      return null
    }

    return {
      buffer: file.data,
      filename: file.filename,
      mimeType: file.mimeType,
      originalName: file.originalName,
    }
  }

  /**
   * Get file by filename (for backward compatibility)
   */
  static async getFileByName(filename: string): Promise<{
    buffer: Buffer
    filename: string
    mimeType: string
    originalName: string
  } | null> {
    await connectDB()

    const file = await ProcessedFile.findOne({ filename })
    if (!file) {
      return null
    }

    return {
      buffer: file.data,
      filename: file.filename,
      mimeType: file.mimeType,
      originalName: file.originalName,
    }
  }

  /**
   * Get all files for a job
   */
  static async getJobFiles(jobId: string): Promise<Array<{
    id: string
    filename: string
    originalName: string
    size: number
    mimeType: string
    metadata?: any
  }>> {
    await connectDB()

    const files = await ProcessedFile.find({ jobId }).select('-data')
    return files.map(file => ({
      id: file._id.toString(),
      filename: file.filename,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      metadata: file.metadata,
    }))
  }

  /**
   * Create ZIP archive of job files
   */
  static async createJobZip(jobId: string): Promise<Buffer | null> {
    await connectDB()

    const files = await ProcessedFile.find({ jobId })
    if (!files.length) {
      return null
    }

    const archiver = require('archiver')
    const archive = archiver('zip', { zlib: { level: 9 } })
    
    const chunks: Buffer[] = []
    
    archive.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    // Add files to archive
    files.forEach(file => {
      archive.append(file.data, { name: file.filename })
    })

    await archive.finalize()
    
    return Buffer.concat(chunks)
  }

  /**
   * Clean up old files (called by cleanup job)
   */
  static async cleanupExpiredFiles(): Promise<number> {
    await connectDB()

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const result = await ProcessedFile.deleteMany({
      createdAt: { $lt: oneDayAgo }
    })

    return result.deletedCount || 0
  }

  /**
   * Migrate existing file system files to MongoDB (one-time migration)
   */
  static async migrateExistingFiles(processedDir: string): Promise<number> {
    await connectDB()

    if (!fs.existsSync(processedDir)) {
      return 0
    }

    const files = fs.readdirSync(processedDir)
    let migrated = 0

    for (const filename of files) {
      const filePath = path.join(processedDir, filename)
      
      try {
        const stats = fs.statSync(filePath)
        if (!stats.isFile()) continue

        // Check if file already exists in DB
        const existing = await ProcessedFile.findOne({ filename })
        if (existing) continue

        const buffer = fs.readFileSync(filePath)
        const mimeType = this.getMimeTypeFromExtension(filename)

        await ProcessedFile.create({
          filename,
          originalName: filename,
          mimeType,
          size: buffer.length,
          data: buffer,
          operation: 'migrated',
          jobId: 'migration',
          createdAt: new Date(),
        })

        migrated++
      } catch (error) {
        console.error(`Failed to migrate file ${filename}:`, error)
      }
    }

    return migrated
  }

  private static getMimeTypeFromExtension(filename: string): string {
    const ext = path.extname(filename).toLowerCase()
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
    }
    return mimeTypes[ext] || 'application/octet-stream'
  }
}
