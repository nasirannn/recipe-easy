import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  align?: "left" | "center";
  headingTag?: "h1" | "h2" | "h3";
  className?: string;
};

export function SectionHeader({
  title,
  description,
  eyebrow,
  align = "center",
  headingTag = "h2",
  className,
}: SectionHeaderProps) {
  const isLeft = align === "left";
  const HeadingTag = headingTag;

  return (
    <div className={cn(isLeft ? "text-left" : "text-center", className)}>
      {eyebrow ? <span className="home-eyebrow">{eyebrow}</span> : null}
      <HeadingTag className="home-title">{title}</HeadingTag>
      {description ? (
        <p className={cn("home-lead", isLeft ? "mx-0" : "mx-auto")}>{description}</p>
      ) : null}
    </div>
  );
}
