'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createSupabaseClient } from '@/lib/supabase'
import { getSuggestedDisplayName, updateUserDisplayName } from '@/lib/utils/user-display'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  isAdmin: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  const saveUserDisplayName = async (user: User) => {
    try {
      // If user doesn't have a custom display_name, save the beautified email prefix
      if (!user.user_metadata?.display_name) {
        const suggestedName = getSuggestedDisplayName(user)
        await updateUserDisplayName(user, suggestedName)
      }
    } catch (error) {
      console.error('Failed to save user display name:', error)
    }
  }

  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: refreshedUser }, error } = await supabase.auth.getUser()
      if (error) {
        // 对于AuthSessionMissingError，这是正常的，不需要记录错误
        if (error.message !== 'Auth session missing!') {
          console.error('Error refreshing user:', error)
        }
        return
      }
      
      setUser(refreshedUser)
    } catch (error) {
      // 对于AuthSessionMissingError，这是正常的，不需要记录错误
      if (error instanceof Error && error.message !== 'Auth session missing!') {
        console.error('Failed to refresh user:', error)
      }
    }
  }, [supabase.auth])

  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    try {
      if (session?.user) {
        // 先设置用户
        setUser(session.user)
        // 然后保存显示名称
        await saveUserDisplayName(session.user)
        // 保存后重新获取最新用户数据
        setTimeout(async () => {
          try {
            const { data: { user: latestUser } } = await supabase.auth.getUser()
            if (latestUser) {
              setUser(latestUser)
            }
          } catch (error) {
            console.error('Error getting latest user:', error)
          }
        }, 500)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error in auth state change:', error)
      setUser(null)
    }
    
    setLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          // 对于AuthSessionMissingError，这是正常的，不需要记录错误
          if (error.message !== 'Auth session missing!') {
            console.error('Error getting user:', error)
          }
          setUser(null)
          setLoading(false)
          return
        }
        
        if (mounted) {
          if (user) {
            setUser(user)
            await saveUserDisplayName(user)
            // 保存后获取最新数据
            const { data: { user: latestUser } } = await supabase.auth.getUser()
            if (latestUser && mounted) {
              setUser(latestUser)
            }
          }
          setLoading(false)
        }
      } catch (error) {
        // 对于AuthSessionMissingError，这是正常的，不需要记录错误
        if (error instanceof Error && error.message !== 'Auth session missing!') {
          console.error('Failed to initialize auth:', error)
        }
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)
    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth, handleAuthStateChange])

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'user'
        }
      }
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      throw error
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      throw error
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          role: 'user'
        }
      },
    })

    if (error) {
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    
    if (error) {
      throw error
    }
  }

  const isAdmin = user?.user_metadata?.role === 'admin'

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    isAdmin,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
