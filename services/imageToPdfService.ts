import { PDFDocument, rgb } from 'pdf-lib'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'

export interface PdfOptions {
  pageSize?: 'A4' | 'Letter' | 'Legal'
  orientation?: 'portrait' | 'landscape'
  margin?: number
  quality?: number
}

export interface ProcessedPdf {
  originalFiles: string[]
  pdfName: string
  outputPath: string
  pageCount: number
  fileSize: number
}

export class ImageToPdfService {
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

  async convertImagesToPdf(
    imageBuffers: { buffer: Buffer; name: string; order: number }[],
    options: PdfOptions = {}
  ): Promise<ProcessedPdf> {
    await this.ensureOutputDir()

    const pdfDoc = await PDFDocument.create()
    
    // Sort images by order
    const sortedImages = imageBuffers.sort((a, b) => a.order - b.order)

    // Page dimensions (in points, 72 points = 1 inch)
    const pageSizes = {
      A4: { width: 595, height: 842 },
      Letter: { width: 612, height: 792 },
      Legal: { width: 612, height: 1008 },
    }

    const pageSize = pageSizes[options.pageSize || 'A4']
    const margin = options.margin || 36 // 0.5 inch default margin
    const isLandscape = options.orientation === 'landscape'
    
    const pageWidth = isLandscape ? pageSize.height : pageSize.width
    const pageHeight = isLandscape ? pageSize.width : pageSize.height
    const contentWidth = pageWidth - (margin * 2)
    const contentHeight = pageHeight - (margin * 2)

    for (let i = 0; i < sortedImages.length; i++) {
      const imageData = sortedImages[i]
      // Convert image to JPEG for PDF compatibility
      const processedBuffer = await sharp(imageData.buffer)
        .jpeg({ quality: options.quality || 90 })
        .toBuffer()

      // Get image dimensions
      const metadata = await sharp(processedBuffer).metadata()
      const imgWidth = metadata.width || 0
      const imgHeight = metadata.height || 0

      // Calculate scaling to fit within page content area
      const scaleX = contentWidth / imgWidth
      const scaleY = contentHeight / imgHeight
      const scale = Math.min(scaleX, scaleY, 1) // Don't upscale

      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale

      // Center the image on the page
      const x = margin + (contentWidth - scaledWidth) / 2
      const y = margin + (contentHeight - scaledHeight) / 2

      // Add page and embed image
      const page = pdfDoc.addPage([pageWidth, pageHeight])
      const image = await pdfDoc.embedJpg(processedBuffer)

      page.drawImage(image, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
      })

      // Optional: Add page number
      page.drawText(`${i + 1}`, {
        x: pageWidth - margin - 20,
        y: margin - 20,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      })
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save()
    
    // Create meaningful PDF filename
    const firstImageName = sortedImages[0]?.name || 'images'
    const baseName = path.parse(firstImageName).name
    const fileId = uuidv4().split('-')[0] // Use shorter ID
    const suffix = sortedImages.length > 1 ? `_and_${sortedImages.length - 1}_more` : ''
    const pdfFileName = `${baseName}${suffix}_combined_${fileId}.pdf`
    const outputPath = path.join(this.outputDir, pdfFileName)
    
    await fs.writeFile(outputPath, pdfBytes)

    return {
      originalFiles: sortedImages.map(img => img.name),
      pdfName: pdfFileName,
      outputPath,
      pageCount: sortedImages.length,
      fileSize: pdfBytes.length,
    }
  }

  async estimatePdfSize(
    imageBuffers: { buffer: Buffer; name: string }[],
    options: PdfOptions = {}
  ): Promise<number> {
    // Rough estimation: PDF overhead + compressed images
    const imagesSizeEstimate = imageBuffers.reduce((total, img) => {
      // Estimate JPEG compression
      const compressedSize = img.buffer.length * (options.quality || 90) / 100
      return total + compressedSize
    }, 0)

    // PDF overhead (structure, metadata, etc.)
    const pdfOverhead = 50000 + (imageBuffers.length * 1000)

    return Math.round(imagesSizeEstimate + pdfOverhead)
  }
}
