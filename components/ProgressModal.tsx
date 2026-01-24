'use client'

import { useEffect } from 'react'
import { JobProgress } from '../types'

// Modern icon components
const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

interface ProgressModalProps {
  job: JobProgress
  onClose: () => void
}

export default function ProgressModal({ job, onClose }: ProgressModalProps) {
  // Handle Escape key to close modal (only if not processing)
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && job.status !== 'processing') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [job.status, onClose])

  const getStatusIcon = () => {
    switch (job.status) {
      case 'processing':
        return <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500 animate-bounce-light" />
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />
      default:
        return <Loader2 className="w-8 h-8 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (job.status) {
      case 'processing':
        return 'bg-gradient-to-r from-primary-500 to-indigo-500'
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md sm:max-w-lg w-full overflow-hidden transform transition-all animate-scale-in border border-white/20">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {job.status === 'processing' && <Sparkles className="w-5 h-5 text-primary-500" />}
              {job.status === 'completed' ? 'Success!' : 'Processing Files'}
            </h2>
            {job.status !== 'processing' && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Status Display */}
          <div className="flex items-start mb-8 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="mr-4 mt-1 bg-white p-2 rounded-full shadow-sm">
              {getStatusIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-gray-900 mb-1">
                {job.status === 'processing' && 'Working magic...'}
                {job.status === 'completed' && 'All done!'}
                {job.status === 'error' && 'Something went wrong'}
                {job.status === 'pending' && 'Queueing up...'}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">{job.message}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Overall Progress</span>
              <span className="text-primary-600">{job.progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out shadow-lg ${getStatusColor()}`}
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>

          {/* Processing Steps */}
          {job.status === 'processing' && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Status</h3>
              <div className="space-y-3">
                {[
                  { step: 'Uploading files', threshold: 10 },
                  { step: 'Analyzing content', threshold: 30 },
                  { step: 'Applying modifications', threshold: 60 },
                  { step: 'Finalizing output', threshold: 90 },
                ].map((item, index) => {
                  const isCompleted = job.progress >= item.threshold;
                  const isCurrent = job.progress >= item.threshold && job.progress < (item.threshold + 30);
                  
                  return (
                    <div
                      key={index}
                      className={`flex items-center text-sm transition-colors duration-300 ${
                        isCompleted ? 'text-green-600 font-medium' : isCurrent ? 'text-primary-600 font-medium' : 'text-gray-400'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 border transition-colors duration-300 ${
                        isCompleted 
                          ? 'bg-green-100 border-green-200' 
                          : isCurrent 
                            ? 'bg-primary-50 border-primary-200 animate-pulse' 
                            : 'bg-transparent border-gray-200'
                      }`}>
                         {isCompleted ? (
                           <CheckCircle className="w-3.5 h-3.5" />
                         ) : (
                           <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-primary-500' : 'bg-gray-300'}`} />
                         )}
                      </div>
                      {item.step}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Error Details */}
          {job.status === 'error' && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-sm text-red-700 font-medium flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {job.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {job.status === 'completed' && (
              <button
                onClick={onClose}
                className="w-full btn-primary text-lg shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700"
              >
                View Your Results
              </button>
            )}
            
            {job.status === 'error' && (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 btn-secondary justify-center"
                >
                  Close
                </button>
                <button className="flex-1 btn-primary justify-center">
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
