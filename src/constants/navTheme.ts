import { DarkTheme, ThemeProvider } from 'expo-router';

import { COLORS } from './theme';

type NavTheme = React.ComponentProps<typeof ThemeProvider>['value'];

/**
 * Navigation theme locked to Popularr's dark palette. Applied by the root
 * layout so native headers, tab bars and card backdrops match the design tokens.
 */
export const navTheme: NavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    border: COLORS.border,
    text: COLORS.text,
    notification: COLORS.primary,
  },
};
