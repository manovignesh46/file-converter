import { PDFDocument, PDFImage, PDFPage } from 'pdf-lib-with-encrypt'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'
import { encrypt } from 'node-qpdf2'
import sharp from 'sharp'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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
    // Use pdf-lib for basic operations
    const saveOptions: { useObjectStreams?: boolean } = {};
    
    if (quality < 100) {
      saveOptions.useObjectStreams = true;
    }

    // First save with pdf-lib
    const pdfBytes = await pdfDoc.save(saveOptions)
    
    // For aggressive compression (quality < 60), try Ghostscript first
    if (quality < 60 && optimizeImages) {
      try {
        const gsCompressed = await this.compressWithGhostscript(Buffer.from(pdfBytes), quality)
        if (gsCompressed && gsCompressed.length < pdfBytes.length) {
          return new Uint8Array(gsCompressed)
        }
      } catch (error) {
        console.log('Ghostscript not available, falling back to QPDF')
      }
    }
    
    // Then use qpdf for compression if quality is less than 100
    if (quality < 100) {
      try {
        // Write to temporary file
        const tempInput = path.join(this.outputDir, `temp_input_${Date.now()}.pdf`)
        const tempOutput = path.join(this.outputDir, `temp_output_${Date.now()}.pdf`)
        
        await fs.writeFile(tempInput, pdfBytes)
        
        // Use qpdf for compression with object stream compression
        const options = {
          input: tempInput,
          output: tempOutput,
          compressStreams: 'y',
          recompressFlate: 'y',
          objectStreams: 'generate',
          streamData: 'compress',
        }
        
        await encrypt(options)
        
        // Read compressed file
        const compressedBytes = await fs.readFile(tempOutput)
        
        // Clean up temp files
        await fs.unlink(tempInput).catch(() => {})
        await fs.unlink(tempOutput).catch(() => {})
        
        return new Uint8Array(compressedBytes)
      } catch (error) {
        console.error('QPDF compression failed, falling back to pdf-lib:', error)
        // Fall back to pdf-lib output if qpdf fails
        return pdfBytes
      }
    }
    
    return pdfBytes
  }

  /**
   * Compress PDF using Ghostscript with image downsampling
   * This is the most effective way to compress PDFs with embedded images
   */
  private async compressWithGhostscript(inputBuffer: Buffer, quality: number, aggressive = false): Promise<Buffer | null> {
    const tempInput = path.join(this.outputDir, `gs_input_${Date.now()}.pdf`)
    const tempOutput = path.join(this.outputDir, `gs_output_${Date.now()}.pdf`)

    try {
      await fs.writeFile(tempInput, inputBuffer)

      // Map quality to Ghostscript settings
      let dpi = 150
      let imageQuality = 60
      let pdfSettings = '/ebook'
      
      if (aggressive) {
        // Ultra-aggressive compression for target size mode
        dpi = 72
        imageQuality = 20
        pdfSettings = '/screen'
      } else if (quality >= 80) {
        dpi = 300
        imageQuality = 85
        pdfSettings = '/printer'
      } else if (quality >= 60) {
        dpi = 200
        imageQuality = 75
        pdfSettings = '/ebook'
      } else if (quality >= 40) {
        dpi = 150
        imageQuality = 60
        pdfSettings = '/ebook'
      } else if (quality >= 20) {
        dpi = 100
        imageQuality = 40
        pdfSettings = '/screen'
      } else {
        dpi = 72
        imageQuality = 25
        pdfSettings = '/screen'
      }

      // Ghostscript command for PDF compression with image downsampling
      const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${pdfSettings} \
-dNOPAUSE -dQUIET -dBATCH \
-dColorImageResolution=${dpi} \
-dGrayImageResolution=${dpi} \
-dMonoImageResolution=${dpi} \
-dColorImageDownsampleType=/Bicubic \
-dGrayImageDownsampleType=/Bicubic \
-dMonoImageDownsampleType=/Bicubic \
-dCompressPages=true \
-dJPEGQ=${imageQuality} \
-dDetectDuplicateImages=true \
-dFastWebView=true \
${aggressive ? '-dSubsetFonts=true -dEmbedAllFonts=true' : ''} \
-sOutputFile="${tempOutput}" \
"${tempInput}"`

      await execAsync(gsCommand)
      
      // Read compressed file
      const compressedBytes = await fs.readFile(tempOutput)
      
      // Clean up
      await fs.unlink(tempInput).catch(() => {})
      await fs.unlink(tempOutput).catch(() => {})
      
      // Only return if compression actually helped (or stayed same for aggressive mode)
      if (aggressive || compressedBytes.length < inputBuffer.length) {
        return compressedBytes
      }
      
      return null
    } catch (error) {
      // Clean up on error
      await fs.unlink(tempInput).catch(() => {})
      await fs.unlink(tempOutput).catch(() => {})
      throw error
    }
  }

  private async compressToTargetSize(
    pdfDoc: PDFDocument,
    targetBytes: number,
    outputPath: string,
    originalName: string,
    originalSize: number,
    pageCount: number
  ): Promise<ProcessedPdf> {
    // For aggressive target size compression, try multiple strategies
    console.log(`Target size compression: ${Math.round(originalSize/1024)} KB → ${Math.round(targetBytes/1024)} KB`)
    
    const compressionRatio = targetBytes / originalSize
    console.log(`Required compression ratio: ${(compressionRatio * 100).toFixed(1)}%`)
    
    // Strategy 1: Try QPDF first (works well for text-heavy PDFs)
    console.log('Strategy 1: Trying QPDF compression...')
    const qpdfBytes = await this.compressPdfWithQuality(pdfDoc, 1, true)
    
    if (qpdfBytes.length <= targetBytes) {
      console.log(`✅ QPDF success: ${Math.round(qpdfBytes.length/1024)} KB`)
      await fs.writeFile(outputPath, qpdfBytes)
      return {
        originalName,
        processedName: path.basename(outputPath),
        originalSize,
        processedSize: qpdfBytes.length,
        compressionRatio: (1 - qpdfBytes.length / originalSize) * 100,
        outputPath,
        pageCount,
      }
    }
    
    console.log(`QPDF result: ${Math.round(qpdfBytes.length/1024)} KB - still too large`)
    
    // Strategy 2: Try ultra-aggressive Ghostscript (for image-heavy PDFs)
    if (compressionRatio < 0.7) {
      console.log('Strategy 2: Trying ultra-aggressive Ghostscript...')
      
      try {
        const pdfBytes = await pdfDoc.save({ useObjectStreams: true })
        const compressed = await this.compressWithGhostscript(Buffer.from(pdfBytes), 1, true)
        
        if (compressed && compressed.length <= targetBytes) {
          console.log(`✅ Ghostscript success: ${Math.round(compressed.length/1024)} KB`)
          
          await fs.writeFile(outputPath, compressed)
          
          return {
            originalName,
            processedName: path.basename(outputPath),
            originalSize,
            processedSize: compressed.length,
            compressionRatio: (1 - compressed.length / originalSize) * 100,
            outputPath,
            pageCount,
          }
        }
        
        console.log(`Ghostscript result: ${compressed ? Math.round(compressed.length/1024) : '?'} KB - still too large`)
      } catch (error) {
        console.error('Ghostscript compression failed:', error)
      }
    }
    
    // Strategy 3: Binary search with QPDF (for moderate compression)
    console.log('Strategy 3: Binary search with QPDF...')
    let quality = 75
    let compressedPdfBytes: Uint8Array

    let minQuality = 1
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

    if (!bestBytes || bestBytes.length > targetBytes) {
      bestBytes = await this.compressPdfWithQuality(pdfDoc, 1, true)
    }

    // If STILL too large, try aggressive image downsampling
    if (bestBytes.length > targetBytes) {
      try {
        console.log('Regular compression insufficient, trying aggressive image downsampling...')
        bestBytes = await this.compressPdfWithImageDownsampling(pdfDoc, targetBytes)
      } catch (error) {
        console.error('Image downsampling failed:', error)
        // Continue with current bestBytes
      }
    }

    // Final verification - if still over target, throw error with helpful message
    if (!bestBytes || bestBytes.length > targetBytes) {
      const actualSizeKB = bestBytes ? Math.round(bestBytes.length / 1024) : Math.round(originalSize / 1024)
      const targetSizeKB = Math.round(targetBytes / 1024)
      const reductionPercent = bestBytes ? Math.round((1 - bestBytes.length / originalSize) * 100) : 0
      
      // Determine PDF type for better error message
      const isProbablyTextPdf = bestBytes && bestBytes.length >= originalSize * 0.95
      
      throw new Error(
        `Unable to compress PDF to ${targetSizeKB} KB. ` +
        `Achieved ${reductionPercent}% reduction (minimum size: ${actualSizeKB} KB).\n\n` +
        (isProbablyTextPdf 
          ? `This PDF contains primarily text/forms with minimal compressible content.\n\n` +
            `Text-based PDFs have limited compression potential because:\n` +
            `• Text and vector graphics are already efficiently stored\n` +
            `• Form fields and structure require fixed space\n` +
            `• Font data cannot be further compressed\n\n` +
            `Try these options:\n` +
            `• Use target size of ${actualSizeKB} KB or higher\n` +
            `• Remove unnecessary pages\n` +
            `• Simplify or remove form fields\n` +
            `• Convert to a simpler PDF format\n` +
            `• Split into multiple smaller PDFs\n\n` +
            `Note: Government portals requiring 200 KB limits may not accept this type of document without content reduction.`
          : `This PDF likely contains embedded images which limit compression.\n\n` +
            `Try these options:\n` +
            `• Use target size of ${actualSizeKB} KB or higher\n` +
            `• Reduce image quality in original PDF before uploading\n` +
            `• Scan documents at lower resolution (150 DPI instead of 300 DPI)\n` +
            `• Remove unnecessary pages or images\n` +
            `• Use external PDF optimizer with image downsampling support`)
      )
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

  /**
   * Aggressive PDF compression using Ghostscript with very low DPI
   * This downsamples images to reach the target size
   */
  private async compressPdfWithImageDownsampling(
    pdfDoc: PDFDocument,
    targetBytes: number
  ): Promise<Uint8Array> {
    console.log('Attempting aggressive Ghostscript compression for target:', Math.round(targetBytes/1024), 'KB')
    
    // First save the PDF
    const pdfBytes = await pdfDoc.save({  useObjectStreams: true })
    
    // Try different DPI levels until we reach target
    const dpiLevels = [72, 96, 100, 120, 150]  // Very low to low DPI
    const qualityLevels = [20, 30, 40, 50, 60]  // Very low to moderate quality
    
    for (let i = 0; i < dpiLevels.length; i++) {
      const dpi = dpiLevels[dpiLevels.length - 1 - i]  // Start from lowest
      const quality = qualityLevels[dpiLevels.length - 1 - i]
      
      try {
        const compressed = await this.compressWithGhostscript(Buffer.from(pdfBytes), quality)
        
        if (compressed && compressed.length <= targetBytes) {
          console.log(`Success at DPI ${dpi}, quality ${quality}: ${Math.round(compressed.length/1024)} KB`)
          return new Uint8Array(compressed)
        }
        
        console.log(`DPI ${dpi}, quality ${quality}: ${compressed ? Math.round(compressed.length/1024) : '?'} KB - still too large`)
      } catch (error) {
        console.error(`Failed at DPI ${dpi}:`, error)
        // Continue to next level
      }
    }
    
    // If Ghostscript failed or unavailable, return original
    console.log('Ghostscript compression did not achieve target size')
    return new Uint8Array(pdfBytes)
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

    // Estimate based on quality with more realistic ratios
    const quality = options.quality || 75
    
    // PDF compression effectiveness varies greatly based on content
    // Text-heavy PDFs compress well, image-heavy PDFs compress less
    // More conservative estimates:
    // Quality 90-100: ~90-95% of original (minimal compression)
    // Quality 70-89: ~80-90% of original (light compression)
    // Quality 50-69: ~70-85% of original (medium compression)
    // Quality 30-49: ~60-75% of original (heavy compression)
    // Quality 0-29: ~50-65% of original (maximum compression)
    
    let estimatedRatio: number
    
    if (quality >= 90) {
      estimatedRatio = 0.90 + (quality - 90) * 0.005 // 90-95%
    } else if (quality >= 70) {
      estimatedRatio = 0.80 + (quality - 70) * 0.005 // 80-90%
    } else if (quality >= 50) {
      estimatedRatio = 0.70 + (quality - 50) * 0.0075 // 70-85%
    } else if (quality >= 30) {
      estimatedRatio = 0.60 + (quality - 30) * 0.0075 // 60-75%
    } else {
      estimatedRatio = 0.50 + (quality / 30) * 0.15 // 50-65%
    }

    // Apply metadata removal benefit
    if (options.removeMetadata) {
      estimatedRatio -= 0.02 // ~2% additional reduction
    }

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
