import type { CSSProperties } from 'react';

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Renderiza um ícone Material Symbols Rounded pelo nome (ex.: "receipt_long",
 * "account_balance_wallet"), reproduzindo o mockup do Claude Design.
 * A fonte é carregada via <link> no root layout (`src/app/layout.tsx`).
 */
export function Icon({ name, size = 20, color, className, style }: IconProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "'Material Symbols Rounded'",
        fontSize: size,
        color,
        lineHeight: 1,
        display: 'inline-flex',
        ...style,
      }}
    >
      {name}
    </span>
  );
}
