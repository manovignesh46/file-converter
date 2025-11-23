import { PDFDocument, rgb } from 'pdf-lib-with-encrypt' 
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'

export interface PdfOptions {
  pageSize?: 'A4' | 'Letter' | 'Legal'
  orientation?: 'portrait' | 'landscape'
  margin?: number
  quality?: number
  imagesPerPage?: 1 | 2 // New option: 1 = one image per page, 2 = two images side-by-side
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
    const imagesPerPage = options.imagesPerPage || 1
    
    const pageWidth = isLandscape ? pageSize.height : pageSize.width
    const pageHeight = isLandscape ? pageSize.width : pageSize.height
    const contentWidth = pageWidth - (margin * 2)
    const contentHeight = pageHeight - (margin * 2)

    // Handle side-by-side layout (2 images per page)
    if (imagesPerPage === 2) {
      await this.createSideBySidePages(pdfDoc, sortedImages, {
        pageWidth,
        pageHeight,
        contentWidth,
        contentHeight,
        margin,
        quality: options.quality || 90
      })
    } else {
      // Original: One image per page
      await this.createSingleImagePages(pdfDoc, sortedImages, {
        pageWidth,
        pageHeight,
        contentWidth,
        contentHeight,
        margin,
        quality: options.quality || 90
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

    const pageCount = imagesPerPage === 2 ? Math.ceil(sortedImages.length / 2) : sortedImages.length

    return {
      originalFiles: sortedImages.map(img => img.name),
      pdfName: pdfFileName,
      outputPath,
      pageCount,
      fileSize: pdfBytes.length,
    }
  }

  private async createSingleImagePages(
    pdfDoc: PDFDocument,
    sortedImages: { buffer: Buffer; name: string; order: number }[],
    config: { pageWidth: number; pageHeight: number; contentWidth: number; contentHeight: number; margin: number; quality: number }
  ): Promise<void> {
    for (let i = 0; i < sortedImages.length; i++) {
      const imageData = sortedImages[i]
      const processedBuffer = await sharp(imageData.buffer)
        .jpeg({ quality: config.quality })
        .toBuffer()

      const metadata = await sharp(processedBuffer).metadata()
      const imgWidth = metadata.width || 0
      const imgHeight = metadata.height || 0

      const scaleX = config.contentWidth / imgWidth
      const scaleY = config.contentHeight / imgHeight
      const scale = Math.min(scaleX, scaleY, 1)

      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale

      const x = config.margin + (config.contentWidth - scaledWidth) / 2
      const y = config.margin + (config.contentHeight - scaledHeight) / 2

      const page = pdfDoc.addPage([config.pageWidth, config.pageHeight])
      const image = await pdfDoc.embedJpg(processedBuffer)

      page.drawImage(image, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
      })

      page.drawText(`${i + 1}`, {
        x: config.pageWidth - config.margin - 20,
        y: config.margin - 20,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      })
    }
  }

  private async createSideBySidePages(
    pdfDoc: PDFDocument,
    sortedImages: { buffer: Buffer; name: string; order: number }[],
    config: { pageWidth: number; pageHeight: number; contentWidth: number; contentHeight: number; margin: number; quality: number }
  ): Promise<void> {
    const gap = 10 // Gap between two images
    const halfWidth = (config.contentWidth - gap) / 2

    for (let i = 0; i < sortedImages.length; i += 2) {
      const page = pdfDoc.addPage([config.pageWidth, config.pageHeight])
      
      // First image (left side)
      const firstImage = sortedImages[i]
      if (firstImage) {
        const processedBuffer1 = await sharp(firstImage.buffer)
          .jpeg({ quality: config.quality })
          .toBuffer()

        const metadata1 = await sharp(processedBuffer1).metadata()
        const imgWidth1 = metadata1.width || 0
        const imgHeight1 = metadata1.height || 0

        const scaleX1 = halfWidth / imgWidth1
        const scaleY1 = config.contentHeight / imgHeight1
        const scale1 = Math.min(scaleX1, scaleY1, 1)

        const scaledWidth1 = imgWidth1 * scale1
        const scaledHeight1 = imgHeight1 * scale1

        const x1 = config.margin + (halfWidth - scaledWidth1) / 2
        // Position at top of page (pageHeight - margin - scaledHeight)
        const y1 = config.pageHeight - config.margin - scaledHeight1

        const image1 = await pdfDoc.embedJpg(processedBuffer1)
        page.drawImage(image1, {
          x: x1,
          y: y1,
          width: scaledWidth1,
          height: scaledHeight1,
        })
      }

      // Second image (right side)
      const secondImage = sortedImages[i + 1]
      if (secondImage) {
        const processedBuffer2 = await sharp(secondImage.buffer)
          .jpeg({ quality: config.quality })
          .toBuffer()

        const metadata2 = await sharp(processedBuffer2).metadata()
        const imgWidth2 = metadata2.width || 0
        const imgHeight2 = metadata2.height || 0

        const scaleX2 = halfWidth / imgWidth2
        const scaleY2 = config.contentHeight / imgHeight2
        const scale2 = Math.min(scaleX2, scaleY2, 1)

        const scaledWidth2 = imgWidth2 * scale2
        const scaledHeight2 = imgHeight2 * scale2

        const x2 = config.margin + halfWidth + gap + (halfWidth - scaledWidth2) / 2
        // Position at top of page (pageHeight - margin - scaledHeight)
        const y2 = config.pageHeight - config.margin - scaledHeight2

        const image2 = await pdfDoc.embedJpg(processedBuffer2)
        page.drawImage(image2, {
          x: x2,
          y: y2,
          width: scaledWidth2,
          height: scaledHeight2,
        })
      }

      // Add page number
      const pageNum = Math.floor(i / 2) + 1
      page.drawText(`${pageNum}`, {
        x: config.pageWidth - config.margin - 20,
        y: config.margin - 20,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      })
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
