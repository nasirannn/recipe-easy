"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthPanel } from "@/components/auth/auth-panel";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const t = useTranslations("auth");
  const [panelVersion, setPanelVersion] = useState(0);
  const [isCodeStep, setIsCodeStep] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPanelVersion((current) => current + 1);
      setIsCodeStep(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden border-border-70 bg-background p-0 shadow-[0_22px_56px_rgba(2,8,6,0.2)] sm:max-w-[452px] sm:rounded-2xl">
        <DialogTitle className="sr-only">
          {isCodeStep ? t("enterCodeTitle") : t("signInTitle")}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isCodeStep ? t("verificationCodeLabel") : t("signInDescription")}
        </DialogDescription>
        <section className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
          {!isCodeStep ? (
            <header className="space-y-2.5 pb-4 text-center">
              <h2 className="text-2xl font-bold leading-tight tracking-tight text-foreground">
                {t("signInTitle")}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("signInDescription")}
              </p>
            </header>
          ) : null}

          <div>
            <AuthPanel
              key={`auth-modal-panel-${panelVersion}`}
              compact={true}
              showHeader={false}
              onCodeStepChange={setIsCodeStep}
              onSignedIn={() => onOpenChange(false)}
            />
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
