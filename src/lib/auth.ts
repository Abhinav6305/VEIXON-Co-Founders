import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.id) token.sub = user.id
      if (account?.providerAccountId) token.sub = account.providerAccountId
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      }
    },
  },
  events: {
    // First/every sign-in - send a one-time welcome email (idempotent via EmailLog).
    async signIn({ user }) {
      try {
        if (!user?.email) return
        const { dispatchEmail } = await import('@/lib/email/service')
        const { welcomeEmail } = await import('@/lib/email/templates')
        const { subject, html } = welcomeEmail(user.name || user.email.split('@')[0])
        await dispatchEmail({ type: 'welcome', to: user.email, userId: (user as any).id, subject, html, once: true })
      } catch {
        /* never block sign-in on email */
      }
    },
  },
  pages: {
    signIn: '/auth',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
