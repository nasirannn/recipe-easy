import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  title,
  description,
  eyebrow,
  align = "center",
  className,
}: SectionHeaderProps) {
  const isLeft = align === "left";

  return (
    <div className={cn(isLeft ? "text-left" : "text-center", className)}>
      {eyebrow ? <span className="home-eyebrow">{eyebrow}</span> : null}
      <h2 className="home-title">{title}</h2>
      {description ? (
        <p className={cn("home-lead", isLeft ? "mx-0" : "mx-auto")}>{description}</p>
      ) : null}
    </div>
  );
}
