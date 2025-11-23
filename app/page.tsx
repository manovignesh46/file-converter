'use client'

import { useState, useCallback } from 'react'
import DragDropUploader from '../components/DragDropUploader'
import OptionsPanel from '../components/OptionsPanel'
import ProgressModal from '../components/ProgressModal'
import ResultsView from '../components/ResultsView'
import Header from '../components/Header'
import { ImageFile, ConversionOptions, JobProgress } from '../types'

export default function Home() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [options, setOptions] = useState<ConversionOptions>({
    operation: 'compress',
    compressionQuality: 80,
  })
  const [currentJob, setCurrentJob] = useState<JobProgress | null>(null)
  const [results, setResults] = useState<Array<string | {
    fileName: string
    originalSize?: number
    processedSize?: number
    compressionRatio?: number
    dimensions?: { width: number; height: number }
    format?: string
    pageCount?: number
  }>>([])
  const [isCleaningUp, setIsCleaningUp] = useState(false)

  const handleImagesChange = useCallback((newImages: ImageFile[]) => {
    setImages(newImages)
  }, [])

  const handleOptionsChange = useCallback((newOptions: ConversionOptions) => {
    setOptions(newOptions)
  }, [])

  // Check if processing can proceed
  const canProcess = useCallback(() => {
    if (images.length === 0) return false
    
    // For PDF password removal, password is required
    if (options.operation === 'pdf-remove-password') {
      return !!(options.pdfPassword && options.pdfPassword.trim().length > 0)
    }
    
    return true
  }, [images.length, options.operation, options.pdfPassword])

  const handleProcess = async () => {
    if (images.length === 0) return

    const jobId = Date.now().toString()
    setCurrentJob({
      id: jobId,
      status: 'processing',
      progress: 0,
      message: 'Starting processing...',
    })

    try {
      const formData = new FormData()
      images.forEach((img, index) => {
        formData.append('images', img.file)
        formData.append(`order_${index}`, img.order.toString())
      })
      formData.append('options', JSON.stringify(options))

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Processing failed')
      }

      const result = await response.json()
      
      setCurrentJob({
        id: jobId,
        status: 'completed',
        progress: 100,
        message: 'Processing completed!',
        outputFiles: result.files,
      })

      setResults(result.files)
    } catch (error) {
      setCurrentJob({
        id: jobId,
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Processing failed. Please try again.',
      })
    }
  }

  const clearJob = () => {
    setCurrentJob(null)
  }

  const clearResults = async () => {
    setIsCleaningUp(true)
    try {
      // Call cleanup API to delete processed files
      const response = await fetch('/api/cleanup', {
        method: 'DELETE',
      })
      if (response.ok) {
        const result = await response.json()
        console.log('Cleanup result:', result.message)
      } else {
        console.warn('Cleanup failed:', await response.text())
      }
    } catch (error) {
      console.error('Failed to cleanup processed files:', error)
      // Continue with UI cleanup even if file cleanup fails
    } finally {
      setIsCleaningUp(false)
    }
    // Clear UI state
    setResults([])
    setImages([])
    setOptions({
      operation: 'compress',
      compressionQuality: 80,
    })
  }

  return (
    <main className="min-h-screen">
      <Header />
      
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-7xl">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 mb-4">
            File Converter Pro
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Convert, compress, resize, and process your images with our powerful online tool. 
            Drag, drop, and transform your images in seconds.
          </p>
        </div>

        {results.length > 0 ? (
          <ResultsView 
            files={results} 
            onStartNew={clearResults}
            isCleaningUp={isCleaningUp}
          />
        ) : (
          <div className="flex flex-col xl:grid xl:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
            <div className="xl:col-span-3 order-1">
              <DragDropUploader 
                images={images}
                onImagesChange={handleImagesChange}
                options={options}
              />
            </div>
            
            <div className="xl:col-span-1 order-2">
              <OptionsPanel 
                options={options}
                onOptionsChange={handleOptionsChange}
                onProcess={handleProcess}
                canProcess={canProcess()}
                images={images}
              />
            </div>
          </div>
        )}
      </div>

      {currentJob && (
        <ProgressModal 
          job={currentJob}
          onClose={clearJob}
        />
      )}
    </main>
  )
}
