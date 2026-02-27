export type LegalDocumentType = 'privacy' | 'terms';
export type LegalLocale = 'en' | 'zh';

const LEGAL_DOC_PUBLIC_BASE = (
  process.env.R2_PUBLIC_URL_DOC ||
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL_DOC ||
  process.env.R2_PUBLIC_URL ||
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  ''
).replace(/\/+$/, '');

function hasContent(value: string | null | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

export function isLegalDocumentType(type: string): type is LegalDocumentType {
  return type === 'privacy' || type === 'terms';
}

export function isLegalLocale(locale: string): locale is LegalLocale {
  return locale === 'en' || locale === 'zh';
}

export function normalizeLegalLocale(locale: string): LegalLocale {
  return locale === 'zh' ? 'zh' : 'en';
}

export function resolveLegalFileName(type: LegalDocumentType, locale: LegalLocale): string {
  if (type === 'privacy') {
    return locale === 'en' ? 'privacy-policy.md' : 'privacy-policy-zh.md';
  }

  return locale === 'en' ? 'terms-of-service.md' : 'terms-of-service-zh.md';
}

function getDocumentUrl(type: LegalDocumentType, locale: LegalLocale): string | null {
  if (!LEGAL_DOC_PUBLIC_BASE) {
    return null;
  }

  return `${LEGAL_DOC_PUBLIC_BASE}/${resolveLegalFileName(type, locale)}`;
}

export async function getLegalDocumentFromR2(
  type: LegalDocumentType,
  locale: LegalLocale
): Promise<string | null> {
  try {
    const url = getDocumentUrl(type, locale);
    if (!url) {
      return null;
    }

    const response = await fetch(url, {
      cache: 'force-cache',
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    const content = await response.text();
    return hasContent(content) ? content : null;
  } catch {
    return null;
  }
}

export async function getLegalDocument(
  type: LegalDocumentType,
  locale: LegalLocale
): Promise<string | null> {
  return getLegalDocumentFromR2(type, locale);
}
