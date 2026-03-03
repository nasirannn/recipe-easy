'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User as UserIcon } from "lucide-react"
import { User } from '@supabase/supabase-js'
import { useState, useEffect, useMemo } from 'react'
import { cn } from "@/lib/utils"
import { getUserAvatarCandidates, getUserDisplayName } from '@/lib/utils/user-display'
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
  const avatarCandidates = useMemo(() => getUserAvatarCandidates(user), [user])
  const candidateSignature = avatarCandidates.join('|')
  const [avatarCandidateIndex, setAvatarCandidateIndex] = useState(0)
  const [showCreditDeduction, setShowCreditDeduction] = useState(false)
  const currentAvatarUrl = avatarCandidates[avatarCandidateIndex] ?? null

  useEffect(() => {
    setAvatarCandidateIndex(0)
  }, [candidateSignature])

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
    setAvatarCandidateIndex((previousIndex) => {
      const nextIndex = previousIndex + 1
      return nextIndex < avatarCandidates.length ? nextIndex : avatarCandidates.length
    })
  }

  return (
    <div className="relative">
      <Avatar className={cn(sizeClasses[size], className)}>
        {currentAvatarUrl ? (
          <AvatarImage 
            src={currentAvatarUrl} 
            alt={getUserDisplayName(user)}
            onError={handleImageError}
          />
        ) : null}
        {showFallback ? (
          <AvatarFallback className="bg-[--color-primary-10] text-primary">
            <UserIcon className={iconSizes[size]} />
          </AvatarFallback>
        ) : null}
      </Avatar>
      
      {/* 积分扣减气泡 */}
      {showCreditDeduction && (
        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-destructive text-xs font-bold text-destructive-foreground animate-bounce shadow-lg">
          <Minus className="h-3 w-3" />
          <span className="ml-0.5">1</span>
        </div>
      )}
    </div>
  )
}
