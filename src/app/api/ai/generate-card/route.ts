import { callClaudeJson } from '@/lib/anthropic'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cardType, weekNumber, founderName, startupName, completionRate, accountabilityScore, tractionProof, customMessage } = body

    if (!cardType || !founderName || !startupName) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const system = `You are VZN, generating shareable founder progress cards.

Return ONLY valid JSON:
{
  "title": "card title",
  "headline": "main message (max 50 chars)",
  "body": "card body text (max 200 chars)",
  "stat1Label": "label",
  "stat1Value": "value",
  "stat2Label": "label",
  "stat2Value": "value",
  "linkedInPostText": "post text for LinkedIn share. It must mention VEIXON Co-founders, a product by @VEIXON Tech, and include #BuildingInPublic"
}`

    const input = `Generate a ${cardType} card for:
Founder: ${founderName}
Startup: ${startupName}
Week: ${weekNumber || 'N/A'}
Completion Rate: ${completionRate || 'N/A'}%
Accountability Score: ${accountabilityScore || 'N/A'}%
Traction: ${tractionProof ? 'Yes' : 'No'}
${customMessage ? `Custom message: ${customMessage}` : ''}

Create a compelling card with LinkedIn-ready text.`

    const result = await callClaudeJson<{
      title: string
      headline: string
      body: string
      stat1Label: string
      stat1Value: string
      stat2Label: string
      stat2Value: string
      linkedInPostText: string
    }>({
      system,
      body: { text: input },
      maxTokens: 800,
    })

    return Response.json(result)
  } catch (error) {
    console.error('Generate card error:', error)
    return Response.json({ error: 'AI unavailable', fallback: true }, { status: 500 })
  }
}
