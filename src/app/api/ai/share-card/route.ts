import { callClaudeJson } from '@/lib/anthropic'
import { buildFounderLinkedInPost } from '@/lib/share'

export const runtime = 'nodejs'

const system = `Generate LinkedIn post for founder. Return ONLY valid JSON: { postText:string, highlightStat:string }.
Written as the founder's voice, not VZN.
The post must be elaborate enough for LinkedIn, mention "VEIXON Co-founders, a product by @VEIXON Tech", and include relevant hashtags.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    try {
      return Response.json(await callClaudeJson({ system, body, maxTokens: 700 }))
    } catch {
      return Response.json({
        postText: buildFounderLinkedInPost({
          day: body.day,
          week: body.week,
          task: body.task,
          shareAngle: body.shareAngle,
          missionCode: body.missionCode,
          startupName: body.startupName,
          completionRate: body.completionRate,
          completedCount: body.completedCount,
          totalTasks: body.totalTasks,
        }),
        highlightStat: body.highlightStat || '1 hard signal logged',
        fallback: true,
      })
    }
  } catch {
    return Response.json({ error: 'AI unavailable', fallback: true }, { status: 500 })
  }
}
