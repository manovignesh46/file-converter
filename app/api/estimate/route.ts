import { NextRequest, NextResponse } from 'next/server'
import { ImageCompressionService } from '../../../services/imageCompressionService'
import { ImageResizeService } from '../../../services/imageResizeService'
import { ImageToPdfService } from '../../../services/imageToPdfService'
import { FormatConversionService } from '../../../services/formatConversionService'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    const optionsStr = formData.get('options') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const options = JSON.parse(optionsStr)
    const buffer = Buffer.from(await file.arrayBuffer())

    let estimatedSize = 0

    switch (options.operation) {
      case 'compress':
        const compressionService = new ImageCompressionService()
        estimatedSize = await compressionService.estimateCompressedSize(buffer, {
          quality: options.compressionQuality,
          targetSize: options.targetSize,
          targetSizeUnit: options.targetSizeUnit,
          outputFormat: options.outputFormat,
        })
        break

      case 'resize':
        const resizeService = new ImageResizeService()
        const resizeEstimate = await resizeService.estimateResizedSize(buffer, {
          width: options.resizeWidth,
          height: options.resizeHeight,
          maintainAspectRatio: options.maintainAspectRatio,
          cropToFit: options.cropToFit,
          outputFormat: options.outputFormat,
        })
        estimatedSize = resizeEstimate.estimatedSize
        break

      case 'convert':
        const conversionService = new FormatConversionService()
        estimatedSize = await conversionService.estimateConvertedSize(buffer, {
          outputFormat: options.outputFormat,
          quality: options.compressionQuality,
        })
        break

      case 'pdf':
        const pdfService = new ImageToPdfService()
        estimatedSize = await pdfService.estimatePdfSize([{ buffer, name: file.name }], {
          quality: options.compressionQuality || 90,
        })
        break

      case 'watermark':
        // Watermark doesn't significantly change size
        estimatedSize = buffer.length
        break

      default:
        estimatedSize = buffer.length
    }

    return NextResponse.json({
      estimatedSize,
      originalSize: buffer.length,
      compressionRatio: Math.round((1 - estimatedSize / buffer.length) * 100),
    })

  } catch (error) {
    console.error('Estimation error:', error)
    return NextResponse.json(
      { error: 'Failed to estimate size' },
      { status: 500 }
    )
  }
}
