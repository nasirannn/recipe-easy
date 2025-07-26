import { cn } from "@/lib/utils";
import { 
  Apple, 
  Beef,
  Beer,
  Cake,
  Coffee, 
  Cookie, 
  Croissant, 
  Fish, 
  IceCream2, 
  Pizza, 
  Sandwich,
  Soup,
  Utensils,
  Wine
} from "lucide-react";
import { useTheme } from "next-themes";

interface FloatingIconProps {
  icon: React.ReactNode;
  className?: string;
}

const FloatingIcon = ({ icon, className }: FloatingIconProps) => (
  <div
    className={cn(
      "absolute opacity-10",
      className
    )}
  >
    {icon}
  </div>
);

export const GridBackground = ({
  className,
}: {
  className?: string;
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const icons = [
    // 左侧区域
    { Icon: Pizza, position: "top-[5%] left-[5%]" },
    { Icon: Coffee, position: "top-[25%] left-[8%]" },
    { Icon: Apple, position: "top-[45%] left-[4%]" },
    { Icon: Cookie, position: "top-[65%] left-[7%]" },
    
    // 右侧区域
    { Icon: Croissant, position: "top-[15%] right-[5%]" },
    { Icon: Fish, position: "top-[35%] right-[3%]" },
    { Icon: Beer, position: "top-[55%] right-[6%]" },
    { Icon: Wine, position: "top-[75%] right-[4%]" },
    
    // 中间区域（较少的图标）
    { Icon: IceCream2, position: "top-[20%] left-[30%]" },
    { Icon: Sandwich, position: "top-[50%] right-[35%]" },
    { Icon: Cake, position: "top-[30%] left-[45%]" },
    
    // 远两侧（点缀）
    { Icon: Beef, position: "top-[10%] left-[2%]" },
    { Icon: Soup, position: "top-[40%] right-[2%]" },
    { Icon: Utensils, position: "top-[60%] left-[3%]" },
    { Icon: Cookie, position: "top-[70%] right-[25%]" }
  ];

  return (
    <div className={cn("absolute inset-0", className)}>
      {/* 网格背景 */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid" />

      {/* 渐变遮罩 - 顶部 */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 h-40 bg-gradient-to-b",
          isDark 
            ? "from-background via-background/50 to-transparent" 
            : "from-background via-background/50 to-transparent"
        )} 
      />

      {/* 渐变遮罩 - 底部 */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 h-80 bg-gradient-to-t",
          isDark 
            ? "from-background via-background/50 to-transparent" 
            : "from-background via-background/50 to-transparent"
        )} 
      />

      {/* 浮动图标 */}
      {icons.map(({ Icon, position }, index) => (
        <FloatingIcon
          key={index}
          icon={<Icon size={40} className="text-primary" strokeWidth={1.5} />}
          className={position}
        />
      ))}
    </div>
  );
}; 