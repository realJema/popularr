import { Text, type TextProps, type TextStyle } from 'react-native';

import { COLORS, FONT_SIZE, WEIGHTS, type ColorToken } from '@/constants/theme';

type Variant =
  | 'display'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodyBold'
  | 'caption'
  | 'label'
  | 'overline';

/**
 * Text colours may be given either as a raw {@link ColorToken} (e.g. `primary`)
 * or as a semantic tone word (e.g. `secondary`). The tone words below alias to
 * real tokens so screens can read more naturally.
 */
type TextColor = ColorToken | 'secondary' | 'muted' | 'white' | 'error';

const COLOR_ALIASES: Partial<Record<TextColor, ColorToken>> = {
  secondary: 'textSecondary',
  muted: 'textMuted',
  white: 'text',
  error: 'danger',
};

function resolveColor(value: TextColor): ColorToken {
  return COLOR_ALIASES[value] ?? (value as ColorToken);
}

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontSize: FONT_SIZE.display, fontWeight: WEIGHTS.extrabold, color: COLORS.text },
  title: { fontSize: FONT_SIZE.xl, fontWeight: WEIGHTS.bold, color: COLORS.text },
  subtitle: { fontSize: FONT_SIZE.lg, fontWeight: WEIGHTS.semibold, color: COLORS.text },
  body: { fontSize: FONT_SIZE.md, fontWeight: WEIGHTS.regular, color: COLORS.textSecondary },
  bodyBold: { fontSize: FONT_SIZE.md, fontWeight: WEIGHTS.semibold, color: COLORS.text },
  caption: { fontSize: FONT_SIZE.sm, fontWeight: WEIGHTS.regular, color: COLORS.textSecondary },
  label: { fontSize: FONT_SIZE.xs, fontWeight: WEIGHTS.semibold, color: COLORS.textSecondary },
  overline: {
    fontSize: FONT_SIZE.xs,
    fontWeight: WEIGHTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
};

interface AppTextProps extends TextProps {
  variant?: Variant;
  /** Semantic colour; takes precedence over `color` and the variant default. */
  tone?: TextColor;
  /** Raw colour token or alias (see {@link TextColor}). */
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
}

/**
 * Typography primitive. All text in Popularr should render through AppText so
 * that the type scale and default colors stay consistent across screens.
 */
export function AppText({
  variant = 'body',
  tone,
  color,
  align,
  weight,
  style,
  ...rest
}: AppTextProps) {
  const requested = tone ?? color;
  const overrides: TextStyle = {
    ...(requested ? { color: COLORS[resolveColor(requested)] } : null),
    ...(align ? { textAlign: align } : null),
    ...(weight ? { fontWeight: WEIGHTS[weight] } : null),
  };

  return <Text style={[VARIANTS[variant], overrides, style]} {...rest} />;
}
