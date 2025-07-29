export interface ImageFile {
  id: string
  file: File
  preview: string
  order: number
  estimatedSize?: number
  originalSize: number
}

export interface ConversionOptions {
  operation: 'compress' | 'resize' | 'convert' | 'pdf' | 'watermark'
  compressionQuality?: number
  targetSize?: number
  targetSizeUnit?: 'KB' | 'MB'
  resizeWidth?: number
  resizeHeight?: number
  maintainAspectRatio?: boolean
  cropToFit?: boolean
  outputFormat?: 'jpg' | 'png' | 'webp'
  removeMetadata?: boolean
  watermarkText?: string
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
}

export interface JobProgress {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  message: string
  outputFiles?: string[]
}
