// AI Gateway — application layer. Model routing + reliability (retry/fallback/circuit-breaker)
// + usage metering + optional cache. This is the only thing the rest of the app calls.
import type { ZodSchema } from 'zod'
import { allProviders, extractJson, getProvider } from './providers'
import { AiError, type ChatOptions, type ChatRequest, type ChatResult, type ProviderName, type Tier, type UsageEvent } from './types'

// ---- model routing: each tier resolves to an ordered provider chain (primary + fallbacks) ----
function envChain(name: string, fallback: ProviderName[]): ProviderName[] {
  const v = process.env[name]
  if (!v) return fallback
  return v.split(',').map((s) => s.trim()).filter(Boolean) as ProviderName[]
}
const PRIMARY = (process.env.AI_PRIMARY_PROVIDER as ProviderName) || 'nvidia'
const CHAINS: Record<Tier, ProviderName[]> = {
  default: envChain('AI_CHAIN_DEFAULT', [PRIMARY, 'openai', 'groq', 'gemini', 'anthropic']),
  fast: envChain('AI_CHAIN_FAST', ['groq', PRIMARY, 'openai', 'gemini']),
  strong: envChain('AI_CHAIN_STRONG', ['anthropic', 'openai', PRIMARY, 'gemini']),
}

// ---- per-provider circuit breaker (in-memory; moves to Redis in the events phase) ----
const BREAKER_THRESHOLD = 4
const BREAKER_COOLDOWN_MS = 30_000
const breaker = new Map<ProviderName, { fails: number; openUntil: number }>()
function breakerOpen(p: ProviderName) {
  const b = breaker.get(p)
  return !!b && b.openUntil > Date.now()
}
function breakerFail(p: ProviderName) {
  const b = breaker.get(p) || { fails: 0, openUntil: 0 }
  b.fails++
  if (b.fails >= BREAKER_THRESHOLD) { b.openUntil = Date.now() + BREAKER_COOLDOWN_MS; b.fails = 0 }
  breaker.set(p, b)
}
function breakerOk(p: ProviderName) {
  breaker.set(p, { fails: 0, openUntil: 0 })
}

// ---- usage metering (pluggable sink; wire to Postgres/Kafka later) ----
let usageSink: (e: UsageEvent) => void = () => {}
export function setUsageSink(fn: (e: UsageEvent) => void) { usageSink = fn }
// rough per-1k-token prices (USD) for cost dashboards; override anytime.
const PRICES: Partial<Record<ProviderName, { in: number; out: number }>> = {
  openai: { in: 0.00015, out: 0.0006 }, anthropic: { in: 0.003, out: 0.015 },
  gemini: { in: 0.000075, out: 0.0003 }, groq: { in: 0.00005, out: 0.00008 },
  nvidia: { in: 0, out: 0 }, ollama: { in: 0, out: 0 },
}
function record(r: ChatResult, userId?: string) {
  const p = PRICES[r.provider]
  const costUsd = p ? (r.usage.promptTokens / 1000) * p.in + (r.usage.completionTokens / 1000) * p.out : undefined
  try { usageSink({ provider: r.provider, model: r.model, usage: r.usage, latencyMs: r.latencyMs, userId, costUsd }) } catch {}
}

