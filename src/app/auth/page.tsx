'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import ThemeToggle from '@/components/ui/ThemeToggle'
import VZNAvatar from '@/components/ui/VZNAvatar'

const AuthCanvas = dynamic(() => import('@/components/landing/AuthCanvas'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[var(--bg-primary)]" />,
})

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="rgb(66, 133, 244)" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="rgb(52, 168, 83)" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="rgb(251, 188, 5)" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="rgb(234, 67, 53)" />
    </svg>
  )
}

function AuthCard() {
  const router = useRouter()
  const params = useSearchParams()
  const { status } = useSession()
  const error = params.get('error')
  const [fromUnlock, setFromUnlock] = useState(false)
  const googleBlockedLocally = error === 'OAuthSignin' || error === 'OAuthCallback'
  const errorMessage = 'Google sign-in failed. Please try again.'

  useEffect(() => {
    if (status === 'authenticated') router.replace('/routing')
  }, [router, status])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage.getItem('veixon_pending_idea')) setFromUnlock(true)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="vzn-panel-strong relative z-10 w-full max-w-[420px] rounded-[1.5rem] p-8 text-center md:p-10"
    >
      <VZNAvatar size="lg" className="mx-auto mb-6" />
      <h1 className="text-xl font-semibold">{fromUnlock ? 'Unlock your full war plan' : 'VEIXON Co-founders'}</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
        {fromUnlock ? 'Log in or create an account to unlock the full war plan.' : 'Your AI co-founder is ready.'}
      </p>
      <div className="my-8 h-px w-full" style={{ background: 'var(--border)' }} />
      {error && (
        <div
          className="mb-5 rounded-xl border px-4 py-3 text-left text-sm"
          style={{
            borderColor: googleBlockedLocally ? 'var(--purple)' : 'var(--amber)',
            background: googleBlockedLocally ? 'color-mix(in srgb, var(--purple) 8%, transparent)' : 'color-mix(in srgb, var(--amber) 10%, transparent)',
            color: googleBlockedLocally ? 'var(--text-secondary)' : 'var(--amber)',
          }}
        >
          {errorMessage}
        </div>
      )}
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl: '/routing' })}
        className="focus-ring flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 font-medium"
        style={{ color: 'white', background: 'var(--purple)', boxShadow: '0 16px 40px color-mix(in srgb, var(--purple) 24%, transparent)' }}
      >
        <GoogleIcon />
        Continue with Google
      </button>
      <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>No credit card required. Free to start.</p>
      <p className="mt-5 text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        By continuing you agree to our <Link href="#" className="underline text-[var(--purple)]">Terms</Link> and{' '}
        <Link href="#" className="underline text-[var(--purple)]">Privacy Policy</Link>.
      </p>
    </motion.div>
  )
}

export default function AuthPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-primary)] px-6 py-10">
      <div className="fixed inset-0 z-0 opacity-80">
        <AuthCanvas />
      </div>
      <div className="fixed right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <Suspense fallback={null}>
        <AuthCard />
      </Suspense>
    </main>
  )
}
