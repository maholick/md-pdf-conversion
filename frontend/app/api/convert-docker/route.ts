import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile, rm } from 'fs/promises'
import { join } from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { randomUUID } from 'crypto'
import yaml from 'js-yaml'
import os from 'os'
import {
  RequestValidationError,
  booleanValue,
  contentDispositionAttachment,
  integerValue,
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
  const workspaceId = randomUUID()
  const hostTempDir = join(process.cwd(), 'temp', workspaceId)
  const docsDir = join(hostTempDir, 'docs')
  const outputDir = join(hostTempDir, 'output')
  const templatesDir = join(process.cwd(), '..', 'templates')
  
  // Docker paths
  const containerWorkspace = `/workspace/${workspaceId}`
  const containerDocsDir = `${containerWorkspace}/docs`
  const containerOutputDir = `${containerWorkspace}/output`
  
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
    
    // Save uploaded markdown files
    const fileNames: string[] = []
    for (const file of files) {
      await writeFile(join(docsDir, file.fileName), file.buffer)
      fileNames.push(file.fileName)
    }
    
    // Create pandoc.yaml
    const pandocYaml = {
      from: 'markdown',
      'output-file': `${containerOutputDir}/${outputFile}`,
      template: 'eisvogel',
      'pdf-engine': 'xelatex',
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
    await writeFile(join(hostTempDir, 'pandoc.yaml'), yaml.dump(pandocYaml))
    
    // Create eisvogel.yaml
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
      fontsize: stringValue(eisvogelConfig.fontsize, '11pt', 10)
    }
    await writeFile(join(hostTempDir, 'eisvogel.yaml'), yaml.dump(eisvogelYaml))
    
    // Build Docker command
    const dockerImage = process.env.PANDOC_DOCKER_IMAGE || 'pandoc/extra:3.5.0'
    const inputFiles = fileNames.map(f => `${containerDocsDir}/${f}`)
    const dockerArgs = [
      'run',
      '--rm',
      '--platform',
      'linux/amd64',
      '--network',
      'none',
      '--cap-drop',
      'ALL',
      '--security-opt',
      'no-new-privileges',
      '-e',
      'HOME=/tmp',
      '--tmpfs',
      '/tmp:rw,nosuid,nodev,size=512m',
      '-v',
      `${hostTempDir}:${containerWorkspace}`,
      '-v',
      `${templatesDir}:/templates:ro`,
      ...(os.platform() !== 'win32' && typeof process.getuid === 'function' && typeof process.getgid === 'function'
        ? ['--user', `${process.getuid()}:${process.getgid()}`]
        : []),
      dockerImage,
      ...inputFiles,
      '--defaults',
      `${containerWorkspace}/pandoc.yaml`,
      '--metadata-file',
      `${containerWorkspace}/eisvogel.yaml`
    ]
    
    console.log('Executing Docker command:', ['docker', ...dockerArgs].join(' '))
    
    // Execute Docker command
    const { stderr } = await execFileAsync('docker', dockerArgs, {
      timeout: DOCKER_TIMEOUT_MS,
      maxBuffer: 10 * 1024 * 1024
    })
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error('Docker stderr:', stderr)
    }
    
    // Read the generated PDF
    const pdfPath = safeResolve(outputDir, outputFile)
    const pdfBuffer = await readFile(pdfPath)
    
    // Clean up temp directory
    await rm(hostTempDir, { recursive: true, force: true })
    
    // Return PDF as response
    return new NextResponse(new Blob([new Uint8Array(pdfBuffer)]), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDispositionAttachment(outputFile),
        'X-Content-Type-Options': 'nosniff'
      }
    })
    
  } catch (error) {
    // Clean up on error
    try {
      await rm(hostTempDir, { recursive: true, force: true })
    } catch {}
    
    console.error('API Error:', error)
    
    const isValidationError = error instanceof RequestValidationError
    const details = process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined

    return NextResponse.json(
      {
        error: isValidationError ? error.message : 'PDF conversion failed',
        ...(details && { details })
      },
      { status: isValidationError ? 400 : 500 }
    )
  }
}
