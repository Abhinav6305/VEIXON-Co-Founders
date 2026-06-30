export const VEIXON_COMPANY = 'VEIXON Tech'
export const VEIXON_COMPANY_MENTION = '@VEIXON Tech'
export const VEIXON_PRODUCT = 'VEIXON Co-founders'

type FounderShareInput = {
  day?: number | string
  week?: number | string
  task?: string
  shareAngle?: string
  missionCode?: string
  startupName?: string
  completionRate?: number
  completedCount?: number
  totalTasks?: number
}

function cleanText(value?: string) {
  return (value || '').replace(/\s+/g, ' ').trim()
}

export function buildFounderLinkedInPost(input: FounderShareInput = {}) {
  const day = Number(input.day || 1)
  const week = Number(input.week || 1)
  const totalTasks = Math.max(1, Number(input.totalTasks || 90))
  const completedCount = Number(input.completedCount || 0)
  const completionRate =
    typeof input.completionRate === 'number'
      ? Math.round(input.completionRate * (input.completionRate <= 1 ? 100 : 1))
      : completedCount
        ? Math.round((completedCount / totalTasks) * 100)
        : null
  const focus = cleanText(input.task || input.shareAngle) || 'logged one more execution signal'
  const mission = cleanText(input.missionCode)
  const startup = cleanText(input.startupName)
  const startupLine = startup ? ` while building ${startup}` : ''

  const progressLine = completedCount
    ? `${completedCount}/${totalTasks} execution tasks completed${completionRate !== null ? ` (${completionRate}%)` : ''}`
    : `Day ${day}/90 logged`

  return [
    `Just completed Day ${day} of my 90-day war plan${startupLine}.`,
    '',
    `Today's mission: ${focus}.`,
    '',
    'What moved forward:',
    `- Progress: ${progressLine}`,
    `- Focus: Week ${week}${mission ? `, ${mission}` : ''}`,
    "- Proof: one more task moved from intention to evidence",
    '',
    `${VEIXON_PRODUCT}, a product by ${VEIXON_COMPANY_MENTION}, is helping me turn founder chaos into daily execution, accountability, and proof.`,
    '',
    '#BuildingInPublic #Startup #FounderJourney #VEIXON',
  ].join('\n')
}

export function buildLinkedInShareUrl(postText: string) {
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(postText)}`
}
