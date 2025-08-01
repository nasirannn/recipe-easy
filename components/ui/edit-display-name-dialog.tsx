"use client"

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateUserDisplayName, getSuggestedDisplayName } from '@/lib/utils/user-display'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'

interface EditDisplayNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onSuccess?: () => void
}

export function EditDisplayNameDialog({ 
  open, 
  onOpenChange, 
  user, 
  onSuccess 
}: EditDisplayNameDialogProps) {
  const t = useTranslations('profile')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 当对话框打开时初始化
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && user) {
      // 对话框打开时设置初始值
      setDisplayName(getSuggestedDisplayName(user))
      setError(null)
    } else if (!newOpen) {
      // 对话框关闭时重置状态
      setDisplayName('')
      setError(null)
      setLoading(false)
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !displayName.trim() || loading) return

    setLoading(true)
    setError(null)

    try {
      const success = await updateUserDisplayName(user, displayName.trim())
      
      if (success) {
        // 成功后关闭对话框
        handleOpenChange(false)
        // 延迟调用成功回调，确保对话框完全关闭
        setTimeout(() => {
          onSuccess?.()
        }, 100)
      } else {
        setError(t('updateFailed'))
      }
    } catch (err) {
      setError(t('updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (user) {
      setDisplayName(getSuggestedDisplayName(user))
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('editDisplayName')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('displayNamePlaceholder')}
              maxLength={50}
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              {t('reset')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || !displayName.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('updating')}
                </>
              ) : (
                t('save')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 