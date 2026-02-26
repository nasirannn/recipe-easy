'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function resolvePostAuthRedirect(): string {
  if (typeof window === 'undefined') {
    return '/'
  }

  const saved = sessionStorage.getItem('post_auth_redirect')
  sessionStorage.removeItem('post_auth_redirect')

  if (!saved || !saved.startsWith('/')) {
    return '/'
  }

  if (saved.startsWith('/auth/callback')) {
    return '/'
  }

  return saved
}

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const finalizeOAuth = async () => {
      const params = new URLSearchParams(window.location.search)
      const error = params.get('error')
      const code = params.get('code')

      if (error) {
        router.replace('/?error=auth_failed')
        return
      }

      if (!code) {
        router.replace('/?error=missing_code')
        return
      }

      try {
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
      } catch (exchangeUnexpectedError) {
        if (cancelled) {
          return
        }
        console.error('Unexpected OAuth callback error:', exchangeUnexpectedError)
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
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Signing you in...</span>
      </div>
    </main>
  )
}
