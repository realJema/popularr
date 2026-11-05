import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppBar } from '@/components/common/AppBar';
import { AppText } from '@/components/common/AppText';
import { Chip } from '@/components/common/Chip';
import { ErrorPanel } from '@/components/common/ErrorPanel';
import { LoadingState } from '@/components/common/LoadingState';
import { Screen } from '@/components/common/Screen';
import { SPACING } from '@/constants/theme';
import { categoryRepository, countryRepository, preferencesRepository } from '@/database/queries';
import type { Category, Country } from '@/types/models';
import { tapSelection } from '@/utils/haptics';

const PREFERENCES_QUERY_KEY = ['preferences'] as const;

/**
 * Preferences — lets the user pick favourite categories and countries. These are
 * persisted to SQLite and later used to tailor Discover ordering and Explore
 * filters. Selections save immediately on tap.
 */
export default function PreferencesScreen() {
  const queryClient = useQueryClient();

  const categories = useQuery({ queryKey: ['categories'], queryFn: () => categoryRepository.getAll() });
  const countries = useQuery({ queryKey: ['countries'], queryFn: () => countryRepository.getAll() });
  const prefs = useQuery({ queryKey: PREFERENCES_QUERY_KEY, queryFn: () => preferencesRepository.get() });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  // Seed local selection state once preferences load.
  useEffect(() => {
    if (prefs.data) {
      setSelectedCategories(prefs.data.preferredCategories);
      setSelectedCountries(prefs.data.preferredCountries);
    }
  }, [prefs.data]);

  const toggleCategory = useCallback(
    async (id: string) => {
      tapSelection();
      const next = selectedCategories.includes(id)
        ? selectedCategories.filter((value) => value !== id)
        : [...selectedCategories, id];
      setSelectedCategories(next);
      await preferencesRepository.update({ preferredCategories: next });
      queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY });
    },
    [selectedCategories, queryClient]
  );

  const toggleCountry = useCallback(
    async (id: string) => {
      tapSelection();
      const next = selectedCountries.includes(id)
        ? selectedCountries.filter((value) => value !== id)
        : [...selectedCountries, id];
      setSelectedCountries(next);
      await preferencesRepository.update({ preferredCountries: next });
      queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY });
    },
    [selectedCountries, queryClient]
  );

  const isLoading = categories.status === 'pending' || countries.status === 'pending' || prefs.status === 'pending';
  const hasError = categories.status === 'error' || countries.status === 'error' || prefs.status === 'error';

  const retry = () => {
    void categories.refetch();
    void countries.refetch();
    void prefs.refetch();
  };

  return (
    <Screen>
      <AppBar
        title="Preferences"
        onBack={() => router.back()}
        right={
          <AppText variant="label" color="primary">
            Auto-saved
          </AppText>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading your preferences…" />
      ) : hasError ? (
        <ErrorPanel onRetry={retry} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppText variant="body" color="secondary" style={styles.intro}>
            Pick the categories and countries you care about most. We use them to tailor
            Discover and Explore.
          </AppText>

          <Section title="Categories" count={selectedCategories.length}>
            <View style={styles.chips}>
              {(categories.data ?? []).map((category: Category) => (
                <SelectableChip
                  key={category.id}
                  label={category.name}
                  active={selectedCategories.includes(category.id)}
                  onPress={() => void toggleCategory(category.id)}
                />
              ))}
            </View>
          </Section>

          <Section title="Countries" count={selectedCountries.length}>
            <View style={styles.chips}>
              {(countries.data ?? []).map((country: Country) => (
                <SelectableChip
                  key={country.id}
                  label={country.name}
                  leading={country.flagEmoji ?? undefined}
                  active={selectedCountries.includes(country.id)}
                  onPress={() => void toggleCountry(country.id)}
                />
              ))}
            </View>
          </Section>
        </ScrollView>
      )}
    </Screen>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText variant="title">{title}</AppText>
        {count > 0 ? (
          <AppText variant="label" color="primary">
            {count} selected
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function SelectableChip({
  label,
  leading,
  active,
  onPress,
}: {
  label: string;
  leading?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}>
      <Chip label={label} leading={leading} active={active} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.xl,
  },
  intro: {
    lineHeight: 20,
  },
  section: {
    gap: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
});
