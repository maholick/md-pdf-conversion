import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile, rm } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { randomUUID } from 'crypto'
import yaml from 'js-yaml'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  const workspaceRoot = '/app/workspace'
  const tempDir = join(workspaceRoot, randomUUID())
  const docsDir = join(tempDir, 'docs')
  const outputDir = join(tempDir, 'output')
  
  console.log('Temp dir:', tempDir)
  console.log('Current working directory:', process.cwd())
  
  try {
    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const pandocConfig = JSON.parse(formData.get('pandocConfig') as string)
    const eisvogelConfig = JSON.parse(formData.get('eisvogelConfig') as string)
    
    // Create temporary directories
    await mkdir(docsDir, { recursive: true })
    await mkdir(outputDir, { recursive: true })
    
    // Save uploaded markdown files and collect filenames
    const savedFiles: string[] = []
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const fileName = file.name
      await writeFile(join(docsDir, fileName), buffer)
      savedFiles.push(`docs/${fileName}`)
    }
    
    // Create pandoc.yaml
    const pandocYaml = {
      from: 'markdown',
      'output-file': join('output', pandocConfig.outputFile || 'output.pdf'),
      template: 'eisvogel',
      'pdf-engine': 'xelatex',  // Use XeLaTeX for better Unicode support
      variables: {
        linkcolor: 'blue',
        urlcolor: 'blue'
      },
      'table-of-contents': pandocConfig.tableOfContents,
      'toc-depth': pandocConfig.tocDepth,
      'number-sections': pandocConfig.numberSections,
      // Note: 'listings' is deprecated in Pandoc 3.5+ but still works in defaults files
      // 'syntax-highlighting' is not available in defaults files, so we use 'listings'
      listings: pandocConfig.listings,
      'reference-links': pandocConfig.referenceLinks
    }
    await writeFile(join(tempDir, 'pandoc.yaml'), yaml.dump(pandocYaml))
    
    // Create eisvogel.yaml
    const eisvogelYaml = {
      title: eisvogelConfig.title || 'Untitled Document',
      author: [eisvogelConfig.author || 'Unknown'],
      date: eisvogelConfig.date || new Date().toISOString().split('T')[0],
      subject: eisvogelConfig.subject || '',
      keywords: eisvogelConfig.keywords || [],
      subtitle: eisvogelConfig.subtitle || '',
      lang: eisvogelConfig.lang || 'en',
      titlepage: eisvogelConfig.titlepage !== false,
      'titlepage-rule-color': '360049',
      'titlepage-rule-height': 0,
      'titlepage-background': '/templates/example-background.pdf',
      'page-background': '/templates/example-page-background.pdf',
      'page-background-opacity': 1.0,
      'toc-own-page': true,
      fontsize: eisvogelConfig.fontsize || '11pt',
      ...(eisvogelConfig.mainfont && { mainfont: eisvogelConfig.mainfont })
    }
    await writeFile(join(tempDir, 'eisvogel.yaml'), yaml.dump(eisvogelYaml))
    
    // Get the pandoc container name
    const pandocContainer = process.env.NODE_ENV === 'production' 
      ? 'md-pdf-conversion-pandoc-1'
      : 'md-pdf-conversion-pandoc-1'
    
    // Map workspace path for pandoc container
    const pandocWorkDir = tempDir.replace('/app/workspace', '/workspace')
    
    // Build pandoc command
    const pandocCommand = [
      'pandoc',
      ...savedFiles.map(f => join(pandocWorkDir, f)),
      '--defaults', join(pandocWorkDir, 'pandoc.yaml'),
      '--metadata-file', join(pandocWorkDir, 'eisvogel.yaml')
    ].join(' ')
    
    // Execute pandoc in the pandoc container
    const dockerCommand = `docker exec -w ${pandocWorkDir} ${pandocContainer} ${pandocCommand}`
    
    console.log('Executing:', dockerCommand)
    
    try {
      const { stdout, stderr } = await execAsync(dockerCommand)
      
      if (stderr) {
        console.log('Pandoc stderr (warnings):', stderr)
      }
      if (stdout) {
        console.log('Pandoc stdout:', stdout)
      }
      
      // Read the generated PDF
      const pdfPath = join(outputDir, pandocConfig.outputFile || 'output.pdf')
      const pdfBuffer = await readFile(pdfPath)
      
      // Generate unique ID for this PDF
      const pdfId = randomUUID()
      const storagePath = join(process.cwd(), 'generated-pdfs')
      
      // Ensure storage directory exists
      await mkdir(storagePath, { recursive: true })
      
      // Save PDF to storage
      await writeFile(join(storagePath, `${pdfId}.pdf`), pdfBuffer)
      
      // Get file size
      const fileSize = pdfBuffer.length
      
      // Clean up temp directory
      await rm(tempDir, { recursive: true, force: true })
      
      // Return success response with PDF ID
      return NextResponse.json({
        success: true,
        pdfId,
        filename: pandocConfig.outputFile || 'output.pdf',
        size: fileSize
      })
    } catch (execError) {
      console.error('Pandoc execution failed:', execError)
      const errorMessage = execError instanceof Error ? execError.message : String(execError)
      throw new Error(`PDF conversion failed: ${errorMessage}`)
    }
  } catch (error) {
    // Clean up on error
    try {
      await rm(tempDir, { recursive: true, force: true })
    } catch {}
    
    console.error('API Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process request', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}