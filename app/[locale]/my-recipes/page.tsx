"use client";
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Recipe, UserLoginStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, Users, ChefHat, Calendar, ArrowLeft, AlertTriangle, Trash2, } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/config';
import { Skeleton } from '@/components/ui/skeleton';
import { FooterSection } from '@/components/layout/sections/footer';

interface RecipeWithMetadata extends Recipe {
  createdAt?: string;
  userStatus?: UserLoginStatus;
}

type DifficultyLevel = 'easy' | 'medium' | 'hard';

function normalizeDifficulty(value?: string): DifficultyLevel {
  const normalized = (value || '').toLowerCase();
  if (normalized === '简单' || normalized.includes('easy')) return 'easy';
  if (normalized === '困难' || normalized.includes('hard')) return 'hard';
  return 'medium';
}

function getDifficultyBadgeTone(value: DifficultyLevel): string {
  if (value === 'easy') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:ring-emerald-400/30';
  }
  if (value === 'hard') {
    return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/20 dark:text-rose-200 dark:ring-rose-400/30';
  }
  return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:ring-amber-400/30';
}

export default function MyRecipesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('myRecipes');
  const tRecipe = useTranslations('recipeDisplay');
  const locale = useLocale();
  const [recipes, setRecipes] = useState<RecipeWithMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<RecipeWithMetadata | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  // 处理未登录用户的重定向
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}`);
    }
  }, [authLoading, user, router, locale]);
  
  const loadRecipes = useCallback(async (forceReload = false) => {
    // 如果已经加载过且不是强制重新加载，则跳过
    if (hasLoaded && !forceReload) {
      return;
    }
    
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/recipes/user/${user.id}?page=${page}&limit=12&lang=${locale}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      
      const data = await response.json() as any;
      setRecipes(data.recipes || []);
      setTotal(data.pagination?.total || 0);
      setHasLoaded(true);
    } catch (error) {
      // Failed to load recipes
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, page, t, hasLoaded, locale]);
  
  useEffect(() => {
    // 等待用户状态加载完成
    if (user?.id && !hasLoaded) {
      loadRecipes();
    }
  }, [user, loadRecipes, hasLoaded]);

  // 页面可见性变化时，可以选择性地刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id && hasLoaded) {
        // 页面重新可见时，可以选择刷新数据（可选）
        // 这里暂时不自动刷新，保持缓存
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, hasLoaded]);
  
  const handleDeleteClick = (recipe: RecipeWithMetadata) => {
    setRecipeToDelete(recipe);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recipeToDelete) return;
    
    try {
      setDeleting(recipeToDelete.id);
      const response = await fetch(`/api/recipes/${recipeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id })
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }
      
      toast.success(t('deleteSuccess'));
      await loadRecipes(true); // 强制重新加载
    } catch (error) {
      // Failed to delete recipe
      toast.error(t('deleteError'));
    } finally {
      setDeleting(null);
      setDeleteDialogOpen(false);
      setRecipeToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRecipeToDelete(null);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return locale === 'zh' ? '今天' : 'Today';
    if (diffDays === 1) return locale === 'zh' ? '昨天' : 'Yesterday';
    if (diffDays < 7) return locale === 'zh' ? `${diffDays}天前` : `${diffDays} days ago`;
    
    return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleGoBack = () => {
    // 总是返回到当前语言环境的首页，避免语言切换后的路由问题
    router.push(`/${locale}`);
  };

  const renderRecipeGridSkeleton = () => (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card
          key={`my-recipes-skeleton-${index}`}
          className="overflow-hidden border-0 bg-card/80 shadow-lg backdrop-blur-sm"
        >
          <Skeleton className="aspect-[3/2] w-full rounded-none" />
          <div className="space-y-3 p-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        </Card>
      ))}
    </div>
  );

  // 显示用户加载状态
  if (authLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="h-10 w-10 rounded-full transition-all duration-200 hover:bg-muted/70"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold text-foreground">
                {t('title')}
              </h1>
            </div>
          </div>
          
          <div className="space-y-8">
            {renderRecipeGridSkeleton()}
            <div className="flex justify-center">
              <Skeleton className="h-10 w-56 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 如果用户未登录，显示加载状态等待重定向
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-8">
          <div className="space-y-8">
            {renderRecipeGridSkeleton()}
            <div className="flex justify-center">
              <Skeleton className="h-10 w-56 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="h-10 w-10 rounded-full transition-all duration-200 hover:bg-muted/70"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-3xl font-bold text-foreground flex items-center">
                  {t('title')}
                  <span className="text-lg font-normal text-muted-foreground ml-2 flex items-center">
                    ({total})
                  </span>
              </h2>
            </div>
          </div>
          
          <div className="space-y-8">
            {renderRecipeGridSkeleton()}
            <div className="flex justify-center">
              <Skeleton className="h-10 w-56 rounded-full" />
            </div>
          </div>
        </div>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="h-10 w-10 rounded-full transition-all duration-200 hover:bg-muted/70"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-3xl font-bold text-foreground flex items-center">
                {t('title')}
                <span className="text-lg font-normal text-muted-foreground ml-2 flex items-center">
                  ({total})
                </span>
            </h2>
          </div>
        </div>
        
        {recipes.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-linear-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChefHat className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-foreground">{t('emptyState.title')}</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {t('emptyState.description')}
              </p>
              <Button asChild size="lg" className="bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Link href="/">{t('emptyState.action')}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Grid Layout - 与 explore 页面保持一致 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recipes.map((recipe) => {
                const normalizedDifficulty = normalizeDifficulty(recipe.difficulty);
                return (
                  <Card
                    key={recipe.id}
                    className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-md shadow-slate-200/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/50 dark:hover:border-orange-500/40 dark:hover:shadow-slate-900/70"
                  >
                  {/* Image Container */}
                  <div className="relative aspect-[3/2] overflow-hidden">
                    <Link
                      href={`/${locale}/recipe/${recipe.id}`}
                      className="absolute inset-0 z-10 block cursor-pointer"
                      prefetch={true}
                      aria-label={recipe.title}
                    >
                      {recipe.imagePath ? (
                        <Image
                          src={getImageUrl(recipe.imagePath)}
                          alt={recipe.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized={true}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/images/recipe-placeholder-bg.png';
                          }}
                        />
                      ) : (
                        <Image
                          src="/images/recipe-placeholder-bg.png"
                          alt="Recipe placeholder background"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized={true}
                        />
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-slate-950/65 via-slate-950/10 to-transparent opacity-75 transition-opacity duration-300 group-hover:opacity-95" />
                    </Link>

                    {recipe.createdAt && (
                      <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(recipe.createdAt)}
                      </span>
                    )}

                    <div className="absolute right-3 top-3 z-20">
                      <Button
                        size="sm"
                        variant="destructive"
                        aria-label={t('delete')}
                        className="h-10 w-10 cursor-pointer rounded-full border-0 bg-destructive/90 text-destructive-foreground shadow-md transition-all duration-200 hover:bg-destructive md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteClick(recipe);
                        }}
                        disabled={deleting === recipe.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive-foreground" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Content - 与 explore 页面保持一致 */}
                  <div className="space-y-4 p-5 md:p-6">
                    <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-300">
                      <Link 
                        href={`/${locale}/recipe/${recipe.id}`} 
                        className="block cursor-pointer"
                        prefetch={true}
                      >
                        {recipe.title}
                      </Link>
                    </h3>
                    
                    {/* 描述 - 与 explore 页面保持一致 */}
                    {recipe.description && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {recipe.description}
                      </p>
                    )}
                    
                    {/* Meta Info - 与 explore 页面保持一致 */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {recipe.cookingTime && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/90 px-2.5 py-1">
                          <Clock className="h-3.5 w-3.5" />
                          {recipe.cookingTime} {tRecipe('mins')}
                        </span>
                      )}
                      {recipe.servings && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/90 px-2.5 py-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>{recipe.servings}</span>
                        </span>
                      )}
                      {recipe.difficulty && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ring-1 ${getDifficultyBadgeTone(normalizedDifficulty)}`}>
                          <ChefHat className="h-3.5 w-3.5" />
                          {tRecipe(normalizedDifficulty)}
                        </span>
                      )}
                    </div>
                  </div>
                  </Card>
                );
              })}
            </div>
            
            {/* No More Data Message */}
            {recipes.length > 0 && (
              <div className="mt-12 text-center">
                <p className="text-muted-foreground text-sm">
                  {t('allRecipesDisplayed')}
                </p>
              </div>
            )}
            
            {/* Pagination */}
            {total > 12 && (
              <div className="flex justify-center mt-8 pt-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-6"
                  >
                    {t('pagination.previous')}
                  </Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, Math.ceil(total / 12)) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="w-10 h-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(total / 12)}
                    className="px-6"
                  >
                    {t('pagination.next')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                {t('deleteDialog.title')}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t('deleteDialog.description', { title: recipeToDelete?.title })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                disabled={deleting === recipeToDelete?.id}
                className="flex-1"
              >
                {t('deleteDialog.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleting === recipeToDelete?.id}
                className="flex-1"
              >
                {deleting === recipeToDelete?.id ? t('deleteDialog.deleting') : t('deleteDialog.confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <FooterSection />
    </div>
  );
}
