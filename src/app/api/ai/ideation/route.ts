import { callClaudeJson } from '@/lib/anthropic'
import { fallbackIdeation, fallbackWarPlan } from '@/lib/fallbacks'
import { newId, saveStartup, updateStartup } from '@/lib/server-store'
import type { IdeationResult, StartupRecord } from '@/lib/types'
import { CURRICULUM_GROUNDING } from '@/lib/curriculum/frameworks'

export const runtime = 'nodejs'
export const maxDuration = 60

// Only the analysis is AI-generated (fast, ~1500 tokens). The 13-week war plan is
// generated locally to keep the request well under the 60s function limit — asking the
// model for the full plan pushed latency to ~90s and timed out on the client.
const system = `You are VZN, a brutal AI co-founder grounded in this venture framework:
${CURRICULUM_GROUNDING}

Analyse this startup idea using the framework above. Return ONLY valid JSON: { scorecard: { market, moat, timing, founderFit, monetisation, executionRisk } each { score:1-10, explanation:string }, devilsAdvocate: [{ title, explanation, severity:'high'|'medium' }], failureProbability:number, survivalEdge:string, vzn_voice:string }. Be specific, sharp and honest. Never vague. Keep each explanation under 30 words.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    let result: IdeationResult
    try {
      const analysis = await callClaudeJson<Omit<IdeationResult, 'warPlan'>>({ system, body, maxTokens: 1400 })
      result = { ...analysis, warPlan: fallbackWarPlan() }
    } catch {
      result = fallbackIdeation(body)
    }

    const id = newId('startup')
    const record: StartupRecord = {
      id,
      userId: body.userId || body.email || 'anonymous',
      ideaText: body.idea || body.ideaText || '',
      targetCustomer: body.targetCustomer || '',
      problem: body.problem || '',
      scorecardJson: result.scorecard,
      warPlanJson: result.warPlan,
      devilsAdvocateJson: result.devilsAdvocate,
      failureProbability: result.failureProbability,
      survivalEdge: result.survivalEdge,
      completedTasks: [],
      taskEdits: [],
      tractionDetails: [],
      introRequests: [],
      shareCardsGenerated: 0,
      pivotAlerts: [],
      createdAt: new Date().toISOString(),
      accountabilityScore: 0,
      taskCompletionRate: 0,
      vaultUnlocked: false,
      tractionProof: false,
      vznVoice: result.vzn_voice,
    }

    await saveStartup(record)

    // Best-effort: persist the founder's email for later triggers (e.g. the inactivity cron).
    if (body.email) {
      try { await updateStartup(id, { founderEmail: body.email }) } catch { /* column appears after migration */ }
    }

    // First-idea email: the analysis report (once per founder).
    if (body.email) {
      try {
        const sc: any = result.scorecard
        const scores = sc
          ? Object.values(sc).map((dimension: any) => Number(dimension?.score) || 0)
          : []
        const composite = scores.length
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : undefined
        const { dispatchEmail } = await import('@/lib/email/service')
        const { analysisReportEmail } = await import('@/lib/email/templates')
        const { subject, html } = analysisReportEmail(body.name || String(body.email).split('@')[0], {
          idea: body.idea || body.ideaText || '',
          failureProbability: result.failureProbability,
          composite,
          vzn: result.vzn_voice,
          startupId: id,
        })
        await dispatchEmail({ type: 'analysis_report', to: body.email, userId: body.userId, subject, html, once: true })
      } catch {
        /* email is best-effort */
      }
    }

    try {
      const sc: any = result.scorecard
      const scores = sc
        ? Object.values(sc).map((dimension: any) => Number(dimension?.score) || 0)
        : []
      const composite = scores.length
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : undefined
      const { dispatchIdeaSubmissionNotice } = await import('@/lib/email/service')
      await dispatchIdeaSubmissionNotice({
        startupId: id,
        founderEmail: body.email,
        founderName: body.name,
        idea: body.idea || body.ideaText || '',
        targetCustomer: body.targetCustomer || '',
        problem: body.problem || '',
        failureProbability: result.failureProbability,
        composite,
      })
    } catch {
      /* admin email is best-effort */
    }

    return Response.json({ id, ...result })
  } catch {
    return Response.json({ error: 'ideation_failed' }, { status: 500 })
  }
}
