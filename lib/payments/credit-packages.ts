export type CreditPackageId = 'starter' | 'pro' | 'studio';

export type CreditPackage = {
  id: CreditPackageId;
  credits: number;
  bonusCredits: number;
  priceCents: number;
  currency: 'USD';
  sortOrder: number;
  highlighted: boolean;
};

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    credits: 1200,
    bonusCredits: 0,
    priceCents: 899,
    currency: 'USD',
    sortOrder: 1,
    highlighted: true,
  },
  {
    id: 'pro',
    credits: 3000,
    bonusCredits: 0,
    priceCents: 1999,
    currency: 'USD',
    sortOrder: 2,
    highlighted: false,
  },
  {
    id: 'studio',
    credits: 8000,
    bonusCredits: 0,
    priceCents: 4999,
    currency: 'USD',
    sortOrder: 3,
    highlighted: false,
  },
];

export function listCreditPackages(): CreditPackage[] {
  return [...CREDIT_PACKAGES].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCreditPackageById(value: string | null | undefined): CreditPackage | null {
  if (!value) {
    return null;
  }

  return CREDIT_PACKAGES.find((item) => item.id === value) ?? null;
}

export function getCreditPackageTotalCredits(pkg: CreditPackage): number {
  return pkg.credits + pkg.bonusCredits;
}

export function formatUsdFromCents(value: number): string {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  return (normalized / 100).toFixed(2);
}
