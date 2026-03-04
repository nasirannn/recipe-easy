"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FooterSection } from "@/components/layout/sections/footer";
import { buildAuthPath } from "@/lib/utils/auth-path";
import { withLocalePath } from "@/lib/utils/locale-path";
import { cn } from "@/lib/utils";

type MealPlanMealEntry = {
  title: string;
  description: string;
};

type MealPlanDay = {
  day: string;
  breakfast: MealPlanMealEntry;
  lunch: MealPlanMealEntry;
  dinner: MealPlanMealEntry;
  snack: MealPlanMealEntry;
};

type MealPlanRecord = {
  id: string;
  planTitle: string;
  prompt: string;
  days: MealPlanDay[];
  languageCode: "en" | "zh";
  createdAt?: string;
};

const FETCH_LIMIT = 120;

export default function MyMealPlansPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("myMealPlans");
  const { user, session, loading: authLoading } = useAuth();

  const [mealPlans, setMealPlans] = useState<MealPlanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);

  const mealPlanGeneratorPath = withLocalePath(locale, "/meal-plan");
  const mealPlanLibraryPath = withLocalePath(locale, "/meal-plans");
  const isZh = locale.toLowerCase().startsWith("zh");

  const authPath = useMemo(() => {
    const query = searchParams.toString();
    const nextPath = query ? `${pathname}?${query}` : pathname;
    return buildAuthPath(locale, nextPath);
  }, [locale, pathname, searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(authPath);
    }
  }, [authLoading, authPath, router, user]);

  const formatDate = useMemo(
    () =>
      new Intl.DateTimeFormat(isZh ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [isZh]
  );

  const loadMealPlans = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/meal-plans/user/${encodeURIComponent(user.id)}?page=1&limit=${FETCH_LIMIT}&lang=all`,
        {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.replace(authPath);
          return;
        }
        throw new Error("Failed to load meal plans");
      }

      const payload = (await response.json()) as {
        success?: boolean;
        mealPlans?: MealPlanRecord[];
      };
      if (!payload.success || !Array.isArray(payload.mealPlans)) {
        throw new Error("Failed to load meal plans");
      }

      setMealPlans(payload.mealPlans);
      setHasHydrated(true);
    } catch {
      toast.error(t("loadError"));
      setMealPlans([]);
      setHasHydrated(true);
    } finally {
      setIsLoading(false);
    }
  }, [authPath, router, session?.access_token, t, user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadMealPlans();
    }
  }, [loadMealPlans, user?.id]);

  const renderPageShell = (content: ReactNode, showFooter = false) => (
    <div className="bg-background text-foreground">
      <div className="px-4 py-8 md:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-[1200px]">{content}</div>
      </div>
      {showFooter ? <FooterSection /> : null}
    </div>
  );

  const renderPageHeader = () => (
    <header className="mb-8 space-y-5 sm:mb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        <Button
          asChild
          className="h-11 min-w-[180px] cursor-pointer rounded-lg bg-primary text-sm font-bold text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
        >
          <Link href={mealPlanGeneratorPath}>
            <CalendarDays className="h-4 w-4" />
            {t("newPlan")}
          </Link>
        </Button>
      </div>
    </header>
  );

  const renderCardSkeleton = () => (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card
          key={`my-meal-plan-skeleton-${index}`}
          className="overflow-hidden rounded-xl border border-recipe-surface-border bg-recipe-surface p-4 shadow-lg shadow-primary/12"
        >
          <Skeleton className="h-4 w-36 bg-recipe-surface-skeleton" />
          <Skeleton className="mt-3 h-7 w-[80%] bg-recipe-surface-skeleton-soft" />
          <Skeleton className="mt-3 h-4 w-full bg-recipe-surface-skeleton" />
          <Skeleton className="mt-2 h-4 w-[75%] bg-recipe-surface-skeleton-soft" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Skeleton className="h-8 w-full rounded-lg bg-recipe-surface-skeleton-soft" />
            <Skeleton className="h-8 w-full rounded-lg bg-recipe-surface-skeleton-soft" />
          </div>
          <Skeleton className="mt-5 h-9 w-full rounded-lg bg-recipe-surface-skeleton-soft" />
        </Card>
      ))}
    </div>
  );

  if (authLoading || (!hasHydrated && isLoading)) {
    return renderPageShell(
      <div className="space-y-8">
        {renderPageHeader()}
        {renderCardSkeleton()}
      </div>
    );
  }

  if (!authLoading && !user) {
    return renderPageShell(renderCardSkeleton());
  }

  return renderPageShell(
    <>
      {renderPageHeader()}

      {mealPlans.length === 0 ? (
        <div className="mx-auto max-w-2xl py-3 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t("emptyState.title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("emptyState.description")}
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="h-11 bg-linear-to-r from-primary to-[--color-primary-90] px-6">
              <Link href={mealPlanGeneratorPath}>{t("emptyState.action")}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mealPlans.map((plan) => {
              const detailHref = `${mealPlanLibraryPath}/${plan.id}`;
              const createdAt = plan.createdAt
                ? formatDate.format(new Date(plan.createdAt))
                : null;

              return (
                <Link
                  key={plan.id}
                  href={detailHref}
                  className="block focus-visible:outline-none"
                >
                  <Card
                    className={cn(
                      "group relative overflow-hidden rounded-xl border border-recipe-surface-border bg-recipe-surface p-4 shadow-lg shadow-primary/12 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/10",
                      "focus-within:ring-2 focus-within:ring-primary/50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-semibold tracking-wide text-primary">
                        {t("cards.planBadge")}
                      </span>
                      {createdAt ? (
                        <span className="inline-flex items-center gap-1.5 text-recipe-surface-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          {t("cards.createdAt", { date: createdAt })}
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-3 line-clamp-2 text-xl font-bold leading-tight tracking-tight text-recipe-surface-foreground transition-colors duration-200 group-hover:text-primary">
                      {plan.planTitle}
                    </h2>

                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-recipe-surface-muted-foreground">
                      {plan.prompt}
                    </p>

                    <span className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-recipe-surface-button-border bg-recipe-surface-button px-3 py-2 text-sm font-medium text-recipe-surface-foreground transition-colors duration-200 group-hover:bg-recipe-surface-button-hover">
                      {t("cards.viewDetails")}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 pt-6 text-center">
            <p className="text-sm text-muted-foreground">{t("allPlansDisplayed")}</p>
          </div>
        </>
      )}

    </>,
    true
  );
}
