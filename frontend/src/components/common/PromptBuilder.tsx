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
 *   - ICAP Framework     → scales implicitly with Bloom/SOLO choices
 *
 * We expose the framework names deliberately (a lecturer audience benefits from
 * the vocabulary) but always pair them with a plain-English description of what
 * each level means in practice. This keeps the UI usable without hiding the
 * scientific grounding that justifies the tool.
 */

interface PromptBuilderProps {
  value: GenerationOptions;
  onChange: (next: GenerationOptions) => void;
  /** When true, the advanced pedagogy controls are expanded by default. */
  defaultExpanded?: boolean;
}

interface OptionDescriptor<T extends string> {
  value: T;
  label: string;
  hint: string;
}

const BLOOM_OPTIONS: OptionDescriptor<BloomLevel>[] = [
  { value: 'understand', label: 'Understand', hint: 'Explain and summarize concepts in own words. Good for introductions.' },
  { value: 'apply', label: 'Apply', hint: 'Use concepts in new situations. Each topic gets a worked example.' },
  { value: 'analyze', label: 'Analyze', hint: 'Compare, contrast, and differentiate. Emphasizes trade-offs.' },
  { value: 'evaluate', label: 'Evaluate', hint: 'Justify choices and critique approaches. Senior/graduate depth.' },
];

const SOLO_OPTIONS: OptionDescriptor<SoloLevel>[] = [
  { value: 'unistructural', label: 'Foundational', hint: 'Single-fact recall. Best for first exposure to a topic.' },
  { value: 'multistructural', label: 'Intermediate', hint: 'Multiple related facts. Balanced default for most quizzes.' },
  { value: 'relational', label: 'Advanced', hint: 'Integrating multiple concepts. Rewards deeper study.' },
  { value: 'extended_abstract', label: 'Challenge', hint: 'Transfer to novel scenarios. For exam-style extension.' },
];

const LENGTH_OPTIONS: OptionDescriptor<LessonLength>[] = [
  { value: 'concise', label: 'Concise', hint: '3–5 sentences per topic. Fast reference.' },
  { value: 'standard', label: 'Standard', hint: '~150–220 words per topic with a small example where useful.' },
  { value: 'detailed', label: 'Detailed', hint: '~250–350 words per topic with intuition + formal definition + worked example.' },
];

/** A single row of radio-style pill buttons with an accessible label + hint. */
function PillRadio<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  options: OptionDescriptor<T>[];
  value: T;
  onChange: (next: T) => void;
}) {
  const activeHint = options.find((o) => o.value === value)?.hint;
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-1.5">
        <p className="text-xs font-semibold text-[#0e0f0c]">{label}</p>
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
                'px-2.5 py-1 text-xs rounded-full border transition-colors ' +
                (active
                  ? 'bg-[#9fe870] border-[#9fe870] text-[#0e0f0c] font-semibold'
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

  const update = <K extends keyof GenerationOptions>(key: K, next: GenerationOptions[K]) => {
    onChange({ ...value, [key]: next });
  };

  // Character counter for custom instructions (500 is the server-side cap).
  const custom = value.customInstructions ?? '';
  const customRemaining = Math.max(0, 500 - custom.length);

  return (
    <div className="surface-card p-4 space-y-3">
      {/* Header / collapse toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 text-left"
      >
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Sparkles className="w-4 h-4 text-[#054d28]" />
        <span className="text-sm font-semibold text-[#0e0f0c]">Generation options</span>
        <span className="text-xs text-[#4b4b4b] ml-auto">
          Bloom: {BLOOM_OPTIONS.find((o) => o.value === value.bloomLevel)?.label} ·{' '}
          SOLO: {SOLO_OPTIONS.find((o) => o.value === value.soloLevel)?.label} ·{' '}
          Length: {LENGTH_OPTIONS.find((o) => o.value === value.lengthLevel)?.label}
        </span>
      </button>

      {expanded && (
        <div className="space-y-4 pt-2 border-t border-[#e2e2e2]">
          <PillRadio
            label="Lesson depth (Bloom's Taxonomy)"
            hint="Controls how deeply the lesson engages with each topic."
            options={BLOOM_OPTIONS}
            value={value.bloomLevel}
            onChange={(next) => update('bloomLevel', next)}
          />
          <PillRadio
            label="Lesson length"
            hint="Controls verbosity per topic subsection."
            options={LENGTH_OPTIONS}
            value={value.lengthLevel}
            onChange={(next) => update('lengthLevel', next)}
          />
          <PillRadio
            label="Quiz difficulty (SOLO Taxonomy)"
            hint="Controls the cognitive demand of the MCQs."
            options={SOLO_OPTIONS}
            value={value.soloLevel}
            onChange={(next) => update('soloLevel', next)}
          />

          {/* Custom instructions — free-text override */}
          <div className="space-y-1.5">
            <div className="flex items-start gap-1.5">
              <p className="text-xs font-semibold text-[#0e0f0c]">Custom instructions (optional)</p>
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
