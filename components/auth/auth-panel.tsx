"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/icons/google-icon";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { sanitizePostAuthPath } from "@/lib/utils/auth-path";
import { withLocalePath } from "@/lib/utils/locale-path";

interface AuthPanelProps {
  className?: string;
  compact?: boolean;
  showHeader?: boolean;
  postAuthRedirectPath?: string | null;
  onSignedIn?: () => void;
  onCodeStepChange?: (isCodeStep: boolean) => void;
}

const OTP_LENGTH = 6;

export function AuthPanel({
  className,
  compact = false,
  showHeader = true,
  postAuthRedirectPath,
  onSignedIn,
  onCodeStepChange,
}: AuthPanelProps) {
  const locale = useLocale();
  const t = useTranslations("auth");
  const router = useRouter();
  const { signInWithGoogle, signInWithMagicLink, verifyEmailCode } = useAuth();

  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isCodeStep, setIsCodeStep] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));

  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const safePostAuthPath = useMemo(
    () => sanitizePostAuthPath(postAuthRedirectPath),
    [postAuthRedirectPath]
  );
  const termsHref = useMemo(() => withLocalePath(locale, "/terms"), [locale]);
  const privacyHref = useMemo(() => withLocalePath(locale, "/privacy"), [locale]);
  const verificationCode = otpDigits.join("");
  const isCodeComplete = /^\d{6}$/.test(verificationCode);
  const codeStepDescription = t("enterCodeDescription", { email });
  const codeStepEmailIndex = email ? codeStepDescription.indexOf(email) : -1;
  const codeStepDescriptionBeforeEmail =
    codeStepEmailIndex >= 0 ? codeStepDescription.slice(0, codeStepEmailIndex) : null;
  const codeStepDescriptionAfterEmail =
    codeStepEmailIndex >= 0
      ? codeStepDescription.slice(codeStepEmailIndex + email.length)
      : null;

  const completeSignIn = () => {
    if (safePostAuthPath) {
      router.replace(safePostAuthPath);
      return;
    }
    onSignedIn?.();
  };

  useEffect(() => {
    if (!isCodeStep) {
      return;
    }

    const timer = window.setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 60);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isCodeStep]);

  useEffect(() => {
    onCodeStepChange?.(isCodeStep);
  }, [isCodeStep, onCodeStepChange]);

  const resetOtp = () => {
    setOtpDigits(Array.from({ length: OTP_LENGTH }, () => ""));
  };

  const handleEmailCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      return;
    }

    setEmailLoading(true);
    try {
      await signInWithMagicLink(normalizedEmail, safePostAuthPath ?? undefined);
      setEmail(normalizedEmail);
      resetOtp();
      setIsCodeStep(true);
      toast.success(t("codeSentToast", { email: normalizedEmail }), {
        position: "bottom-right",
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "";
      const message = rawMessage || t("sendCodeError");
      toast.error(message);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle(safePostAuthPath ?? undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("googleSignInError");
      toast.error(message);
      setGoogleLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    setOtpDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) {
      return;
    }

    event.preventDefault();

    const nextDigits = Array.from({ length: OTP_LENGTH }, (_, index) => pasted[index] ?? "");
    setOtpDigits(nextDigits);

    const nextFocusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    otpInputRefs.current[nextFocusIndex]?.focus();
  };

  const handleVerifyCode = async () => {
    if (!isCodeComplete) {
      toast.error(t("codeRequiredError"));
      return;
    }

    setCodeLoading(true);
    try {
      await verifyEmailCode(email, verificationCode);
      setIsCodeStep(false);
      completeSignIn();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("verifyCodeError");
      toast.error(message);
    } finally {
      setCodeLoading(false);
    }
  };

  const handleChangeEmail = () => {
    if (codeLoading) {
      return;
    }

    setIsCodeStep(false);
    resetOtp();
    window.setTimeout(() => {
      emailInputRef.current?.focus();
    }, 50);
  };

  const panelTitle = t("signInTitle");
  const panelDescription = t("signInDescription");
  const googleButtonClass = compact
    ? "h-11 w-full cursor-pointer rounded-lg border-border-70 bg-background-85 text-sm font-bold tracking-[0.01em] text-foreground transition-colors hover:bg-muted-75"
    : "h-11 w-full cursor-pointer rounded-lg border-border-70 bg-card/88 text-sm font-bold tracking-[0.01em] text-foreground transition-colors hover:bg-muted/45";
  const dividerTextClass = compact ? "bg-background px-2 text-muted-foreground" : "bg-card px-2 text-muted-foreground";
  const labelClass = compact ? "text-xs font-medium text-foreground/85" : "";
  const inputClass = compact
    ? "h-11 rounded-lg border-border-70 bg-background pl-10"
    : "h-11 border-border-70 bg-card/90 pl-10";
  const submitButtonClass =
    "h-11 w-full cursor-pointer rounded-lg text-sm font-bold tracking-[0.01em]";

  return (
    <div className={cn("space-y-5", compact && "space-y-4", className)}>
      {!isCodeStep ? (
        <>
          {showHeader ? (
            <header className={cn("space-y-2", compact ? "text-center" : "text-left")}>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{panelTitle}</h2>
              <p className="text-sm text-muted-foreground">{panelDescription}</p>
            </header>
          ) : null}

          <Button
            type="button"
            variant="outline"
            className={googleButtonClass}
            onClick={handleGoogleAuth}
            disabled={emailLoading || googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            {t("continueWithGoogle")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border-70" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className={dividerTextClass}>{t("orContinueWith")}</span>
            </div>
          </div>

          <form onSubmit={handleEmailCode} className={cn("space-y-4", compact && "space-y-3.5")}>
            <div className="space-y-2">
              <Label htmlFor="auth-email" className={labelClass}>
                {t("email")}
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={emailInputRef}
                  id="auth-email"
                  type="email"
                  value={email}
                  placeholder={t("emailPlaceholder")}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                  required
                  disabled={emailLoading || googleLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className={submitButtonClass}
              disabled={emailLoading || googleLoading || !email.trim()}
            >
              {emailLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("sendCode")}
            </Button>

            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              {t.rich("signInAgreement", {
                terms: (chunks) => (
                  <Link
                    href={termsHref}
                    className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary/90 hover:underline"
                  >
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link
                    href={privacyHref}
                    className="font-medium text-primary underline-offset-4 transition-colors hover:text-primary/90 hover:underline"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </form>
        </>
      ) : (
        <section className="relative pt-1">
          <div className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full bg-primary/16 blur-3xl" />
          <div className="relative space-y-5">
            <header className="space-y-2 text-center">
              <h3 className="text-[2rem] font-bold leading-tight tracking-tight text-foreground">
                {t("enterCodeTitle")}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {codeStepDescriptionBeforeEmail !== null && codeStepDescriptionAfterEmail !== null ? (
                  <>
                    {codeStepDescriptionBeforeEmail}
                    <span className="font-semibold text-foreground">{email}</span>
                    {codeStepDescriptionAfterEmail}
                  </>
                ) : (
                  codeStepDescription
                )}
              </p>
            </header>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/75">
                {t("verificationCodeLabel")}
              </p>
              <div className="grid grid-cols-6 gap-2.5">
                {otpDigits.map((digit, index) => (
                  <Input
                    key={`otp-digit-${index}`}
                    ref={(node) => {
                      otpInputRefs.current[index] = node;
                    }}
                    value={digit}
                    onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={handleOtpPaste}
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className="h-14 rounded-xl border-border-70 bg-card/92 text-center text-xl font-semibold tracking-[0.14em] text-foreground sm:h-16"
                    aria-label={t("codeDigitAria", { index: index + 1 })}
                    disabled={codeLoading}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                className="inline-flex h-11 cursor-pointer items-center gap-1.5 px-2 text-xs font-medium text-muted-foreground/75 hover:!bg-transparent hover:text-muted-foreground"
                onClick={handleChangeEmail}
                disabled={codeLoading}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("changeEmail")}
              </Button>
            </div>

            <Button
              type="button"
              className="h-11 w-full cursor-pointer rounded-lg text-sm font-bold tracking-[0.01em]"
              onClick={handleVerifyCode}
              disabled={codeLoading || !isCodeComplete}
            >
              {codeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {codeLoading ? t("verifyingCode") : t("verifyCode")}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
