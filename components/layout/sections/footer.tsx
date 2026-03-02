"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useState } from "react";
import { ContactDialog } from "@/components/ui/contact-dialog";
import { withLocalePath } from "@/lib/utils/locale-path";

export const FooterSection = () => {
  const locale = useLocale();
  const homeHref = withLocalePath(locale);
  const [showContactDialog, setShowContactDialog] = useState(false);

  return (
    <footer id="footer" className="mt-10 border-t border-border-70 bg-background py-10 text-foreground">
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
                RecipeEasy © 2026
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

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a
              href="https://aiketorecipes.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-primary"
            >
              AI Keto Recipes
            </a>
            <a
              href="https://aistage.net"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-primary"
            >
              AIStage
            </a>
            <a
              href="https://makernb.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-primary"
            >
              MakeRNB
            </a>
          </div>

          <div className="my-6 h-px bg-border-70" />

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://startupfa.me/s/recipe-easy.com?utm_source=recipe-easy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <Image
                src="https://startupfa.me/badges/featured/default-small.webp"
                alt="Featured on Startup Fame"
                width={224}
                height={36}
                className="h-9 w-auto object-contain"
                unoptimized
              />
            </a>

            <a
              href="https://www.producthunt.com/products/recipeeasy?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-recipeeasy"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <Image
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1001064&theme=light&t=1754981113114"
                alt="RecipeEasy on Product Hunt"
                width={250}
                height={54}
                className="h-9 w-auto object-contain"
                unoptimized
              />
            </a>

            <a
              href="https://fazier.com/launches/recipeeasy"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <Image
                src="https://fazier.com/api/v1/public/badges/embed_image.svg?launch_id=5138&badge_type=weekly&theme=light"
                alt="RecipeEasy on Fazier"
                width={270}
                height={36}
                className="h-9 w-auto object-contain"
                unoptimized
              />
            </a>

            <a
              href="https://tinylaunch.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <Image
                src="https://tinylaunch.com/tinylaunch_badge_featured_on.svg"
                alt="Featured on TinyLaunch"
                width={202}
                height={36}
                className="h-9 w-auto object-contain"
                unoptimized
              />
            </a>

            <a
              href="https://firsto.co/projects/recipeeasy"
              target="_blank"
              rel="noopener noreferrer"
              title="Find us on Firsto"
              className="transition-opacity hover:opacity-80"
            >
              <Image
                src="https://firsto.co/images/badges/find-us-on-firsto.svg"
                alt="Find us on Firsto"
                width={195}
                height={36}
                className="h-9 w-auto object-contain"
                unoptimized
              />
            </a>

            <a
              href="https://www.saashub.com/recipe-easy?utm_source=badge&utm_campaign=badge&utm_content=recipe-easy&badge_variant=color&badge_kind=approved"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <Image
                src="https://cdn-b.saashub.com/img/badges/approved-color.png?v=1"
                alt="RecipeEasy on SaaSHub"
                width={150}
                height={36}
                className="h-9 w-auto max-w-[150px] object-contain"
                unoptimized
              />
            </a>
          </div>
        </div>
      </div>

      <ContactDialog open={showContactDialog} onOpenChange={setShowContactDialog} />
    </footer>
  );
};
