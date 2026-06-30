// Zod response contracts for AI outputs. Validated at the gateway boundary
// (chatJsonSafe) so malformed model JSON never reaches a user — on failure the
// gateway repair-retries once, then the route falls back to the deterministic engine.
import { z } from 'zod'

const score = z.coerce.number().min(0).max(10)

export const ScoreSchema = z.object({ label: z.string().min(1), score })
export const DevilSchema = z.object({
  title: z.string().min(1),
  explanation: z.string().min(1),
  severity: z.string().optional(),
})

// /api/ai/teaser
export const TeaserSchema = z.object({
  failureProbability: z.coerce.number().min(0).max(100),
  composite: score,
  scores: z.array(ScoreSchema).min(4),
  devil: DevilSchema,
  tenMillion: z.boolean().catch(false),
  killCriteria: z.string().catch(''),
  vzn: z.string().min(1),
})
export type Teaser = z.infer<typeof TeaserSchema>

// /api/ai/decision
const ScenarioSchema = z.object({
  summary: z.string().default(''),
  day30: z.string().default(''),
  day90: z.string().default(''),
  day180: z.string().default(''),
})
export const DecisionSchema = z.object({
  bestCase: ScenarioSchema,
  worstCase: ScenarioSchema,
  mostLikely: ScenarioSchema,
  recommendation: z.string().min(1),
  reasoning: z.string().default(''),
  vzn_voice: z.string().default(''),
})
export type DecisionResult = z.infer<typeof DecisionSchema>
