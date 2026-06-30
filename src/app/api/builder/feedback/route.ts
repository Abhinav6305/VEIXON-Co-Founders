import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { artifactId, feedback } = await req.json()

    if (!artifactId) {
      return NextResponse.json({ error: 'artifactId is required' }, { status: 400 })
    }

    const artifact = await prisma.artifact.findUnique({
      where: { id: artifactId },
    })

    if (!artifact) {
      return NextResponse.json({ error: 'Artifact not found' }, { status: 404 })
    }

    const updated = await prisma.artifact.update({
      where: { id: artifactId },
      data: {
        humanFeedback: String(feedback || '').trim() || null,
        isApproved: false,
      },
    })

    return NextResponse.json({ success: true, artifact: updated })
  } catch (error: any) {
    console.error('Feedback submission error:', error)
    return NextResponse.json({ error: 'Failed to save feedback', details: error.message }, { status: 500 })
  }
}
