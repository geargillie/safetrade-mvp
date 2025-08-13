import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Get the file path
    const filePath = path.join(process.cwd(), 'app', 'listings', 'create', 'page.tsx')
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        error: 'Create page file not found',
        path: filePath
      })
    }

    // Read the file content
    const content = fs.readFileSync(filePath, 'utf-8')
    
    // Check for key features
    const features = {
      has_identity_verification_import: content.includes('FreeIdentityVerification'),
      has_identity_verification_component: content.includes('<FreeIdentityVerification'),
      has_verification_state: content.includes('isVerified'),
      has_show_verification_state: content.includes('showVerification'),
      has_status_field: content.includes('status: \'available\''),
      file_size: content.length,
      lines_count: content.split('\n').length
    }

    // Get first and last few lines to verify it's the right file
    const lines = content.split('\n')
    const preview = {
      first_10_lines: lines.slice(0, 10),
      last_5_lines: lines.slice(-5),
      imports_section: lines.filter(line => line.trim().startsWith('import')),
    }

    return NextResponse.json({
      features,
      preview,
      environment: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV || 'not-vercel',
      timestamp: new Date().toISOString(),
      debug_note: 'This checks what version of create page is actually deployed'
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check create page',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}