'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User as UserIcon } from "lucide-react"
import { User } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { cn } from "@/lib/utils"
import { getUserDisplayName, getUserAvatarUrl } from '@/lib/utils/user-display'
import { Minus } from "lucide-react"

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
  const [showCreditDeduction, setShowCreditDeduction] = useState(false)

  // 获取头像URL
  useEffect(() => {
    if (user) {
      const newAvatarUrl = getUserAvatarUrl(user);
      setAvatarUrl(newAvatarUrl);
    } else {
      setAvatarUrl(null);
    }
  }, [user]);

  // 监听积分扣减事件
  useEffect(() => {
    const handleCreditDeduction = (event: CustomEvent) => {
      if (event.detail?.amount) {
        setShowCreditDeduction(true)
        // 3秒后自动隐藏
        setTimeout(() => {
          setShowCreditDeduction(false)
        }, 3000)
      }
    }

    window.addEventListener('creditDeducted', handleCreditDeduction as EventListener)
    
    return () => {
      window.removeEventListener('creditDeducted', handleCreditDeduction as EventListener)
    }
  }, [])

  const handleImageError = () => {
    // Image load error
    setImageError(true)
  }

  const handleImageLoad = () => {
    // Image loaded successfully
    setImageError(false)
  }

  return (
    <div className="relative">
      <Avatar className={cn(sizeClasses[size], className)}>
        {avatarUrl && !imageError ? (
          <AvatarImage 
            src={avatarUrl} 
            alt={getUserDisplayName(user)}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : null}
        {/* 始终显示备用头像，如果没有头像URL或图片加载失败 */}
        <AvatarFallback className="bg-[--color-primary-10] text-primary">
          <UserIcon className={iconSizes[size]} />
        </AvatarFallback>
      </Avatar>
      
      {/* 积分扣减气泡 */}
      {showCreditDeduction && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-bounce shadow-lg border-2 border-white">
          <Minus className="h-3 w-3" />
          <span className="ml-0.5">1</span>
        </div>
      )}
    </div>
  )
}
