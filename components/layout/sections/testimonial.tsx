"use client";

import { useLocale } from "next-intl";

export const TestimonialSection = () => {
  const locale = useLocale();

  const quote =
    locale === "zh"
      ? "“这是我用过最好的厨房助手，就像魔法一样。”"
      : '"The best kitchen assistant I\'ve ever used. It\'s like magic."';

  const name = locale === "zh" ? "Gordon R." : "Gordon R.";
  const role = locale === "zh" ? "专业厨师" : "Professional Chef";

  return (
    <section id="testimonials" className="py-16">
      <span id="faq" className="sr-only" aria-hidden="true" />
      <div className="px-4 md:px-10">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="relative overflow-hidden rounded-2xl bg-slate-900">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{
                backgroundImage: 'url("/images/testimonial.webp")',
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-6 px-6 py-16 text-center md:px-12 md:py-20">
              <h2 className="max-w-[800px] text-3xl font-black text-white md:text-5xl">{quote}</h2>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-primary bg-slate-700">
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{
                      backgroundImage:
                        'url("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80")',
                    }}
                  />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-white">{name}</p>
                  <p className="text-sm font-medium text-primary">{role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
