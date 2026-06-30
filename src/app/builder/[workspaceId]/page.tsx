'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import AppShell from '@/components/AppShell'

export default function WorkspacePage() {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const [statusData, setStatusData] = useState<any>(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/builder/status?workspaceId=${workspaceId}`)
        const data = await res.json()
        setStatusData(data)
      } catch (e) {
        console.error('Failed to fetch workspace status:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = window.setInterval(fetchStatus, 5000)
    return () => window.clearInterval(interval)
  }, [workspaceId])

  const submitFeedback = async (artifactId: string) => {
    setBusyId(artifactId)
    try {
      await fetch('/api/builder/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifactId, feedback }),
      })
      setFeedback('')
    } finally {
      setBusyId(null)
    }
  }

  const approveArtifact = async (artifactId: string) => {
    setBusyId(artifactId)
    try {
      await fetch('/api/builder/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifactId }),
      })
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <AppShell title="Builder Workspace" subtitle="Agents, artifacts, and review loops.">
        <div className="vzn-page-pad grid min-h-[calc(100vh-120px)] place-items-center">
          <div className="vzn-panel rounded-[1.5rem] p-6">
            <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
              <Loader2 className="h-5 w-5 animate-spin text-[var(--purple)]" />
              Loading workspace...
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  const artifacts = statusData?.artifacts || []
  const jobs = statusData?.jobs || []

  return (
    <AppShell
      title="Builder Workspace"
      subtitle="Review generated product artifacts before they move forward."
      actions={<span className="vzn-status-pill">{statusData?.status || 'planning'}</span>}
    >
      <div className="vzn-page-pad">
        <div className="vzn-page-center">
          <div className="mb-8">
            <div className="vzn-section-label">AI Product Builder</div>
            <h1 className="mt-2 text-3xl font-bold">Workspace Review</h1>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--text-muted)' }}>
              Agents generate artifacts here. Approve the useful ones, send feedback on the rough ones.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              {artifacts.length === 0 ? (
                <div className="vzn-panel flex items-center gap-3 rounded-2xl p-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--purple)]" />
                  No artifacts generated yet. Agents are thinking...
                </div>
              ) : (
                artifacts.map((artifact: any) => {
                  const artifactId = artifact.id || artifact._id

                  return (
                    <div key={artifactId} className="vzn-panel veixon-lift veixon-rise rounded-2xl p-6">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold capitalize">
                          {artifact.artifactType} Document (v{artifact.version})
                        </h2>
                        {artifact.isApproved ? (
                          <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: 'color-mix(in srgb, var(--teal) 18%, transparent)', color: 'var(--teal)' }}>
                            Approved
                          </span>
                        ) : (
                          <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ background: 'color-mix(in srgb, var(--amber) 18%, transparent)', color: 'var(--amber)' }}>
                            Review Required
                          </span>
                        )}
                      </div>

                      <div className="mb-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl p-4 font-mono text-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                        {typeof artifact.content === 'string' ? artifact.content : JSON.stringify(artifact.content, null, 2)}
                      </div>

                      {!artifact.isApproved && (
                        <div className="space-y-4">
                          <textarea
                            className="vzn-input w-full rounded-xl p-3 text-[var(--text-primary)]"
                            placeholder="Provide feedback to the agent to revise this document..."
                            rows={3}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                          />
                          <div className="flex flex-wrap gap-4">
                            <button
                              onClick={() => submitFeedback(artifactId)}
                              disabled={busyId === artifactId}
                              className="vzn-button-ghost inline-flex items-center gap-2 rounded-lg border px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busyId === artifactId && <Loader2 className="h-4 w-4 animate-spin" />}
                              Request Revision
                            </button>
                            <button
                              onClick={() => approveArtifact(artifactId)}
                              disabled={busyId === artifactId}
                              className="vzn-button-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busyId === artifactId && <Loader2 className="h-4 w-4 animate-spin" />}
                              Approve &amp; Proceed
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="vzn-panel sticky top-24 rounded-2xl p-6">
                <h3 className="mb-4 text-lg font-semibold">Agent Activity</h3>
                <div className="max-h-[80vh] space-y-4 overflow-y-auto">
                  {jobs.length === 0 && (
                    <div className="vzn-skeleton-card grid place-items-center p-5 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      No agent jobs yet.
                    </div>
                  )}
                  {jobs.map((job: any) => (
                    <div key={job.id || job._id} className="border-l-2 py-2 pl-4" style={{ borderColor: 'var(--teal)' }}>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{job.agentRole}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : job.status || 'pending'}
                      </p>
                      <div className="mt-2 space-y-1">
                        {(job.logs || []).map((log: any, i: number) => (
                          <p key={i} className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            &gt; {typeof log === 'string' ? log : log.message}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
