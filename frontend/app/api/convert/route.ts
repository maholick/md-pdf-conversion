import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile, rm } from 'fs/promises'
import { join } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { randomUUID } from 'crypto'
import yaml from 'js-yaml'
import {
  RequestValidationError,
  booleanValue,
  cleanupStoredPdfs,
  integerValue,
  optionalStringValue,
  parseJsonObject,
  prepareUploadedMarkdownFiles,
  safeResolve,
  sanitizePdfFileName,
  stringArrayValue,
  stringValue
} from '@/lib/server/conversion-security'

export const runtime = 'nodejs'

const execFileAsync = promisify(execFile)
const DOCKER_TIMEOUT_MS = 120_000

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
    const files = await prepareUploadedMarkdownFiles(formData.getAll('files'))
    const pandocConfig = parseJsonObject(formData.get('pandocConfig'), 'pandocConfig')
    const eisvogelConfig = parseJsonObject(formData.get('eisvogelConfig'), 'eisvogelConfig')
    const outputFile = sanitizePdfFileName(pandocConfig.outputFile)
    
    // Create temporary directories
    await mkdir(docsDir, { recursive: true })
    await mkdir(outputDir, { recursive: true })
    
    // Save uploaded markdown files and collect filenames
    const savedFiles: string[] = []
    for (const file of files) {
      await writeFile(join(docsDir, file.fileName), file.buffer)
      savedFiles.push(`docs/${file.fileName}`)
    }
    
    // Create pandoc.yaml
    const pandocYaml = {
      from: 'markdown',
      'output-file': join('output', outputFile),
      template: 'eisvogel',
      'pdf-engine': 'xelatex',  // Use XeLaTeX for better Unicode support
      variables: {
        linkcolor: 'blue',
        urlcolor: 'blue'
      },
      'table-of-contents': booleanValue(pandocConfig.tableOfContents, true),
      'toc-depth': integerValue(pandocConfig.tocDepth, 2, 1, 6),
      'number-sections': booleanValue(pandocConfig.numberSections, true),
      // Note: 'listings' is deprecated in Pandoc 3.5+ but still works in defaults files
      // 'syntax-highlighting' is not available in defaults files, so we use 'listings'
      listings: booleanValue(pandocConfig.listings, true),
      'reference-links': booleanValue(pandocConfig.referenceLinks, true)
    }
    await writeFile(join(tempDir, 'pandoc.yaml'), yaml.dump(pandocYaml))
    
    // Create eisvogel.yaml
    const mainfont = optionalStringValue(eisvogelConfig.mainfont, 80)
    const eisvogelYaml = {
      title: stringValue(eisvogelConfig.title, 'Untitled Document'),
      author: [stringValue(eisvogelConfig.author, 'Unknown')],
      date: stringValue(eisvogelConfig.date, new Date().toISOString().split('T')[0], 40),
      subject: stringValue(eisvogelConfig.subject, ''),
      keywords: stringArrayValue(eisvogelConfig.keywords),
      subtitle: stringValue(eisvogelConfig.subtitle, ''),
      lang: stringValue(eisvogelConfig.lang, 'en', 20),
      titlepage: booleanValue(eisvogelConfig.titlepage, true),
      'titlepage-rule-color': '360049',
      'titlepage-rule-height': 0,
      'titlepage-background': '/templates/example-background.pdf',
      'page-background': '/templates/example-page-background.pdf',
      'page-background-opacity': 1.0,
      'toc-own-page': true,
      fontsize: stringValue(eisvogelConfig.fontsize, '11pt', 10),
      ...(mainfont && { mainfont })
    }
    await writeFile(join(tempDir, 'eisvogel.yaml'), yaml.dump(eisvogelYaml))
    
    // Build pandoc command
    const pandocArgs = [
      ...savedFiles,
      '--defaults',
      'pandoc.yaml',
      '--metadata-file',
      'eisvogel.yaml'
    ]
    
    const pandocContainer = process.env.PANDOC_CONTAINER
    const command = pandocContainer ? 'docker' : 'pandoc'
    const args = pandocContainer
      ? ['exec', '-w', tempDir.replace('/app/workspace', '/workspace'), pandocContainer, 'pandoc', ...pandocArgs]
      : pandocArgs

    console.log('Executing conversion command:', [command, ...args].join(' '))
    
    try {
      const { stdout, stderr } = await execFileAsync(command, args, {
        cwd: pandocContainer ? undefined : tempDir,
        timeout: DOCKER_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024
      })
      
      if (stderr) {
        console.log('Pandoc stderr (warnings):', stderr)
      }
      if (stdout) {
        console.log('Pandoc stdout:', stdout)
      }
      
      // Read the generated PDF
      const pdfPath = safeResolve(outputDir, outputFile)
      const pdfBuffer = await readFile(pdfPath)
      
      // Generate unique ID for this PDF
      const pdfId = randomUUID()
      const storagePath = join(process.cwd(), 'generated-pdfs')
      
      // Ensure storage directory exists
      await mkdir(storagePath, { recursive: true })
      await cleanupStoredPdfs(storagePath)
      
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
        filename: outputFile,
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
    
    const isValidationError = error instanceof RequestValidationError
    const details = process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined

    return NextResponse.json(
      {
        error: isValidationError ? error.message : 'Failed to process request',
        ...(details && { details })
      },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
