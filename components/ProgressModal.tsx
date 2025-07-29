'use client'

import { JobProgress } from '../types'

// Simple icon components
const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22,4 12,14.01 9,11.01"></polyline>
  </svg>
)

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
)

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M21 12a9 9 0 11-6.219-8.56"></path>
  </svg>
)

interface ProgressModalProps {
  job: JobProgress
  onClose: () => void
}

export default function ProgressModal({ job, onClose }: ProgressModalProps) {
  const handleDownloadFile = (file: string) => {
    const link = document.createElement('a')
    link.href = `/api/download/${file}`
    link.download = file
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadAll = () => {
    if (job.outputFiles && job.outputFiles.length > 0) {
      const link = document.createElement('a')
      link.href = `/api/download-all?files=${job.outputFiles.join(',')}`
      link.download = 'processed-images.zip'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
  const getStatusIcon = () => {
    switch (job.status) {
      case 'processing':
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />
      default:
        return <Loader2 className="w-6 h-6 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (job.status) {
      case 'processing':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Processing Images</h2>
            {job.status !== 'processing' && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center mb-4">
            {getStatusIcon()}
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {job.status === 'processing' && 'Processing...'}
                {job.status === 'completed' && 'Completed Successfully!'}
                {job.status === 'error' && 'Processing Failed'}
                {job.status === 'pending' && 'Preparing...'}
              </p>
              <p className="text-sm text-gray-500">{job.message}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{job.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>

          {/* Processing Steps */}
          {job.status === 'processing' && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Processing Steps</h3>
              <div className="space-y-2">
                {[
                  { step: 'Uploading files', completed: job.progress > 20 },
                  { step: 'Processing images', completed: job.progress > 60 },
                  { step: 'Generating output', completed: job.progress > 90 },
                  { step: 'Finalizing', completed: job.progress >= 100 },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center text-sm ${
                      item.completed ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {item.completed ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <div className="w-4 h-4 mr-2 border-2 border-gray-300 rounded-full" />
                    )}
                    {item.step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output Files */}
          {job.status === 'completed' && job.outputFiles && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Output Files ({job.outputFiles.length})
              </h3>
              <div className="space-y-2">
                {job.outputFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-700 truncate">{file}</span>
                    <button 
                      onClick={() => handleDownloadFile(file)}
                      className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Details */}
          {job.status === 'error' && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">
                Something went wrong while processing your images. Please try again with different settings or contact support if the problem persists.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            {job.status === 'completed' && (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 btn-primary"
                >
                  View Results
                </button>
                <button 
                  onClick={handleDownloadAll}
                  className="flex-1 btn-secondary"
                >
                  Download All
                </button>
              </>
            )}
            
            {job.status === 'error' && (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 btn-secondary"
                >
                  Close
                </button>
                <button className="flex-1 btn-primary">
                  Try Again
                </button>
              </>
            )}

            {job.status === 'processing' && (
              <button className="w-full btn-secondary" disabled>
                Processing... Please wait
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
