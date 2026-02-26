'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const snapshotRef = useRef<string>('initial')

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

  const signInWithGoogle = useCallback(async () => {
    if (typeof window !== 'undefined') {
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
      sessionStorage.setItem('post_auth_redirect', currentPath)
    }

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
    signOut,
  }), [user, session, loading, signInWithGoogle, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
