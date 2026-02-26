import Image from "next/image";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/layout/section-header";

export const IntroductionSection = () => {
  const t = useTranslations("introduction");

  return (
    <section id="introduction" className="home-section">
      <div className="home-inner">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-10">
          <div className="order-2 h-full lg:order-1 home-card p-7 md:p-10">
            <SectionHeader
              eyebrow={t("title")}
              title={t("heading")}
              description={t("description1")}
              align="left"
              className="mb-5"
            />
            <p className="text-base leading-7 text-muted-foreground md:text-lg">
              {t("description2")}
            </p>
          </div>

          <div className="order-1 h-full lg:order-2">
            <Image
              src="/images/introduction_fridge.jpg"
              alt={t("imageAlt")}
              width={720}
              height={520}
              className="h-full w-full rounded-xl object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}; 
