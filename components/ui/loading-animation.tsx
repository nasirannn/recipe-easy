import { cn } from "@/lib/utils";
import { ChefHat } from "lucide-react";
import { useEffect, useState } from "react";
import { Typography } from "./typography";
import { Progress } from "./progress";

interface LoadingAnimationProps {
  className?: string;
  language?: 'en' | 'zh';
}

export const LoadingAnimation = ({ className, language = 'en' }: LoadingAnimationProps) => {
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const startTime = Date.now();
    
    // Progress bar animation - slower progression
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // Much slower progression
        if (prev < 30) return prev + 0.8;
        if (prev < 60) return prev + 0.5;
        if (prev < 85) return prev + 0.3;
        if (prev < 95) return prev + 0.1;
        return 99; // Never quite reach 100% until complete
      });
    }, 200); // Slower interval
    
    // Time tracking for messages
    const timeInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    
    return () => {
      clearInterval(progressInterval);
      clearInterval(timeInterval);
    };
  }, []);
  
  // Update message based on elapsed time with cleaner intervals
  useEffect(() => {
    if (language === 'zh') {
      if (elapsedTime <= 4) {
        setMessage('🔥 灶台已点燃，正在智能搭配食材组合...');
      } else if (elapsedTime <= 19) {
        setMessage(`🔍 从全球食谱库精选最佳方案...`);
      } else if (elapsedTime <= 39) {
        setMessage('👨‍🍳 米其林AI大厨正在设计...');
      } else if (elapsedTime <= 59) {
        setMessage('✨ 快完成了！正在生成分步说明...');
      } else {
        setMessage('⏳ AI正在慢火精炼中...');
      }
    } else {
      if (elapsedTime <= 4) {
        setMessage('🔥 Stove ignited, intelligently combining ingredients...');
      } else if (elapsedTime <= 19) {
        setMessage(`🔍 Selecting best recipes from global database...`);
      } else if (elapsedTime <= 39) {
        setMessage('👨‍🍳 Michelin AI Chef designing...');
      } else if (elapsedTime <= 59) {
        setMessage('✨ Almost done! Generating step-by-step instructions...');
      } else {
        setMessage('⏳ AI is being refined with a slow and steady flame....');
      }
    }
  }, [elapsedTime, progress, language]);

  return (
    <div className={cn("flex flex-col items-center justify-center p-12 space-y-8", className)}>
      <div className="relative">
        {/* Chef hat with gentle bobbing animation */}
        <div className="animate-bounce">
          <ChefHat className="h-12 w-12 text-secondary" strokeWidth={1.2} />
        </div>
        
        {/* Elegant circular spinner */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-2 border-muted/30 border-secondary animate-spin"></div>
        </div>
      </div>
      
      {/* Progress bar with elegant styling */}
      <div className="w-full max-w-md space-y-3">
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 min-w-0">
            <Typography variant="inline" className="text-muted-foreground font-mono text-xs leading-tight truncate block">
              {message}
            </Typography>
          </div>
          <Typography variant="inline" className="text-muted-foreground font-mono text-xs shrink-0">
            {Math.round(progress)}%
          </Typography>
        </div>
        <Progress value={progress} />
      </div>
    </div>
  );
}; 
