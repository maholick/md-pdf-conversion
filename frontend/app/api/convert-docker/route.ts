import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile, rm } from 'fs/promises'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { randomUUID } from 'crypto'
import yaml from 'js-yaml'
import os from 'os'

const execAsync = promisify(exec)

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
    const files = formData.getAll('files') as File[]
    const pandocConfig = JSON.parse(formData.get('pandocConfig') as string)
    const eisvogelConfig = JSON.parse(formData.get('eisvogelConfig') as string)
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }
    
    // Create temporary directories
    await mkdir(docsDir, { recursive: true })
    await mkdir(outputDir, { recursive: true })
    
    // Save uploaded markdown files
    const fileNames: string[] = []
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      await writeFile(join(docsDir, fileName), buffer)
      fileNames.push(fileName)
    }
    
    // Create pandoc.yaml
    const pandocYaml = {
      from: 'markdown',
      'output-file': `${containerOutputDir}/${pandocConfig.outputFile || 'output.pdf'}`,
      template: 'eisvogel',
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
    await writeFile(join(hostTempDir, 'pandoc.yaml'), yaml.dump(pandocYaml))
    
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
      fontsize: eisvogelConfig.fontsize || '11pt'
    }
    await writeFile(join(hostTempDir, 'eisvogel.yaml'), yaml.dump(eisvogelYaml))
    
    // Build Docker command
    const dockerImage = process.env.PANDOC_DOCKER_IMAGE || 'pandoc/extra:3.5.0'
    const inputFiles = fileNames.map(f => `${containerDocsDir}/${f}`).join(' ')
    
    const dockerCommand = [
      'docker run --rm',
      '--platform linux/amd64',
      `-v "${hostTempDir}:${containerWorkspace}"`,
      `-v "${templatesDir}:/templates:ro"`,
      os.platform() !== 'win32' ? `--user $(id -u):$(id -g)` : '',
      dockerImage,
      inputFiles,
      `--defaults ${containerWorkspace}/pandoc.yaml`,
      `--metadata-file ${containerWorkspace}/eisvogel.yaml`
    ].filter(Boolean).join(' ')
    
    console.log('Executing Docker command:', dockerCommand)
    
    // Execute Docker command
    const { stderr } = await execAsync(dockerCommand)
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error('Docker stderr:', stderr)
    }
    
    // Read the generated PDF
    const pdfPath = join(outputDir, pandocConfig.outputFile || 'output.pdf')
    const pdfBuffer = await readFile(pdfPath)
    
    // Clean up temp directory
    await rm(hostTempDir, { recursive: true, force: true })
    
    // Return PDF as response
    return new NextResponse(new Blob([new Uint8Array(pdfBuffer)]), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pandocConfig.outputFile || 'output.pdf'}"`
      }
    })
    
  } catch (error) {
    // Clean up on error
    try {
      await rm(hostTempDir, { recursive: true, force: true })
    } catch {}
    
    console.error('API Error:', error)
    
    return NextResponse.json(
      { 
        error: 'PDF conversion failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}