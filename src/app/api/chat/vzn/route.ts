import { chat } from '@/lib/ai'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      message,
      founderName,
      startupName,
      ideaText,
      marketIntelligence,
      currentWeek,
      missionCode,
      missionName,
      dayNumber,
      todayTask,
      accountabilityScore,
      weekCompletionPct,
      streakCount,
      oath,
      lastDebriefSignal,
      recentDecisions,
      tractionProof,
    } = body

    if (!message || !founderName) {
      return Response.json({ error: 'Message and founder name required' }, { status: 400 })
    }

    const systemPrompt = `You are VZN — the AI co-founder of ${founderName}'s startup.

FOUNDER CONTEXT:
- Startup: ${startupName || 'Unknown'}
- Idea: ${ideaText || 'Unknown'}
- Market originality score: ${marketIntelligence?.ideaOriginality?.score || 'Unknown'}/10
- Biggest competitor: ${marketIntelligence?.biggestThreat || 'Unknown'}
- Current week: Week ${currentWeek || '?'} — ${missionCode || '?'}: ${missionName || '?'}
- Today: Day ${dayNumber || '?'} of 90
- Task today: ${todayTask || 'Unknown'}
- Accountability score: ${accountabilityScore || 0}%
- Task completion this week: ${weekCompletionPct || 0}%
- Streak: ${streakCount || 0} days
- Oath: "${oath || 'Not set'}"
- Recent debrief signal: "${lastDebriefSignal || 'None'}"
- Recent decisions: ${recentDecisions || 'None'}
- Traction: ${tractionProof ? 'Yes' : 'No'}

PERSONALITY:
Direct. Sharp. Zero filler. Never say "Great!" or "Awesome!".
Short sentences. One follow-up question when it helps.
Reference their actual data when relevant. Challenge laziness.
Celebrate real wins briefly, then push forward.
Max 3 sentences unless they explicitly ask for something long-form.

Never invent precise statistics or cite named sources. If you estimate a number, say it is an estimate.

Reply in plain conversational text as VZN. Do NOT return JSON, markdown headings, or any preamble — just the reply.`

    const res = await chat(
      {
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
        maxTokens: 400,
        temperature: 0.6,
      },
      { tier: 'default', retries: 1 },
    )

    const reply = (res.text || '').trim()
    if (!reply) {
      return Response.json({ error: 'AI returned empty response', fallback: true }, { status: 502 })
    }
    return Response.json({ reply, provider: res.provider })
  } catch (error: any) {
    // Surface the real reason in the server log + response so failures are diagnosable
    // instead of silently degrading to canned replies.
    console.error('VZN chat error:', error?.code || '', error?.message || error)
    return Response.json(
      { error: 'AI unavailable', code: error?.code, detail: String(error?.message || error), fallback: true },
      { status: 502 },
    )
  }
}
