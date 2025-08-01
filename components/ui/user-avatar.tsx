'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User as UserIcon } from "lucide-react"
import { User } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { cn } from "@/lib/utils"
import { getUserDisplayName, getUserAvatarUrl } from '@/lib/utils/user-display'

interface UserAvatarProps {
  user: User | null
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

  // 获取头像URL
  useEffect(() => {
    if (!user) {
      setAvatarUrl(null)
      setImageError(false)
      return
    }

    const newAvatarUrl = getUserAvatarUrl(user)

    // 只有当URL真正改变时才更新
    if (newAvatarUrl !== avatarUrl) {
      setAvatarUrl(newAvatarUrl)
      setImageError(false)
    }
  }, [user, avatarUrl])

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
          alt={getUserDisplayName(user)}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      ) : null}
      {showFallback && (
        <AvatarFallback className="bg-primary/10 text-primary">
          <UserIcon className={iconSizes[size]} />
        </AvatarFallback>
      )}
    </Avatar>
  )
}
