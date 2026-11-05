/**
 * Popularr design tokens.
 *
 * The application uses a single, fixed dark visual theme (see `userInterfaceStyle`
 * in app.json). Every screen and reusable component must read colors, spacing,
 * radii and typography from this module so the visual identity stays consistent.
 */

export const COLORS = {
  // Core palette
  background: '#101014',
  surface: '#1B1B23',
  surfaceSecondary: '#252530',
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#6D28D9',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#6B6B76',
  border: '#30303A',

  // Semantic
  success: '#22C55E',
  danger: '#EF4444',

  // Swipe / interaction indicators
  like: '#22C55E',
  pass: '#EF4444',
  superLike: '#3B82F6',

  // Overlay / scrim
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlaySoft: 'rgba(0, 0, 0, 0.35)',
  scrim: 'rgba(16, 16, 20, 0.92)',

  // Transparent helper
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof COLORS;

/** Vertical rhythm and horizontal padding. 4pt base grid. */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const RADII = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const SIZES = {
  /** Height of a primary action button. */
  buttonHeight: 52,
  /** Height of a compact / secondary control. */
  buttonHeightSm: 40,
  /** Corner radius used for the celebrity card stack. */
  cardRadius: 28,
  iconSm: 16,
  iconMd: 22,
  iconLg: 28,
  /** Swipe control button diameter on the Discover screen. */
  controlButton: 60,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;

export const WEIGHTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const SHADOWS = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  control: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;

/** Gradient stops used behind hero / card surfaces. */
export const GRADIENTS = {
  primary: [COLORS.primaryDark, COLORS.primary] as const,
  cardScrim: ['rgba(16,16,20,0)' as const, 'rgba(16,16,20,0.85)' as const],
};
