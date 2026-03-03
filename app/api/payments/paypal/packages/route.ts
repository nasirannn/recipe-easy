import { NextResponse } from 'next/server';
import {
  formatUsdFromCents,
  getCreditPackageTotalCredits,
  listCreditPackages,
} from '@/lib/payments/credit-packages';

export const runtime = 'nodejs';

export async function GET() {
  const packages = listCreditPackages().map((pkg) => ({
    id: pkg.id,
    credits: pkg.credits,
    bonusCredits: pkg.bonusCredits,
    totalCredits: getCreditPackageTotalCredits(pkg),
    priceCents: pkg.priceCents,
    price: formatUsdFromCents(pkg.priceCents),
    currency: pkg.currency,
    highlighted: pkg.highlighted,
  }));

  return NextResponse.json({
    success: true,
    packages,
  });
}

