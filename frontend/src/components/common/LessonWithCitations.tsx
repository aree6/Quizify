import { useCallback, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { X, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import type { SourceCitation } from '../../types';

/**
 * Renders the lesson markdown with clickable `[S#]` citation chips.
 *
 * Strategy: we pre-process the raw markdown and rewrite each `[S<digits>]`
 * token into a markdown link `[S<digits>](#source-<n>)`. That makes the
 * markers valid markdown links that ReactMarkdown will hand to a custom
 * anchor renderer, which we intercept to open the source modal. This avoids
 * a custom remark plugin while keeping all existing formatting intact.
 */
function rewriteCitationMarkers(markdown: string): string {
  return markdown.replace(/\[S(\d+)\]/g, (_match, idx) => `[S${idx}](#source-${idx})`);
}

/** Parse the `#source-<n>` href back into a 1-based citation index. */
function parseSourceIndex(href: string | undefined): number | null {
  if (!href) return null;
  const match = /^#source-(\d+)$/.exec(href);
  return match ? Number(match[1]) : null;
}

interface LessonWithCitationsProps {
  markdown: string;
  sources: SourceCitation[];
  /**
   * Optional container className — lets callers retain the existing
   * `markdown-content` typography without hard-coding it here.
   */
  className?: string;
}

export function LessonWithCitations({ markdown, sources, className }: LessonWithCitationsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const rewritten = useMemo(() => rewriteCitationMarkers(markdown), [markdown]);

  // Fast lookup by 1-based index for the modal handler.
  const sourcesByIndex = useMemo(() => {
    const map = new Map<number, SourceCitation>();
    for (const s of sources) map.set(s.index, s);
    return map;
  }, [sources]);

  const openSource = useCallback(
    (idx: number) => {
      if (sourcesByIndex.has(idx)) setActiveIndex(idx);
    },
    [sourcesByIndex],
  );

  const components: Components = useMemo(
    () => ({
      a: ({ href, children, ...rest }) => {
        const sourceIdx = parseSourceIndex(href);
        if (sourceIdx !== null) {
          const exists = sourcesByIndex.has(sourceIdx);
          return (
            <button
              type="button"
              disabled={!exists}
              onClick={() => openSource(sourceIdx)}
              title={exists ? `View source [S${sourceIdx}]` : `Source [S${sourceIdx}] unavailable`}
              className={
                'inline-flex items-center align-baseline px-1.5 py-0 mx-0.5 text-[11px] font-mono font-semibold rounded ' +
                (exists
                  ? 'bg-[#e2f6d5] text-[#054d28] hover:bg-[#9fe870] cursor-pointer'
                  : 'bg-[#f5f5f5] text-[#a0a0a0] cursor-not-allowed')
              }
            >
              {children}
            </button>
          );
        }
        // Non-citation anchors: keep default rendering, open in new tab.
        return (
          <a href={href} target="_blank" rel="noreferrer" {...rest}>
            {children}
          </a>
        );
      },
    }),
    [openSource, sourcesByIndex],
  );

  const activeSource = activeIndex !== null ? sourcesByIndex.get(activeIndex) ?? null : null;

  return (
    <>
      <div className={className}>
        <ReactMarkdown components={components}>{rewritten}</ReactMarkdown>
      </div>
      {activeSource && (
        <SourceModal
          source={activeSource}
          total={sources.length}
          onClose={() => setActiveIndex(null)}
          onNavigate={(delta) => {
            const next = activeSource.index + delta;
            if (sourcesByIndex.has(next)) setActiveIndex(next);
          }}
        />
      )}
    </>
  );
}

/* ── Source modal: full chunk text + navigation between adjacent sources ── */
interface SourceModalProps {
  source: SourceCitation;
  total: number;
  onClose: () => void;
  onNavigate: (delta: number) => void;
}

function SourceModal({ source, total, onClose, onNavigate }: SourceModalProps) {
  const canPrev = source.index > 1;
  const canNext = source.index < total;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#e2e2e2]">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-[#4b4b4b] flex-shrink-0" />
            <span className="font-mono font-semibold text-sm text-[#0e0f0c]">
              [S{source.index}]
            </span>
            <span className="text-sm font-medium text-[#0e0f0c] truncate">
              {source.sourceFile}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close source"
            className="p-1 rounded hover:bg-[#f5f5f5] flex-shrink-0"
          >
            <X className="w-4 h-4 text-[#4b4b4b]" />
          </button>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-[#e2e2e2] bg-[#fafafa] text-xs text-[#4b4b4b] flex-wrap">
          {source.chapter && <span>Chapter: <span className="text-[#0e0f0c] font-medium">{source.chapter}</span></span>}
          <span>Chunk #{source.chunkIndex}</span>
          <span>Similarity: {Math.round(source.similarity * 100)}%</span>
        </div>

        {/* Full chunk text */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm text-[#0e0f0c] leading-relaxed whitespace-pre-wrap">
            {source.text}
          </p>
        </div>

        {/* Footer with prev/next navigation */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-[#e2e2e2]">
          <button
            type="button"
            onClick={() => onNavigate(-1)}
            disabled={!canPrev}
            className="pill-secondary flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-xs text-[#4b4b4b]">
            Source {source.index} of {total}
          </span>
          <button
            type="button"
            onClick={() => onNavigate(1)}
            disabled={!canNext}
            className="pill-secondary flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
