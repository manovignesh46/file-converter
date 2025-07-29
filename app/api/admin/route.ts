import { NextRequest, NextResponse } from 'next/server'
import { FileStorageService } from '../../../services/fileStorageService'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    switch (action) {
      case 'migrate':
        const migrated = await FileStorageService.migrateExistingFiles(
          './public/processed'
        )
        return NextResponse.json({
          success: true,
          message: `Migrated ${migrated} files to MongoDB`,
          migratedCount: migrated
        })

      case 'cleanup':
        const cleaned = await FileStorageService.cleanupExpiredFiles()
        return NextResponse.json({
          success: true,
          message: `Cleaned up ${cleaned} expired files`,
          cleanedCount: cleaned
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "migrate" or "cleanup"' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Admin operation failed:', error)
    return NextResponse.json(
      { 
        error: 'Operation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
