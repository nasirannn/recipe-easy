'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"
import { User as SupabaseUser } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  user: SupabaseUser | null
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showFallback?: boolean
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-12 w-12',
  xl: 'h-24 w-24'
}

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-6 w-6', 
  xl: 'h-12 w-12'
}

export function UserAvatar({ 
  user, 
  className, 
  size = 'md', 
  showFallback = true 
}: UserAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  // 获取头像URL的优先级：avatar_url > picture > null
  useEffect(() => {
    if (!user) {
      setAvatarUrl(null)
      setImageError(false)
      return
    }

    const newAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null
    
    // 只有当URL真正改变时才更新
    if (newAvatarUrl !== avatarUrl) {
      setAvatarUrl(newAvatarUrl)
      setImageError(false)
    }
  }, [user?.user_metadata?.avatar_url, user?.user_metadata?.picture, user?.id])

  // 获取用户显示名称
  const getDisplayName = () => {
    if (!user) return ''
    return user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.email?.split('@')[0] || 
           'User'
  }

  // 获取用户首字母
  const getInitials = () => {
    const displayName = getDisplayName()
    if (!displayName) return 'U'
    
    const names = displayName.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return displayName.slice(0, 2).toUpperCase()
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const handleImageLoad = () => {
    setImageError(false)
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarUrl && !imageError ? (
        <AvatarImage 
          src={avatarUrl} 
          alt={getDisplayName()}
          onError={handleImageError}
          onLoad={handleImageLoad}
          // 添加时间戳防止缓存
          key={`${avatarUrl}-${Date.now()}`}
        />
      ) : null}
      {showFallback && (
        <AvatarFallback className="bg-primary text-primary-foreground">
          {user ? getInitials() : <User className={iconSizes[size]} />}
        </AvatarFallback>
      )}
    </Avatar>
  )
}
