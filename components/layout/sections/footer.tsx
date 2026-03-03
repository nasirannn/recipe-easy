"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useState } from "react";
import { ContactDialog } from "@/components/ui/contact-dialog";
import { withLocalePath } from "@/lib/utils/locale-path";

type ExternalTextLink = {
  href: string;
  label: string;
};

type ExternalBadgeLink = {
  href: string;
  imageSrc: string;
  alt: string;
  width: number;
  height: number;
  title?: string;
  imageClassName?: string;
};

const FRIEND_LINKS: ExternalTextLink[] = [
  {
    href: "https://aiketorecipes.com/",
    label: "AI Keto Recipes",
  },
  {
    href: "https://aistage.net",
    label: "AIStage",
  },
  {
    href: "https://makernb.com",
    label: "MakeRNB",
  },
];

const FEATURED_BADGES: ExternalBadgeLink[] = [
  {
    href: "https://startupfa.me/s/recipe-easy.com?utm_source=recipe-easy.com",
    imageSrc: "https://startupfa.me/badges/featured/default-small.webp",
    alt: "Featured on Startup Fame",
    width: 224,
    height: 36,
  },
  {
    href: "https://www.producthunt.com/products/recipeeasy?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-recipeeasy",
    imageSrc: "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1001064&theme=light&t=1754981113114",
    alt: "RecipeEasy on Product Hunt",
    width: 250,
    height: 54,
  },
  {
    href: "https://fazier.com/launches/recipeeasy",
    imageSrc: "https://fazier.com/api/v1/public/badges/embed_image.svg?launch_id=5138&badge_type=weekly&theme=light",
    alt: "RecipeEasy on Fazier",
    width: 270,
    height: 36,
  },
  {
    href: "https://tinylaunch.com",
    imageSrc: "https://tinylaunch.com/tinylaunch_badge_featured_on.svg",
    alt: "Featured on TinyLaunch",
    width: 202,
    height: 36,
  },
  {
    href: "https://firsto.co/projects/recipeeasy",
    imageSrc: "https://firsto.co/images/badges/find-us-on-firsto.svg",
    alt: "Find us on Firsto",
    width: 195,
    height: 36,
    title: "Find us on Firsto",
  },
  {
    href: "https://www.saashub.com/recipe-easy?utm_source=badge&utm_campaign=badge&utm_content=recipe-easy&badge_variant=color&badge_kind=approved",
    imageSrc: "https://cdn-b.saashub.com/img/badges/approved-color.png?v=1",
    alt: "RecipeEasy on SaaSHub",
    width: 150,
    height: 36,
    imageClassName: "max-w-[150px]",
  },
];

export const FooterSection = () => {
  const locale = useLocale();
  const homeHref = withLocalePath(locale);
  const [showContactDialog, setShowContactDialog] = useState(false);

  return (
    <footer id="footer" className="mt-10 border-t border-border-70 bg-background pb-10 pt-6 text-foreground">
      <div className="px-4 md:px-10">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="relative h-6 w-6 opacity-75">
                <Image
                  src="/logo.svg"
                  alt="RecipeEasy"
                  fill
                  className="object-contain"
                  sizes="24px"
                />
              </div>
              <Link href={homeHref} className="font-bold text-muted-foreground hover:text-primary">
                RecipeEasy © 2025
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground md:justify-end">
              <Link href={withLocalePath(locale, "/privacy")} className="transition-colors hover:text-primary">
                {locale === "zh" ? "隐私政策" : "Privacy Policy"}
              </Link>
              <Link href={withLocalePath(locale, "/terms")} className="transition-colors hover:text-primary">
                {locale === "zh" ? "服务条款" : "Terms of Service"}
              </Link>
              <button
                type="button"
                onClick={() => setShowContactDialog(true)}
                className="cursor-pointer bg-transparent p-0 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {locale === "zh" ? "联系支持" : "Contact Support"}
              </button>
            </div>
          </div>

          <div className="my-6 h-px bg-border-70" />

          <div className="space-y-5">
            <section className="space-y-3">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground/80">
                {locale === "zh" ? "友情链接" : "Friend Links"}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
                {FRIEND_LINKS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex cursor-pointer items-center text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground/80">
                {locale === "zh" ? "收录与推荐" : "Featured On"}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                {FEATURED_BADGES.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={item.title}
                    className="group inline-flex h-10 cursor-pointer items-center justify-center px-1 transition-opacity duration-200 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
                  >
                    <Image
                      src={item.imageSrc}
                      alt={item.alt}
                      width={item.width}
                      height={item.height}
                      className={`h-9 w-auto max-w-full object-contain ${item.imageClassName ?? ""}`}
                      unoptimized
                    />
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <ContactDialog open={showContactDialog} onOpenChange={setShowContactDialog} />
    </footer>
  );
};
