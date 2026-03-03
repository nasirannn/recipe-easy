"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth/auth-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { withLocalePath } from "@/lib/utils/locale-path";

type CaptureOrderResponse = {
  success?: boolean;
  creditsAdded?: number;
  creditedNow?: boolean;
  error?: string;
};

type ViewState = "loading" | "success" | "error" | "auth";

export function PayPalReturnResult() {
  const t = useTranslations("billing");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { session } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [state, setState] = useState<ViewState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [credited, setCredited] = useState<number>(0);
  const capturedOrderRef = useRef<string | null>(null);

  const payPalOrderId = useMemo(() => {
    const token = (searchParams.get("token") || "").trim();
    const fallback = (searchParams.get("orderId") || "").trim();
    return token || fallback;
  }, [searchParams]);

  useEffect(() => {
    if (!payPalOrderId) {
      setState("error");
      setErrorMessage(t("return.orderMissing"));
      return;
    }

    if (!session?.access_token) {
      setState("auth");
      return;
    }

    if (capturedOrderRef.current === payPalOrderId) {
      return;
    }

    capturedOrderRef.current = payPalOrderId;
    let disposed = false;

    const capture = async () => {
      setState("loading");
      setErrorMessage("");

      try {
        const response = await fetch("/api/payments/paypal/capture-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ orderId: payPalOrderId }),
        });

        const data = (await response.json()) as CaptureOrderResponse;
        if (!response.ok || !data.success) {
          throw new Error(data.error || t("errors.captureFailed"));
        }

        if (disposed) {
          return;
        }

        setCredited(Number(data.creditsAdded ?? 0));
        setState("success");
        window.dispatchEvent(new Event("creditsUpdated"));
        toast.success(t("return.successToast"));
      } catch (error) {
        if (disposed) {
          return;
        }
        const message = error instanceof Error ? error.message : t("errors.captureFailed");
        setErrorMessage(message);
        setState("error");
      }
    };

    capture();

    return () => {
      disposed = true;
    };
  }, [payPalOrderId, session?.access_token, t]);

  if (state === "loading") {
    return (
      <Card className="mx-auto w-full max-w-lg rounded-2xl border border-border-70 bg-card">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold text-foreground">{t("return.processing")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 pb-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("return.processingHint")}</p>
        </CardContent>
      </Card>
    );
  }

  if (state === "auth") {
    return (
      <>
        <Card className="mx-auto w-full max-w-lg rounded-2xl border border-border-70 bg-card">
          <CardHeader>
            <CardTitle className="text-center text-xl font-bold text-foreground">{t("return.signInRequired")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-8">
            <p className="text-center text-sm text-muted-foreground">{t("return.signInRequiredHint")}</p>
            <Button type="button" className="h-11 w-full" onClick={() => setShowAuthModal(true)}>
              {t("return.signInToContinue")}
            </Button>
          </CardContent>
        </Card>
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </>
    );
  }

  if (state === "error") {
    return (
      <Card className="mx-auto w-full max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="inline-flex items-center justify-center gap-2 text-center text-xl font-bold text-destructive">
            <ShieldAlert className="h-5 w-5" />
            {t("return.failed")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          <p className="text-center text-sm text-destructive/90">{errorMessage || t("errors.captureFailed")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              {t("return.retry")}
            </Button>
            <Button type="button" onClick={() => (window.location.href = withLocalePath(locale, "/pricing"))}>
              {t("return.backToPricing")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-lg rounded-2xl border border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="inline-flex items-center justify-center gap-2 text-center text-xl font-bold text-foreground">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          {t("return.successTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-8">
        <p className="text-center text-sm leading-6 text-muted-foreground">
          {t("return.successDescription", { credits: credited })}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={() => (window.location.href = withLocalePath(locale, "/pricing"))}>
            {t("return.buyMore")}
          </Button>
          <Button type="button" onClick={() => (window.location.href = withLocalePath(locale, "/workspace"))}>
            {t("return.goWorkspace")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

