"use client";
import { Menu } from "lucide-react";
import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import Link from "next/link";
import Image from "next/image";
import { ToggleTheme } from "./toogle-theme";
import { LanguageSwitcher } from "../ui/language-switcher";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation'
import { LogOut } from "lucide-react";
import { AuthModal } from "@/components/auth/auth-modal";

interface RouteProps {
  href: string;
  label: string;
}

// interface FeatureProps {
//   title: string;
//   description: string;
// }

export const Navbar = () => {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const t = useTranslations('navigation');
  const locale = useLocale();

  // 监听页面滚动
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50); // 滚动超过50px时显示背景
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const routeList: RouteProps[] = [
    {
      href: "#features",
      label: t("features"),
    },
    {
      href: "#testimonials",
      label: t("testimonials"),
    },
    {
      href: "#faq",
      label: t("faq"),
    },
  ];

// const featureList: FeatureProps[] = [
//   {
//     title: "Showcase Your Value ",
//     description: "Highlight how your product solves user problems.",
//   },
//   {
//     title: "Build Trust",
//     description:
//       "Leverages social proof elements to establish trust and credibility.",
//   },
//   {
//     title: "Capture Leads",
//     description:
//       "Make your lead capture form visually appealing and strategically.",
//   },
// ];

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full rounded-none flex justify-between items-center p-4 lg:px-8 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/15 backdrop-blur-sm shadow-sm'
          : 'bg-transparent backdrop-blur-none'
      }`}
    >
    {/* 左侧Logo和品牌名称 */}
    <Link href="/" className="font-bold text-base sm:text-lg flex items-center gap-1.5 sm:gap-2">
      <div className="relative w-7 h-7 sm:w-8 sm:h-8">
        <Image
          src="/recipe-easy-logo.svg"
          alt="Logo"
          fill
          className="object-contain"
          sizes="(max-width: 640px) 28px, 32px"
        />
      </div>
      RecipeEasy
    </Link>
  
    {/* 移动端菜单按钮 */}
    <div className="flex items-center lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Menu
            onClick={() => setIsOpen(!isOpen)}
            className="cursor-pointer lg:hidden"
          />
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex flex-col justify-between rounded-tr-2xl rounded-br-2xl bg-card border-secondary"
        >
          <div>
            <div className="border-b pb-4 mb-4">
              <Link
                href="/"
                className="font-bold text-lg flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <div className="relative w-8 h-8">
                  <Image
                    src="/recipe-easy-logo.svg"
                    alt="Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                RecipeEasy
              </Link>
            </div>
            
            <nav className="flex flex-col gap-4">
              {routeList.map(({ href, label }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium hover:text-primary transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-4 items-center">
            <div className="flex gap-4">
                <LanguageSwitcher />
                <ToggleTheme />
            </div>

            {!loading && (
              user ? (
                <div className="text-center w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <UserAvatar user={user} size="md" />
                    <span className="font-semibold text-base">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                  </div>
                  <Button onClick={handleLogout} variant="outline" className="w-full">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('logout')}</span>
                  </Button>
                </div>
              ) : (
                <Button onClick={() => {
                  setIsOpen(false);
                  setShowAuthModal(true);
                }} variant="default" className="w-full">
                  {t('login')}
                </Button>
              )
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  
    {/* 桌面端导航菜单 - 修改为靠左对齐 */}
    <div className="hidden lg:flex flex-1 pl-8"> {/* 添加flex-1和左内边距 */}
      <NavigationMenu className="w-full">
        <NavigationMenuList className="justify-start"> {/* 改为靠左对齐 */}
          <NavigationMenuItem>
            {/* <NavigationMenuTrigger className="bg-card text-base">
              Features
            </NavigationMenuTrigger> */}
            <NavigationMenuContent>
              {/* 菜单内容... */}
            </NavigationMenuContent>
          </NavigationMenuItem>
  
          <NavigationMenuItem>
            {routeList.map(({ href, label }) => (
              <NavigationMenuLink key={href} asChild>
                <Link href={href} className="text-base px-4 hover:text-primary">
                  {label}
                </Link>
              </NavigationMenuLink>
            ))}
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  
    {/* 右侧功能按钮 */}
    <div className="hidden lg:flex items-center gap-4">
      <LanguageSwitcher />
      <ToggleTheme />
      {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <UserAvatar user={user} size="md" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="flex flex-col items-start mb-1">
                    <span className="font-semibold text-base">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => setShowAuthModal(true)} variant="default" size="sm">
                {t('login')}
              </Button>
            )
          )}
      {/* <Button asChild size="sm" variant="ghost" aria-label="">
        <Link
          aria-label=""
          href=""
          target="_blank"
        >
        </Link>
      </Button> */}
    </div>
    <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
  </header>
  );
};
