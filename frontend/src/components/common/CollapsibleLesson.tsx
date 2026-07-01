import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { SourceCitation } from '../../types';

interface Section {
  heading: string;
  level: number;
  content: string;
}

function parseSections(markdown: string): Section[] {
  const lines = markdown.split('\n');
  const sections: Section[] = [];
  let currentHeading = '';
  let currentLevel = 0;
  let currentLines: string[] = [];
  let hasSeenHeading = false;

  const headingRegex = /^(#{1,4})\s+(.+)$/;

  for (const line of lines) {
    const match = headingRegex.exec(line);
    if (match) {
      // Push previous section if it has content
      if (hasSeenHeading && currentLines.some((l) => l.trim())) {
        sections.push({
          heading: currentHeading,
          level: currentLevel,
          content: currentLines.join('\n').trim(),
        });
      }
      currentHeading = match[2].trim();
      currentLevel = match[1].length;
      currentLines = [];
      hasSeenHeading = true;
    } else {
      currentLines.push(line);
    }
  }

  // Push last section
  if (hasSeenHeading && currentLines.some((l) => l.trim())) {
    sections.push({
      heading: currentHeading,
      level: currentLevel,
      content: currentLines.join('\n').trim(),
    });
  }

  // Fallback: if no headings found, treat entire content as one section
  if (sections.length === 0 && markdown.trim()) {
    sections.push({
      heading: 'Course Content',
      level: 1,
      content: markdown.trim(),
    });
  }

  return sections;
}

function rewriteCitationMarkers(markdown: string): string {
  return markdown.replace(/\[S(\d+)\]/g, (_match, idx) => `[S${idx}](#source-${idx})`);
}

function parseSourceIndex(href: string | undefined): number | null {
  if (!href) return null;
  const match = /^#source-(\d+)$/.exec(href);
  return match ? Number(match[1]) : null;
}

interface CollapsibleLessonProps {
  markdown: string;
  sources: SourceCitation[];
  className?: string;
}

export function CollapsibleLesson({ markdown, sources, className }: CollapsibleLessonProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const sections = useMemo(() => parseSections(markdown), [markdown]);

  const sourcesByIndex = useMemo(() => {
    const map = new Map<number, SourceCitation>();
    for (const s of sources) map.set(s.index, s);
    return map;
  }, [sources]);

  const [activeSourceIdx, setActiveSourceIdx] = useState<number | null>(null);

  const toggleSection = (idx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const renderMarkdown = (content: string) => {
    const rewritten = rewriteCitationMarkers(content);

    const components: Components = {
      a: ({ href, children, ...rest }) => {
        const sourceIdx = parseSourceIndex(href);
        if (sourceIdx !== null) {
          const exists = sourcesByIndex.has(sourceIdx);
          return (
            <button
              type="button"
              disabled={!exists}
              onClick={() => exists && setActiveSourceIdx(sourceIdx)}
              title={exists ? `View source [S${sourceIdx}]` : `Source [S${sourceIdx}] unavailable`}
              className={
                'inline-flex items-center align-baseline px-1.5 py-0 mx-0.5 text-[11px] font-mono font-semibold rounded ' +
                (exists
                  ? 'bg-light-mint text-positive hover:bg-lime cursor-pointer'
                  : 'bg-chip-gray/60 text-muted-gray cursor-not-allowed')
              }
            >
              {children}
            </button>
          );
        }
        return (
          <a href={href} target="_blank" rel="noreferrer" {...rest}>
            {children}
          </a>
        );
      },
    };

    return <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{rewritten}</ReactMarkdown>;
  };

  if (sections.length === 0) {
    return <p className="text-sm text-body-gray">No content.</p>;
  }

  return (
    <div className={className}>
      <div className="space-y-1">
        {sections.map((section, idx) => {
          const isExpanded = expanded.has(idx);
          return (
            <div key={idx} className="border border-hover-gray rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(idx)}
                className="w-full flex items-center gap-2 px-4 py-3 cursor-pointer text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-body-gray flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-body-gray flex-shrink-0" />
                )}
                <span
                  className={`text-sm font-semibold text-near-black flex-1 ${
                    section.level <= 2 ? 'text-base' : ''
                  }`}
                >
                  {section.heading}
                </span>
              </button>
              {isExpanded && (
                <div className="px-2 sm:px-5 py-3 text-sm text-body-gray leading-relaxed markdown-content">
                  {renderMarkdown(section.content)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeSourceIdx !== null && sourcesByIndex.has(activeSourceIdx) && (
        <SourceModal
          source={sourcesByIndex.get(activeSourceIdx)!}
          total={sources.length}
          onClose={() => setActiveSourceIdx(null)}
          onNavigate={(delta) => {
            const next = activeSourceIdx + delta;
            if (sourcesByIndex.has(next)) setActiveSourceIdx(next);
          }}
        />
      )}
    </div>
  );
}

function SourceModal({
  source,
  total,
  onClose,
  onNavigate,
}: {
  source: SourceCitation;
  total: number;
  onClose: () => void;
  onNavigate: (delta: number) => void;
}) {
  const canPrev = source.index > 1;
  const canNext = source.index < total;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-near-black/40 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-hover-gray">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono font-semibold text-sm text-near-black">[S{source.index}]</span>
            <span className="text-sm font-medium text-near-black truncate">{source.sourceFile}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close source"
            className="p-1 rounded hover:bg-chip-gray/60 flex-shrink-0"
          >
            <span className="text-body-gray text-lg leading-none">&times;</span>
          </button>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-hover-gray bg-chip-gray/60 text-xs text-body-gray flex-wrap">
          {source.chapter && (
            <span>Chapter: <span className="text-near-black font-medium">{source.chapter}</span></span>
          )}
          <span>Chunk #{source.chunkIndex}</span>
          <span>Similarity: {Math.round(source.similarity * 100)}%</span>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm text-near-black leading-relaxed whitespace-pre-wrap">{source.text}</p>
        </div>
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-hover-gray">
          <button
            type="button"
            onClick={() => onNavigate(-1)}
            disabled={!canPrev}
            className="pill-secondary flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="w-4 h-4">&larr;</span> Previous
          </button>
          <span className="text-xs text-body-gray">Source {source.index} of {total}</span>
          <button
            type="button"
            onClick={() => onNavigate(1)}
            disabled={!canNext}
            className="pill-secondary flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <span className="w-4 h-4">&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
