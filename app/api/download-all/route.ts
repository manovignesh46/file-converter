import { NextRequest, NextResponse } from 'next/server'
import archiver from 'archiver'
import path from 'path'
import fs from 'fs'
import { FileStorageService } from '../../../services/fileStorageService'

export async function POST(request: NextRequest) {
  try {
    const { files, jobId } = await request.json()
    
    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: 'No files specified' }, { status: 400 })
    }

    // If jobId is provided, get files from MongoDB for that job
    if (jobId) {
      const zipBuffer = await FileStorageService.createJobZip(jobId)
      if (zipBuffer) {
        const headers = new Headers()
        headers.set('Content-Type', 'application/zip')
        headers.set('Content-Disposition', 'attachment; filename="processed-images.zip"')
        headers.set('Content-Length', zipBuffer.length.toString())

        return new NextResponse(zipBuffer, {
          status: 200,
          headers,
        })
      }
    }

    // Fallback: create ZIP from individual files (backward compatibility)
    const processedDir = path.join(process.cwd(), 'public', 'processed')

    // Create a readable stream
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    })

    const chunks: Buffer[] = []
    
    archive.on('data', (chunk) => {
      chunks.push(chunk)
    })

    archive.on('error', (err) => {
      console.error('Archive error:', err)
      throw err
    })

    // Add files to archive
    for (const filename of files) {
      const filePath = path.join(processedDir, filename.trim())
      
      try {
        // Check if file exists
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: filename.trim() })
        } else {
          console.warn(`File not found: ${filename}`)
        }
      } catch (error) {
        console.error(`Error adding file ${filename}:`, error)
      }
    }

    // Finalize the archive
    await archive.finalize()

    // Convert chunks to buffer
    const buffer = Buffer.concat(chunks)

    // Set headers for ZIP download
    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set('Content-Length', buffer.length.toString())
    headers.set('Content-Disposition', 'attachment; filename="processed-images.zip"')
    headers.set('Cache-Control', 'public, max-age=3600')

    return new NextResponse(buffer, { headers })

  } catch (error) {
    console.error('ZIP download error:', error)
    return NextResponse.json(
      { error: 'Failed to create ZIP file' },
      { status: 500 }
    )
  }
}
