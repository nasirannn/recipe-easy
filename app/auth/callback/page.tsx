'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EmailOtpType } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { sanitizePostAuthPath } from '@/lib/utils/auth-path'

function resolvePostAuthRedirect(): string {
  if (typeof window === 'undefined') {
    return '/'
  }

  const saved = sessionStorage.getItem('post_auth_redirect')
  sessionStorage.removeItem('post_auth_redirect')

  return sanitizePostAuthPath(saved) || '/'
}

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const finalizeOAuth = async () => {
      const params = new URLSearchParams(window.location.search)
      const error = params.get('error')
      const code = params.get('code')
      const tokenHash = params.get('token_hash')
      const type = params.get('type')

      if (error) {
        router.replace('/?error=auth_failed')
        return
      }

      try {
        if (tokenHash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          })

          if (cancelled) {
            return
          }

          if (verifyError) {
            console.error('Magic link verification failed:', verifyError)
            router.replace('/?error=auth_failed')
            return
          }

          router.replace(resolvePostAuthRedirect())
          return
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (cancelled) {
            return
          }

          if (exchangeError) {
            console.error('OAuth code exchange failed:', exchangeError)
            router.replace('/?error=auth_failed')
            return
          }

          router.replace(resolvePostAuthRedirect())
          return
        }

        if (cancelled) {
          return
        }

        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Failed to get auth session from callback:', sessionError)
          router.replace('/?error=auth_failed')
          return
        }

        if (data.session) {
          router.replace(resolvePostAuthRedirect())
          return
        }

        router.replace('/?error=missing_code')
      } catch (exchangeUnexpectedError) {
        if (cancelled) {
          return
        }
        console.error('Unexpected auth callback error:', exchangeUnexpectedError)
        router.replace('/?error=unexpected')
      }
    }

    finalizeOAuth()

    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground" aria-live="polite">
        <h1 className="sr-only">Authentication callback</h1>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Signing you in...</span>
      </div>
    </main>
  )
}
