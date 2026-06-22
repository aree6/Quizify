import { ChevronDown, ChevronRight } from 'lucide-react';
import type { StudentAnalyticsData } from '../../types';
import { BLOOM_LABELS, SCORE_COLORS, SOLO_LABELS } from './analyticsTokens';

export function StudentDiagnostic({ student }: { student: StudentAnalyticsData }) {
  const allTopicsStrong = new Set<string>();
  const topicAgg = new Map<string, { correct: number; total: number }>();
  for (const a of student.answers) {
    const t = a.metadata.topic || 'General';
    if (!topicAgg.has(t)) topicAgg.set(t, { correct: 0, total: 0 });
    topicAgg.get(t)!.total += 1;
    if (a.isCorrect) topicAgg.get(t)!.correct += 1;
  }
  for (const [topic, v] of topicAgg) {
    if ((v.correct / v.total) * 100 >= 70) allTopicsStrong.add(topic);
  }
  const weakTopicsList = student.weakTopics.filter((w) => !allTopicsStrong.has(w.topic));

  let recommendation = '';
  if (weakTopicsList.length > 0) {
    const topicStr = weakTopicsList.slice(0, 2).map((w) => w.topic).join(' and ');
    recommendation = `Focus on ${topicStr}. `;
    if (student.weakestBloomLevel) {
      recommendation += `Pay special attention to questions at the ${BLOOM_LABELS[student.weakestBloomLevel] ?? student.weakestBloomLevel} cognitive level.`;
    }
  } else if (student.weakestBloomLevel) {
    recommendation = `While topic knowledge is solid, consider more practice at the ${BLOOM_LABELS[student.weakestBloomLevel] ?? student.weakestBloomLevel} level to build deeper understanding.`;
  } else if (student.percentage >= 70) {
    recommendation = 'Strong performance across all areas. Consider enrichment material to push further.';
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold text-body-gray mb-2">Weak Topics</p>
          {weakTopicsList.length === 0 ? (
            <p className="text-xs text-muted-gray">No weak areas identified.</p>
          ) : (
            <div className="space-y-1">
              {weakTopicsList.map((w) => (
                <div key={w.topic} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-near-black font-medium">{w.topic}</span>
                  <span className="text-body-gray">
                    {w.correct}/{w.total} ({w.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-body-gray mb-2">Cognitive Profile</p>
          <div className="space-y-1 text-xs">
            {student.strongestTopic && (
              <p className="text-near-black">
                <span className="text-body-gray">Strongest topic:</span> {student.strongestTopic}
              </p>
            )}
            {student.weakestBloomLevel && (
              <p className="text-near-black">
                <span className="text-body-gray">Weakest level:</span> {BLOOM_LABELS[student.weakestBloomLevel] ?? student.weakestBloomLevel}
              </p>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-body-gray mb-2">Recommendation</p>
          <p className="text-xs text-near-black leading-relaxed">{recommendation || 'Review all areas for improvement.'}</p>
        </div>
      </div>

      <details className="group">
        <summary className="text-xs font-semibold text-body-gray cursor-pointer hover:text-near-black list-none flex items-center gap-1">
          <ChevronRight className="w-3 h-3 transition-colors group-open:hidden" />
          <ChevronDown className="w-3 h-3 transition-colors hidden group-open:inline" />
          Question-by-question breakdown ({student.answers.length})
        </summary>
        <div className="mt-3 space-y-2 max-h-[28rem] overflow-y-auto">
          {student.answers.map((a, idx) => (
            <div
              key={a.questionId}
              className="rounded-lg border p-3 text-sm"
              style={{
                borderColor: a.isCorrect ? 'rgba(159,232,112,0.4)' : 'rgba(208,50,56,0.3)',
                backgroundColor: a.isCorrect ? 'rgba(159,232,112,0.06)' : 'rgba(208,50,56,0.04)',
              }}
            >
              <div className="flex items-start gap-2 mb-1">
                <span className="font-bold text-xs mt-0.5" style={{ color: a.isCorrect ? SCORE_COLORS.strong : SCORE_COLORS.weak }}>
                  {a.isCorrect ? 'CORRECT' : 'INCORRECT'}
                </span>
                <span className="text-body-gray text-xs">{idx + 1}.</span>
                <p className="text-near-black flex-1 leading-snug">{a.prompt}</p>
              </div>
              <div className="ml-12 space-y-0.5 text-xs">
                {a.options.map((opt, oi) => {
                  const isCorrect = oi === a.correctOptionIndex;
                  const isSelected = oi === a.selectedOptionIndex;
                  return (
                    <p
                      key={oi}
                      className="leading-snug"
                      style={{
                        color: isCorrect ? SCORE_COLORS.strong : isSelected && !isCorrect ? SCORE_COLORS.weak : SCORE_COLORS.body,
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      {String.fromCharCode(65 + oi)}. {opt}
                      {isCorrect && ' (correct)'}
                      {isSelected && !isCorrect && ' (your answer)'}
                    </p>
                  );
                })}
              </div>
              {(a.explanations?.[a.selectedOptionIndex] || a.explanations?.[a.correctOptionIndex]) && (
                <div className="ml-12 mt-2 text-xs text-body-gray leading-relaxed border-l-2 border-chip-gray pl-2">
                  {a.isCorrect ? (
                    <p>{a.explanations[a.selectedOptionIndex]}</p>
                  ) : (
                    <>
                      {a.explanations[a.selectedOptionIndex] && (
                        <p className="mb-1">
                          <span className="font-semibold text-danger">Why your answer is wrong:</span>{' '}
                          {a.explanations[a.selectedOptionIndex]}
                        </p>
                      )}
                      {a.explanations[a.correctOptionIndex] && (
                        <p>
                          <span className="font-semibold text-positive">Why the correct answer is right:</span>{' '}
                          {a.explanations[a.correctOptionIndex]}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
              <div className="ml-12 mt-1 flex flex-wrap gap-1">
                {a.metadata.topic && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-chip-gray text-body-gray">{a.metadata.topic}</span>
                )}
                {a.metadata.bloomLevel && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-chip-gray text-body-gray">{BLOOM_LABELS[a.metadata.bloomLevel]}</span>
                )}
                {a.metadata.soloLevel && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-chip-gray text-body-gray">{SOLO_LABELS[a.metadata.soloLevel]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
