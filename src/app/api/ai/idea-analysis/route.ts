import { callClaudeJson } from '@/lib/anthropic'
import { buildAnalysisSystem } from '@/lib/curriculum/frameworks'
import { fallbackCurriculumAnalysis, fallbackWarPlan } from '@/lib/fallbacks'
import { newId, saveStartup, updateStartup } from '@/lib/server-store'
import type { CurriculumAnalysis } from '@/lib/types'

export const runtime = 'nodejs'
export const maxDuration = 60

// Curriculum-grounded idea analysis engine.
// Runs the founder's idea through the M1–M6 framework and returns structured output the
// app drives on (scorecard, Lean Canvas, TAM/SAM/SOM, $10M verdict, JTBD, competitors,
// devil's advocate, kill criteria). Falls back to a deterministic analysis if the model
// is unavailable, so the backend always responds.
export async function POST(req: Request) {
  try {
    const body = await req.json()

    let analysis: CurriculumAnalysis
    let usedFallback = false
    try {
      analysis = await callClaudeJson<CurriculumAnalysis>({
        system: buildAnalysisSystem(),
        body,
        maxTokens: 2400,
      })
      // guard against partial model output — if a required block is missing, fall back.
      if (!analysis?.scorecard || !analysis?.leanCanvas || !analysis?.market) {
        throw new Error('incomplete analysis')
      }
    } catch {
      analysis = fallbackCurriculumAnalysis(body) as CurriculumAnalysis
      usedFallback = true
    }

    // Persist: attach to an existing startup if given, else create a lightweight record.
    let id: string | undefined = body.startupId
    try {
      if (id) {
        await updateStartup(id, {
          curriculumAnalysisJson: analysis,
          failureProbability: analysis.failureProbability,
        })
      } else if (body.persist !== false) {
        id = newId('startup')
        await saveStartup({
          id,
          userId: body.userId || body.email || 'anonymous',
          ideaText: body.idea || body.ideaText || '',
          targetCustomer: body.targetCustomer || '',
          problem: body.problem || '',
          curriculumAnalysisJson: analysis,
          warPlanJson: fallbackWarPlan(),
          failureProbability: analysis.failureProbability,
          completedTasks: [],
          createdAt: new Date().toISOString(),
          accountabilityScore: 0,
          taskCompletionRate: 0,
          vaultUnlocked: false,
          tractionProof: false,
          vznVoice: analysis.vzn_voice,
        })
      }
    } catch {
      // persistence is best-effort; still return the analysis.
    }

    // First-idea email: the analysis report (once per founder).
    if (!body.startupId && id && body.email) {
      try {
        const sc: any = (analysis as any).scorecard
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
          failureProbability: analysis.failureProbability,
          composite,
          vzn: analysis.vzn_voice,
          startupId: id,
        })
        await dispatchEmail({ type: 'analysis_report', to: body.email, userId: body.userId, subject, html, once: true })
      } catch {
        /* email is best-effort */
      }
    }

    if (!body.startupId) {
      try {
        const sc: any = (analysis as any).scorecard
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
          failureProbability: analysis.failureProbability,
          composite,
        })
      } catch {
        /* admin email is best-effort */
      }
    }

    return Response.json({ id, fallback: usedFallback, analysis })
  } catch {
    return Response.json({ error: 'analysis_failed' }, { status: 500 })
  }
}
