import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { FileStorageService } from '../../../../services/fileStorageService'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename

    // First try to get from MongoDB
    const mongoFile = await FileStorageService.getFileByName(filename)
    
    if (mongoFile) {
      // File found in MongoDB
      const headers = new Headers()
      headers.set('Content-Type', mongoFile.mimeType)
      headers.set('Content-Disposition', `attachment; filename="${mongoFile.originalName}"`)
      headers.set('Content-Length', mongoFile.buffer.length.toString())

      return new NextResponse(mongoFile.buffer, {
        status: 200,
        headers,
      })
    }

    // Fallback to file system (for backward compatibility)
    const filePath = path.join(process.cwd(), 'public', 'processed', filename)

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read file
    const fileBuffer = await fs.readFile(filePath)
    const stats = await fs.stat(filePath)

    // Determine content type
    const ext = path.extname(filename).toLowerCase()
    const contentType = getContentType(ext)

    // Set headers for download
    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Content-Length', stats.size.toString())
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    headers.set('Cache-Control', 'public, max-age=3600')

    return new NextResponse(fileBuffer, { headers })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}

function getContentType(ext: string): string {
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    case '.pdf':
      return 'application/pdf'
    case '.zip':
      return 'application/zip'
    default:
      return 'application/octet-stream'
  }
}
