"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface RouteBackgroundShellProps {
  children: ReactNode;
  locale: string;
}

export function RouteBackgroundShell({ children, locale }: RouteBackgroundShellProps) {
  const pathname = usePathname();
  const isHomePage = pathname === `/${locale}` || pathname === "/";

  if (!isHomePage) {
    return <div>{children}</div>;
  }

  return (
    <div className="home-shell">
      <div className="home-shell-content">{children}</div>
    </div>
  );
}
