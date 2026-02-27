export function getLocaleBasePath(locale: string): string {
  return locale === 'en' ? '' : `/${locale}`;
}

export function withLocalePath(locale: string, path?: string): string {
  const base = getLocaleBasePath(locale);

  if (!path || path === '/') {
    return base || '/';
  }

  if (path.startsWith('#')) {
    return `${base || '/'}${path}`;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
