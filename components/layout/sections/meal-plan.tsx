"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Download,
  Loader2,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AuthModal } from "@/components/auth/auth-modal";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/layout/section-header";
import { APP_CONFIG } from "@/lib/config";
import { useAuth } from "@/contexts/auth-context";
import { useUserUsage } from "@/hooks/use-user-usage";
import { exportMealPlanPdf } from "@/lib/client/meal-plan-pdf";
import { withLocalePath } from "@/lib/utils/locale-path";

type MealEntry = {
  title: string;
  description: string;
};

type MealPlanDay = {
  day: string;
  breakfast: MealEntry;
  lunch: MealEntry;
  dinner: MealEntry;
  snack: MealEntry;
};

type MealPlanResponse = {
  id?: string;
  planTitle: string;
  days: MealPlanDay[];
};

const TABLE_MEAL_COLUMNS = ["breakfast", "lunch", "dinner", "snack"] as const;
const hasStepPrefix = (value: string) => /^\s*\d{1,2}\s*[\.\-:)]\s*/.test(value);

export function MealPlanSection() {
  const t = useTranslations("mealPlanPage");
  const locale = useLocale();
  const { session } = useAuth();
  const { updateCreditsLocally } = useUserUsage();

  const [inputText, setInputText] = useState("");
  const [generatedFrom, setGeneratedFrom] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlanResponse | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const benefits = [
    {
      icon: <WandSparkles className="h-5 w-5" />,
      title: t("benefits.personalized.title"),
      description: t("benefits.personalized.description"),
    },
    {
      icon: <CalendarDays className="h-5 w-5" />,
      title: t("benefits.consistent.title"),
      description: t("benefits.consistent.description"),
    },
    {
      icon: <BadgeCheck className="h-5 w-5" />,
      title: t("benefits.practical.title"),
      description: t("benefits.practical.description"),
    },
  ];

  const workflowSteps = [
    {
      title: t("workflow.step1.title"),
      description: t("workflow.step1.description"),
    },
    {
      title: t("workflow.step2.title"),
      description: t("workflow.step2.description"),
    },
    {
      title: t("workflow.step3.title"),
      description: t("workflow.step3.description"),
    },
  ];

  const workflowStepIcons = [
    <WandSparkles key="workflow-step-icon-1" className="h-7 w-7" />,
    <Sparkles key="workflow-step-icon-2" className="h-7 w-7" />,
    <CalendarDays key="workflow-step-icon-3" className="h-7 w-7" />,
  ];

  const promptSuggestions = [
    t("promptSuggestions.seasonalSummer"),
    t("promptSuggestions.highProtein"),
    t("promptSuggestions.familyBudget"),
    t("promptSuggestions.vegetarianWorkdays"),
    t("promptSuggestions.lowSodiumHeart"),
  ];
  const [activeHintIndex, setActiveHintIndex] = useState(0);
  const activeHint = promptSuggestions[activeHintIndex] ?? "";

  useEffect(() => {
    if (promptSuggestions.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveHintIndex((currentIndex) => (currentIndex + 1) % promptSuggestions.length);
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, [promptSuggestions.length]);

  useEffect(() => {
    if (!mealPlan?.days?.length) {
      setActiveDayIndex(0);
      return;
    }
    setActiveDayIndex((currentIndex) => Math.min(currentIndex, mealPlan.days.length - 1));
  }, [mealPlan]);
  const selectedDay = mealPlan?.days[activeDayIndex] ?? null;
  const mealPlanDetailPath = mealPlan?.id
    ? withLocalePath(locale, `/meal-plans/${encodeURIComponent(mealPlan.id)}`)
    : null;

  const handleDownloadPdf = async () => {
    if (!mealPlan || isDownloadingPdf) {
      return;
    }

    setIsDownloadingPdf(true);

    try {
      const planTitle = mealPlan.planTitle || t("resultTitle");
      await exportMealPlanPdf({
        title: planTitle,
        prompt: generatedFrom || planTitle,
        fileNameBase: planTitle || "meal-plan",
        days: mealPlan.days,
        labels: {
          day: locale.toLowerCase().startsWith("zh") ? "日期" : "Day",
          prompt: t("pdfGeneratedFrom"),
          breakfast: t("breakfast"),
          lunch: t("lunch"),
          dinner: t("dinner"),
          snack: t("snack"),
        },
      });
    } catch (error) {
      console.error("Failed to export meal plan PDF:", error);
      toast.error(t("errors.downloadPdfFailed"));
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleGenerate = async () => {
    const prompt = inputText.trim();
    if (prompt.length < 10) {
      setErrorMessage(t("errors.tooShort"));
      return;
    }

    if (!session?.access_token) {
      setShowAuthModal(true);
      setErrorMessage(t("loginRequired"));
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/generate-meal-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt,
          language: locale,
        }),
      });

      const data = (await response.json()) as Partial<MealPlanResponse> & { error?: string };
      if (!response.ok) {
        if (response.status === 401) {
          setShowAuthModal(true);
          throw new Error(t("loginRequired"));
        }
        if (response.status === 402) {
          throw new Error(data.error || t("errors.insufficientCredits"));
        }
        throw new Error(data.error || t("errors.failed"));
      }

      if (!Array.isArray(data.days) || data.days.length === 0) {
        throw new Error(t("errors.failed"));
      }

      const nextPlan: MealPlanResponse = {
        id: typeof data.id === "string" && data.id.length > 0 ? data.id : undefined,
        planTitle: typeof data.planTitle === "string" && data.planTitle.trim().length > 0
          ? data.planTitle.trim()
          : t("resultTitle"),
        days: data.days,
      };

      setMealPlan(nextPlan);
      setActiveDayIndex(0);
      setGeneratedFrom(prompt);
      updateCreditsLocally(APP_CONFIG.mealPlanGenerationCost);
      toast.success(t("success"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("errors.failed");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderLoadingPreview = () => (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={`meal-plan-loading-day-tab-${index}`}
            className="h-10 w-20 shrink-0 animate-pulse rounded-xl border border-border-70 bg-muted-20"
          />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {TABLE_MEAL_COLUMNS.map((mealKey) => (
          <div
            key={`meal-plan-loading-preview-card-${mealKey}`}
            className="rounded-2xl border border-border-70 bg-card-95 p-4"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-muted-45" />
            <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-muted-50" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted-40" />
            <div className="mt-1 h-4 w-5/6 animate-pulse rounded bg-muted-40" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <section className="home-section relative overflow-hidden pb-8 md:pb-10 lg:pb-12">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute -top-20 left-[-9%] h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 right-[-8%] h-64 w-64 rounded-full bg-muted-40 blur-3xl" />
        </div>

        <div className="relative z-10 px-4 md:px-10">
          <div className="mx-auto w-full max-w-[1200px] space-y-7 md:space-y-9">
            <SectionHeader
              eyebrow={t("eyebrow")}
              title={t("title")}
              description={t("description")}
              headingTag="h1"
              className="home-section-header"
            />

            <div className="mx-auto w-full max-w-4xl space-y-4 md:space-y-5">
              <label htmlFor="meal-plan-input" className="sr-only">
                {t("textareaLabel")}
              </label>
              <div className="relative">
                <textarea
                  id="meal-plan-input"
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  placeholder={t("textareaPlaceholder")}
                  className="min-h-[250px] w-full resize-y rounded-2xl border border-border-70 bg-background-95 px-5 py-4 pb-24 text-sm leading-relaxed text-foreground shadow-sm outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 sm:text-base"
                />

                <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 sm:inset-x-4 sm:bottom-4">
                  <button
                    type="button"
                    onClick={() => setInputText(activeHint)}
                    aria-label={t("hintAriaLabel")}
                    title={activeHint}
                    className="pointer-events-auto inline-flex min-w-0 max-w-[calc(100%-170px)] cursor-pointer items-center px-1 py-1 text-left text-xs font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:max-w-[calc(100%-200px)] sm:text-sm"
                  >
                    <span key={`meal-plan-hint-${activeHintIndex}`} className="truncate underline-offset-4 hover:underline">
                      {activeHint}
                    </span>
                  </button>

                  <Button
                    type="button"
                    className="pointer-events-auto h-11 min-w-[160px] shrink-0 cursor-pointer gap-2 text-sm font-bold transition-colors duration-200 hover:bg-primary/90 focus-visible:ring-ring-60 disabled:cursor-not-allowed sm:min-w-[190px]"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {isGenerating ? t("generating") : t("generate")}
                  </Button>
                </div>
              </div>

              {errorMessage ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
                  {errorMessage}
                </p>
              ) : null}

              {isGenerating || mealPlan ? (
                <div className="rounded-2xl border border-border-70 bg-card-95 p-4 shadow-[0_12px_30px_rgb(15_23_42_/0.08)] sm:p-5">
                  {isGenerating ? (
                    renderLoadingPreview()
                  ) : mealPlan ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-border-70 bg-muted-20 px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="text-lg font-bold tracking-tight text-foreground">
                            {mealPlan.planTitle || t("resultTitle")}
                          </h2>
                          <CalendarDays className="h-4.5 w-4.5 shrink-0 text-primary" />
                        </div>

                        {generatedFrom ? (
                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                            {generatedFrom}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {mealPlan.days.map((day, index) => (
                          <button
                            key={`meal-plan-day-tab-${index}`}
                            type="button"
                            onClick={() => setActiveDayIndex(index)}
                            className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                              index === activeDayIndex
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-border-70 bg-muted-20 text-foreground hover:bg-muted-30"
                            }`}
                          >
                            {day.day}
                          </button>
                        ))}
                      </div>

                      {selectedDay ? (
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                          {TABLE_MEAL_COLUMNS.map((mealKey) => {
                            const meal = selectedDay[mealKey];

                            return (
                              <article
                                key={`meal-plan-preview-${mealKey}-${activeDayIndex}`}
                                className="rounded-2xl border border-border-70 bg-muted-10 p-4"
                              >
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  {t(mealKey)}
                                </p>
                                <h3 className="mt-2 text-xl leading-tight font-extrabold text-foreground">
                                  {meal.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                  {meal.description}
                                </p>
                              </article>
                            );
                          })}
                        </div>
                      ) : null}

                      <div className="flex flex-col gap-2 rounded-xl border border-border-70 bg-muted-20 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="inline-flex items-start gap-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{t("autoSavedToMealPlans")}</span>
                        </p>

                        <div className="flex flex-wrap justify-end gap-2">
                          {mealPlanDetailPath ? (
                            <Button
                              asChild
                              type="button"
                              variant="outline"
                              className="h-10 cursor-pointer gap-2 border-border-70 bg-background-95 px-4 text-sm font-semibold text-foreground transition-[border-color,color,background-color] duration-200 hover:border-primary/45 hover:bg-primary/10 hover:text-primary"
                            >
                              <Link href={mealPlanDetailPath}>
                                <ArrowUpRight className="h-4 w-4" />
                                {t("viewDetails")}
                              </Link>
                            </Button>
                          ) : null}

                          <Button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={isDownloadingPdf}
                            className="h-10 min-w-[148px] cursor-pointer gap-2 text-sm font-bold transition-colors duration-200 hover:bg-primary/90 disabled:cursor-not-allowed"
                          >
                            {isDownloadingPdf ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            {isDownloadingPdf ? t("downloadingPdf") : t("downloadPdf")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="home-section border-y border-border-45 bg-muted-20 py-10 md:py-12 lg:py-14">
        <div className="px-4 md:px-10">
          <div className="mx-auto w-full max-w-[1200px]">
            <SectionHeader
              eyebrow={t("capabilitiesEyebrow")}
              title={t("landingTitle")}
              description={t("landingDescription")}
              className="home-section-header"
            />

            <div className="grid gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {benefits.map((benefit, index) => (
                <div
                  key={`meal-plan-benefit-${index}`}
                  className="home-card group flex min-h-[220px] gap-4 p-6 transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-[0_16px_36px_rgb(15_23_42_/0.1)]"
                >
                  <div className="shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/12 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                      {benefit.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold tracking-tight text-foreground">{benefit.title}</h3>
                    <p className="mt-3 text-[15px] leading-7 text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-section py-10 md:py-12 lg:py-14">
        <div className="px-4 md:px-10">
          <div className="mx-auto w-full max-w-[1200px]">
            <div className="mx-auto w-full max-w-5xl">
              <div className="home-section-header text-center">
                <p className="text-sm font-bold uppercase tracking-wider text-primary">
                  {t("workflow.title")}
                </p>
                <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {t("workflow.subtitle")}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {workflowSteps.map((step, index) => {
                  const displayTitle = hasStepPrefix(step.title) ? step.title : `${index + 1}. ${step.title}`;

                  return (
                    <article
                      key={`meal-plan-workflow-step-${index}`}
                      className="group flex h-full flex-col gap-4 rounded-2xl border border-border-70 bg-card-95 p-6 shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_14px_30px_rgb(15_23_42_/0.09)]"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-70 bg-muted-20 text-foreground transition-colors duration-200 group-hover:border-primary/35 group-hover:bg-primary/12 group-hover:text-primary">
                        {workflowStepIcons[index]}
                      </div>

                      <h4 className="text-lg leading-snug font-bold text-foreground">{displayTitle}</h4>
                      <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section pt-0 pb-10 md:pb-12 lg:pb-14">
        <div className="px-4 md:px-10">
          <div className="mx-auto w-full max-w-[1200px]">
            <div className="mx-auto w-full max-w-4xl rounded-2xl border border-border-70 bg-muted-20 px-4 py-4 sm:px-5 sm:py-5">
              <p className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span>{t("safetyNotice")}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
