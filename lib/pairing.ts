export const PAIRING_TYPE_OPTIONS = [
  'drink',
  'wine',
  'tea',
  'cocktail',
  'mocktail',
  'beer',
  'juice',
  'coffee',
  'sake',
] as const;

export type PairingType = (typeof PAIRING_TYPE_OPTIONS)[number];

const PAIRING_TYPE_SET = new Set<string>(PAIRING_TYPE_OPTIONS);

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z-]/g, '');
}

function mapPairingTypeToken(token: string): PairingType | null {
  if (!token) {
    return null;
  }

  if (PAIRING_TYPE_SET.has(token)) {
    return token as PairingType;
  }

  if (token.includes('mocktail') || token.includes('non-alcoholic') || token.includes('nonalcoholic')) {
    return 'mocktail';
  }
  if (token.includes('cocktail') || token.includes('martini') || token.includes('spritz')) {
    return 'cocktail';
  }
  if (token.includes('wine')) {
    return 'wine';
  }
  if (token.includes('beer') || token.includes('lager') || token.includes('ale') || token.includes('stout')) {
    return 'beer';
  }
  if (token.includes('coffee') || token.includes('espresso') || token.includes('latte') || token.includes('cappuccino')) {
    return 'coffee';
  }
  if (token.includes('tea') || token.includes('matcha')) {
    return 'tea';
  }
  if (token.includes('juice') || token.includes('smoothie')) {
    return 'juice';
  }
  if (token.includes('sake')) {
    return 'sake';
  }
  if (token.includes('beverage') || token.includes('drink')) {
    return 'drink';
  }

  return 'drink';
}

export function normalizePairingType(
  value: unknown,
  fallback: PairingType | null = null
): PairingType | null {
  if (typeof value !== 'string') {
    return fallback;
  }

  const token = normalizeToken(value);
  if (!token) {
    return fallback;
  }

  return mapPairingTypeToken(token) ?? fallback;
}

