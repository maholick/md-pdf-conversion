import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET() {
  try {
    // Test if Docker is available
    const { stdout } = await execAsync('docker --version')
    
    // Test if pandoc image works
    const pandocTest = await execAsync('docker run --rm pandoc/extra:3.5.0 --version')
    
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
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}