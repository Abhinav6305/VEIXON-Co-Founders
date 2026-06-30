import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function parseMaybeJson(value: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('workspaceId') || searchParams.get('startupId')

    if (!id) {
      return NextResponse.json({ error: 'workspaceId or startupId is required' }, { status: 400 })
    }

    let workspace = await prisma.workspace.findFirst({
      where: {
        OR: [{ id }, { startupId: id }],
      },
      include: {
        artifacts: { orderBy: { createdAt: 'desc' } },
        agentJobs: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!workspace) {
      const startup = await prisma.startup.findUnique({ where: { id } })
      if (startup) {
        workspace = await prisma.workspace.create({
          data: { startupId: startup.id, status: 'planning' },
          include: {
            artifacts: { orderBy: { createdAt: 'desc' } },
            agentJobs: { orderBy: { createdAt: 'desc' } },
          },
        })
      }
    }

    if (!workspace) {
      return NextResponse.json({ status: 'missing', artifacts: [], jobs: [] })
    }

    return NextResponse.json({
      id: workspace.id,
      startupId: workspace.startupId,
      status: workspace.status,
      artifacts: workspace.artifacts.map((artifact) => ({
        ...artifact,
        content: parseMaybeJson(artifact.content),
      })),
      jobs: workspace.agentJobs.map((job) => ({
        ...job,
        logs: parseMaybeJson(job.logs) || [],
      })),
    })
  } catch (error: any) {
    console.error('Builder status error:', error)
    return NextResponse.json({ error: 'Failed to load builder status', details: error.message }, { status: 500 })
  }
}
