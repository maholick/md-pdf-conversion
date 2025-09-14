import { NextRequest, NextResponse } from 'next/server'
import { readFile, access } from 'fs/promises'
import { join } from 'path'
import { constants } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pdfId } = await params
    const filename = request.nextUrl.searchParams.get('filename') || 'document.pdf'
    
    // Construct the path to the stored PDF
    const pdfPath = join(process.cwd(), 'generated-pdfs', `${pdfId}.pdf`)
    
    // Check if file exists
    await access(pdfPath, constants.F_OK)
    
    // Read the PDF file
    const pdfBuffer = await readFile(pdfPath)
    
    // Return the PDF with appropriate headers
    return new NextResponse(new Blob([new Uint8Array(pdfBuffer)]), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'File not found or expired' },
      { status: 404 }
    )
  }
}