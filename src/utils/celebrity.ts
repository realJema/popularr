import { COLORS } from '@/constants/theme';

/**
 * Pure display helpers for celebrity data. Kept free of React/SQLite so they can
 * be reused by cards, lists and the details screen, and unit-tested in Stage 6.
 */

const GRADIENT_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['#8B5CF6', '#6D28D9'],
  ['#F472B6', '#DB2777'],
  ['#F59E0B', '#D97706'],
  ['#22D3EE', '#0891B2'],
  ['#34D399', '#059669'],
  ['#FB7185', '#E11D48'],
  ['#A78BFA', '#7C3AED'],
  ['#FBBF24', '#EA580C'],
];

/** First letters of up to two words, uppercased — used on image placeholders. */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Stable string hash (FNV-1a) so the same person always gets the same colors. */
function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Deterministic gradient stops derived from the celebrity id/slug. */
export function getAvatarGradient(seed: string): readonly [string, string] {
  const pair = GRADIENT_PAIRS[hashString(seed) % GRADIENT_PAIRS.length];
  return pair;
}

/** Whole years between an ISO birth date and today, or null when unknown. */
export function getAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

/** Format an ISO date as e.g. "14 May 1990" (device locale). */
export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Human label for a curated popularity score bucket. */
export function popularityTier(score: number): { label: string; color: string } {
  if (score >= 95) return { label: 'Iconic', color: COLORS.primary };
  if (score >= 85) return { label: 'Huge', color: COLORS.primaryLight };
  if (score >= 70) return { label: 'Popular', color: COLORS.success };
  return { label: 'Rising', color: COLORS.textSecondary };
}

/** Compact relative time (e.g. "3h ago") from an ISO timestamp. */
export function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}
