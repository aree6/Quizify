import { ChevronDown, ChevronRight, Info, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type {
  BloomLevel,
  GenerationOptions,
  LessonLength,
  SoloLevel,
} from '../../types';

/**
 * PromptBuilder — the lecturer-facing "knobs" that tune lesson + quiz generation.
 *
 * Each control is grounded in a pedagogical framework from the SRS:
 *   - Bloom's Taxonomy   → lesson cognitive depth
 *   - SOLO Taxonomy      → quiz structural complexity
 *
 * CONFIG-DRIVEN BEHAVIOR:
 *   - Lecturers toggle SPECIFIC levels of Bloom's and SOLO Taxonomies.
 *   - We ONLY generate content and questions for the levels they ENABLE.
 *   - If a level is toggled off, it is ignored completely.
 *
 * UI MAPPING RULES (SOLO Taxonomy):
 *   - UI "Foundational"  → Uni-structural
 *   - UI "Intermediate"  → Multi-structural
 *   - UI "Advanced"      → Relational
 *   - UI "Challenge"     → Extended Abstract
 */

interface PromptBuilderProps {
  value: GenerationOptions;
  onChange: (next: GenerationOptions) => void;
  /** When true, the advanced pedagogy controls are expanded by default. */
  defaultExpanded?: boolean;
}

interface BloomOption {
  value: BloomLevel;
  label: string;
  hint: string;
}

interface SoloOption {
  value: SoloLevel;
  label: string;
  hint: string;
}

const BLOOM_OPTIONS: BloomOption[] = [
  { value: 'remember', label: 'Remember', hint: 'Recall facts, terminology, and basic concepts.' },
  { value: 'understand', label: 'Understand', hint: 'Explain and summarize concepts in own words. Good for introductions.' },
  { value: 'apply', label: 'Apply', hint: 'Use concepts in new situations. Each topic gets a worked example.' },
  { value: 'analyze', label: 'Analyze', hint: 'Compare, contrast, and differentiate. Emphasizes trade-offs.' },
  { value: 'evaluate', label: 'Evaluate', hint: 'Justify choices and critique approaches. Senior/graduate depth.' },
  { value: 'create', label: 'Create', hint: 'Design, construct, or formulate new solutions. Synthesis level.' },
];

const SOLO_OPTIONS: SoloOption[] = [
  { value: 'unistructural', label: 'Foundational', hint: 'Single-fact recall (Uni-structural). Best for first exposure to a topic.' },
  { value: 'multistructural', label: 'Intermediate', hint: 'Multiple related facts (Multi-structural). Balanced default for most quizzes.' },
  { value: 'relational', label: 'Advanced', hint: 'Integrating multiple concepts (Relational). Rewards deeper study.' },
  { value: 'extended_abstract', label: 'Challenge', hint: 'Transfer to novel scenarios (Extended Abstract). For exam-style extension.' },
];

const LENGTH_OPTIONS: Array<{ value: LessonLength; label: string; hint: string }> = [
  { value: 'concise', label: 'Concise', hint: '3–5 sentences per topic. Fast reference.' },
  { value: 'standard', label: 'Standard', hint: '~150–220 words per topic with a small example where useful.' },
  { value: 'detailed', label: 'Detailed', hint: '~250–350 words per topic with intuition + formal definition + worked example.' },
];

/** Multi-select toggle pills for taxonomy levels. */
function TogglePills<T extends string>({
  label,
  hint,
  options,
  selected,
  onToggle,
}: {
  label: string;
  hint: string;
  options: Array<{ value: T; label: string; hint: string }>;
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-1.5">
        <p className="text-xs font-semibold text-[#1c1d1a]">{label}</p>
        <span title={hint} className="text-[#a0a0a0] cursor-help">
          <Info className="w-3 h-3" />
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              title={opt.hint}
              className={
                'px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer ' +
                (active
                  ? 'bg-[#9fe870] border-[#9fe870] text-[#1c1d1a] font-semibold'
                  : 'bg-white border-[#e2e2e2] text-[#4b4b4b] hover:border-[#9fe870]')
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-[11px] text-[#4b4b4b] leading-snug">
          Enabled: {options.filter((o) => selected.includes(o.value)).map((o) => o.label).join(', ')}
        </p>
      )}
    </div>
  );
}

/** A single row of radio-style pill buttons for length selection. */
function PillRadio<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  options: Array<{ value: T; label: string; hint: string }>;
  value: T;
  onChange: (next: T) => void;
}) {
  const activeHint = options.find((o) => o.value === value)?.hint;
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-1.5">
        <p className="text-xs font-semibold text-[#1c1d1a]">{label}</p>
        <span title={hint} className="text-[#a0a0a0] cursor-help">
          <Info className="w-3 h-3" />
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              title={opt.hint}
              className={
                'px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer ' +
                (active
                  ? 'bg-[#9fe870] border-[#9fe870] text-[#1c1d1a] font-semibold'
                  : 'bg-white border-[#e2e2e2] text-[#4b4b4b] hover:border-[#9fe870]')
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {activeHint && <p className="text-[11px] text-[#4b4b4b] leading-snug">{activeHint}</p>}
    </div>
  );
}

