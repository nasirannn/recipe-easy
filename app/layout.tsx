import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { generateMetadata, websiteStructuredData, organizationStructuredData, SITE_URL } from "@/lib/seo";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

// Google Analytics ID
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-NYQTCQWRZ7';

export const metadata: Metadata = {
  ...generateMetadata({
    title: "RecipeEasy - AI Recipe Generator, Random Recipes, Meal Ideas",
    description: "Stuck on what to cook? Enter your ingredients and get random, AI-generated recipes based on what you have — with easy cooking steps.",
    path: "/",
  }),
  icons: {
            icon: "/images/recipe-easy-logo.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 动态设置lang属性
              (function() {
                var path = window.location.pathname;
                var lang = 'en'; // 默认语言
                if (path.includes('/zh')) {
                  lang = 'zh';
                }
                document.documentElement.lang = lang;
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              analytics_storage: 'denied'
            });
          `}
        </Script>
        

        
        {/* Microsoft Clarity */}
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "snyht181zw");
            `,
          }}
        />
        
        {/* 结构化数据 */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData),
          }}
        />
        <Script
          id="organization-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
        
        {children}
        <Toaster />
      </body>
    </html>
  );
}
export const runtime = 'edge';
