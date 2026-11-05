import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { navTheme } from '@/constants/navTheme';
import { COLORS } from '@/constants/theme';
import { initDatabase } from '@/database/db';

// Keep the splash visible until the first screen is ready.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op: hide is handled by the router */
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

type BootState = 'loading' | 'ready' | 'error';

export default function RootLayout() {
  const [bootState, setBootState] = useState<BootState>('loading');

  // Open + migrate + seed the local database before any screen can query data.
  // The splash stays up until this resolves, so screens always see a ready DB.
  useEffect(() => {
    let cancelled = false;

    initDatabase()
      .then(() => {
        if (!cancelled) setBootState('ready');
      })
      .catch((error) => {
        console.error('Failed to initialize database', error);
        if (!cancelled) setBootState('error');
      })
      .finally(() => {
        SplashScreen.hideAsync().catch(() => {});
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navTheme}>
        <StatusBar style="light" />
        {bootState === 'ready' ? (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.background },
            }}
          />
        ) : bootState === 'error' ? (
          <View style={styles.fallback}>
            <EmptyState
              title="Something went wrong"
              message="Popularr couldn't set up your local data. Restart the app to try again."
              icon="alert-circle-outline"
            />
          </View>
        ) : (
          <LoadingState label="Getting things ready…" />
        )}
      </ThemeProvider>
    </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});
