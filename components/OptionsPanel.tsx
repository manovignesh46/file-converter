'use client'

import { useState } from 'react'
import { ConversionOptions } from '../app/page'

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

interface OptionsPanelProps {
  options: ConversionOptions
  onOptionsChange: (options: ConversionOptions) => void
  onProcess: () => void
  canProcess: boolean
}

export default function OptionsPanel({ options, onOptionsChange, onProcess, canProcess }: OptionsPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateOption = (key: keyof ConversionOptions, value: any) => {
    const updatedOptions = { ...options, [key]: value }
    
    // Set default values when operation changes
    if (key === 'operation') {
      if (value === 'convert' && !options.outputFormat) {
        updatedOptions.outputFormat = 'jpg'
      }
    }
    
    onOptionsChange(updatedOptions)
  }

  return (
    <div className="card sticky top-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Options</h2>
        <p className="text-gray-600">Choose how you want to process your images</p>
      </div>

      {/* Operation Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Operation Type
        </label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { value: 'compress', label: 'Compress', desc: 'Reduce file size' },
            { value: 'resize', label: 'Resize', desc: 'Change dimensions' },
            { value: 'convert', label: 'Convert', desc: 'Change format' },
            { value: 'pdf', label: 'PDF', desc: 'Combine to PDF' },
            { value: 'watermark', label: 'Watermark', desc: 'Add watermark' },
          ].map((op) => {
            let IconComponent = Settings
            if (op.value === 'compress') IconComponent = Zap
            if (op.value === 'resize') IconComponent = Resize
            if (op.value === 'convert') IconComponent = FileImage
            if (op.value === 'pdf') IconComponent = FileImage
            if (op.value === 'watermark') IconComponent = Type

            return (
              <button
                key={op.value}
                onClick={() => updateOption('operation', op.value)}
                className={`flex items-center p-3 rounded-lg border-2 transition-all text-left ${
                  options.operation === op.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <IconComponent className={`w-5 h-5 mr-3 ${
                  options.operation === op.value ? 'text-primary-600' : 'text-gray-400'
                }`} />
                <div>
                  <div className={`font-medium ${
                    options.operation === op.value ? 'text-primary-900' : 'text-gray-900'
                  }`}>
                    {op.label}
                  </div>
                  <div className="text-sm text-gray-500">{op.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Compression Options */}
      {options.operation === 'compress' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Compression Settings</h3>
          
          <div className="space-y-4">
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
                className="w-full"
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
                className="rounded"
              />
              <label htmlFor="targetSize" className="text-sm text-gray-700">
                Target specific size
              </label>
            </div>

            {options.targetSize && (
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={options.targetSize}
                  onChange={(e) => updateOption('targetSize', parseInt(e.target.value))}
                  className="input-field flex-1"
                  min="1"
                />
                <select
                  value={options.targetSizeUnit}
                  onChange={(e) => updateOption('targetSizeUnit', e.target.value)}
                  className="input-field"
                >
                  <option value="KB">KB</option>
                  <option value="MB">MB</option>
                </select>
              </div>
            )}
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
                className="rounded"
              />
              <label htmlFor="maintainAspect" className="text-sm text-gray-700">
                Maintain aspect ratio
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="cropToFit"
                checked={options.cropToFit || false}
                onChange={(e) => updateOption('cropToFit', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="cropToFit" className="text-sm text-gray-700">
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
            </select>
          </div>
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
                className="rounded"
              />
              <label htmlFor="removeMetadata" className="text-sm text-gray-700">
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
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
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
            if (options.operation === 'watermark') IconComponent = Type
            return <IconComponent className="w-5 h-5 mr-2" />
          })()}
          Process Images
        </div>
      </button>

      {!canProcess && (
        <p className="text-sm text-gray-500 text-center mt-2">
          Upload images to start processing
        </p>
      )}
    </div>
  )
}
