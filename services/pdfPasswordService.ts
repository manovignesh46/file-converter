import { decrypt } from 'node-qpdf2'
import { PDFDocument } from 'pdf-lib-with-encrypt'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'processed')

export class PdfPasswordService {
  async removePassword(
    buffer: Buffer,
    originalName: string,
    options: { password?: string }
  ): Promise<{
    processedName: string
    originalSize: number
    processedSize: number
    pageCount: number
  }> {
    const originalSize = buffer.length
    
    // Generate unique filenames
    const tempId = uuidv4().split('-')
    const tempInputPath = path.join(UPLOAD_DIR, `temp_input_${tempId}.pdf`)
    const tempDecryptedPath = path.join(UPLOAD_DIR, `temp_decrypted_${tempId}.pdf`)

    try {
      // Ensure directory exists
      await fs.mkdir(UPLOAD_DIR, { recursive: true })
      
      // Write input buffer to temporary file
      await fs.writeFile(tempInputPath, buffer)

      // Use QPDF to decrypt the PDF
      await decrypt({
        input: tempInputPath,
        output: tempDecryptedPath,
        password: options.password || ''
      })

      // Read the decrypted PDF
      const decryptedBuffer = await fs.readFile(tempDecryptedPath)
      
      // Load with pdf-lib to get metadata and re-save (ensures clean output)
      const pdfDoc = await PDFDocument.load(decryptedBuffer)
      const pdfBytes = await pdfDoc.save()
      
      // Generate final output filename
      const originalBaseName = path.parse(originalName).name
      const fileId = uuidv4().split('-')[0]
      const processedName = `${originalBaseName}_unlocked_${fileId}.pdf`
      const outputPath = path.join(UPLOAD_DIR, processedName)
      
      // Save final PDF
      await fs.writeFile(outputPath, pdfBytes)

      return {
        processedName,
        originalSize,
        processedSize: pdfBytes.length,
        pageCount: pdfDoc.getPageCount(),
      }
    } catch (error) {
      console.error('Error removing PDF password:', error)
      
      // Extract error message from various possible sources
      // node-qpdf2 throws stderr output as a string
      let errorMessage = ''
      
      if (typeof error === 'string') {
        errorMessage = error
      } else if (error instanceof Error) {
        errorMessage = error.message
      } else if (error && typeof error === 'object') {
        errorMessage = (error as any).stderr || (error as any).message || String(error)
      }
      
      console.error('Extracted error message:', errorMessage)
      
      // Check for qpdf not installed
      if (errorMessage.includes('ENOENT') || errorMessage.includes('spawn qpdf')) {
        throw new Error('PDF password removal tool (qpdf) is not installed on the server. Please contact the administrator.')
      }
      
      // QPDF specific error messages (case-insensitive check)
      const lowerErrorMessage = errorMessage.toLowerCase()
      
      if (lowerErrorMessage.includes('invalid password') || lowerErrorMessage.includes('incorrect password')) {
        throw new Error('❌ Incorrect password. Please check your password and try again.')
      }
      
      if (lowerErrorMessage.includes('not encrypted') || lowerErrorMessage.includes('not password protected')) {
        throw new Error('ℹ️ This PDF is not password protected.')
      }
      
      if (lowerErrorMessage.includes('unable to open') || lowerErrorMessage.includes('invalid pdf') || lowerErrorMessage.includes('not a pdf')) {
        throw new Error('⚠️ The PDF file appears to be corrupted or is not a valid PDF.')
      }
      
      if (lowerErrorMessage.includes('permission') || lowerErrorMessage.includes('access denied')) {
        throw new Error('🚫 Access denied. The PDF may have restrictions that prevent password removal.')
      }
      
      // If we still don't have a specific error, throw generic message with hint
      throw new Error('❌ Failed to remove password from PDF. Please verify the password is correct or check if the file is corrupted.')
    } finally {
      // Clean up temporary files
      try {
        await fs.unlink(tempInputPath).catch(() => {})
        await fs.unlink(tempDecryptedPath).catch(() => {})
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary files:', cleanupError)
      }
    }
  }
}
