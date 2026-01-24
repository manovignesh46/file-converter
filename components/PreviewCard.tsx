'use client'

import { ImageFile, ConversionOptions } from '../types'

// Modern icon components
const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const FileImage = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const FileText = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const Tag = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
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
    if (ratio >= 50) return 'text-green-600 bg-green-50'
    if (ratio >= 25) return 'text-yellow-600 bg-yellow-50'
    if (ratio >= 0) return 'text-blue-600 bg-blue-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="relative group h-full flex flex-col">
      {/* Image/PDF Preview */}
      <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden border-b border-gray-100">
        {image.isPdf ? (
          <div className="w-full h-full flex items-center justify-center bg-red-50/50 group-hover:bg-red-50 transition-colors">
            <div className="text-center transform transition-transform group-hover:scale-110 duration-300">
              <FileText className="w-12 h-12 text-red-500 mx-auto mb-2 drop-shadow-sm" />
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">PDF Document</span>
            </div>
          </div>
        ) : (
          <img
            src={image.preview}
            alt={image.file.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onLoad={() => URL.revokeObjectURL(image.preview)}
          />
        )}
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-start justify-end p-2">
           <button
            onClick={() => onRemove(image.id)}
            className="bg-white/90 backdrop-blur hover:bg-red-500 hover:text-white text-gray-700 rounded-full p-2 transition-all duration-200 shadow-sm"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Badge */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur shadow-sm text-gray-700 text-xs px-2 py-1 rounded-md font-bold border border-gray-200">
          #{image.order + 1}
        </div>
      </div>

      {/* File Info */}
      <div className="p-3 flex-1 flex flex-col justify-between bg-white">
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate" title={image.file.name}>
            {image.file.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {image.file.type.split('/')[1]?.toUpperCase() || 'FILE'} • {formatFileSize(image.originalSize)}
          </p>
        </div>

        {/* Size Comparison */}
        {image.estimatedSize && image.estimatedSize !== image.originalSize && (
          <div className="space-y-2 mt-2 pt-2 border-t border-gray-50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Estimated</span>
              <span className="font-semibold text-gray-700">
                {formatFileSize(image.estimatedSize)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Savings</span>
              <span className={`font-bold px-1.5 py-0.5 rounded ${getCompressionColor()}`}>
                {getCompressionRatio() >= 0 ? '↓' : '↑'}{Math.abs(getCompressionRatio())}%
              </span>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {options.operation && (
          <div className="mt-2 pt-2 border-t border-gray-50">
             <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                <span className="truncate max-w-[80px]">{options.operation.replace('-', ' ')}</span>
                {options.compressionQuality && <span>{options.compressionQuality}% Q</span>}
                {options.outputFormat && <span>TO {options.outputFormat}</span>}
             </div>
          </div>
        )}
      </div>
    </div>
  )
}
