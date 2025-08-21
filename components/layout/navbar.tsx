"use client";

import { Menu, LogOut, User, Settings, BookOpen, Home, Search, Star, HelpCircle, ChevronRight, Compass } from "lucide-react";
import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { useUserUsage } from '@/hooks/use-user-usage';
import { getUserDisplayName } from '@/lib/utils/user-display';
import { EditDisplayNameDialog } from '@/components/ui/edit-display-name-dialog';
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { AuthModal } from "@/components/auth/auth-modal";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ToggleTheme } from "@/components/layout/toogle-theme";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import Image from "next/image";
import Link from "next/link";

interface RouteProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditNameDialog, setShowEditNameDialog] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { credits } = useUserUsage();
  const [isOpen, setIsOpen] = React.useState(false);
  const t = useTranslations('navigation');
  const tCredits = useTranslations('credits');
  const locale = useLocale();

  // 添加调试信息
  React.useEffect(() => {
    if (loading) return;
    
    if (user) {
      // 检查是否是Google用户
      if (user.app_metadata?.provider === 'google') {
      }
    } else {
    }
  }, [user, loading]);

  // 如果当前路径包含隐私政策或服务条款，不显示导航栏
  if (pathname.includes('/privacy') || pathname.includes('/terms')) {
    return null;
  }

  const routeList: RouteProps[] = [
    { href: `/${locale}`, label: t('home'), icon: <Home className="h-4 w-4" /> },
    { href: `/${locale}/recipes`, label: t('explore'), icon: <Compass className="h-4 w-4" /> },
    { href: `/${locale}#features`, label: t('features'), icon: <Star className="h-4 w-4" /> },
    { href: `/${locale}#faq`, label: t('faq'), icon: <HelpCircle className="h-4 w-4" /> },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      router.push(`/${locale}`);
    } catch (error) {
      // Logout error
    }
  };

  // 处理编辑名称成功后的回调 - 简化版本
  const handleEditNameSuccess = () => {
    // 用户数据会通过认证状态变化自动更新
  };

  return (
    <header className="w-full border-b border-transparent bg-transparent backdrop-blur-sm">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <Image
                src="/images/recipe-easy-logo.svg"
                alt="RecipeEasy"
                fill
                className="object-contain"
                sizes="32px"
              />
            </div>
            <span className="hidden font-bold sm:inline-block">
              RecipeEasy
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {routeList.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="flex items-center gap-2 transition-colors hover:text-primary text-gray-500"
              >
                {route.icon}
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
          </div>
          <nav className="flex items-center">
            {/* 桌面版功能区 */}
            <div className="hidden md:flex items-center">
              <div className="flex items-center ml-3">
                <div className="cursor-pointer">
                  <LanguageSwitcher />
                </div>
                <div className="mx-1"></div>
                <div className="cursor-pointer">
                  <ToggleTheme />
                </div>
              </div>
              
              {/* 用户菜单 */}
              {!loading && (
                user ? (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="ml-2 h-11 w-11 rounded-full overflow-hidden p-0 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer"
                      >
                        <UserAvatar user={user} size="md" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-52 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      {/* 用户信息 */}
                      <div className="mb-3">
                        <div className="relative">
                          {/* 用户名居中显示 */}
                          <div className="text-center">
                            <div className="font-medium text-base truncate">
                              {getUserDisplayName(user)}
                            </div>
                          </div>
                          {/* 右箭头绝对定位到右侧 */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-6 w-6 p-0 hover:bg-accent cursor-pointer"
                            onClick={() => setShowEditNameDialog(true)}
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="mb-3 text-center">
                        <div className="text-sm text-muted-foreground truncate px-2">
                          {user.email}
                        </div>
                      </div>
                     
                     <DropdownMenuSeparator className="mb-3" />
                     
                     {/* 积分信息 */}
                     <div className="mb-3 text-center">
                       <div className="flex items-center justify-center gap-2">
                         <span className="text-sm font-medium">{t('credits')}</span>
                         <span className="font-medium text-base">
                           {credits?.credits || 0}
                         </span>
                       </div>
                     </div>
                     
                     <div className="mb-3 text-center">
                       <div className="text-sm text-muted-foreground truncate px-2">
                         {tCredits('consumeOneCredit')}
                       </div>
                     </div>
                     
                     <DropdownMenuSeparator className="mb-3" />

                     {/* 我的菜谱链接 */}
                     <div className="mb-3">
                       <DropdownMenuItem 
                         onClick={() => router.push(`/${locale}/my-recipes`)}
                         className="cursor-pointer w-full justify-center"
                       >
                         <span className="font-medium">{t('myRecipes')}</span>
                       </DropdownMenuItem>
                     </div>
                     
                     <DropdownMenuSeparator className="mb-3" />

                     <div className="flex justify-center">
                       <DropdownMenuItem 
                         onClick={handleLogout} 
                         className="cursor-pointer w-[90%] justify-center hover:bg-[--color-destructive-10]"
                       >
                         <span className="font-medium">{t('signout')}</span>
                       </DropdownMenuItem>
                     </div>
                     
                   </DropdownMenuContent>
                 </DropdownMenu>
                ) : (
                  <Button onClick={() => setShowAuthModal(true)} variant="default" size="sm" className="ml-2 cursor-pointer">
                    {t('signin')}
                  </Button>
                )
              )}
            </div>
            
            {/* 移动版汉堡菜单 */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 cursor-pointer">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="right" 
                  className="flex flex-col p-0"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <SheetTitle className="sr-only">导航菜单</SheetTitle>
                  <div className="flex flex-col h-full">
                    {/* 移动版顶部 */}
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                          <div className="relative w-8 h-8">
                            <Image
                              src="/images/recipe-easy-logo.svg"
                              alt="RecipeEasy"
                              fill
                              className="object-contain"
                              sizes="32px"
                            />
                          </div>
                          <span className="font-semibold text-lg">RecipeEasy</span>
                        </Link>
                      </div>
                    </div>
                    
                    {/* 移动版导航项 */}
                    <div className="p-4 flex-1 overflow-y-auto">
                      {!loading && user && (
                        <div className="mb-6 pt-2 pb-5 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3 mb-4">
                            <UserAvatar user={user} size="md" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="font-semibold">
                                  {getUserDisplayName(user)}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 hover:bg-accent cursor-pointer"
                                  onClick={() => setShowEditNameDialog(true)}
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {user.email}
                              </div>
                            </div>
                          </div>
                          
                          {/* 移动端积分信息区域 */}
                          <div className="bg-accent/50 rounded-md p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm">{t('credits')}</span>
                              </div>
                              <span className="font-semibold tabular-nums">
                                {credits?.credits || 0}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-muted-foreground">{t('totalEarned')}</span>
                              <span className="text-xs tabular-nums font-medium">
                                {credits?.total_earned || 0}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {tCredits('consumeOneCredit')}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <nav className="space-y-1">
                        {routeList.map((route) => (
                          <Link
                            key={route.href}
                            href={route.href}
                            className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-primary transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            {route.icon}
                            <span className="ml-2">{route.label}</span>
                          </Link>
                        ))}
                        
                        {/* 我的菜谱链接 - 仅登录用户显示 */}
                        {!loading && user && (
                          <Link
                            href={`/${locale}/my-recipes`}
                            className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent hover:text-primary transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            <BookOpen className="mr-2 h-4 w-4" />
                            {t('myRecipes')}
                          </Link>
                        )}
                      </nav>
                    </div>
                    
                    {/* 移动版底部操作区 */}
                    <div className="p-4 border-t mt-auto">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm">{t('appearance')}</span>
                        <ToggleTheme />
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm">{t('language')}</span>
                        <LanguageSwitcher />
                      </div>
                      
                      {!loading && user && (
                        <Button
                          variant="outline"
                          className="w-full justify-center cursor-pointer"
                          onClick={() => {
                            handleLogout();
                            setIsOpen(false);
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>{t('signout')}</span>
                        </Button>
                      )}
                      
                      {!loading && !user && (
                        <Button
                          variant="default"
                          className="w-full justify-center cursor-pointer"
                          onClick={() => {
                            setShowAuthModal(true);
                            setIsOpen(false);
                          }}
                        >
                          {t('signin')}
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      </div>
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      
      {/* 编辑显示名称对话框 */}
      <EditDisplayNameDialog 
        open={showEditNameDialog} 
        onOpenChange={setShowEditNameDialog}
        user={user}
        onSuccess={handleEditNameSuccess}
      />
    </header>
  );
}