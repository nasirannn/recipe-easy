"use client"

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { cn } from '@/lib/utils'

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
  themeClassName?: string
}

export function EditUserInfoDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
  themeClassName,
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

  const clearLocalPreview = useCallback(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearLocalPreview()
    }
  }, [clearLocalPreview])

  useEffect(() => {
    if (open && user) {
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
      return
    }
    clearLocalPreview()
    setDisplayName('')
    setInitialDisplayName('')
    setAvatarPreview(null)
    setCurrentCustomAvatarUrl(null)
    setSelectedAvatar(null)
    setError(null)
    setLoading(false)
  }, [open, user, clearLocalPreview])

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
  }

  const hasChanges = useMemo(() => {
    return displayName.trim() !== initialDisplayName.trim() || Boolean(selectedAvatar)
  }, [displayName, initialDisplayName, selectedAvatar])

  const canSubmit = Boolean(displayName.trim()) && hasChanges && !loading
  const profileName =
    displayName.trim() || initialDisplayName.trim() || user?.email?.split('@')[0] || t('username')

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
      <DialogContent
        className={cn(
          'w-[calc(100%-1.5rem)] max-h-[92dvh] overflow-hidden border-border-70 bg-card p-0 shadow-lg sm:max-w-[560px] sm:rounded-2xl',
          themeClassName
        )}
      >
        <div className="border-b border-border-60 px-6 pb-4 pt-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              {t('editUserInfo')}
            </DialogTitle>
            <DialogDescription className="max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
              {t('userInfoDescription')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-6 overflow-y-auto px-6 py-5">
            <div className="rounded-xl border border-border-70 bg-muted-20 p-4 sm:p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative w-fit">
                  <Avatar className="h-24 w-24 border border-border bg-card ring-2 ring-primary/15">
                    {avatarPreview ? (
                      <AvatarImage
                        src={avatarPreview}
                        alt={profileName}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <UserRound className="h-9 w-9" />
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="absolute -bottom-1 -right-1 h-9 w-9 cursor-pointer rounded-full border-border bg-card text-foreground shadow-sm hover:bg-accent"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                  >
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">
                      {selectedAvatar ? t('changeAvatar') : t('uploadAvatar')}
                    </span>
                  </Button>
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="space-y-1">
                    <p className="truncate text-sm font-semibold text-foreground">{profileName}</p>
                    {user?.email ? (
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    ) : null}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t('avatarRequirements')}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                    disabled={loading}
                  />
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                      type="button"
                      variant="default"
                      className="h-10 cursor-pointer rounded-lg px-4 text-sm font-semibold"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      {selectedAvatar ? t('changeAvatar') : t('uploadAvatar')}
                    </Button>
                    {selectedAvatar ? (
                      <span className="inline-flex max-w-[220px] items-center truncate rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-foreground">
                        {selectedAvatar.name}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-0">
              <label
                htmlFor="displayName"
                className="mb-3 block text-sm font-semibold leading-none text-foreground"
              >
                {t('username')}
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder={t('displayNamePlaceholder')}
                  maxLength={50}
                  disabled={loading}
                  autoFocus
                  className="h-11 rounded-xl border-border bg-background pl-10 text-sm"
                />
              </div>
              <p className="mt-2 text-right text-xs text-muted-foreground">{displayName.length}/50</p>
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2.5 border-t border-border-60 bg-muted-20 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={handleReset}
              disabled={loading || !hasChanges}
            >
              {t('reset')}
            </Button>
            <Button
              type="submit"
              className="min-w-[132px] cursor-pointer rounded-lg font-semibold"
              disabled={!canSubmit}
            >
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
