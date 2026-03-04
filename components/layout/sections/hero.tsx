"use client";

import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { withLocalePath } from "@/lib/utils/locale-path";

export const HeroSection = () => {
  const t = useTranslations("hero");
  const locale = useLocale();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const workspacePath = withLocalePath(locale, "/workspace");
  const mealPlanPath = withLocalePath(locale, "/meal-plan");
  const [isHeroImageLoaded, setIsHeroImageLoaded] = useState(false);
  const [hasHeroImageError, setHasHeroImageError] = useState(false);
  const [isThemeHydrated, setIsThemeHydrated] = useState(false);
  const isDarkTheme = isThemeHydrated && resolvedTheme === "dark";

  const heroImageSrc = useMemo(() => {
    return isDarkTheme
      ? "/images/hero-workspace-dark.webp"
      : "/images/hero-workspace-light.webp";
  }, [isDarkTheme]);

  const heroImageAlt = useMemo(() => {
    return locale === "zh" ? "RecipeEasy 工作台预览" : "RecipeEasy workspace preview";
  }, [locale]);

  const shouldShowHeroImage = !hasHeroImageError;
  const shouldShowHeroSkeleton = !shouldShowHeroImage || !isHeroImageLoaded;

  const stats =
    locale === "zh"
      ? [
          { value: "1", label: "每次生成菜谱消耗 1 积分" },
          { value: "2", label: "每次生成图片消耗 2 积分" },
          { value: "3", label: "每日登录赠送 3 积分" },
        ]
      : [
          { value: "1", label: "credit per recipe" },
          { value: "2", label: "credits per image" },
          { value: "3", label: "daily sign-in credits" },
        ];

  useEffect(() => {
    setIsHeroImageLoaded(false);
    setHasHeroImageError(false);
  }, [heroImageSrc]);

  useEffect(() => {
    setIsThemeHydrated(true);
  }, []);

  return (
    <section id="hero" className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-28 left-[-14%] h-[24rem] w-[24rem] rounded-full bg-primary/16 blur-3xl dark:bg-primary/20" />
        <div className="absolute -top-28 right-[-12%] h-[24rem] w-[24rem] rounded-full bg-emerald-300/16 blur-3xl dark:bg-emerald-400/14" />
      </div>

      <div className="relative z-10 px-4 pb-10 pt-10 md:px-10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col">
          <div className="flex flex-col-reverse items-center gap-6 py-10 md:flex-row md:items-center md:gap-8 lg:gap-10">
            <div className="w-full text-left md:min-w-[400px] md:flex-1">
              <span className="inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {locale === "zh" ? "AI 驱动烹饪" : "AI-Powered Cooking"}
              </span>

              <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.033em] text-foreground sm:text-5xl lg:text-6xl">
                {locale === "zh" ? (
                  <>
                    你的 AI
                    <span className="text-primary"> 私人副厨</span>
                  </>
                ) : (
                  <>
                    Your AI
                    <span className="text-primary"> Sous Chef</span>
                  </>
                )}
              </h1>

              <p className="mt-3 max-w-[500px] text-lg leading-relaxed font-normal text-slate-500 dark:text-slate-400">
                {t("description")}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push(workspacePath)}
                  className="inline-flex h-12 min-w-[140px] cursor-pointer items-center justify-center rounded-lg bg-primary px-6 text-base font-bold leading-normal tracking-[0.015em] text-primary-foreground shadow-[0_0_20px_rgba(19,236,91,0.3)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(19,236,91,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-60 focus-visible:ring-offset-2"
                >
                  <span>{t("generateRecipeCta")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push(mealPlanPath)}
                  className="inline-flex h-12 min-w-[140px] cursor-pointer items-center justify-center rounded-lg border border-border-70 bg-background-85 px-6 text-base font-bold leading-normal tracking-[0.015em] text-foreground transition-colors hover:bg-muted-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-60 focus-visible:ring-offset-2"
                >
                  <span>{t("generateMealPlanCta")}</span>
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                </span>
                <span>{locale === "zh" ? "无需信用卡" : "No credit card required"}</span>
                <span className="mx-2 text-muted-foreground-80">•</span>
                <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                </span>
                <span>{locale === "zh" ? "每日免费积分" : "Daily free credits"}</span>
              </div>
            </div>

            <div className="group relative w-full md:w-[46%] md:max-w-[600px] md:flex-none">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/20 to-transparent opacity-40 blur-2xl transition-opacity group-hover:opacity-60" />
              <div className="relative overflow-hidden rounded-2xl border border-border-70 bg-card-90 shadow-2xl">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  {shouldShowHeroSkeleton ? (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/70 via-muted/50 to-muted/30"
                    />
                  ) : null}
                  {shouldShowHeroImage ? (
                    <Image
                      src={heroImageSrc as string}
                      alt={heroImageAlt}
                      fill
                      priority
                      className={`object-cover transition-opacity duration-500 ${
                        isHeroImageLoaded ? "opacity-100" : "opacity-0"
                      }`}
                      unoptimized={true}
                      onLoad={() => setIsHeroImageLoaded(true)}
                      onError={() => {
                        setHasHeroImageError(true);
                        setIsHeroImageLoaded(false);
                      }}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-16 mt-8 grid grid-cols-1 gap-6 border-y border-border-70 py-12 md:grid-cols-3">
            {stats.map((stat, statIndex) => (
              <div
                key={stat.label}
                className={`flex flex-col items-center gap-1 text-center ${
                  statIndex === 1 ? "border-y border-border-70 py-6 md:border-x md:border-y-0 md:py-0" : ""
                }`}
              >
                <p className="text-3xl font-black text-foreground">{stat.value}</p>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
