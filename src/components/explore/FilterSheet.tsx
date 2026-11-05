import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { COLORS, RADII, SPACING } from '@/constants/theme';
import type { Category, Country } from '@/types/models';
import { AppText } from '../common/AppText';
import { Chip } from '../common/Chip';

export interface FilterValues {
  categoryIds: string[];
  countryIds: string[];
  minPopularity?: number;
}

interface FilterSheetProps {
  visible: boolean;
  categories: Category[];
  countries: Country[];
  initial: FilterValues;
  onClose: () => void;
  onApply: (values: FilterValues) => void;
}

const POPULARITY_OPTIONS: { label: string; value: number | undefined }[] = [
  { label: 'Any', value: undefined },
  { label: '70+', value: 70 },
  { label: '85+', value: 85 },
  { label: '95+', value: 95 },
];

function toggleValue(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((value) => value !== id) : [...list, id];
}

/** Bottom-sheet multi-select for categories, countries and a popularity floor. */
export function FilterSheet({ visible, categories, countries, initial, onClose, onApply }: FilterSheetProps) {
  const [categoryIds, setCategoryIds] = useState<string[]>(initial.categoryIds);
  const [countryIds, setCountryIds] = useState<string[]>(initial.countryIds);
  const [minPopularity, setMinPopularity] = useState<number | undefined>(initial.minPopularity);

  // Re-seed the draft each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setCategoryIds(initial.categoryIds);
      setCountryIds(initial.countryIds);
      setMinPopularity(initial.minPopularity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const activeCount = categoryIds.length + countryIds.length + (minPopularity !== undefined ? 1 : 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close filters" />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <AppText variant="title">Filters</AppText>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <AppText variant="label" color="secondary">
                Close
              </AppText>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <AppText variant="overline" style={styles.sectionLabel}>
              Categories
            </AppText>
            <View style={styles.chips}>
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => setCategoryIds((prev) => toggleValue(prev, category.id))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: categoryIds.includes(category.id) }}>
                  <Chip label={category.name} active={categoryIds.includes(category.id)} />
                </Pressable>
              ))}
            </View>

            <AppText variant="overline" style={styles.sectionLabel}>
              Countries
            </AppText>
            <View style={styles.chips}>
              {countries.map((country) => (
                <Pressable
                  key={country.id}
                  onPress={() => setCountryIds((prev) => toggleValue(prev, country.id))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: countryIds.includes(country.id) }}>
                  <Chip
                    label={country.name}
                    leading={country.flagEmoji ?? undefined}
                    active={countryIds.includes(country.id)}
                  />
                </Pressable>
              ))}
            </View>

            <AppText variant="overline" style={styles.sectionLabel}>
              Minimum popularity
            </AppText>
            <View style={styles.segment}>
              {POPULARITY_OPTIONS.map((option) => {
                const active = option.value === minPopularity;
                return (
                  <Pressable
                    key={option.label}
                    onPress={() => setMinPopularity(option.value)}
                    style={[styles.segmentItem, active && styles.segmentItemActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}>
                    <AppText variant="label" color={active ? 'white' : 'secondary'}>
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={styles.resetButton}
              onPress={() => {
                setCategoryIds([]);
                setCountryIds([]);
                setMinPopularity(undefined);
              }}>
              <AppText variant="label" color="secondary">
                Reset
              </AppText>
            </Pressable>
            <Pressable
              style={styles.applyButton}
              onPress={() => {
                onApply({ categoryIds, countryIds, minPopularity });
                onClose();
              }}>
              <AppText variant="label" color="white">
                {activeCount > 0 ? `Apply (${activeCount})` : 'Apply'}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.overlay,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    maxHeight: '82%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  scroll: {
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  sectionLabel: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  segment: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentItemActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  resetButton: {
    flex: 1,
    height: 48,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButton: {
    flex: 2,
    height: 48,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
