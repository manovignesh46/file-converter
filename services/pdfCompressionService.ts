import { PDFDocument } from 'pdf-lib-with-encrypt'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'

export interface PdfCompressionOptions {
  quality?: number // 1-100, where 100 is highest quality
  targetSize?: number
  targetSizeUnit?: 'KB' | 'MB'
  removeMetadata?: boolean
  optimizeImages?: boolean
}

export interface ProcessedPdf {
  originalName: string
  processedName: string
  originalSize: number
  processedSize: number
  compressionRatio: number
  outputPath: string
  pageCount: number
}

export class PdfCompressionService {
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

  async compressPdf(
    inputBuffer: Buffer,
    originalName: string,
    options: PdfCompressionOptions
  ): Promise<ProcessedPdf> {
    await this.ensureOutputDir()

    // Extract original filename without extension
    const originalBaseName = path.parse(originalName).name
    const fileId = uuidv4().split('-')[0] // Use shorter ID
    const suffix = `_compressed`
    const outputFileName = `${originalBaseName}${suffix}_${fileId}.pdf`
    const outputPath = path.join(this.outputDir, outputFileName)

    try {
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(inputBuffer)
      const pageCount = pdfDoc.getPageCount()

      // Remove metadata if requested
      if (options.removeMetadata) {
        // Clear document info
        pdfDoc.setTitle('')
        pdfDoc.setAuthor('')
        pdfDoc.setSubject('')
        pdfDoc.setCreator('')
        pdfDoc.setProducer('')
        pdfDoc.setCreationDate(new Date(0))
        pdfDoc.setModificationDate(new Date(0))
      }

      // If target size is specified, use iterative compression
      if (options.targetSize && options.targetSizeUnit) {
        const targetBytes = options.targetSizeUnit === 'KB' 
          ? options.targetSize * 1024 
          : options.targetSize * 1024 * 1024

        return await this.compressToTargetSize(
          pdfDoc,
          targetBytes,
          outputPath,
          originalName,
          inputBuffer.length,
          pageCount
        )
      }

      // Regular compression based on quality
      const quality = options.quality || 75
      const compressedPdfBytes = await this.compressPdfWithQuality(pdfDoc, quality, options.optimizeImages)

      await fs.writeFile(outputPath, compressedPdfBytes)

      const compressionRatio = (1 - compressedPdfBytes.length / inputBuffer.length) * 100

      return {
        originalName,
        processedName: outputFileName,
        originalSize: inputBuffer.length,
        processedSize: compressedPdfBytes.length,
        compressionRatio,
        outputPath,
        pageCount,
      }
    } catch (error) {
      console.error('PDF compression error:', error)
      throw new Error(`Failed to compress PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async compressPdfWithQuality(
    pdfDoc: PDFDocument, 
    quality: number, 
    optimizeImages: boolean = true
  ): Promise<Uint8Array> {
    // Basic PDF compression - pdf-lib has limited compression options
    
    const saveOptions: { useObjectStreams?: boolean } = {};
    
    if (quality < 100) {
      saveOptions.useObjectStreams = true;
    }

    return await pdfDoc.save(saveOptions)
  }

  private async compressToTargetSize(
    pdfDoc: PDFDocument,
    targetBytes: number,
    outputPath: string,
    originalName: string,
    originalSize: number,
    pageCount: number
  ): Promise<ProcessedPdf> {
    let quality = 75
    let compressedPdfBytes: Uint8Array

    // Binary search for optimal quality
    let minQuality = 10
    let maxQuality = 100
    let bestBytes: Uint8Array | null = null
    let bestQuality = quality

    while (minQuality <= maxQuality) {
      quality = Math.floor((minQuality + maxQuality) / 2)
      
      compressedPdfBytes = await this.compressPdfWithQuality(pdfDoc, quality, true)

      if (compressedPdfBytes.length <= targetBytes) {
        bestBytes = compressedPdfBytes
        bestQuality = quality
        minQuality = quality + 1
      } else {
        maxQuality = quality - 1
      }
    }

    if (!bestBytes) {
      // If we can't reach target size, use lowest quality
      bestBytes = await this.compressPdfWithQuality(pdfDoc, 10, true)
    }

    await fs.writeFile(outputPath, bestBytes)

    return {
      originalName,
      processedName: path.basename(outputPath),
      originalSize,
      processedSize: bestBytes.length,
      compressionRatio: (1 - bestBytes.length / originalSize) * 100,
      outputPath,
      pageCount,
    }
  }

  async estimateCompressedSize(
    inputBuffer: Buffer,
    options: PdfCompressionOptions
  ): Promise<number> {
    if (options.targetSize && options.targetSizeUnit) {
      return options.targetSizeUnit === 'KB' 
        ? options.targetSize * 1024 
        : options.targetSize * 1024 * 1024
    }

    // Estimate based on quality
    const quality = options.quality || 75
    let estimatedRatio = quality / 100

    // PDF compression is typically less effective than image compression
    // Apply a more conservative ratio
    estimatedRatio = Math.max(estimatedRatio, 0.5) // Minimum 50% of original size

    return Math.round(inputBuffer.length * estimatedRatio)
  }

  async getPdfInfo(inputBuffer: Buffer): Promise<{
    pageCount: number
    title?: string
    author?: string
    hasImages: boolean
  }> {
    try {
      const pdfDoc = await PDFDocument.load(inputBuffer)
      const pageCount = pdfDoc.getPageCount()
      
      // Get basic metadata
      const title = pdfDoc.getTitle()
      const author = pdfDoc.getAuthor()
      
      // Check if PDF contains images (simplified check)
      // This is a basic implementation - more sophisticated detection would be needed
      const hasImages = inputBuffer.length > pageCount * 50000 // Rough heuristic

      return {
        pageCount,
        title: title || undefined,
        author: author || undefined,
        hasImages,
      }
    } catch (error) {
      throw new Error(`Failed to read PDF info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
