"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, ArrowLeft, CalendarDays, Clock3, Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FooterSection } from "@/components/layout/sections/footer";
import { buildAuthPath } from "@/lib/utils/auth-path";
import { withLocalePath } from "@/lib/utils/locale-path";
import { exportMealPlanPdf } from "@/lib/client/meal-plan-pdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  createdAt?: string;
};

const MEAL_COLUMNS = ["breakfast", "lunch", "dinner", "snack"] as const;

export default function MealPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("myMealPlans");
  const tMeal = useTranslations("mealPlanPage");
  const { user, session, loading: authLoading } = useAuth();

  const [mealPlan, setMealPlan] = useState<MealPlanRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMissing, setIsMissing] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const mealPlanId = typeof params?.id === "string" ? params.id : "";
  const mealPlanLibraryPath = withLocalePath(locale, "/meal-plans");
  const generatorPath = withLocalePath(locale, "/meal-plan");
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

  const loadMealPlan = useCallback(async () => {
    if (!mealPlanId) {
      setIsLoading(false);
      setIsMissing(true);
      return;
    }

    if (!user?.id) {
      return;
    }

    try {
      setIsLoading(true);
      setIsMissing(false);

      const response = await fetch(`/api/meal-plans/${encodeURIComponent(mealPlanId)}`, {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.replace(authPath);
          return;
        }
        if (response.status === 404) {
          setIsMissing(true);
          setMealPlan(null);
          return;
        }
        throw new Error("Failed to load meal plan");
      }

      const payload = (await response.json()) as {
        success?: boolean;
        mealPlan?: MealPlanRecord;
      };

      if (!payload.success || !payload.mealPlan) {
        throw new Error("Failed to load meal plan");
      }

      setMealPlan(payload.mealPlan);
    } catch {
      toast.error(t("detail.loadError"));
      setMealPlan(null);
    } finally {
      setIsLoading(false);
    }
  }, [authPath, mealPlanId, router, session?.access_token, t, user?.id]);

  useEffect(() => {
    if (user?.id && mealPlanId) {
      loadMealPlan();
    }
  }, [loadMealPlan, mealPlanId, user?.id]);

  const handleDownloadPdf = useCallback(async () => {
    if (!mealPlan || isDownloadingPdf) {
      return;
    }

    setIsDownloadingPdf(true);

    try {
      const planTitle = mealPlan.planTitle || tMeal("resultTitle");
      await exportMealPlanPdf({
        title: planTitle,
        prompt: mealPlan.prompt || planTitle,
        fileNameBase: planTitle || "meal-plan",
        days: mealPlan.days,
        labels: {
          day: isZh ? "日期" : "Day",
          prompt: t("detail.generatedFrom"),
          breakfast: tMeal("breakfast"),
          lunch: tMeal("lunch"),
          dinner: tMeal("dinner"),
          snack: tMeal("snack"),
        },
      });
    } catch (error) {
      console.error("Failed to export meal plan PDF:", error);
      toast.error(tMeal("errors.downloadPdfFailed"));
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [isDownloadingPdf, isZh, mealPlan, t, tMeal]);

  const handleDeleteMealPlan = useCallback(async () => {
    if (!mealPlan?.id || isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/meal-plans/${encodeURIComponent(mealPlan.id)}`, {
        method: "DELETE",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.replace(authPath);
          return;
        }
        throw new Error("Failed to delete meal plan");
      }

      setIsDeleteDialogOpen(false);
      toast.success(t("deleteSuccess"));
      router.push(mealPlanLibraryPath);
    } catch {
      toast.error(t("deleteError"));
    } finally {
      setIsDeleting(false);
    }
  }, [authPath, isDeleting, mealPlan?.id, mealPlanLibraryPath, router, session?.access_token, t]);

  const renderPageShell = (content: ReactNode, showFooter = false) => (
    <div className="bg-background text-foreground">
      <div className="px-4 py-8 md:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-[1200px]">{content}</div>
      </div>
      {showFooter ? <FooterSection /> : null}
    </div>
  );

  if (authLoading || isLoading) {
    return renderPageShell(
      <div className="space-y-6">
        <Skeleton className="h-9 w-44 rounded-lg" />
        <Card className="rounded-xl border border-border/70 bg-card p-6">
          <Skeleton className="h-7 w-[56%]" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-[82%]" />
        </Card>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`meal-plan-detail-skeleton-${index}`} className="rounded-xl border border-border/70 bg-card p-5">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="mt-4 h-5 w-[75%]" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-[88%]" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!authLoading && !user) {
    return renderPageShell(<div className="h-20" />);
  }

  if (isMissing || !mealPlan) {
    return renderPageShell(
      <div className="mx-auto max-w-2xl py-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("detail.missingTitle")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t("detail.missingDescription")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline" className="h-11 px-5">
            <Link href={mealPlanLibraryPath}>
              <ArrowLeft className="h-4 w-4" />
              {t("detail.backToList")}
            </Link>
          </Button>
          <Button asChild className="h-11 px-5">
            <Link href={generatorPath}>
              <CalendarDays className="h-4 w-4" />
              {t("newPlan")}
            </Link>
          </Button>
        </div>
      </div>,
      true
    );
  }

  const createdAt = mealPlan.createdAt ? formatDate.format(new Date(mealPlan.createdAt)) : null;

  return renderPageShell(
    <>
      <header className="mb-8 space-y-5 sm:mb-10">
        <Button asChild variant="ghost" className="h-9 px-0 text-sm font-medium hover:bg-transparent hover:text-primary">
          <Link href={mealPlanLibraryPath}>
            <ArrowLeft className="h-4 w-4" />
            {t("detail.backToList")}
          </Link>
        </Button>

        <Card className="rounded-xl border border-recipe-surface-border bg-recipe-surface p-5 shadow-lg shadow-primary/10 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex items-center rounded-full border border-border/60 bg-muted/20 px-2.5 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
              {t("detail.generatedFrom")}
            </p>
            {createdAt ? (
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                {t("cards.createdAt", { date: createdAt })}
              </p>
            ) : null}
          </div>

          <p className="mt-4 text-base leading-relaxed font-semibold text-foreground sm:text-lg sm:leading-8">
            {mealPlan.prompt}
          </p>
        </Card>
      </header>

      <div className="space-y-4">
        <Card className="overflow-hidden rounded-xl border border-recipe-surface-border bg-recipe-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] border-collapse">
              <thead className="bg-muted/25">
                <tr className="border-b border-border/60">
                  <th
                    scope="col"
                    className="w-[120px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                  >
                    {isZh ? "日期" : "Day"}
                  </th>
                  {MEAL_COLUMNS.map((mealKey) => (
                    <th
                      key={`meal-plan-header-${mealKey}`}
                      scope="col"
                      className="min-w-[190px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                    >
                      {tMeal(mealKey)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {mealPlan.days.map((day, dayIndex) => (
                  <tr
                    key={`${mealPlan.id}-table-row-${dayIndex}`}
                    className="align-top border-b border-border/50 last:border-b-0 odd:bg-transparent even:bg-muted/10"
                  >
                    <th
                      scope="row"
                      className="px-4 py-4 text-left text-sm font-semibold text-foreground"
                    >
                      {day.day}
                    </th>

                    {MEAL_COLUMNS.map((mealKey) => {
                      const meal = day[mealKey];

                      return (
                        <td key={`${mealPlan.id}-table-cell-${dayIndex}-${mealKey}`} className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold leading-tight text-foreground">{meal.title}</p>
                            <p className="text-xs leading-relaxed text-muted-foreground">{meal.description}</p>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-8 border-t border-border/60 pt-6">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="h-10 cursor-pointer px-4 transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {isDownloadingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isDownloadingPdf ? tMeal("downloadingPdf") : tMeal("downloadPdf")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="h-10 cursor-pointer border-destructive/45 px-4 text-destructive transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            {t("delete")}
          </Button>
        </div>
      </div>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (isDeleting) {
            return;
          }
          setIsDeleteDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              {t("deleteDialog.title")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t("deleteDialog.description", { title: mealPlan.planTitle })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="flex-1"
            >
              {t("deleteDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMealPlan}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>,
    true
  );
}
