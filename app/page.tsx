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
  const [results, setResults] = useState<string[]>([])
  const [isCleaningUp, setIsCleaningUp] = useState(false)

  const handleImagesChange = useCallback((newImages: ImageFile[]) => {
    setImages(newImages)
  }, [])

  const handleOptionsChange = useCallback((newOptions: ConversionOptions) => {
    setOptions(newOptions)
  }, [])

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
        throw new Error('Processing failed')
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
        message: 'Processing failed. Please try again.',
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
  }

  return (
    <main className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Professional Image Converter
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <DragDropUploader 
                images={images}
                onImagesChange={handleImagesChange}
                options={options}
              />
            </div>
            
            <div className="lg:col-span-1">
              <OptionsPanel 
                options={options}
                onOptionsChange={handleOptionsChange}
                onProcess={handleProcess}
                canProcess={images.length > 0}
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
