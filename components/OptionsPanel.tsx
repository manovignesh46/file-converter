'use client'

import { useState, useEffect, useCallback } from 'react'
import { ConversionOptions } from '../types'

// Simple icon components as fallbacks
const Settings = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M12 1v6m0 6v6"></path>
    <path d="m15.5 5.5-3 3-3-3"></path>
    <path d="m15.5 18.5-3-3-3 3"></path>
  </svg>
)

const Zap = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"></polygon>
  </svg>
)

const Resize = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
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

const Type = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="4,7 4,4 20,4 20,7"></polyline>
    <line x1="9" y1="20" x2="15" y2="20"></line>
    <line x1="12" y1="4" x2="12" y2="20"></line>
  </svg>
)

const FileMinus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
    <line x1="8" y1="14" x2="16" y2="14"></line>
  </svg>
)

interface OptionsPanelProps {
  options: ConversionOptions
  onOptionsChange: (options: ConversionOptions) => void
  onProcess: () => void
  canProcess: boolean
  images: Array<{ id: string; file: File; preview: string; order: number; estimatedSize?: number; originalSize: number; isPdf?: boolean }>
}

export default function OptionsPanel({ options, onOptionsChange, onProcess, canProcess, images }: OptionsPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Analyze uploaded file types
  const fileTypes = {
    hasImages: images.some(img => img.file.type.startsWith('image/')),
    hasPDFs: images.some(img => img.file.type === 'application/pdf' || img.isPdf),
    imageCount: images.filter(img => img.file.type.startsWith('image/')).length,
    pdfCount: images.filter(img => img.file.type === 'application/pdf' || img.isPdf).length,
  }

  // Generate contextual operations based on uploaded files
  const getAvailableOperations = () => {
    const operations = []

    if (fileTypes.hasImages) {
      operations.push(
        { value: 'compress', label: 'Compress', desc: 'Reduce file size', icon: Zap },
        { value: 'resize', label: 'Resize', desc: 'Change dimensions', icon: Resize },
        { value: 'convert', label: 'Convert', desc: 'Change format or convert to PDF', icon: FileImage },
        { value: 'watermark', label: 'Watermark', desc: 'Add watermark', icon: Type }
      )
    }

    if (fileTypes.hasPDFs) {
      operations.push(
        { value: 'pdf-compress', label: 'Compress', desc: 'Reduce PDF file size', icon: FileMinus }
      )
    }

    if (fileTypes.hasImages && fileTypes.imageCount > 1) {
      operations.push(
        { value: 'pdf', label: 'Combine to PDF', desc: 'Merge images into PDF', icon: FileImage }
      )
    }

    return operations
  }

  const availableOperations = getAvailableOperations()

  // Move updateOption before useEffect and wrap with useCallback
  const updateOption = useCallback((key: keyof ConversionOptions, value: any) => {
    const updatedOptions = { ...options, [key]: value }
    
    // Set default values when operation changes
    if (key === 'operation') {
      if (value === 'convert' && !options.outputFormat) {
        updatedOptions.outputFormat = 'jpg'
      }
      if (value === 'watermark' && !options.watermarkPosition) {
        updatedOptions.watermarkPosition = 'bottom-right'
      }
      if (value === 'watermark' && !options.watermarkColor) {
        updatedOptions.watermarkColor = '#ffffff'
      }
      if (value === 'watermark' && !options.watermarkText) {
        updatedOptions.watermarkText = 'Sample Watermark'
      }
    }
    
    onOptionsChange(updatedOptions)
  }, [options, onOptionsChange])

  // Auto-select operation based on file types when files change
  useEffect(() => {
    if (images.length > 0 && availableOperations.length > 0) {
      // Only auto-select if no operation is currently selected or if the current operation is not available
      const currentOperationAvailable = availableOperations.some(op => op.value === options.operation)
      
      if (!options.operation || !currentOperationAvailable) {
        // Smart default selection
        if (fileTypes.hasPDFs && !fileTypes.hasImages) {
          // Only PDFs -> select compress
          updateOption('operation', 'pdf-compress')
        } else if (fileTypes.hasImages && !fileTypes.hasPDFs) {
          // Only images -> select compress as default
          updateOption('operation', 'compress')
        } else if (fileTypes.hasImages && fileTypes.hasPDFs) {
          // Mixed files -> select compress as default
          updateOption('operation', 'compress')
        }
      }
    }
  }, [images.length, fileTypes.hasImages, fileTypes.hasPDFs, availableOperations, options.operation, updateOption])

  return (
    <div className="card sticky top-4 h-fit">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Processing Options</h2>
        <p className="text-sm sm:text-base text-gray-600">Choose how you want to process your images</p>
      </div>

      {images.length > 0 ? (
        <>
          {/* Operation Type */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Operation Type
            </label>
            
            {/* File type indicator */}
            {images.length > 0 && (
              <div className="mb-3 text-xs sm:text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">
                {fileTypes.hasImages && fileTypes.hasPDFs 
                  ? `${fileTypes.imageCount} image(s) and ${fileTypes.pdfCount} PDF(s) selected`
                  : fileTypes.hasImages 
                    ? `${fileTypes.imageCount} image(s) selected`
                    : `${fileTypes.pdfCount} PDF(s) selected`
                }
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {availableOperations.map((op) => {
                const IconComponent = op.icon || Settings

                return (
                  <button
                    key={op.value}
                    onClick={() => updateOption('operation', op.value)}
                    className={`flex items-center p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                      options.operation === op.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0 ${
                      options.operation === op.value ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <div className={`font-medium text-sm sm:text-base ${
                        options.operation === op.value ? 'text-primary-900' : 'text-gray-900'
                      }`}>
                        {op.label}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {op.desc}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Compression Options */}
          {options.operation === 'compress' && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Compression Settings</h3>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality: {options.compressionQuality}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={options.compressionQuality || 80}
                    onChange={(e) => updateOption('compressionQuality', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Smallest</span>
                    <span>Best Quality</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="targetSize"
                    checked={!!options.targetSize}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        updateOption('targetSize', undefined)
                        updateOption('targetSizeUnit', undefined)
                      } else {
                        updateOption('targetSize', 500)
                        updateOption('targetSizeUnit', 'KB')
                      }
                    }}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <label htmlFor="targetSize" className="text-xs sm:text-sm text-gray-700 cursor-pointer">
                    Target specific size
                  </label>
                </div>

                {options.targetSize && (
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={options.targetSize}
                      onChange={(e) => updateOption('targetSize', parseInt(e.target.value))}
                      className="input-field flex-1 text-sm"
                      min="1"
                      placeholder="Size"
                    />
                    <select
                      value={options.targetSizeUnit}
                      onChange={(e) => updateOption('targetSizeUnit', e.target.value)}
                      className="input-field text-sm w-20"
                    >
                      <option value="KB">KB</option>
                      <option value="MB">MB</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PDF Compression Options */}
          {options.operation === 'pdf-compress' && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">PDF Compression Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality: {options.compressionQuality || 75}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={options.compressionQuality || 75}
                    onChange={(e) => updateOption('compressionQuality', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Smallest File</span>
                    <span>Best Quality</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pdfTargetSize"
                    checked={!!options.targetSize}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateOption('targetSize', 1)
                        updateOption('targetSizeUnit', 'MB')
                      } else {
                        updateOption('targetSize', undefined)
                        updateOption('targetSizeUnit', undefined)
                      }
                    }}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <label htmlFor="pdfTargetSize" className="text-sm text-gray-700 cursor-pointer">
                    Target file size
                  </label>
                </div>

                {options.targetSize && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={options.targetSize || 1}
                        onChange={(e) => updateOption('targetSize', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <select
                        value={options.targetSizeUnit || 'MB'}
                        onChange={(e) => updateOption('targetSizeUnit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="KB">KB</option>
                        <option value="MB">MB</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="optimizeImages"
                    checked={options.optimizeImages || false}
                    onChange={(e) => updateOption('optimizeImages', e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <label htmlFor="optimizeImages" className="text-sm text-gray-700 cursor-pointer">
                    Optimize embedded images
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Resize Options */}
          {options.operation === 'resize' && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Resize Settings</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      value={options.resizeWidth || ''}
                      onChange={(e) => updateOption('resizeWidth', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="input-field"
                      placeholder="Auto"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      value={options.resizeHeight || ''}
                      onChange={(e) => updateOption('resizeHeight', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="input-field"
                      placeholder="Auto"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="maintainAspect"
                    checked={options.maintainAspectRatio !== false}
                    onChange={(e) => updateOption('maintainAspectRatio', e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <label htmlFor="maintainAspect" className="text-sm text-gray-700 cursor-pointer">
                    Maintain aspect ratio
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="cropToFit"
                    checked={options.cropToFit || false}
                    onChange={(e) => updateOption('cropToFit', e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <label htmlFor="cropToFit" className="text-sm text-gray-700 cursor-pointer">
                    Crop to fit (instead of letterbox)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Format Conversion Options */}
          {options.operation === 'convert' && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Format Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format
                </label>
                <select
                  value={options.outputFormat || 'jpg'}
                  onChange={(e) => updateOption('outputFormat', e.target.value)}
                  className="input-field"
                >
                  <option value="jpg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                  {fileTypes.hasImages && (
                    <option value="pdf">PDF (Convert images to PDF)</option>
                  )}
                </select>
              </div>

              {/* PDF specific options when converting to PDF */}
              {options.outputFormat === 'pdf' && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Layout
                    </label>
                    <select
                      value={options.pdfLayout || 'fit'}
                      onChange={(e) => updateOption('pdfLayout', e.target.value)}
                      className="input-field"
                    >
                      <option value="fit">Fit to page</option>
                      <option value="original">Original size</option>
                      <option value="fill">Fill page</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Size
                    </label>
                    <select
                      value={options.pdfPageSize || 'A4'}
                      onChange={(e) => updateOption('pdfPageSize', e.target.value)}
                      className="input-field"
                    >
                      <option value="A4">A4</option>
                      <option value="Letter">Letter</option>
                      <option value="Legal">Legal</option>
                      <option value="A3">A3</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Watermark Options */}
          {options.operation === 'watermark' && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Watermark Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Watermark Text
                  </label>
                  <input
                    type="text"
                    value={options.watermarkText || ''}
                    onChange={(e) => updateOption('watermarkText', e.target.value)}
                    className="input-field"
                    placeholder="Enter watermark text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <select
                    value={options.watermarkPosition || 'bottom-right'}
                    onChange={(e) => updateOption('watermarkPosition', e.target.value)}
                    className="input-field"
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="center">Center</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={options.watermarkColor || '#ffffff'}
                      onChange={(e) => updateOption('watermarkColor', e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={options.watermarkColor || '#ffffff'}
                      onChange={(e) => updateOption('watermarkColor', e.target.value)}
                      className="input-field flex-1"
                      placeholder="#ffffff"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Choose color or enter hex code (e.g., #ffffff for white)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Options */}
          <div className="mb-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Settings className="w-4 h-4 mr-1" />
              Advanced Options
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="removeMetadata"
                    checked={options.removeMetadata || false}
                    onChange={(e) => updateOption('removeMetadata', e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <label htmlFor="removeMetadata" className="text-sm text-gray-700 cursor-pointer">
                    Remove metadata (EXIF/GPS data)
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Process Button */}
          <button
            onClick={onProcess}
            disabled={!canProcess}
            className={`w-full py-3 sm:py-4 px-4 rounded-lg font-medium transition-all text-sm sm:text-base ${
              canProcess
                ? 'bg-primary-500 hover:bg-primary-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-center">
              {(() => {
                let IconComponent = Settings
                if (options.operation === 'compress') IconComponent = Zap
                if (options.operation === 'resize') IconComponent = Resize
                if (options.operation === 'convert') IconComponent = FileImage
                if (options.operation === 'pdf') IconComponent = FileImage
                if (options.operation === 'pdf-compress') IconComponent = FileMinus
                if (options.operation === 'watermark') IconComponent = Type
                return <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              })()}
              {options.operation === 'pdf-compress' ? 'Process PDFs' : 'Process Images'}
            </div>
          </button>

          {!canProcess && (
            <p className="text-xs sm:text-sm text-gray-500 text-center mt-2">
              Upload images to start processing
            </p>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <FileImage className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Files Selected</h3>
          <p>Upload files to see processing options</p>
        </div>
      )}
    </div>
  )
}
