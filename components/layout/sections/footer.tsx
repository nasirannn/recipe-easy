"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { ContactDialog } from '@/components/ui/contact-dialog';

export const FooterSection = () => {
  const t = useTranslations('footer');
  const tContact = useTranslations('contactDialog');
  const locale = useLocale();
  const [showContactDialog, setShowContactDialog] = useState(false);

  return (
    <footer id="footer" className="home-section-compact border-t border-border/70">
      <div className="home-inner">
        {/* Main content grid - two columns layout with right content grouped */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
          {/* First column: Logo and description */}
          <div className="text-center md:text-left">
            <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold tracking-tight sm:text-lg">
              <div className="relative w-7 h-7 sm:w-8 sm:h-8">
                <Image 
                  src="/images/recipe-easy-logo.svg"
                  alt="Logo"
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 28px, 32px"
                />
              </div>
              RecipeEasy
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground md:mx-0">
              {t('description')}
            </p>
          </div>

          {/* Second column: About, Help, and Friend sections grouped together */}
          <div>
            <div className="flex flex-wrap justify-center gap-8 md:justify-end">
              {/* About section */}
              <div className="flex flex-col gap-2 shrink-0 text-center md:text-left">
                <h3 className="text-base font-semibold">{t('about')}</h3>
                <div>
                  <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {t('features')}
                  </Link>
                </div>
              </div>

              {/* Help section */}
              <div className="flex flex-col gap-2 shrink-0 text-center md:text-left">
                <h3 className="text-base font-semibold">{t('help')}</h3>
                <div>
                  <button 
                    onClick={() => setShowContactDialog(true)}
                    className="bg-transparent border-none p-0 text-sm text-muted-foreground transition-colors hover:text-foreground text-center md:text-left cursor-pointer"
                  >
                    {t('contact')}
                  </button>
                </div>
                <div>
                  <Link href="#faq" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {t('faq')}
                  </Link>
                </div>
              </div>

              {/* Friend section */}
              <div className="flex flex-col gap-2 shrink-0 text-center md:text-left">
                <h3 className="text-base font-semibold">{t('friends')}</h3>
                <div>
                  <a 
                    href="https://aiketorecipes.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    AI Keto Recipes
                  </a>
                </div>
                <div>
                  <a 
                  href="https://aistage.net" 
                  title="AIStage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >AIStage</a>
                </div>
                <div>
                  <a
                    href="https://makernb.com"
                    title="MakeRNB"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    MakeRNB
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright and legal links */}
        <div className="my-6 h-px bg-border/70" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-left text-sm text-muted-foreground">
            {t('copyright')}
          </h3>
          <div className="flex gap-6 text-sm">
            <Link href={`/${locale}/privacy`} className="text-muted-foreground transition-colors hover:text-foreground">
              {t('privacy')}
            </Link>
            <Link href={`/${locale}/terms`} className="text-muted-foreground transition-colors hover:text-foreground">
              {t('terms')}
            </Link>
          </div>
        </div>

        {/* Badges section */}
        <div className="my-6 h-px bg-border/70" />
        <div className="flex flex-wrap items-center justify-start gap-4">
          <a 
            href="https://startupfa.me/s/recipe-easy.com?utm_source=recipe-easy.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
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
            className="hover:opacity-80 transition-opacity"
          >
            <Image 
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1001064&theme=light&t=1754981113114" 
              alt="RecipeEasy - AI Recipe Generator - Turn ingredients into recipe instantly | Product Hunt" 
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
            className="hover:opacity-80 transition-opacity"
          >
            <Image 
              src="https://fazier.com/api/v1/public/badges/embed_image.svg?launch_id=5138&badge_type=weekly&theme=light" 
              alt="Fazier badge" 
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
            className="hover:opacity-80 transition-opacity"
          >
            <Image 
              src="https://tinylaunch.com/tinylaunch_badge_featured_on.svg"
              alt="TinyLaunch Badge"
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
            className="hover:opacity-80 transition-opacity"
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
            className="hover:opacity-80 transition-opacity"
          >
            <Image
              src="https://cdn-b.saashub.com/img/badges/approved-color.png?v=1"
              alt="Recipe Easy badge"
              width={150}
              height={36}
              className="h-9 w-auto max-w-[150px] object-contain"
              unoptimized
            />
          </a>
          <a href="https://indie.deals?ref=https%3A%2F%2Frecipe-easy.com" target="_blank" rel="noopener noreferrer">
            <style jsx>{`
              .indie-deals-badge {
                position: relative;
                overflow: hidden;
                display: inline-block;
              }
              .indie-deals-badge::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, 
                  rgba(255,255,255,0) 0%, 
                  rgba(255,255,255,0) 40%, 
                  rgba(255,255,255,0) 40%, 
                  rgba(255,255,255,0.9) 50%, 
                  rgba(255,255,255,0) 60%, 
                  rgba(255,255,255,0) 100%);
                transform: translateX(-100%) rotate(45deg);
                pointer-events: none;
                transition: transform 0.3s ease-out;
              }
              .indie-deals-badge:hover::after {
                animation: indie-deals-shine 1s ease-out;
              }
              @keyframes indie-deals-shine {
                0% { transform: translateX(-100%) rotate(45deg); }
                50% { transform: translateX(0%) rotate(45deg); }
                100% { transform: translateX(100%) rotate(45deg); }
              }
            `}</style>
            <svg 
              width="120" 
              height="40" 
              viewBox="0 0 120 40"
              xmlns="http://www.w3.org/2000/svg"
              className="indie-deals-badge h-9 w-auto object-contain"
            >
              <defs>
                <linearGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#e6f0fc" />
                </linearGradient>
              </defs>
              
              <rect 
                width="120" 
                height="40" 
                rx="10" 
                fill="url(#badgeGradient)"
              />
              
              <rect 
                x="0.75" 
                y="0.75" 
                width="118.5" 
                height="38.5" 
                rx="9.25" 
                fill="none"
                stroke="#0070f3" 
                strokeWidth="1.5" 
                strokeOpacity="0.3"
              />
              
              <image 
                href="https://indie.deals/logo_badge.png"
                x="9.6"
                y="8"
                width="24"
                height="24"
                preserveAspectRatio="xMidYMid meet"
                filter="drop-shadow(1px 1px 2px rgba(0,0,0,0.15))"
              />
              
              <text 
                x="80.4" 
                y="15.2" 
                textAnchor="middle" 
                dominantBaseline="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="7.199999999999999"
                fontWeight="normal"
                fill="#4b5563"
                letterSpacing="0.01em"
              >
                Find us on
              </text>
              <text 
                x="80.4" 
                y="26" 
                textAnchor="middle" 
                dominantBaseline="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontSize="8.8"
                fontWeight="bold"
                fill="#0070f3"
                letterSpacing="0.01em"
              >
                Indie.Deals
              </text>
            </svg>
          </a>
        </div>
      </div>

      <ContactDialog
        open={showContactDialog}
        onOpenChange={setShowContactDialog}
        email="contact@recipe-easy.com"
        subject={tContact('defaultSubject')}
        body={tContact('defaultBody')}
      />
    </footer>
  );
};
