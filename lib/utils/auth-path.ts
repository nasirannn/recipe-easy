import { withLocalePath } from "@/lib/utils/locale-path";

export function sanitizePostAuthPath(path: string | null | undefined): string | null {
  if (!path || typeof path !== "string") {
    return null;
  }

  const trimmed = path.trim();
  if (!trimmed || !trimmed.startsWith("/")) {
    return null;
  }

  if (trimmed.startsWith("//")) {
    return null;
  }

  if (trimmed.startsWith("/auth/callback")) {
    return null;
  }

  if (/^\/(?:en|zh)\/auth(?:\/|$)/.test(trimmed) || /^\/auth(?:\/|$)/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export function buildAuthPath(locale: string, postAuthPath?: string | null): string {
  const authPath = withLocalePath(locale, "/auth");
  const sanitized = sanitizePostAuthPath(postAuthPath);

  if (!sanitized) {
    return authPath;
  }

  const searchParams = new URLSearchParams();
  searchParams.set("next", sanitized);
  return `${authPath}?${searchParams.toString()}`;
}
