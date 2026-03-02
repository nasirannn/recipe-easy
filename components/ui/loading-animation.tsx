import { cn } from "@/lib/utils";
import { ChefHat } from "lucide-react";
import { useEffect, useState } from "react";
import { Typography } from "./typography";
import { Progress } from "./progress";

interface LoadingAnimationProps {
  className?: string;
  language?: "en" | "zh";
}

export const LoadingAnimation = ({
  className,
  language = "en",
}: LoadingAnimationProps) => {
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) return prev + 0.8;
        if (prev < 60) return prev + 0.5;
        if (prev < 85) return prev + 0.3;
        if (prev < 95) return prev + 0.1;
        return 99;
      });
    }, 200);

    const timeInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(timeInterval);
    };
  }, []);

  useEffect(() => {
    if (language === "zh") {
      if (elapsedTime <= 4) {
        setMessage("正在分析食材组合...");
      } else if (elapsedTime <= 19) {
        setMessage("正在匹配最优菜谱方案...");
      } else if (elapsedTime <= 39) {
        setMessage("正在生成烹饪步骤...");
      } else if (elapsedTime <= 59) {
        setMessage("即将完成，正在优化细节...");
      } else {
        setMessage("正在继续生成，请稍候...");
      }
      return;
    }

    if (elapsedTime <= 4) {
      setMessage("Analyzing your ingredient combinations...");
    } else if (elapsedTime <= 19) {
      setMessage("Selecting the best recipe strategy...");
    } else if (elapsedTime <= 39) {
      setMessage("Generating cooking instructions...");
    } else if (elapsedTime <= 59) {
      setMessage("Almost done, refining the details...");
    } else {
      setMessage("Still generating, thanks for waiting...");
    }
  }, [elapsedTime, language]);

  return (
    <div className={cn("home-card border-border-70 bg-card-90 p-6 md:p-8", className)}>
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ChefHat className="h-7 w-7 text-primary" strokeWidth={1.8} />
          </div>
          <div className="absolute inset-0 animate-ping rounded-full border-2 border-primary/30" />
        </div>

        <div className="w-full max-w-md space-y-3">
          <div className="flex items-center justify-between gap-4">
            <Typography
              variant="inline"
              className="block truncate text-xs font-medium text-muted-foreground"
            >
              {message}
            </Typography>
            <Typography
              variant="inline"
              className="shrink-0 text-xs font-semibold text-foreground"
            >
              {Math.round(progress)}%
            </Typography>
          </div>
          <Progress value={progress} />
        </div>

        <Typography variant="inline" className="text-xs text-muted-foreground">
          {language === "zh"
            ? "生成通常需要 20-60 秒"
            : "Generation usually takes 20-60 seconds"}
        </Typography>
      </div>
    </div>
  );
};
