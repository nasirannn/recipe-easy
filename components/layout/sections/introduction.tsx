import Image from "next/image";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/layout/section-header";

export const IntroductionSection = () => {
  const t = useTranslations("introduction");

  return (
    <section id="introduction" className="home-section">
      <div className="px-4 md:px-10">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="home-card overflow-hidden p-6 md:p-8 lg:p-10">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center lg:gap-8">
              <div>
                <SectionHeader
                  title={t("heading")}
                  description={t("description1")}
                  align="left"
                  className="home-section-header-tight"
                />
                <p className="text-base leading-7 text-muted-foreground md:text-lg">
                  {t("description2")}
                </p>
              </div>

              <div>
                <Image
                  src="/images/introduction_fridge.jpg"
                  alt={t("imageAlt")}
                  width={720}
                  height={520}
                  className="h-60 w-full rounded-xl object-cover sm:h-72 lg:h-[320px]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}; 
