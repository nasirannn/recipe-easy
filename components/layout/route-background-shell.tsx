import type { ReactNode } from "react";

interface RouteBackgroundShellProps {
  children: ReactNode;
}

export function RouteBackgroundShell({ children }: RouteBackgroundShellProps) {
  return (
    <div className="theme-shell-base">
      <div className="theme-shell-content">{children}</div>
    </div>
  );
}
