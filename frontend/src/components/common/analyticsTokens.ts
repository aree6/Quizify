export const BLOOM_LABELS: Record<string, string> = {
  remember: 'Remember',
  understand: 'Understand',
  apply: 'Apply',
  analyze: 'Analyze',
  evaluate: 'Evaluate',
  create: 'Create',
};

export const SOLO_LABELS: Record<string, string> = {
  unistructural: 'Foundational',
  multistructural: 'Intermediate',
  relational: 'Advanced',
  extended_abstract: 'Challenge',
};

export const SCORE_COLORS = {
  strong: '#9fe870',
  moderate: '#7a5b00',
  weak: '#d03238',
  muted: '#afafaf',
  nearBlack: '#1c1d1a',
  body: '#4b4b4b',
};

export function barColor(pct: number): string {
  if (pct >= 70) return SCORE_COLORS.strong;
  if (pct >= 40) return SCORE_COLORS.moderate;
  return SCORE_COLORS.weak;
}
