import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get build and deployment info
    const buildInfo = {
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV || 'not-vercel',
      vercel_url: process.env.VERCEL_URL || 'not-set',
      vercel_git_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA || 'not-set',
      vercel_git_commit_ref: process.env.VERCEL_GIT_COMMIT_REF || 'not-set',
      next_runtime: process.env.NEXT_RUNTIME || 'not-set',
      timestamp: new Date().toISOString(),
      
      // App metadata
      app_version: process.env.npm_package_version || 'unknown',
      
      // Build time info (if available)
      build_id: process.env.BUILD_ID || 'unknown',
      
      // Check if we're in a serverless environment
      is_serverless: !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL,
      
      // Memory and runtime info
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
    }

    // Check if we can access the file system (might be restricted in some deployments)
    let file_system_access = 'unknown'
    try {
      const fs = require('fs')
      const path = require('path')
      const createPagePath = path.join(process.cwd(), 'app', 'listings', 'create', 'page.tsx')
      file_system_access = fs.existsSync(createPagePath) ? 'accessible' : 'file_not_found'
    } catch (err) {
      file_system_access = 'restricted'
    }

    return NextResponse.json({
      build_info: buildInfo,
      file_system_access,
      debugging_notes: [
        'Check VERCEL_GIT_COMMIT_SHA to verify latest commit is deployed',
        'Check VERCEL_ENV to confirm production environment',
        'file_system_access shows if we can read deployed files',
        'Compare with latest git commit hash to verify deployment'
      ]
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get build info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}