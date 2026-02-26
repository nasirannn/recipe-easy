"use client"

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { User } from '@supabase/supabase-js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Loader2, UserRound } from 'lucide-react'
import {
  getSuggestedDisplayName,
  getUserAvatarUrl,
  updateUserProfile,
} from '@/lib/utils/user-display'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase'

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024
const ACCEPTED_AVATAR_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

function normalizeImageType(value: string): string {
  const normalized = value.toLowerCase().trim()
  if (normalized === 'image/jpg') {
    return 'image/jpeg'
  }
  return normalized
}

interface EditUserInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onSuccess?: () => void
}

export function EditUserInfoDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditUserInfoDialogProps) {
  const t = useTranslations('profile')
  const [displayName, setDisplayName] = useState('')
  const [initialDisplayName, setInitialDisplayName] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [currentCustomAvatarUrl, setCurrentCustomAvatarUrl] = useState<string | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewObjectUrlRef = useRef<string | null>(null)

  const clearLocalPreview = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearLocalPreview()
    }
  }, [])

  const initializeForm = () => {
    if (!user) return
    clearLocalPreview()

    const suggestedName = getSuggestedDisplayName(user)
    const existingAvatarPreview = getUserAvatarUrl(user)
    const existingCustomAvatar = user.user_metadata?.avatar_url ?? null

    setDisplayName(suggestedName)
    setInitialDisplayName(suggestedName)
    setAvatarPreview(existingAvatarPreview)
    setCurrentCustomAvatarUrl(existingCustomAvatar)
    setSelectedAvatar(null)
    setError(null)
    setLoading(false)
  }

  const resetFormState = () => {
    clearLocalPreview()
    setDisplayName('')
    setInitialDisplayName('')
    setAvatarPreview(null)
    setCurrentCustomAvatarUrl(null)
    setSelectedAvatar(null)
    setError(null)
    setLoading(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      initializeForm()
    } else {
      resetFormState()
    }
    onOpenChange(nextOpen)
  }

  const hasChanges = useMemo(() => {
    return displayName.trim() !== initialDisplayName.trim() || Boolean(selectedAvatar)
  }, [displayName, initialDisplayName, selectedAvatar])

  const canSubmit = Boolean(displayName.trim()) && hasChanges && !loading

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    const normalizedType = normalizeImageType(file.type)
    if (!ACCEPTED_AVATAR_TYPES.has(normalizedType)) {
      setError(t('invalidAvatarType'))
      return
    }

    if (file.size <= 0 || file.size > MAX_AVATAR_SIZE_BYTES) {
      setError(t('avatarTooLarge'))
      return
    }

    clearLocalPreview()
    const objectUrl = URL.createObjectURL(file)
    previewObjectUrlRef.current = objectUrl

    setSelectedAvatar(file)
    setAvatarPreview(objectUrl)
    setError(null)
  }

  const handleReset = () => {
    if (!user || loading) return
    clearLocalPreview()
    setDisplayName(initialDisplayName)
    setAvatarPreview(getUserAvatarUrl(user))
    setSelectedAvatar(null)
    setError(null)
  }

  const uploadAvatar = async (): Promise<string> => {
    if (!selectedAvatar || !user) {
      throw new Error(t('avatarUploadFailed'))
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (sessionError || !accessToken) {
      throw new Error(t('updateProfileFailed'))
    }

    const formData = new FormData()
    formData.append('file', selectedAvatar)
    formData.append('userId', user.id)
    if (currentCustomAvatarUrl) {
      formData.append('oldAvatarUrl', currentCustomAvatarUrl)
    }

    const response = await fetch('/api/users/avatar', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    })

    const result = await response.json().catch(() => ({} as Record<string, unknown>))
    if (!response.ok || result.success !== true || typeof result.avatarUrl !== 'string') {
      const uploadError = typeof result.error === 'string' ? result.error : t('avatarUploadFailed')
      throw new Error(uploadError)
    }

    return result.avatarUrl
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user || !displayName.trim() || loading || !hasChanges) return

    setLoading(true)
    setError(null)

    try {
      const profilePayload: { displayName: string; avatarUrl?: string | null } = {
        displayName: displayName.trim(),
      }

      if (selectedAvatar) {
        profilePayload.avatarUrl = await uploadAvatar()
      }

      const success = await updateUserProfile(user, profilePayload)
      if (!success) {
        setError(t('updateProfileFailed'))
        return
      }

      handleOpenChange(false)
      setTimeout(() => {
        onSuccess?.()
      }, 100)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('updateProfileFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden border-slate-200/80 bg-white/95 p-0 sm:max-w-[520px] dark:border-slate-700 dark:bg-slate-950/95">
        <div className="border-b border-slate-200/80 bg-slate-50/80 px-6 py-5 dark:border-slate-700 dark:bg-slate-900/70">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {t('editUserInfo')}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 dark:text-slate-300">
              {t('userInfoDescription')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20 border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
                {avatarPreview ? (
                  <AvatarImage
                    src={avatarPreview}
                    alt={displayName || t('username')}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <UserRound className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t('avatar')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t('avatarRequirements')}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 cursor-pointer rounded-lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {selectedAvatar ? t('changeAvatar') : t('uploadAvatar')}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t('username')}
            </label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t('displayNamePlaceholder')}
              maxLength={50}
              disabled={loading}
              autoFocus
              className="h-11 rounded-lg border-slate-300/90 bg-white dark:border-slate-600 dark:bg-slate-900"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={handleReset}
              disabled={loading}
            >
              {t('reset')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" className="cursor-pointer" disabled={!canSubmit}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('updating')}
                </>
              ) : (
                t('saveChanges')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const EditDisplayNameDialog = EditUserInfoDialog
