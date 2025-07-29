'use client'

import { useState } from 'react'

// Simple icon components
const Download = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7,10 12,15 17,10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
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

const Archive = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="21,8 21,21 3,21 3,8"></polyline>
    <rect x="1" y="3" width="22" height="5"></rect>
    <line x1="10" y1="12" x2="14" y2="12"></line>
  </svg>
)

const RotateCcw = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="1,4 1,10 7,10"></polyline>
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
  </svg>
)

const Share2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="18" cy="5" r="3"></circle>
    <circle cx="6" cy="12" r="3"></circle>
    <circle cx="18" cy="19" r="3"></circle>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
  </svg>
)

interface ResultsViewProps {
  files: Array<string | {
    fileName: string
    originalSize?: number
    processedSize?: number
    compressionRatio?: number
    dimensions?: { width: number; height: number }
    format?: string
    pageCount?: number
  }>
  onStartNew: () => void
  isCleaningUp?: boolean
}

export default function ResultsView({ files, onStartNew, isCleaningUp = false }: ResultsViewProps) {
  type FileType = typeof files[0]
  
  // State to track image loading errors for each file
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({})
  
  const handleImageError = (fileName: string) => {
    setImageErrors(prev => ({ ...prev, [fileName]: true }))
  }
  
  const handleImageLoad = (fileName: string) => {
    setImageErrors(prev => ({ ...prev, [fileName]: false }))
  }

  const getFileName = (file: FileType): string => {
    return typeof file === 'string' ? file : file.fileName
  }

  const getFileSize = (file: FileType): string => {
    if (typeof file === 'string') {
      return 'Calculating...'
    }
    if (file.processedSize) {
      return formatFileSize(file.processedSize)
    }
    return 'Calculating...'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const calculateSummaryStats = () => {
    let totalOriginalSize = 0
    let totalProcessedSize = 0
    let filesWithSizeData = 0
    let totalSpaceSaved = 0

    files.forEach(file => {
      if (typeof file === 'object' && file.originalSize && file.processedSize) {
        totalOriginalSize += file.originalSize
        totalProcessedSize += file.processedSize
        totalSpaceSaved += (file.originalSize - file.processedSize)
        filesWithSizeData++
      }
    })

    const averageReduction = filesWithSizeData > 0 
      ? ((totalOriginalSize - totalProcessedSize) / totalOriginalSize * 100)
      : 0

    return {
      filesProcessed: files.length,
      averageReduction: averageReduction > 0 ? averageReduction.toFixed(1) + '%' : 'N/A',
      totalSize: totalProcessedSize > 0 ? formatFileSize(totalProcessedSize) : 'N/A',
      spaceSaved: totalSpaceSaved > 0 ? formatFileSize(totalSpaceSaved) : 'N/A',
      hasCompressionData: filesWithSizeData > 0
    }
  }

  const summaryStats = calculateSummaryStats()

  const handleDownload = (file: FileType) => {
    const fileName = getFileName(file)
    // Create download link
    const link = document.createElement('a')
    link.href = `/api/download/${fileName}`
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadAll = async () => {
    try {
      const fileNames = files.map(getFileName)
      const response = await fetch('/api/download-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileNames })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'processed-images.zip'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const formatFileName = (file: FileType): string => {
    const fileName = getFileName(file)
    // The filename now contains meaningful information, so we can display it as-is
    // Just remove the unique ID suffix for cleaner display
    return fileName.replace(/_[a-f0-9]{8}\./i, '.')
  }

  const getFileExtension = (file: FileType): string => {
    const fileName = getFileName(file)
    return fileName.split('.').pop()?.toUpperCase() || 'UNKNOWN'
  }



  return (
    <div className="card">
      <div className="text-center mb-8">
        <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <FileImage className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Processing Complete!
        </h2>
        <p className="text-gray-600">
          Your {files.length} image{files.length !== 1 ? 's have' : ' has'} been successfully processed.
        </p>
      </div>

      {/* Results Grid */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Processed Files ({files.length})
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={handleDownloadAll}
              className="btn-secondary flex items-center"
            >
              <Archive className="w-4 h-4 mr-2" />
              Download All (ZIP)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file, index) => {
            const fileName = getFileName(file)
            const hasError = imageErrors[fileName] || false
            
            return (
              <div
                key={fileName}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* File Preview */}
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {!hasError ? (
                    <img
                      src={`/api/preview/${encodeURIComponent(fileName)}`}
                      alt={formatFileName(file)}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(fileName)}
                      onLoad={() => handleImageLoad(fileName)}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <FileImage className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-1 truncate">
                    {formatFileName(file)}
                  </h4>
                  <p className="text-sm text-gray-500 mb-3">
                    Format: {getFileExtension(file)} • Size: {getFileSize(file)}
                  </p>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(file)}
                      className="flex-1 btn-primary text-sm py-2"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </button>
                    <button className="btn-secondary text-sm py-2 px-3">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Processing Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-600">{summaryStats.filesProcessed}</div>
            <div className="text-sm text-gray-500">Files Processed</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${summaryStats.hasCompressionData ? 'text-green-600' : 'text-gray-400'}`}>
              {summaryStats.averageReduction}
            </div>
            <div className="text-sm text-gray-500">Size Reduction</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${summaryStats.hasCompressionData ? 'text-blue-600' : 'text-gray-400'}`}>
              {summaryStats.totalSize}
            </div>
            <div className="text-sm text-gray-500">Total Size</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${summaryStats.hasCompressionData ? 'text-purple-600' : 'text-gray-400'}`}>
              {summaryStats.spaceSaved}
            </div>
            <div className="text-sm text-gray-500">Space Saved</div>
          </div>
        </div>
        {!summaryStats.hasCompressionData && (
          <div className="mt-3 text-sm text-gray-500 text-center">
            Detailed metrics available for files with compression data
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onStartNew}
          disabled={isCleaningUp}
          className={`flex-1 btn-primary flex items-center justify-center ${
            isCleaningUp ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <RotateCcw className={`w-5 h-5 mr-2 ${isCleaningUp ? 'animate-spin' : ''}`} />
          {isCleaningUp ? 'Cleaning up...' : 'Process More Images'}
        </button>
        <button
          onClick={handleDownloadAll}
          className="flex-1 btn-secondary flex items-center justify-center"
        >
          <Archive className="w-5 h-5 mr-2" />
          Download All as ZIP
        </button>
      </div>

      {/* Additional Options */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">What&apos;s Next?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <FileImage className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Convert Format</h4>
            <p className="text-sm text-gray-600">Convert to different image formats</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Archive className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Batch Process</h4>
            <p className="text-sm text-gray-600">Process multiple images at once</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Share2 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Share & Collaborate</h4>
            <p className="text-sm text-gray-600">Share your processed images</p>
          </div>
        </div>
      </div>
    </div>
  )
}
