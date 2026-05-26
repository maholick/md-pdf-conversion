import { NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'

export const runtime = 'nodejs'

const execFileAsync = promisify(execFile)
const DOCKER_TIMEOUT_MS = 30_000

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    )
  }

  try {
    // Test if Docker is available
    const { stdout } = await execFileAsync('docker', ['--version'], {
      timeout: DOCKER_TIMEOUT_MS,
      maxBuffer: 1024 * 1024
    })
    
    // Test if pandoc image works
    const pandocTest = await execFileAsync('docker', [
      'run',
      '--rm',
      '--network',
      'none',
      '--cap-drop',
      'ALL',
      '--security-opt',
      'no-new-privileges',
      'pandoc/extra:3.5.0',
      '--version'
    ], {
      timeout: DOCKER_TIMEOUT_MS,
      maxBuffer: 1024 * 1024
    })
    
    return NextResponse.json({
      success: true,
      dockerVersion: stdout.trim(),
      pandocVersion: pandocTest.stdout.split('\n')[0],
      message: 'Docker is working correctly'
    })
  } catch (error) {
    console.error('Docker test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
