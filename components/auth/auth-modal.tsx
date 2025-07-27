"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, AlertCircle, Loader2, Eye } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { GoogleIcon } from "@/components/icons/google-icon";
import { useTranslations } from 'next-intl';



interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const t = useTranslations('auth');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [signupEmailError, setSignupEmailError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (typeof signInWithGoogle !== 'function') {
        throw new Error(t('signInNotInitialized'));
      }

      await signInWithGoogle();
      // 成功时不重置 loading 状态，因为页面会跳转
      // 保持加载状态直到页面跳转完成
    } catch (error) {
      console.error("Google sign in error:", error);
      setError(error instanceof Error ? error.message : t('generalError'));
      toast.error(t('signInFailed'));
      setIsLoading(false); // 只在出错时重置加载状态
    }
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await signInWithEmail(email, password);
      toast.success(t('signInSuccess'));
      onOpenChange(false);
    } catch (error) {
      console.error("Email sign in error:", error);
      setError(error instanceof Error ? error.message : t('signInError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password) return;
    // 移除邮箱域名验证
    setSignupEmailError(null);
    setIsLoading(true);
    setError(null);
    
    try {
      await signUpWithEmail(email, password);
      toast.success(t('signUpSuccess'));
      onOpenChange(false);
    } catch (error) {
      console.error("Email sign up error:", error);
      setError(error instanceof Error ? error.message : t('signUpError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await resetPassword(email);
      toast.success(t('resetPasswordSuccess'));
      setShowResetPassword(false);
    } catch (error) {
      console.error("Password reset error:", error);
      setError(error instanceof Error ? error.message : t('resetPasswordError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="p-6">
            <DialogHeader className="text-center mb-4">
              <DialogTitle className="text-2xl font-bold">
                {t('resetPassword')}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t('resetPasswordDescription')}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 text-sm bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-reset">{t('email')}</Label>
                <Input
                  id="email-reset"
                  type="email"
                  placeholder={t('enterYourEmail')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-md"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowResetPassword(false)}
                  variant="outline"
                  className="w-1/2 h-12"
                  disabled={isLoading}
                >
                  {t('back')}
                </Button>
                
                <Button
                  onClick={handleResetPassword}
                  disabled={isLoading || !email}
                  className="w-1/2 h-12"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  {t('sendResetEmail')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-2xl font-bold text-center">
              {isSignUp ? t('signUpTitle') : t('signInTitle')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-center">
              {isSignUp ? t('signUpDescription') : t('signInDescription')}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 text-sm bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // 移除邮箱域名验证
                  setSignupEmailError(null);
                }}
                className="h-12 rounded-md"
              />
              {isSignUp && signupEmailError && (
                <div className="text-xs text-red-500 mt-1">{signupEmailError}</div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">
                  {t('password')}
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-md pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <Button
              onClick={isSignUp ? handleEmailSignUp : handleEmailSignIn}
              disabled={isLoading || !email || !password || (isSignUp && !!signupEmailError)}
              className="w-full h-12"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isSignUp ? t('signUp') : t('signIn')}
            </Button>

            {!isSignUp && (
              <div className="flex justify-start mt-2">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="text-xs text-primary hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {t('forgotPassword')}
                </button>
              </div>
            )}
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t('or')}
                </span>
              </div>
            </div>
            
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-600"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <GoogleIcon className="h-5 w-5 mr-2" />
              )}
              {isLoading ? t('signingIn') : t('continueWithGoogle')}
            </Button>
            
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary hover:text-primary/80"
              >
                {isSignUp
                  ? t('alreadyHaveAccount')
                  : t('dontHaveAccount')}
              </button>
            </div>
          </div>
          
          <div className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
