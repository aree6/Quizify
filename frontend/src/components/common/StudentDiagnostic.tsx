import { ChevronDown, ChevronRight } from 'lucide-react';
import type { StudentAnalyticsData } from '../../types';
import { BLOOM_LABELS, SOLO_LABELS } from './analyticsTokens';

const BLOOM_ACTION: Record<string, string> = {
  remember: 'recalling key facts and definitions',
  understand: 'understanding and explaining concepts in your own words',
  apply: 'applying what you have learned to practical scenarios',
  analyze: 'breaking down information and finding patterns',
  evaluate: 'making judgments and backing them up with evidence',
  create: 'designing solutions and combining ideas in new ways',
};

function Chip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`px-2  text-[11px] rounded-full font-medium inline-flex ${className}`}>
      {children}
    </span>
  );
}

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
  const weakTopicNames = weakTopicsList.slice(0, 2).map((w) => w.topic);
  const bloomAction = student.weakestBloomLevel ? BLOOM_ACTION[student.weakestBloomLevel] : null;
  const bloomLabel = student.weakestBloomLevel ? (BLOOM_LABELS[student.weakestBloomLevel] ?? student.weakestBloomLevel) : null;

  let recommendation: React.ReactNode;
  if (weakTopicsList.length > 0) {
    recommendation = (
      <>
        You might want to revisit{' '}
        {weakTopicNames.map((name, i) => (
          <span key={name}>
            {i > 0 && ' and '}
            <Chip className="bg-chip-gray text-body-gray">{name}</Chip>
          </span>
        ))}
        .{bloomAction ? ` Focus on ${bloomAction} to strengthen those areas.` : ' Spend some extra time reviewing those topics.'}
      </>
    );
  } else if (bloomAction) {
    recommendation = `You are doing well across topics. To go further, try questions that involve ${bloomAction}.`;
  } else if (student.percentage >= 70) {
    recommendation = 'Great work! You have shown a strong grasp of the material across all areas.';
  } else {
    recommendation = 'Keep reviewing the topics and practicing with different types of questions to improve.';
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold text-body-gray mb-2">Weak Topics</p>
          {weakTopicsList.length === 0 ? (
            <p className="text-xs text-muted-gray">No weak areas identified.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {weakTopicsList.map((w) => (
                <div
                  key={w.topic}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                    w.percentage >= 70 ? 'bg-light-mint text-positive' :
                    w.percentage >= 40 ? 'bg-[#fff5c3] text-[#7a5b00]' :
                    'bg-error-surface text-danger'
                  }`}
                >
                  <p className="leading-tight">{w.topic}</p>
                  <p className="text-[10px] opacity-75 mt-0.5">{w.correct}/{w.total} · {w.percentage}%</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-body-gray mb-2">Cognitive Profile</p>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {student.strongestTopic && (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-light-mint text-positive">
                  Strongest: {student.strongestTopic}
                </span>
              )}
              {student.weakestBloomLevel && (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-error-surface text-danger">
                  Weakest: {BLOOM_LABELS[student.weakestBloomLevel] ?? student.weakestBloomLevel}
                </span>
              )}
            </div>
            {!student.strongestTopic && !student.weakestBloomLevel && (
              <p className="text-xs text-muted-gray">No profile data available.</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-body-gray mb-2">Recommendation</p>
          <p className="text-xs text-near-black leading-relaxed">{recommendation}</p>
        </div>
      </div>

      <details className="group">
        <summary className="text-sm w-full px-4 py-3 rounded-lg font-semibold text-body-gray cursor-pointer hover:text-near-black list-none flex items-center justify-center gap-1.5">
          <ChevronRight className="w-3 h-3 transition-colors group-open:hidden" />
          <ChevronDown className="w-3 h-3 transition-colors hidden group-open:inline" />
          Question-by-question breakdown ({student.answers.length})
        </summary>
        <div className="mt-3 space-y-2">
          {student.answers.map((a, idx) => (
            <div
              key={a.questionId}
              className="rounded-lg border p-3 text-sm"
              style={{
                borderColor: a.isCorrect ? 'rgba(5,77,40,0.25)' : 'rgba(208,50,56,0.3)',
                backgroundColor: a.isCorrect ? 'rgba(5,77,40,0.06)' : 'rgba(208,50,56,0.04)',
              }}
            >
              <div className="mb-1">
                <span className={`font-bold text-xs ${a.isCorrect ? 'text-positive' : 'text-danger'}`}>
                  {a.isCorrect ? 'CORRECT' : 'INCORRECT'}
                </span>
              </div>
              <div className="flex items-start gap-2 mb-1">
                <span className="text-body-gray text-xs mt-0.5">{idx + 1}.</span>
                <p className="text-near-black flex-1 leading-snug">{a.prompt}</p>
              </div>
              <div className="ml-2 space-y-0.5 text-xs">
                {a.options.map((opt, oi) => {
                  const isCorrect = oi === a.correctOptionIndex;
                  const isSelected = oi === a.selectedOptionIndex;
                  return (
                    <p
                      key={oi}
                      className="leading-snug"
                      style={{
                        color: isCorrect ? '#054d28' : isSelected && !isCorrect ? '#d03238' : '#4b4b4b',
                        fontWeight: isSelected || isCorrect ? 600 : 400,
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
                <div className="ml-2 mt-6 text-xs text-body-gray leading-relaxed border-l-2 border-chip-gray pl-2">
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
              <div className="ml-2 mt-5 flex flex-wrap gap-1">
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
