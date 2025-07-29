import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'

export interface FormatConversionOptions {
  outputFormat: 'jpg' | 'png' | 'webp'
  quality?: number
  removeMetadata?: boolean
}

export interface WatermarkOptions {
  text?: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  fontSize?: number
  opacity?: number
  color?: string
}

export interface ProcessedImage {
  originalName: string
  processedName: string
  originalSize: number
  processedSize: number
  outputPath: string
  format: string
}

export class FormatConversionService {
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

  async convertFormat(
    inputBuffer: Buffer,
    originalName: string,
    options: FormatConversionOptions
  ): Promise<ProcessedImage> {
    await this.ensureOutputDir()

    // Extract original filename without extension
    const originalBaseName = path.parse(originalName).name
    const fileId = uuidv4().split('-')[0] // Use shorter ID
    const suffix = `_converted_to_${options.outputFormat}`
    const outputFileName = `${originalBaseName}${suffix}_${fileId}.${options.outputFormat}`
    const outputPath = path.join(this.outputDir, outputFileName)

    let pipeline = sharp(inputBuffer)

    // Remove metadata if requested
    if (options.removeMetadata) {
      pipeline = pipeline.withMetadata({})
    }

    // Apply format-specific settings
    switch (options.outputFormat) {
      case 'jpg':
        pipeline = pipeline.jpeg({
          quality: options.quality || 90,
          progressive: true,
        })
        break
      case 'png':
        pipeline = pipeline.png({
          compressionLevel: this.qualityToCompressionLevel(options.quality || 90),
          progressive: true,
        })
        break
      case 'webp':
        pipeline = pipeline.webp({
          quality: options.quality || 90,
        })
        break
    }

    const processedBuffer = await pipeline.toBuffer()
    await fs.writeFile(outputPath, processedBuffer)

    return {
      originalName,
      processedName: outputFileName,
      originalSize: inputBuffer.length,
      processedSize: processedBuffer.length,
      outputPath,
      format: options.outputFormat,
    }
  }

  async addWatermark(
    inputBuffer: Buffer,
    originalName: string,
    watermarkOptions: WatermarkOptions,
    formatOptions?: FormatConversionOptions
  ): Promise<ProcessedImage> {
    await this.ensureOutputDir()

    // Extract original filename without extension
    const originalBaseName = path.parse(originalName).name
    const fileId = uuidv4().split('-')[0] // Use shorter ID
    const extension = formatOptions?.outputFormat || 'jpg'
    const suffix = `_watermarked`
    const outputFileName = `${originalBaseName}${suffix}_${fileId}.${extension}`
    const outputPath = path.join(this.outputDir, outputFileName)

    const image = sharp(inputBuffer)
    const metadata = await image.metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0

    if (!watermarkOptions.text) {
      throw new Error('Watermark text is required')
    }

    // Create watermark SVG
    const fontSize = watermarkOptions.fontSize || Math.max(width * 0.03, 20)
    const opacity = watermarkOptions.opacity || 0.5
    const color = watermarkOptions.color || '#ffffff'

    // Calculate text width more accurately (approximate)
    const textWidth = watermarkOptions.text.length * fontSize * 0.6
    const padding = 20

    // Calculate position with bounds checking
    let x = padding
    let y = fontSize + padding

    switch (watermarkOptions.position || 'bottom-right') {
      case 'top-left':
        x = padding
        y = fontSize + padding
        break
      case 'top-right':
        x = Math.max(width - textWidth - padding, padding)
        y = fontSize + padding
        break
      case 'bottom-left':
        x = padding
        y = Math.max(height - padding, fontSize + padding)
        break
      case 'bottom-right':
        x = Math.max(width - textWidth - padding, padding)
        y = Math.max(height - padding, fontSize + padding)
        break
      case 'center':
        x = Math.max((width - textWidth) / 2, padding)
        y = Math.max(height / 2, fontSize + padding)
        break
      default:
        // Default to bottom-right if no valid position specified
        x = Math.max(width - textWidth - padding, padding)
        y = Math.max(height - padding, fontSize + padding)
        break
    }

    const watermarkSvg = `
      <svg width="${width}" height="${height}">
        <text x="${x}" y="${y}" 
              font-family="Arial, sans-serif" 
              font-size="${fontSize}" 
              fill="${color}" 
              fill-opacity="${opacity}"
              font-weight="bold">
          ${watermarkOptions.text}
        </text>
      </svg>
    `

    let pipeline = image.composite([
      {
        input: Buffer.from(watermarkSvg),
        top: 0,
        left: 0,
      }
    ])

    // Remove metadata if requested
    if (formatOptions?.removeMetadata) {
      pipeline = pipeline.withMetadata({})
    }

    // Apply format
    if (extension === 'jpg') {
      pipeline = pipeline.jpeg({ quality: formatOptions?.quality || 90 })
    } else if (extension === 'png') {
      pipeline = pipeline.png({ compressionLevel: 6 })
    } else if (extension === 'webp') {
      pipeline = pipeline.webp({ quality: formatOptions?.quality || 90 })
    }

    const processedBuffer = await pipeline.toBuffer()
    await fs.writeFile(outputPath, processedBuffer)

    return {
      originalName,
      processedName: outputFileName,
      originalSize: inputBuffer.length,
      processedSize: processedBuffer.length,
      outputPath,
      format: extension,
    }
  }

  private qualityToCompressionLevel(quality: number): number {
    // Convert quality (0-100) to PNG compression level (0-9)
    return Math.round((100 - quality) / 100 * 9)
  }

  async estimateConvertedSize(
    inputBuffer: Buffer,
    options: FormatConversionOptions
  ): Promise<number> {
    // Rough estimation based on format characteristics
    const baseSize = inputBuffer.length

    switch (options.outputFormat) {
      case 'jpg':
        return Math.round(baseSize * (options.quality || 90) / 100)
      case 'png':
        // PNG typically larger but lossless
        return Math.round(baseSize * 1.2)
      case 'webp':
        // WebP typically smaller
        return Math.round(baseSize * 0.7 * (options.quality || 90) / 100)
      default:
        return baseSize
    }
  }
}
