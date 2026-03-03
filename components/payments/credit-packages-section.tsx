"use client";

import { useEffect, useMemo, useState } from "react";
import { Coins, Loader2, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { AuthModal } from "@/components/auth/auth-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";

const DAILY_LOGIN_FREE_CREDITS = 3;
const PRICING_SKELETON_CARD_COUNT = 4;

type CreditPackageDto = {
  id: string;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  priceCents: number;
  price: string;
  currency: string;
  highlighted: boolean;
};

type PackagesResponse = {
  success?: boolean;
  packages?: CreditPackageDto[];
  error?: string;
};

type CreateOrderResponse = {
  success?: boolean;
  orderId?: string;
  approvalUrl?: string | null;
  error?: string;
};

function formatCurrency(currency: string, amount: string): string {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return `${currency} ${amount}`;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  } catch {
    return `${currency} ${amount}`;
  }
}

function PricingPackageSkeletonCard({ showBadge }: { showBadge?: boolean }) {
  return (
    <Card className="flex h-full flex-col rounded-2xl border border-border-70 bg-card">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-7 w-28" />
          {showBadge ? <Skeleton className="h-6 w-24 rounded-full" /> : null}
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <div className="space-y-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-3 w-24" />
        </div>

        <div className="rounded-xl border border-border-70 bg-background/70 p-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-2 h-3 w-28" />
        </div>

        <Skeleton className="mt-auto h-11 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

export function CreditPackagesSection() {
  const t = useTranslations("billing");
  const locale = useLocale();
  const { session } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [packages, setPackages] = useState<CreditPackageDto[]>([]);
  const [buyingPackageId, setBuyingPackageId] = useState<string | null>(null);

  const isZh = locale.toLowerCase().startsWith("zh");

  useEffect(() => {
    let disposed = false;

    const fetchPackages = async () => {
      try {
        setLoadingPackages(true);
        setPackagesError(null);

        const response = await fetch("/api/payments/paypal/packages", { cache: "no-store" });
        const data = (await response.json()) as PackagesResponse;
        if (!response.ok || !data.success || !Array.isArray(data.packages)) {
          throw new Error(data.error || "Failed to load packages.");
        }

        if (!disposed) {
          setPackages(data.packages);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load packages.";
        if (!disposed) {
          setPackagesError(message);
        }
      } finally {
        if (!disposed) {
          setLoadingPackages(false);
        }
      }
    };

    fetchPackages();

    return () => {
      disposed = true;
    };
  }, []);

  const packageNameMap = useMemo(
    () => ({
      starter: t("packages.starter.name"),
      pro: t("packages.pro.name"),
      studio: t("packages.studio.name"),
    }),
    [t]
  );

  const packageDescriptionMap = useMemo(
    () => ({
      starter: t("packages.starter.description"),
      pro: t("packages.pro.description"),
      studio: t("packages.studio.description"),
    }),
    [t]
  );

  const handlePurchase = async (pkg: CreditPackageDto) => {
    if (!session?.access_token) {
      setShowAuthModal(true);
      return;
    }

    try {
      setBuyingPackageId(pkg.id);
      const response = await fetch("/api/payments/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          packageId: pkg.id,
          locale,
        }),
      });

      const data = (await response.json()) as CreateOrderResponse;
      if (!response.ok || !data.success || !data.orderId) {
        throw new Error(data.error || t("errors.createOrderFailed"));
      }

      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
        return;
      }

      throw new Error(t("errors.approvalUrlMissing"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("errors.createOrderFailed");
      toast.error(message);
    } finally {
      setBuyingPackageId(null);
    }
  };

  return (
    <section className="px-4 py-8 md:px-10 lg:py-10">
      <div className="mx-auto w-full max-w-[1200px]">
        <header className="mb-8 space-y-3 text-center sm:mb-10 sm:space-y-4">
          <span className="home-eyebrow">{t("eyebrow")}</span>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">{t("title")}</h1>
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("description")}
          </p>
        </header>

        {loadingPackages ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label={t("loading")}>
            {Array.from({ length: PRICING_SKELETON_CARD_COUNT }).map((_, index) => (
              <PricingPackageSkeletonCard key={`pricing-skeleton-${index}`} showBadge={index === 1} />
            ))}
          </div>
        ) : packagesError ? (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-8 text-center text-sm text-destructive">
            {packagesError}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="flex h-full flex-col rounded-2xl border border-border-70 bg-card">
              <CardHeader className="space-y-3">
                <CardTitle className="text-xl font-bold text-foreground">{t("freePlan.name")}</CardTitle>
                <CardDescription className="min-h-[44px] text-sm leading-6 text-muted-foreground">
                  {t("freePlan.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5">
                <div className="space-y-1">
                  <p className="text-3xl font-black tracking-tight text-foreground">{t("freePlan.price")}</p>
                  <p className="text-xs text-muted-foreground">{t("freePlan.subtitle")}</p>
                </div>

                <div className="rounded-xl border border-border-70 bg-background/70 p-3">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Coins className="h-4 w-4 text-primary" />
                    {t("freePlan.credits", { count: DAILY_LOGIN_FREE_CREDITS })}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("freePlan.hint")}</p>
                </div>

                <Button
                  type="button"
                  className="mt-auto h-11 w-full"
                  variant="outline"
                  onClick={() => setShowAuthModal(true)}
                  disabled={Boolean(session?.access_token)}
                >
                  {session?.access_token ? t("freePlan.loggedIn") : t("freePlan.signIn")}
                </Button>
              </CardContent>
            </Card>

            {packages.map((pkg) => {
              const packageName = packageNameMap[pkg.id as keyof typeof packageNameMap] ?? pkg.id;
              const packageDescription =
                packageDescriptionMap[pkg.id as keyof typeof packageDescriptionMap] ?? "";
              const isBuying = buyingPackageId === pkg.id;

              return (
                <Card
                  key={pkg.id}
                  className={[
                    "flex h-full flex-col rounded-2xl border border-border-70 bg-card",
                    pkg.highlighted ? "ring-2 ring-primary/50" : "",
                  ].join(" ")}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-xl font-bold text-foreground">{packageName}</CardTitle>
                      {pkg.highlighted ? (
                        <span className="rounded-full bg-primary/12 px-2.5 py-1 text-xs font-semibold text-primary">
                          {t("popular")}
                        </span>
                      ) : null}
                    </div>
                    <CardDescription className="min-h-[44px] text-sm leading-6 text-muted-foreground">
                      {packageDescription}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-5">
                    <div className="space-y-1">
                      <p className="text-3xl font-black tracking-tight text-foreground">
                        {formatCurrency(pkg.currency, pkg.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">{t("oneTimePurchase")}</p>
                    </div>

                    <div className="rounded-xl border border-border-70 bg-background/70 p-3">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Coins className="h-4 w-4 text-primary" />
                        {t("creditsCount", { count: pkg.totalCredits })}
                      </p>
                      {pkg.bonusCredits > 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("creditsBreakdown", { base: pkg.credits, bonus: pkg.bonusCredits })}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">{t("creditsBaseOnly", { base: pkg.credits })}</p>
                      )}
                    </div>

                    <Button
                      type="button"
                      className="mt-auto h-11 w-full"
                      variant={pkg.highlighted ? "default" : "outline"}
                      onClick={() => handlePurchase(pkg)}
                      disabled={isBuying}
                    >
                      {isBuying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("redirecting")}
                        </>
                      ) : (
                        t("buyNow")
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border-70 bg-background/70 px-4 py-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>{isZh ? "由 PayPal 安全处理支付" : "Secure checkout powered by PayPal"}</span>
        </div>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </section>
  );
}
