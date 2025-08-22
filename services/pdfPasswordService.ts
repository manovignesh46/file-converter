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
    const originalSize = buffer.length;

    try {
      const pdfDoc = await PDFDocument.load(buffer, {
        password: options.password,
      });
      
      const pdfBytes = await pdfDoc.save()
      const processedSize = pdfBytes.length
      const originalBaseName = path.parse(originalName).name
      const fileId = uuidv4().split('-')[0]
      const processedName = `${originalBaseName}_unlocked_${fileId}.pdf`
      const outputPath = path.join(UPLOAD_DIR, processedName)

      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await fs.writeFile(outputPath, pdfBytes);

      return {
        processedName,
        originalSize,
        processedSize,
        pageCount: pdfDoc.getPageCount(),
      };
    } catch (error) {
      console.error('Error removing PDF password:', error);
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('encrypted') || errorMessage.includes('password')) {
          throw new Error('Invalid password provided for the encrypted PDF.');
        }
      }
      
      throw new Error('Failed to process the PDF. It might be corrupted.');
    }
  }
}