// ---- optional response cache (deterministic JSON calls only) ----
const cache = new Map<string, { text: string; exp: number }>()
const CACHE_TTL_MS = 5 * 60_000
function cacheKey(req: ChatRequest, provider: ProviderName) {
  return `${provider}:${req.model || ''}:${JSON.stringify(req.system || '')}:${JSON.stringify(req.messages)}`
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function resolveChain(opts?: ChatOptions): ProviderName[] {
  const want = opts?.providers && opts.providers.length ? opts.providers : CHAINS[opts?.tier || 'default']
  const seen = new Set<ProviderName>()
  return want.filter((n) => {
    if (seen.has(n)) return false
    seen.add(n)
    const prov = getProvider(n)
    return prov && prov.configured()
  })
}

/** Core call: tries the provider chain with retries + circuit breaker, returns the first success. */
export async function chat(req: ChatRequest, opts?: ChatOptions): Promise<ChatResult> {
  const chain = resolveChain(opts)
  if (!chain.length) throw new AiError('No LLM provider is configured', 'no_provider')
  const retries = opts?.retries ?? 2
  let lastErr: unknown

  for (const name of chain) {
    if (breakerOpen(name)) continue
    const provider = getProvider(name)
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (opts?.cache) {
          const key = cacheKey(req, name)
          const hit = cache.get(key)
          if (hit && hit.exp > Date.now()) return { text: hit.text, provider: name, model: req.model || provider.defaultModel, usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }, latencyMs: 0 }
          const res = await provider.chat(req)
          cache.set(key, { text: res.text, exp: Date.now() + CACHE_TTL_MS })
          breakerOk(name); record(res, opts?.userId); return res
        }
        const res = await provider.chat(req)
        breakerOk(name); record(res, opts?.userId); return res
      } catch (e) {
        lastErr = e
        const retryable = e instanceof AiError ? e.retryable : true
        if (retryable && attempt < retries) {
          await sleep(200 * 2 ** attempt + Math.random() * 150) // backoff + jitter
          continue
        }
        breakerFail(name)
        break // move to next provider
      }
    }
  }
  if (lastErr instanceof AiError) throw lastErr
  throw new AiError('All providers failed', 'all_failed')
}

/** Strongly-typed JSON call: forces JSON, extracts + parses. */
export async function chatJson<T>(req: ChatRequest, opts?: ChatOptions): Promise<T> {
  const res = await chat({ ...req, json: true }, opts)
  try {
    return JSON.parse(extractJson(res.text)) as T
  } catch {
    throw new AiError('Model did not return valid JSON', 'bad_json', res.provider)
  }
}

function parseWith<T>(schema: ZodSchema<T>, text: string): { ok: true; value: T } | { ok: false; error: string } {
  let json: unknown
  try {
    json = JSON.parse(extractJson(text))
  } catch {
    return { ok: false, error: 'response was not valid JSON' }
  }
  const res = schema.safeParse(json)
  if (res.success) return { ok: true, value: res.data }
  return { ok: false, error: res.error.issues.map((i) => `${i.path.join('.') || 'root'}: ${i.message}`).slice(0, 5).join('; ') }
}

/**
 * Schema-validated JSON call. Validates the model output against a Zod contract;
 * on failure it asks the model to repair its JSON once, and if that still fails it
 * throws `schema_invalid` so the calling route can fall back deterministically.
 * No malformed JSON ever reaches a user.
 */
export async function chatJsonSafe<T>(schema: ZodSchema<T>, req: ChatRequest, opts?: ChatOptions): Promise<T> {
  const first = await chat({ ...req, json: true }, opts)
  const a = parseWith(schema, first.text) as ({ ok: true; value: T } | { ok: false; error: string }) & { error?: string }
  if (a.ok) return a.value

  const repair: ChatRequest = {
    ...req,
    json: true,
    messages: [
      ...req.messages,
      { role: 'assistant', content: first.text.slice(0, 4000) },
      { role: 'user', content: `Your previous reply failed validation (${a.error}). Reply again with ONLY corrected JSON that matches the required schema exactly — no prose, no markdown.` },
    ],
  }
  const second = await chat(repair, { ...opts, retries: 0 })
  const b = parseWith(schema, second.text) as ({ ok: true; value: T } | { ok: false; error: string }) & { error?: string }
  if (b.ok) return b.value
  throw new AiError(`AI output failed schema validation: ${b.error}`, 'schema_invalid', second.provider)
}

export function listConfiguredProviders(): ProviderName[] {
  return allProviders().filter((p) => p.configured()).map((p) => p.name)
}
