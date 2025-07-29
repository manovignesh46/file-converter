import { NextRequest, NextResponse } from 'next/server'
import multer from 'multer'
import { promisify } from 'util'
import { ImageCompressionService } from '../../../services/imageCompressionService'
import { ImageResizeService } from '../../../services/imageResizeService'
import { ImageToPdfService } from '../../../services/imageToPdfService'
import { FormatConversionService } from '../../../services/formatConversionService'
import { FileStorageService } from '../../../services/fileStorageService'
import connectDB from '../../../lib/mongodb'
import { Job } from '../../../lib/models'
import { v4 as uuidv4 } from 'uuid'

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
})

const uploadMiddleware = promisify(upload.array('images'))

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]
    const optionsStr = formData.get('options') as string
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    const options = JSON.parse(optionsStr)
    const jobId = uuidv4()

    // Create job record
    const job = new Job({
      id: jobId,
      status: 'processing',
      operation: options.operation,
      options,
      inputFiles: files.map(file => ({
        originalName: file.name,
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
      })),
    })
    await job.save()

    // Process files based on operation
    const results = await processFiles(files, options, jobId)

    // Update job status
    job.status = 'completed'
    job.progress = 100
    job.outputFiles = results.files
    job.completedAt = new Date()
    await job.save()

    return NextResponse.json({
      success: true,
      jobId,
      files: results.files,
      message: 'Processing completed successfully',
    })

  } catch (error) {
    console.error('Processing error:', error)
    return NextResponse.json(
      { error: 'Processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function processFiles(files: File[], options: any, jobId: string) {
  const outputFiles: string[] = []
  const storedFileIds: string[] = []

  switch (options.operation) {
    case 'compress':
      const compressionService = new ImageCompressionService()
      
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const result = await compressionService.compressImage(buffer, file.name, {
          quality: options.compressionQuality,
          targetSize: options.targetSize,
          targetSizeUnit: options.targetSizeUnit,
          removeMetadata: options.removeMetadata,
          outputFormat: options.outputFormat,
        })
        
        // Store in MongoDB instead of file system
        const fileId = await FileStorageService.storeFile(
          result.buffer,
          result.processedName,
          file.name,
          `image/${options.outputFormat || 'jpeg'}`,
          'compress',
          jobId,
          {
            originalSize: file.size,
            compressionRatio: file.size / result.buffer.length,
            format: options.outputFormat,
          }
        )
        
        outputFiles.push(result.processedName)
        storedFileIds.push(fileId)
      }
      break

    case 'resize':
      const resizeService = new ImageResizeService()
      
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const result = await resizeService.resizeImage(buffer, file.name, {
          width: options.resizeWidth,
          height: options.resizeHeight,
          maintainAspectRatio: options.maintainAspectRatio,
          cropToFit: options.cropToFit,
          outputFormat: options.outputFormat,
          removeMetadata: options.removeMetadata,
        })
        
        // Store in MongoDB
        const fileId = await FileStorageService.storeFile(
          result.buffer,
          result.processedName,
          file.name,
          `image/${options.outputFormat || 'jpeg'}`,
          'resize',
          jobId,
          {
            originalSize: file.size,
            dimensions: {
              width: options.resizeWidth,
              height: options.resizeHeight,
            },
            format: options.outputFormat,
          }
        )
        
        outputFiles.push(result.processedName)
        storedFileIds.push(fileId)
      }
      break

    case 'convert':
      const conversionService = new FormatConversionService()
      
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const result = await conversionService.convertFormat(buffer, file.name, {
          outputFormat: options.outputFormat,
          quality: options.compressionQuality,
          removeMetadata: options.removeMetadata,
        })
        
        // Store in MongoDB
        const fileId = await FileStorageService.storeFile(
          result.buffer,
          result.processedName,
          file.name,
          `image/${options.outputFormat}`,
          'convert',
          jobId,
          {
            originalSize: file.size,
            format: options.outputFormat,
          }
        )
        
        outputFiles.push(result.processedName)
        storedFileIds.push(fileId)
      }
      break

    case 'pdf':
      const pdfService = new ImageToPdfService()
      
      const imageBuffers = await Promise.all(
        files.map(async (file, index) => ({
          buffer: Buffer.from(await file.arrayBuffer()),
          name: file.name,
          order: index,
        }))
      )

      const pdfResult = await pdfService.convertImagesToPdf(imageBuffers, {
        pageSize: options.pageSize || 'A4',
        orientation: options.orientation || 'portrait',
        quality: options.compressionQuality || 90,
      })
      
      // Store PDF in MongoDB
      const fileId = await FileStorageService.storeFile(
        pdfResult.pdfBuffer,
        pdfResult.pdfName,
        `${files.length}-images.pdf`,
        'application/pdf',
        'pdf',
        jobId,
        {
          originalSize: files.reduce((sum, file) => sum + file.size, 0),
          pageCount: files.length,
          pageSize: options.pageSize,
          orientation: options.orientation,
        }
      )
      
      outputFiles.push(pdfResult.pdfName)
      storedFileIds.push(fileId)
      break

    case 'watermark':
      const watermarkService = new FormatConversionService()
      
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const result = await watermarkService.addWatermark(
          buffer,
          file.name,
          {
            text: options.watermarkText,
            position: options.watermarkPosition,
          },
          {
            outputFormat: options.outputFormat || 'jpg',
            quality: options.compressionQuality,
            removeMetadata: options.removeMetadata,
          }
        )
        
        // Store in MongoDB
        const fileId = await FileStorageService.storeFile(
          result.buffer,
          result.processedName,
          file.name,
          `image/${options.outputFormat || 'jpeg'}`,
          'watermark',
          jobId,
          {
            originalSize: file.size,
            watermarkText: options.watermarkText,
            watermarkPosition: options.watermarkPosition,
            format: options.outputFormat,
          }
        )
        
        outputFiles.push(result.processedName)
        storedFileIds.push(fileId)
      }
      break

    default:
      throw new Error(`Unsupported operation: ${options.operation}`)
  }

  return { files: outputFiles, storedFileIds }
}
