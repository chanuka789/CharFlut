import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
}

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
  const filename = params.filename

  if (!filename || filename.includes('/') || filename.includes('..') || filename.includes('\0')) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const filePath = join(process.cwd(), 'public', 'uploads', filename)
    const data = await readFile(filePath)
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
    const contentType = MIME_MAP[ext] || 'application/octet-stream'

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
