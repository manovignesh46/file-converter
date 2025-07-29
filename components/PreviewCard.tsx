'use client'

import { ImageFile, ConversionOptions } from '../types'

// Simple icon components
const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const FileImage = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
    <circle cx="10" cy="13" r="2"></circle>
    <path d="m20 17-1.1-1.1a2 2 0 0 0-2.83.02L14 18"></path>
  </svg>
)

const FileText = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10,9 9,9 8,9"></polyline>
  </svg>
)

interface PreviewCardProps {
  image: ImageFile
  onRemove: (id: string) => void
  options: ConversionOptions
}

export default function PreviewCard({ image, onRemove, options }: PreviewCardProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCompressionRatio = (): number => {
    if (!image.estimatedSize) return 0
    return Math.round((1 - image.estimatedSize / image.originalSize) * 100)
  }

  const getCompressionColor = (): string => {
    const ratio = getCompressionRatio()
    if (ratio >= 50) return 'text-green-600'
    if (ratio >= 25) return 'text-yellow-600'
    if (ratio >= 0) return 'text-blue-600'
    return 'text-red-600'
  }

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-200">
      {/* Image/PDF Preview */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {image.isPdf ? (
          <div className="w-full h-full flex items-center justify-center bg-red-50">
            <div className="text-center">
              <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-red-600 mx-auto mb-1 sm:mb-2" />
              <span className="text-xs text-red-600 font-medium">PDF</span>
            </div>
          </div>
        ) : (
          <img
            src={image.preview}
            alt={image.file.name}
            className="w-full h-full object-cover"
            onLoad={() => URL.revokeObjectURL(image.preview)}
          />
        )}
        
        {/* Remove Button */}
        <button
          onClick={() => onRemove(image.id)}
          className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 sm:p-1.5 
                     opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 touch-manipulation"
          title="Remove image"
        >
          <X className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>

        {/* Order Badge */}
        <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-primary-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 
                        rounded-full font-medium">
          #{image.order + 1}
        </div>
      </div>

      {/* File Info */}
      <div className="p-2 sm:p-3">
        <div className="mb-1 sm:mb-2">
          <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate" title={image.file.name}>
            {image.file.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {image.file.type} • {formatFileSize(image.originalSize)}
          </p>
        </div>

        {/* Size Comparison */}
        {image.estimatedSize && image.estimatedSize !== image.originalSize && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Original:</span>
              <span className="font-medium">{formatFileSize(image.originalSize)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Estimated:</span>
              <span className="font-medium text-primary-600">
                {formatFileSize(image.estimatedSize)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Compression:</span>
              <span className={`font-medium ${getCompressionColor()}`}>
                {getCompressionRatio() >= 0 ? '-' : '+'}{Math.abs(getCompressionRatio())}%
              </span>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {options.operation && (
          <div className="mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <FileImage className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="capitalize truncate">{options.operation}</span>
              {options.operation === 'compress' && options.compressionQuality && (
                <span className="ml-1 text-xs">({options.compressionQuality}%)</span>
              )}
              {options.operation === 'resize' && (options.resizeWidth || options.resizeHeight) && (
                <span className="ml-1 text-xs truncate">
                  ({options.resizeWidth || '?'} × {options.resizeHeight || '?'})
                </span>
              )}
              {options.operation === 'convert' && options.outputFormat && (
                <span className="ml-1 text-xs uppercase">→ {options.outputFormat}</span>
              )}
            </div>
          </div>
        )}

        {/* Progress Bar Placeholder */}
        <div className="mt-1 sm:mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full transition-all duration-300" style={{ width: '0%' }} />
        </div>
      </div>
    </div>
  )
}
