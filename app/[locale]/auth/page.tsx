"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AuthPanel } from "@/components/auth/auth-panel";
import { useAuth } from "@/contexts/auth-context";
import { sanitizePostAuthPath } from "@/lib/utils/auth-path";
import { withLocalePath } from "@/lib/utils/locale-path";

export default function AuthPage() {
  const locale = useLocale();
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const homeHref = withLocalePath(locale);
  const workspaceHref = withLocalePath(locale, "/workspace");

  const nextParam = searchParams.get("next");
  const postAuthPath = useMemo(() => sanitizePostAuthPath(nextParam), [nextParam]);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    if (postAuthPath) {
      router.replace(postAuthPath);
      return;
    }

    router.replace(workspaceHref);
  }, [loading, postAuthPath, router, user, workspaceHref]);

  return (
    <main className="min-h-screen bg-background px-4 pb-16 pt-20 text-foreground md:px-10 md:pt-24">
      <div className="mx-auto grid w-full max-w-[1080px] gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <section className="relative overflow-hidden rounded-2xl border border-border-70 bg-card/92 p-7 shadow-[0_16px_42px_rgba(2,8,6,0.12)] md:p-9">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-emerald-300/14 blur-3xl dark:bg-emerald-400/12" />

          <div className="relative space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("secureAccess")}
            </span>

            <h1 className="max-w-[18ch] text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              {t("fullPageTitle")}
            </h1>
            <p className="max-w-[44ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("fullPageDescription")}
            </p>

            <div className="grid gap-2.5 text-sm text-foreground/90">
              <p className="inline-flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t("benefitOne")}</span>
              </p>
              <p className="inline-flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t("benefitTwo")}</span>
              </p>
              <p className="inline-flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t("benefitThree")}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{t("returnHint")}</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border-70 bg-card/96 p-6 shadow-[0_16px_42px_rgba(2,8,6,0.1)] md:p-8">
          <AuthPanel postAuthRedirectPath={postAuthPath} />

          <div className="mt-5 border-t border-border-70 pt-4 text-center">
            <Link
              href={homeHref}
              className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("backHome")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
