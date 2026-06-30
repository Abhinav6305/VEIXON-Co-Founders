import { chatJsonSafe, TeaserSchema } from '@/lib/ai'
import { CURRICULUM_GROUNDING, VZN_PERSONA } from '@/lib/curriculum/frameworks'
import { rateLimit, clientIp, tooMany } from '@/lib/rate-limit'
import { fallbackCurriculumAnalysis } from '@/lib/fallbacks'

export const runtime = 'nodejs'
export const maxDuration = 30

// PUBLIC teaser. Now a REAL AI call (curriculum-grounded) via the AI Gateway, with the
// deterministic engine as a guaranteed fallback when no provider is configured or the model errors.
const TEASER_SYSTEM = `${VZN_PERSONA}

${CURRICULUM_GROUNDING}

TASK: Give a FAST, brutal teaser read of the founder's one-line idea, grounded in the framework above.
Return ONLY valid JSON, no markdown:
{
  "failureProbability": <integer 0-100, honest probability they fail if nothing changes>,
  "composite": <integer 1-10, overall>,
  "scores": [
    {"label":"Problem severity","score":<1-10>},
    {"label":"Market size","score":<1-10>},
    {"label":"Moat","score":<1-10>},
    {"label":"Scalability ($10M)","score":<1-10>}
  ],
  "devil": {"title": <=6 words, "explanation": <one brutal sentence>, "severity": "high" | "medium"},
  "tenMillion": <boolean: could it credibly reach ~$10M ARR in 3-5 years?>,
  "killCriteria": <one sentence: the signal that means pivot>,
  "vzn": <2 sentences, first person, brutally honest, references THIS idea>
}
Every string under 24 words. Be specific to the idea — never generic.`

// Deterministic mapping (no key / model failure) — instant and always valid.
function fallbackTeaser(idea: string, customer?: string, problem?: string) {
  const a = fallbackCurriculumAnalysis({ idea, targetCustomer: customer, problem }) as any
  const sc = a.scorecard
  const scores = Object.values(sc).map((dimension: any) => Number(dimension?.score) || 0)
  const composite = Math.round(scores.reduce((sum, score) => sum + score, 0) / Math.max(1, scores.length))
  return {
    failureProbability: a.failureProbability,
    composite,
    scores: [
      { label: 'Problem severity', score: sc.problemSeverity.score },
      { label: 'Market size', score: sc.marketSize.score },
      { label: 'Moat', score: sc.moat.score },
      { label: 'Scalability ($10M)', score: sc.scalability.score },
    ],
    devil: a.devilsAdvocate[0],
    tenMillion: a.market.tenMillionVerdict.passes,
    killCriteria: a.killCriteria,
    vzn: a.vzn_voice,
    source: 'fallback' as const,
  }
}

function valid(t: any): boolean {
  return t && typeof t.failureProbability === 'number' && Array.isArray(t.scores) && t.scores.length >= 4 && t.devil && typeof t.vzn === 'string'
}

export async function POST(req: Request) {
  // Public, unauthenticated route — rate limit by IP to prevent abuse of the AI bill.
  const rl = rateLimit(`teaser:${clientIp(req)}`, 20, 60_000)
  if (!rl.ok) return tooMany(rl.retryAfter)

  const body = await req.json().catch(() => ({}))
  const idea = String(body?.idea || '').trim()
  if (idea.length < 6) return Response.json({ error: 'Describe your idea in a few words.' }, { status: 400 })

  try {
    // Schema-validated at the gateway (repair-retries once); falls back below on failure.
    const t = await chatJsonSafe(
      TeaserSchema,
      { system: TEASER_SYSTEM, messages: [{ role: 'user', content: idea }], maxTokens: 700, temperature: 0.5 },
      { tier: 'fast' },
    )
    return Response.json({ ...t, source: 'ai' })
  } catch {
    return Response.json(fallbackTeaser(idea, body?.customer, body?.problem))
  }
}
