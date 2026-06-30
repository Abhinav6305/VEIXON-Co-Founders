import { randomUUID } from 'crypto'
import prisma from './prisma'
import type { StartupRecord } from './types'

export function newId(prefix: string) {
  return `${prefix}_${randomUUID()}`
}

const startupInclude = {
  completedTasks: { orderBy: { completedAt: 'asc' as const } },
  dayDebriefs: { orderBy: [{ week: 'asc' as const }, { day: 'asc' as const }] },
  weekAnalyses: { orderBy: { week: 'asc' as const } },
  weekUnlockStatus: { orderBy: { week: 'asc' as const } },
  competitorNotes: true,
  tractionDetails: true,
  introRequests: true,
  taskEdits: true,
  pivotAlerts: true,
  decisionFollowUps: true,
}

function parseJson(value: any, fallback: any = null) {
  if (value === null || value === undefined) return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export async function saveStartup(record: any) {
  // Prisma needs JSON to be stringified for string fields, but since record is loosely typed here,
  // we serialize complex nested objects.
  // Drop relation fields that callers pass as plain arrays (e.g. completedTasks: []).
  // Prisma rejects scalar arrays on relation fields, so strip them out before create.
  const {
    completedTasks,
    taskEdits,
    tractionDetails,
    introRequests,
    pivotAlerts,
    competitorNotes,
    dayDebriefs,
    weekAnalyses,
    decisionFollowUps,
    weekUnlockStatus,
    workspaces,
    decisions,
    ...scalar
  } = record

  const serializedRecord = {
    ...scalar,
    scorecardJson: record.scorecardJson ? JSON.stringify(record.scorecardJson) : null,
    warPlanJson: record.warPlanJson ? JSON.stringify(record.warPlanJson) : null,
    devilsAdvocateJson: record.devilsAdvocateJson ? JSON.stringify(record.devilsAdvocateJson) : null,
    founderDNA: record.founderDNA ? JSON.stringify(record.founderDNA) : null,
    marketIntelligence: record.marketIntelligence ? JSON.stringify(record.marketIntelligence) : null,
    competitorAwarenessAnswers: record.competitorAwarenessAnswers ? JSON.stringify(record.competitorAwarenessAnswers) : null,
    trackedCompetitors: record.trackedCompetitors ? JSON.stringify(record.trackedCompetitors) : null,
  }

  const result = await prisma.startup.create({
    data: serializedRecord
  })
  return result
}

function parseStartup(found: any) {
  if (!found) return null
  return {
    ...found,
    scorecardJson: parseJson(found.scorecardJson),
    warPlanJson: parseJson(found.warPlanJson, []),
    devilsAdvocateJson: parseJson(found.devilsAdvocateJson, []),
    founderDNA: parseJson(found.founderDNA),
    marketIntelligence: parseJson(found.marketIntelligence),
    competitorAwarenessAnswers: parseJson(found.competitorAwarenessAnswers, []),
    trackedCompetitors: parseJson(found.trackedCompetitors, []),
    dayDebriefs: (found.dayDebriefs || []).map((debrief: any) => ({
      ...debrief,
      prepAnswers: parseJson(debrief.prepAnswers, []),
      executionNotes: parseJson(debrief.executionNotes, []),
      subStepsCompleted: parseJson(debrief.subStepsCompleted, []),
      debrief: parseJson(debrief.debrief, {}),
    })),
    weekAnalyses: (found.weekAnalyses || []).map((analysis: any) => ({
      ...analysis,
      patterns: parseJson(analysis.patterns, []),
      warnings: parseJson(analysis.warnings, []),
      strengths: parseJson(analysis.strengths, []),
    })),
    pivotAlerts: (found.pivotAlerts || []).map((alert: any) => ({
      ...alert,
      signals: parseJson(alert.signals, []),
    })),
  }
}

export async function getStartupById(id: string) {
  const found = await prisma.startup.findUnique({ where: { id }, include: startupInclude })
  return parseStartup(found)
}

export const getStartup = getStartupById

export async function getLatestStartup(userId: string) {
  const found = await prisma.startup.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: startupInclude,
  })
  return parseStartup(found)
}

export async function updateStartup(id: string, update: any) {
  const {
    completedTasks,
    taskEdits,
    tractionDetails,
    introRequests,
    pivotAlerts,
    competitorNotes,
    dayDebriefs,
    weekAnalyses,
    decisionFollowUps,
    weekUnlockStatus,
    workspaces,
    decisions,
    ...scalarUpdate
  } = update

  const serializedUpdate = {
    ...scalarUpdate,
    scorecardJson: update.scorecardJson ? JSON.stringify(update.scorecardJson) : undefined,
    warPlanJson: update.warPlanJson ? JSON.stringify(update.warPlanJson) : undefined,
    devilsAdvocateJson: update.devilsAdvocateJson ? JSON.stringify(update.devilsAdvocateJson) : undefined,
    founderDNA: update.founderDNA ? JSON.stringify(update.founderDNA) : undefined,
    marketIntelligence: update.marketIntelligence ? JSON.stringify(update.marketIntelligence) : undefined,
    competitorAwarenessAnswers: update.competitorAwarenessAnswers ? JSON.stringify(update.competitorAwarenessAnswers) : undefined,
    trackedCompetitors: update.trackedCompetitors ? JSON.stringify(update.trackedCompetitors) : undefined,
  }
  
  await prisma.startup.update({
    where: { id },
    data: serializedUpdate
  })
}

export async function saveDecision(record: any) {
  const serializedRecord = {
    ...record,
    optionsJson: record.optionsJson ? JSON.stringify(record.optionsJson) : null,
    scenariosJson: record.scenariosJson ? JSON.stringify(record.scenariosJson) : null,
  }
  return await prisma.decision.create({ data: serializedRecord })
}

function parseDecision(found: any) {
  if (!found) return null
  return {
    ...found,
    optionsJson: found.optionsJson ? JSON.parse(found.optionsJson) : null,
    scenariosJson: found.scenariosJson ? JSON.parse(found.scenariosJson) : null,
  }
}

export async function getDecisionById(id: string) {
  const found = await prisma.decision.findUnique({ where: { id } })
  return parseDecision(found)
}

export async function listDecisions(userId: string) {
  // We need to fetch decisions for startups owned by this user
  const startups = await prisma.startup.findMany({
    where: { userId },
    select: { id: true }
  })
  const startupIds = startups.map(s => s.id)

  const found = await prisma.decision.findMany({
    where: { startupId: { in: startupIds } },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  return found.map(parseDecision)
}

export async function saveCheckin(record: any) {
  const serializedRecord = {
    ...record,
    tasksJson: record.tasksJson ? JSON.stringify(record.tasksJson) : null,
  }
  return await prisma.checkin.create({ data: serializedRecord })
}

function parseCheckin(found: any) {
  if (!found) return null
  return {
    ...found,
    tasksJson: found.tasksJson ? JSON.parse(found.tasksJson) : null,
  }
}

export async function getCheckinById(id: string) {
  const found = await prisma.checkin.findUnique({ where: { id } })
  return parseCheckin(found)
}

export async function getLatestCheckin(userId: string) {
  const found = await prisma.checkin.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })
  return parseCheckin(found)
}