export function PromptBuilder({ value, onChange, defaultExpanded = false }: PromptBuilderProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleBloom = (level: BloomLevel) => {
    const next = value.enabledBloomLevels.includes(level)
      ? value.enabledBloomLevels.filter((l) => l !== level)
      : [...value.enabledBloomLevels, level];
    // Ensure at least one level remains selected
    if (next.length > 0) {
      onChange({ ...value, enabledBloomLevels: next });
    }
  };

  const toggleSolo = (level: SoloLevel) => {
    const next = value.enabledSoloLevels.includes(level)
      ? value.enabledSoloLevels.filter((l) => l !== level)
      : [...value.enabledSoloLevels, level];
    // Ensure at least one level remains selected
    if (next.length > 0) {
      onChange({ ...value, enabledSoloLevels: next });
    }
  };

  const update = <K extends keyof GenerationOptions>(key: K, next: GenerationOptions[K]) => {
    onChange({ ...value, [key]: next });
  };

  // Character counter for custom instructions (500 is the server-side cap).
  const custom = value.customInstructions ?? '';
  const customRemaining = Math.max(0, 500 - custom.length);

  const enabledBloomLabels = BLOOM_OPTIONS
    .filter((o) => value.enabledBloomLevels.includes(o.value))
    .map((o) => o.label)
    .join(', ');

  const enabledSoloLabels = SOLO_OPTIONS
    .filter((o) => value.enabledSoloLevels.includes(o.value))
    .map((o) => o.label)
    .join(', ');

  return (
    <div className="surface-card p-4 space-y-3">
      {/* Header / collapse toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 text-left cursor-pointer"
      >
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Sparkles className="w-4 h-4 text-[#054d28]" />
        <span className="text-sm font-semibold text-[#1c1d1a]">Generation options</span>
        <span className="text-xs text-[#4b4b4b] ml-auto truncate max-w-[50%]">
          Bloom: {enabledBloomLabels || 'None'} · SOLO: {enabledSoloLabels || 'None'} · Length: {LENGTH_OPTIONS.find((o) => o.value === value.lengthLevel)?.label}
        </span>
      </button>

      {expanded && (
        <div className="space-y-4 pt-2 border-t border-[#e2e2e2]">
          <TogglePills
            label="Bloom's Taxonomy (Lesson + Quiz cognitive targets)"
            hint="Toggle the cognitive levels you want to target. Only enabled levels will appear in generated content."
            options={BLOOM_OPTIONS}
            selected={value.enabledBloomLevels}
            onToggle={toggleBloom}
          />
          <PillRadio
            label="Lesson length"
            hint="Controls verbosity per topic subsection."
            options={LENGTH_OPTIONS}
            value={value.lengthLevel}
            onChange={(next) => update('lengthLevel', next)}
          />
          <TogglePills
            label="SOLO Taxonomy (Quiz structural complexity)"
            hint="Toggle the depth levels you want to target. Only enabled levels will appear in quiz questions."
            options={SOLO_OPTIONS}
            selected={value.enabledSoloLevels}
            onToggle={toggleSolo}
          />

          {/* Custom instructions — free-text override */}
          <div className="space-y-1.5">
            <div className="flex items-start gap-1.5">
              <p className="text-xs font-semibold text-[#1c1d1a]">Custom instructions (optional)</p>
              <span
                title="Free-text directives appended to the prompt. Injection-like patterns are auto-stripped."
                className="text-[#a0a0a0] cursor-help"
              >
                <Info className="w-3 h-3" />
              </span>
            </div>
            <textarea
              value={custom}
              onChange={(e) => update('customInstructions', e.target.value.slice(0, 500))}
              rows={3}
              placeholder={
                "e.g. \"Focus on O(n log n) complexity; include at least one stability example for sorting.\""
              }
              className="field text-xs w-full resize-y"
              maxLength={500}
            />
            <p className="text-[11px] text-[#a0a0a0] text-right">{customRemaining} characters left</p>
          </div>
        </div>
      )}
    </div>
  );
}
