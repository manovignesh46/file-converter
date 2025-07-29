'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PreviewCard from './PreviewCard'
import { ImageFile, ConversionOptions } from '../types'

// Simple icon components
const Upload = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17,8 12,3 7,8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
)

const ImageIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21,15 16,10 5,21"></polyline>
  </svg>
)

const Move = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="5,9 2,12 5,15"></polyline>
    <polyline points="9,5 12,2 15,5"></polyline>
    <polyline points="15,19 12,22 9,19"></polyline>
    <polyline points="19,9 22,12 19,15"></polyline>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <line x1="12" y1="2" x2="12" y2="22"></line>
  </svg>
)

interface DragDropUploaderProps {
  images: ImageFile[]
  onImagesChange: (images: ImageFile[]) => void
  options: ConversionOptions
}

interface SortableItemProps {
  id: string
  image: ImageFile
  onRemove: (id: string) => void
  options: ConversionOptions
}

function SortableItem({ id, image, onRemove, options }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative group">
      <PreviewCard 
        image={image} 
        onRemove={onRemove}
        options={options}
      />
      <div 
        {...listeners}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
      >
        <div className="bg-white rounded-full p-1 shadow-md">
          <Move className="w-4 h-4 text-gray-500" />
        </div>
      </div>
    </div>
  )
}

export default function DragDropUploader({ images, onImagesChange, options }: DragDropUploaderProps) {
  const [estimatedSizes, setEstimatedSizes] = useState<{ [key: string]: number }>({})
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const calculateEstimatedSize = useCallback((file: File, options: ConversionOptions): number => {
    const originalSize = file.size

    switch (options.operation) {
      case 'compress':
        if (options.targetSize && options.targetSizeUnit) {
          const targetBytes = options.targetSizeUnit === 'KB' 
            ? options.targetSize * 1024 
            : options.targetSize * 1024 * 1024
          return Math.min(targetBytes, originalSize)
        }
        if (options.compressionQuality) {
          return Math.round(originalSize * (options.compressionQuality / 100))
        }
        return originalSize * 0.8

      case 'resize':
        // Estimate based on dimension reduction
        if (options.resizeWidth || options.resizeHeight) {
          return Math.round(originalSize * 0.6) // Rough estimate
        }
        return originalSize

      case 'convert':
        // Different formats have different compression ratios
        if (options.outputFormat === 'webp') {
          return Math.round(originalSize * 0.7)
        }
        if (options.outputFormat === 'jpg') {
          return Math.round(originalSize * 0.8)
        }
        return originalSize

      default:
        return originalSize
    }
  }, [])

  useEffect(() => {
    const newEstimatedSizes: { [key: string]: number } = {}
    images.forEach(img => {
      newEstimatedSizes[img.id] = calculateEstimatedSize(img.file, options)
    })
    setEstimatedSizes(newEstimatedSizes)
    
    // Update images with estimated sizes
    const updatedImages = images.map(img => ({
      ...img,
      estimatedSize: newEstimatedSizes[img.id]
    }))
    
    if (JSON.stringify(updatedImages) !== JSON.stringify(images)) {
      onImagesChange(updatedImages)
    }
  }, [images, options, calculateEstimatedSize, onImagesChange])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages: ImageFile[] = acceptedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
      originalSize: file.size,
      estimatedSize: calculateEstimatedSize(file, options),
      order: images.length + index,
    }))

    onImagesChange([...images, ...newImages])
  }, [images, onImagesChange, options, calculateEstimatedSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp']
    },
    multiple: true
  })

  const removeImage = useCallback((id: string) => {
    const updatedImages = images.filter(img => img.id !== id)
    onImagesChange(updatedImages)
  }, [images, onImagesChange])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex(img => img.id === active.id)
      const newIndex = images.findIndex(img => img.id === over.id)
      
      const reorderedImages = arrayMove(images, oldIndex, newIndex)
      
      // Update order property
      const updatedImages = reorderedImages.map((img, index) => ({
        ...img,
        order: index
      }))
      
      onImagesChange(updatedImages)
    }
  }, [images, onImagesChange])

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Images</h2>
        <p className="text-gray-600">
          Drag and drop your images here, or click to select files. You can reorder them by dragging.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`drag-zone ${isDragActive ? 'active' : ''} ${images.length > 0 ? 'mb-6' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <div className="bg-primary-100 p-4 rounded-full mb-4">
            {isDragActive ? (
              <Upload className="w-8 h-8 text-primary-600 animate-bounce-light" />
            ) : (
              <ImageIcon className="w-8 h-8 text-primary-600" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isDragActive ? 'Drop images here' : 'Upload your images'}
          </h3>
          <p className="text-gray-500 text-center">
            {isDragActive 
              ? 'Release to upload your files'
              : 'Drag & drop images here, or click to select'
            }
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Supports: JPG, PNG, WebP, GIF, BMP (Max 50MB per file)
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Uploaded Images ({images.length})
            </h3>
            <button
              onClick={() => onImagesChange([])}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Clear All
            </button>
          </div>
          
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={images.map(img => img.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                {images.map((image) => (
                  <SortableItem
                    key={image.id}
                    id={image.id}
                    image={image}
                    onRemove={removeImage}
                    options={options}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total original size:</span>
              <span className="font-medium">
                {(images.reduce((sum, img) => sum + img.originalSize, 0) / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Estimated processed size:</span>
              <span className="font-medium text-primary-600">
                {(images.reduce((sum, img) => sum + (img.estimatedSize || img.originalSize), 0) / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Estimated compression:</span>
              <span className="font-medium text-green-600">
                {Math.round((1 - images.reduce((sum, img) => sum + (img.estimatedSize || img.originalSize), 0) / images.reduce((sum, img) => sum + img.originalSize, 0)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
