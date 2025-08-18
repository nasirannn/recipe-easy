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

interface RecipeWithMetadata extends Recipe {
  createdAt?: string;
  userStatus?: UserLoginStatus;
}

export default function MyRecipesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('myRecipes');
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
      
      const data = await response.json();
      setRecipes(data.results || []);
      setTotal(data.total || 0);
      setHasLoaded(true);
    } catch (error) {
      console.error('Failed to load recipes:', error);
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
      console.error('Failed to delete recipe:', error);
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
                onClick={() => router.push(`/${locale}`)}
                className="w-10 h-10 rounded-full hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('title')}
              </h1>
            </div>
          </div>
          
          {/* Loading in center */}
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading...</p>
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
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-slate-600 dark:text-slate-400">Redirecting...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const handleGoBack = () => {
    // 总是返回到当前语言环境的首页，避免语言切换后的路由问题
    router.push(`/${locale}`);
  };
  
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
                className="w-10 h-10 rounded-full hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  {t('title')}
                  <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-2 flex items-center">
                    ({total})
                  </span>
                </h1>
              </div>
            </div>
            
            {/* Image Notice */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
                  <span className="text-lg">📸</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('imageNotice.title')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{t('imageNotice.description')}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Loading in center */}
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-slate-600 dark:text-slate-400">{t('loading')}</p>
            </div>
          </div>
        </div>
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
              className="w-10 h-10 rounded-full hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                {t('title')}
                <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-2 flex items-center">
                  ({total})
                </span>
              </h1>
              {hasLoaded && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadRecipes(true)}
                  disabled={loading}
                  className="w-10 h-10 rounded-full hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200"
                >
                  <svg className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
          
          {/* Image Notice */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
                <span className="text-lg">📸</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('imageNotice.title')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('imageNotice.description')}</p>
              </div>
            </div>
          </div>
        </div>
        
        {recipes.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-linear-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChefHat className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">{t('emptyState.title')}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
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
              {recipes.map((recipe) => (
                <Card key={recipe.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transform hover:-translate-y-1">
                  {/* Image Container */}
                  <div className="relative aspect-[3/2] overflow-hidden">

                    {recipe.imagePath ? (
                      <Image 
                        src={getImageUrl(recipe.imagePath)} 
                        alt={recipe.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full relative group overflow-hidden">
                        {/* 背景图片 - 移除模糊效果和遮罩 */}
                        <Image
                          src="/images/recipe-placeholder-bg.png"
                          alt="Recipe placeholder background"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    

                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 shadow-lg"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteClick(recipe);
                          }}
                          disabled={deleting === recipe.id}
                        >
                          <Trash2 className="h-5 w-5 text-white" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content - 与 explore 页面保持一致 */}
                  <div className="p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors text-lg">
                      <Link 
                        href={`/${locale}/recipe/${recipe.id}`} 
                        className="block hover:text-orange-600 dark:hover:text-orange-400"
                        prefetch={true}
                      >
                        {recipe.title}
                      </Link>
                    </h3>
                    
                    {/* 描述 - 与 explore 页面保持一致 */}
                    {recipe.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}
                    
                    {/* Meta Info - 与 explore 页面保持一致 */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {recipe.cookingTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{recipe.cookingTime}</span>
                        </div>
                      )}
                      {recipe.servings && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{recipe.servings}</span>
                        </div>
                      )}
                      {recipe.difficulty && (
                        <div className="flex items-center gap-1">
                          <ChefHat className="h-3 w-3" />
                          <span>{recipe.difficulty}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Date */}
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {recipe.createdAt && <span>{formatDate(recipe.createdAt)}</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* No More Data Message */}
            {recipes.length > 0 && (
              <div className="text-center mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {t('noMoreData')}
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
              <DialogDescription className="text-slate-600 dark:text-slate-400">
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
    </div>
  );
}

export const runtime = 'edge';