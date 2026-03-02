'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: (postAuthRedirectPath?: string) => Promise<void>
  signInWithMagicLink: (email: string, postAuthRedirectPath?: string) => Promise<void>
  verifyEmailCode: (email: string, code: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const snapshotRef = useRef<string>('initial')

  const persistPostAuthRedirect = useCallback((postAuthRedirectPath?: string) => {
    if (typeof window === 'undefined') {
      return
    }

    const fallbackPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const targetPath = (postAuthRedirectPath || fallbackPath).trim() || fallbackPath
    sessionStorage.setItem('post_auth_redirect', targetPath)
  }, [])

  const syncAuthState = useCallback((nextSession: Session | null) => {
    const nextUser = nextSession?.user ?? null
    const profileSnapshot = [
      nextUser?.updated_at ?? '',
      nextUser?.user_metadata?.display_name ?? '',
      nextUser?.user_metadata?.avatar_url ?? '',
      nextUser?.user_metadata?.picture ?? '',
    ].join('|')
    const nextSnapshot = [
      nextUser?.id ?? 'anonymous',
      nextSession?.access_token ?? 'no-token',
      nextSession?.expires_at ?? 0,
      profileSnapshot,
    ].join(':')

    // 跳过重复更新，避免全局重复渲染和副作用
    if (snapshotRef.current === nextSnapshot) {
      return
    }

    snapshotRef.current = nextSnapshot
    setSession(nextSession)
    setUser(nextUser)
  }, [])

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!isMounted) return
        if (error) {
          console.error('Failed to get auth session:', error)
          syncAuthState(null)
          return
        }
        syncAuthState(data.session ?? null)
      } catch (error) {
        if (!isMounted) return
        console.error('Unexpected auth initialization error:', error)
        syncAuthState(null)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return
      syncAuthState(nextSession ?? null)
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [syncAuthState])

  const signInWithGoogle = useCallback(async (postAuthRedirectPath?: string) => {
    persistPostAuthRedirect(postAuthRedirectPath)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    if (error) {
      // Error signing in with Google
      throw error
    }
  }, [persistPostAuthRedirect])

  const signInWithMagicLink = useCallback(async (email: string, postAuthRedirectPath?: string) => {
    if (typeof window === 'undefined') {
      throw new Error('Magic link sign in is only available in the browser')
    }

    const normalizedEmail = email.trim()
    if (!normalizedEmail) {
      throw new Error('Email is required')
    }

    persistPostAuthRedirect(postAuthRedirectPath)

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw error
    }
  }, [persistPostAuthRedirect])

  const verifyEmailCode = useCallback(async (email: string, code: string) => {
    if (typeof window === 'undefined') {
      throw new Error('Email code verification is only available in the browser')
    }

    const normalizedEmail = email.trim()
    const normalizedCode = code.trim()

    if (!normalizedEmail) {
      throw new Error('Email is required')
    }

    if (!/^\d{6}$/.test(normalizedCode)) {
      throw new Error('Please enter a valid 6-digit code')
    }

    const { error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedCode,
      type: 'email',
    })

    if (error) {
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      syncAuthState(null)
    } finally {
      setLoading(false)
    }
  }, [syncAuthState])

  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithMagicLink,
    verifyEmailCode,
    signOut,
  }), [user, session, loading, signInWithGoogle, signInWithMagicLink, verifyEmailCode, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
