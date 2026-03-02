import { cn } from "@/lib/utils";

type OptionButtonClassOptions = {
  active: boolean;
  className?: string;
  disabled?: boolean;
};

type OverlayIconButtonClassOptions = {
  active?: boolean;
  destructive?: boolean;
  className?: string;
  disabled?: boolean;
};

const interactiveFocusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-60 focus-visible:ring-offset-2";
const interactiveTransitionClass = "transition-colors duration-200";

const optionButtonActiveToneClass = "border-primary bg-primary text-primary-foreground hover:bg-primary/90";
const optionButtonInactiveToneClass =
  "border-border-70 bg-card/75 text-foreground hover:border-primary/50 hover:bg-card hover:text-primary";

const overlayIconBaseClass = cn(
  "inline-flex cursor-pointer items-center justify-center rounded-full border backdrop-blur-sm",
  interactiveTransitionClass,
  interactiveFocusRingClass
);
const overlayIconActiveToneClass = "border-primary/80 bg-primary text-primary-foreground hover:bg-primary/90";
const overlayIconInactiveToneClass =
  "border-recipe-surface-border bg-recipe-overlay-mid text-white hover:bg-recipe-overlay-strong";
const overlayIconDestructiveToneClass =
  "border-white/35 bg-destructive/90 text-destructive-foreground hover:bg-destructive";

export const optionButtonClass = ({ active, className, disabled = false }: OptionButtonClassOptions) =>
  cn(
    "cursor-pointer border",
    interactiveTransitionClass,
    interactiveFocusRingClass,
    active ? optionButtonActiveToneClass : optionButtonInactiveToneClass,
    disabled && "cursor-not-allowed opacity-75",
    className
  );

export const overlayIconButtonClass = ({
  active = false,
  destructive = false,
  className,
  disabled = false,
}: OverlayIconButtonClassOptions) =>
  cn(
    overlayIconBaseClass,
    destructive
      ? overlayIconDestructiveToneClass
      : active
        ? overlayIconActiveToneClass
        : overlayIconInactiveToneClass,
    disabled && "cursor-not-allowed opacity-70",
    className
  );

