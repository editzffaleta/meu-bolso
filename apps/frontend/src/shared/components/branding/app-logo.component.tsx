import { cn } from '@/shared/lib/class-name.util';

const APP_NAME = 'meu-bolso';

type LogoSize = 'sm' | 'md' | 'lg';

const markSizeClasses: Record<LogoSize, string> = {
  sm: 'size-8 rounded-lg text-base',
  md: 'size-9 rounded-xl text-lg',
  lg: 'size-10 rounded-xl text-xl',
};

const textSizeClasses: Record<LogoSize, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
};

const gapClasses: Record<LogoSize, string> = {
  sm: 'gap-2',
  md: 'gap-2.5',
  lg: 'gap-3',
};

type AppLogoMarkProps = {
  size?: LogoSize;
  className?: string;
  priority?: boolean;
};

type AppWordmarkProps = {
  size?: LogoSize;
  className?: string;
};

type AppLogoProps = {
  size?: LogoSize;
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showMark?: boolean;
  showText?: boolean;
  withText?: boolean;
  priority?: boolean;
};

export function AppLogoMark({ size = 'md', className }: AppLogoMarkProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-primary font-extrabold leading-none text-primary-foreground',
        markSizeClasses[size],
        className,
      )}
      aria-hidden
    >
      m
    </span>
  );
}

export function AppWordmark({ size = 'md', className }: AppWordmarkProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center leading-none font-bold tracking-tight',
        textSizeClasses[size],
        className,
      )}
    >
      {APP_NAME}
    </span>
  );
}

export function AppLogo({
  size = 'md',
  className,
  markClassName,
  textClassName,
  showMark = true,
  showText,
  withText = true,
  priority: _priority,
}: AppLogoProps) {
  const shouldShowText = showText ?? withText;

  return (
    <span className={cn('inline-flex items-center', gapClasses[size], className)}>
      {showMark ? <AppLogoMark size={size} className={markClassName} /> : null}
      {shouldShowText ? <AppWordmark size={size} className={textClassName} /> : null}
    </span>
  );
}
