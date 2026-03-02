'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { AuthPanel } from '@/components/auth/auth-panel'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const t = useTranslations('auth')
  const [panelVersion, setPanelVersion] = useState(0)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPanelVersion((current) => current + 1)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden border-border-70 bg-background p-5 shadow-[0_22px_56px_rgba(2,8,6,0.2)] sm:max-w-[452px] sm:rounded-2xl sm:p-6">
        <DialogTitle className="sr-only">{t('signInTitle')}</DialogTitle>
        <DialogDescription className="sr-only">{t('signInDescription')}</DialogDescription>
        <AuthPanel
          key={`login-dialog-panel-${panelVersion}`}
          compact={true}
          showHeader={false}
          onSignedIn={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
