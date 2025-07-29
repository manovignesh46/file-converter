import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'

export interface CompressionOptions {
  quality?: number
  targetSize?: number
  targetSizeUnit?: 'KB' | 'MB'
  removeMetadata?: boolean
  outputFormat?: 'jpg' | 'png' | 'webp'
}

export interface ProcessedImage {
  originalName: string
  processedName: string
  originalSize: number
  processedSize: number
  compressionRatio: number
  outputPath: string
  buffer: Buffer
}

export class ImageCompressionService {
  private outputDir: string

  constructor() {
    this.outputDir = path.join(process.cwd(), 'public', 'processed')
  }

  async ensureOutputDir(): Promise<void> {
    try {
      await fs.access(this.outputDir)
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true })
    }
  }

  async compressImage(
    inputBuffer: Buffer,
    originalName: string,
    options: CompressionOptions
  ): Promise<ProcessedImage> {
    await this.ensureOutputDir()

    // Extract original filename without extension
    const originalBaseName = path.parse(originalName).name
    const fileId = uuidv4().split('-')[0] // Use shorter ID
    const extension = options.outputFormat || 'jpg'
    const suffix = `_compressed`
    const outputFileName = `${originalBaseName}${suffix}_${fileId}.${extension}`
    const outputPath = path.join(this.outputDir, outputFileName)

    let pipeline = sharp(inputBuffer)

    // Remove metadata if requested
    if (options.removeMetadata) {
      pipeline = pipeline.withMetadata({})
    }

    // Apply compression based on format
    if (extension === 'jpg') {
      pipeline = pipeline.jpeg({
        quality: options.quality || 80,
        progressive: true,
      })
    } else if (extension === 'png') {
      pipeline = pipeline.png({
        compressionLevel: this.qualityToCompressionLevel(options.quality || 80),
        progressive: true,
      })
    } else if (extension === 'webp') {
      pipeline = pipeline.webp({
        quality: options.quality || 80,
      })
    }

    // If target size is specified, iteratively compress
    if (options.targetSize && options.targetSizeUnit) {
      const targetBytes = options.targetSizeUnit === 'KB' 
        ? options.targetSize * 1024 
        : options.targetSize * 1024 * 1024

      return await this.compressToTargetSize(
        pipeline,
        targetBytes,
        outputPath,
        originalName,
        inputBuffer.length,
        extension
      )
    }

    // Regular compression
    const processedBuffer = await pipeline.toBuffer()
    await fs.writeFile(outputPath, processedBuffer)

    return {
      originalName,
      processedName: outputFileName,
      originalSize: inputBuffer.length,
      processedSize: processedBuffer.length,
      compressionRatio: (1 - processedBuffer.length / inputBuffer.length) * 100,
      outputPath,
      buffer: processedBuffer,
    }
  }

  private async compressToTargetSize(
    pipeline: sharp.Sharp,
    targetBytes: number,
    outputPath: string,
    originalName: string,
    originalSize: number,
    format: string
  ): Promise<ProcessedImage> {
    let quality = 80
    let processedBuffer: Buffer

    // Binary search for optimal quality
    let minQuality = 10
    let maxQuality = 100
    let bestBuffer: Buffer | null = null
    let bestQuality = quality

    while (minQuality <= maxQuality) {
      quality = Math.floor((minQuality + maxQuality) / 2)
      
      let tempPipeline = pipeline.clone()
      
      if (format === 'jpg' || format === 'jpeg') {
        tempPipeline = tempPipeline.jpeg({ quality })
      } else if (format === 'png') {
        tempPipeline = tempPipeline.png({ 
          compressionLevel: this.qualityToCompressionLevel(quality) 
        })
      } else if (format === 'webp') {
        tempPipeline = tempPipeline.webp({ quality })
      }

      processedBuffer = await tempPipeline.toBuffer()

      if (processedBuffer.length <= targetBytes) {
        bestBuffer = processedBuffer
        bestQuality = quality
        minQuality = quality + 1
      } else {
        maxQuality = quality - 1
      }
    }

    if (!bestBuffer) {
      // If we can't reach target size, use lowest quality
      let tempPipeline = pipeline.clone()
      
      if (format === 'jpg' || format === 'jpeg') {
        tempPipeline = tempPipeline.jpeg({ quality: 10 })
      } else if (format === 'png') {
        tempPipeline = tempPipeline.png({ compressionLevel: 9 })
      } else if (format === 'webp') {
        tempPipeline = tempPipeline.webp({ quality: 10 })
      }

      bestBuffer = await tempPipeline.toBuffer()
    }

    await fs.writeFile(outputPath, bestBuffer)

    return {
      originalName,
      processedName: path.basename(outputPath),
      originalSize,
      processedSize: bestBuffer.length,
      compressionRatio: (1 - bestBuffer.length / originalSize) * 100,
      outputPath,
      buffer: bestBuffer,
    }
  }

  private qualityToCompressionLevel(quality: number): number {
    // Convert quality (0-100) to PNG compression level (0-9)
    return Math.round((100 - quality) / 100 * 9)
  }

  async estimateCompressedSize(
    inputBuffer: Buffer,
    options: CompressionOptions
  ): Promise<number> {
    const pipeline = sharp(inputBuffer)
    const extension = options.outputFormat || 'jpg'

    if (options.targetSize && options.targetSizeUnit) {
      return options.targetSizeUnit === 'KB' 
        ? options.targetSize * 1024 
        : options.targetSize * 1024 * 1024
    }

    // Quick estimation based on quality
    let estimatedRatio = 0.8 // Default 80% of original

    if (extension === 'webp') {
      estimatedRatio = 0.7 // WebP typically better compression
    }

    if (options.quality) {
      estimatedRatio = options.quality / 100
    }

    return Math.round(inputBuffer.length * estimatedRatio)
  }
}
