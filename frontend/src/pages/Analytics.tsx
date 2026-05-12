import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  BarChart3,
  Brain,
  ChevronDown,
  ChevronRight,
  Layers,
  Search,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type {
  BloomPerformanceData,
  CourseAnalytics,
  CourseSummary,
  CrossMatrixEntry,
  SoloPerformanceData,
  StudentAnalyticsData,
  TopicPerformanceData,
} from '../types';
import { apiService } from '../services/api';
import { PageLoading, PageEmpty, PageError } from '../components/common/PageState';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

const BLOOM_LABELS: Record<string, string> = {
  remember: 'Remember',
  understand: 'Understand',
  apply: 'Apply',
  analyze: 'Analyze',
  evaluate: 'Evaluate',
  create: 'Create',
};

const SOLO_LABELS: Record<string, string> = {
  unistructural: 'Foundational',
  multistructural: 'Intermediate',
  relational: 'Advanced',
  extended_abstract: 'Challenge',
};

const SCORE_COLORS = {
  strong: '#9fe870',
  moderate: '#7a5b00',
  weak: '#d03238',
  muted: '#afafaf',
  nearBlack: '#1c1d1a',
  body: '#4b4b4b',
};

function barColor(pct: number): string {
  if (pct >= 70) return SCORE_COLORS.strong;
  if (pct >= 40) return SCORE_COLORS.moderate;
  return SCORE_COLORS.weak;
}

function cellBgColor(pct: number): string {
  if (pct < 0) return '#f3f3f3';
  if (pct >= 70) return 'rgba(159,232,112,0.25)';
  if (pct >= 40) return 'rgba(122,91,0,0.12)';
  return 'rgba(208,50,56,0.10)';
}

function cellTextColor(pct: number): string {
  if (pct < 0) return SCORE_COLORS.muted;
  if (pct >= 70) return SCORE_COLORS.nearBlack;
  if (pct >= 40) return SCORE_COLORS.moderate;
  return SCORE_COLORS.weak;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

type StudentSort = 'name' | 'score' | 'percentage' | 'date';

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-white rounded-lg p-3 ring-card text-sm">
      <p className="font-semibold text-near-black">{label}</p>
      <p className="text-body-gray">{payload[0].value}%</p>
    </div>
  );
}

function CountTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-white rounded-lg p-2 ring-card text-sm">
      <p className="font-semibold text-near-black">{label}</p>
      <p className="text-body-gray">{payload[0].value} students</p>
    </div>
  );
}

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color?: string;
  sub?: string;
}

function KpiCard({ icon: Icon, label, value, color, sub }: KpiCardProps) {
  return (
    <div className="top-stat flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-chip-gray flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-near-black" />
      </div>
      <div>
        <p className="text-xs text-body-gray mb-0.5">{label}</p>
        <p className="text-2xl font-bold" style={{ color: color ?? SCORE_COLORS.nearBlack }}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-gray mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function TopicPerformanceChart({ data }: { data: TopicPerformanceData[] }) {
  if (data.length === 0) return <PageEmpty message="No topic data available." />;
  const chartData = data.map((d) => ({
    name: d.topic,
    percentage: d.percentage,
    totalAnswers: d.totalAnswers,
  }));
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 52)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e2" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: SCORE_COLORS.muted }} axisLine={{ stroke: SCORE_COLORS.muted }} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: SCORE_COLORS.nearBlack, fontWeight: 600 }} axisLine={false} tickLine={false} width={120} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        <Bar dataKey="percentage" radius={[0, 6, 6, 0]} barSize={28}>
          {chartData.map((entry, idx) => (
            <Cell key={idx} fill={barColor(entry.percentage)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function BloomSoloSection({
  bloom,
  solo,
}: {
  bloom: BloomPerformanceData[];
  solo: SoloPerformanceData[];
}) {
  const activeBloom = bloom.filter((b) => b.totalAnswers > 0);
  const activeSolo = solo.filter((s) => s.totalAnswers > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="surface-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-near-black" />
          <h3 className="text-base font-bold text-near-black">Cognitive Depth (Bloom)</h3>
        </div>
        {activeBloom.length === 0 ? (
          <p className="text-sm text-body-gray py-4">No data across Bloom levels.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, activeBloom.length * 44)}>
            <BarChart
              data={activeBloom.map((b) => ({
                name: BLOOM_LABELS[b.bloomLevel] ?? b.bloomLevel,
                percentage: b.percentage,
                total: b.totalAnswers,
              }))}
              layout="vertical"
              margin={{ left: 0, right: 24, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e2" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: SCORE_COLORS.muted }} axisLine={{ stroke: SCORE_COLORS.muted }} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: SCORE_COLORS.nearBlack, fontWeight: 600 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="percentage" radius={[0, 6, 6, 0]} barSize={24}>
                {activeBloom.map((_, idx) => (
                  <Cell key={idx} fill={barColor(activeBloom[idx].percentage)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {bloom.filter((b) => b.totalAnswers === 0).length > 0 && (
          <p className="text-xs text-muted-gray mt-2">
            No questions at: {bloom.filter((b) => b.totalAnswers === 0).map((b) => BLOOM_LABELS[b.bloomLevel] ?? b.bloomLevel).join(', ')}
          </p>
        )}
      </div>

      <div className="surface-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-near-black" />
          <h3 className="text-base font-bold text-near-black">Complexity Depth (SOLO)</h3>
        </div>
        {activeSolo.length === 0 ? (
          <p className="text-sm text-body-gray py-4">No data across SOLO levels.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, activeSolo.length * 44)}>
            <BarChart
              data={activeSolo.map((s) => ({
                name: SOLO_LABELS[s.soloLevel] ?? s.soloLevel,
                percentage: s.percentage,
                total: s.totalAnswers,
              }))}
              layout="vertical"
              margin={{ left: 0, right: 24, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e2" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: SCORE_COLORS.muted }} axisLine={{ stroke: SCORE_COLORS.muted }} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: SCORE_COLORS.nearBlack, fontWeight: 600 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="percentage" radius={[0, 6, 6, 0]} barSize={24}>
                {activeSolo.map((_, idx) => (
                  <Cell key={idx} fill={barColor(activeSolo[idx].percentage)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {solo.filter((s) => s.totalAnswers === 0).length > 0 && (
          <p className="text-xs text-muted-gray mt-2">
            No questions at: {solo.filter((s) => s.totalAnswers === 0).map((s) => SOLO_LABELS[s.soloLevel] ?? s.soloLevel).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

function CrossMatrixTable({ data, topics }: { data: CrossMatrixEntry[]; topics: string[] }) {
  const bLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
  const matrix = new Map<string, Map<string, number>>();
  for (const entry of data) {
    if (!matrix.has(entry.topic)) matrix.set(entry.topic, new Map());
    matrix.get(entry.topic)!.set(entry.bloomLevel, entry.percentage);
  }

  const activeTopics = topics.filter((t) => matrix.has(t));
  if (activeTopics.length === 0) return <PageEmpty message="No cross-topic data available." />;

  return (
    <div className="surface-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-chip-gray">
            <th className="text-left px-4 py-3 text-xs font-bold text-body-gray sticky left-0 bg-white z-10">Topic</th>
            {bLevels.map((b) => (
              <th key={b} className="text-center px-3 py-3 text-xs font-bold text-body-gray whitespace-nowrap">
                {BLOOM_LABELS[b] ?? b}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activeTopics.map((topic) => {
            const row = matrix.get(topic)!;
            return (
              <tr key={topic} className="border-b border-chip-gray last:border-b-0">
                <td className="px-4 py-2.5 text-sm font-semibold text-near-black sticky left-0 bg-white z-10">
                  {topic}
                </td>
                {bLevels.map((b) => {
                  const pct = row.get(b);
                  return (
                    <td
                      key={b}
                      className="text-center px-3 py-2.5 text-sm font-semibold whitespace-nowrap"
                      style={{
                        backgroundColor: cellBgColor(pct ?? -1),
                        color: cellTextColor(pct ?? -1),
                      }}
                    >
                      {pct !== undefined ? `${pct}%` : '\u2014'}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex items-center gap-4 px-4 py-2 text-xs text-body-gray border-t border-chip-gray">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: 'rgba(159,232,112,0.25)' }} />
          Strong (70-100%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: 'rgba(122,91,0,0.12)' }} />
          Moderate (40-69%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: 'rgba(208,50,56,0.10)' }} />
          Needs attention (0-39%)
        </span>
      </div>
    </div>
  );
}

function StudentDiagnostic({ student }: { student: StudentAnalyticsData }) {
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
  for (const w of student.weakTopics) {
    if (!allTopicsStrong.has(w.topic)) continue;
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
    <div className="border-t border-chip-gray mt-3 pt-4">
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
        <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
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
              <div className="ml-12 mt-1 flex flex-wrap gap-1">
                {a.metadata.topic && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-chip-gray text-body-gray">{a.metadata.topic}</span>
                )}
                {a.metadata.bloomLevel && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-chip-gray text-body-gray">{BLOOM_LABELS[a.metadata.bloomLevel]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

interface StudentRowProps {
  student: StudentAnalyticsData;
  rank: number;
  expanded: boolean;
  onToggle: () => void;
}

const DESKTOP_HEADER =
  'hidden md:grid grid-cols-[2rem_1fr_80px_70px_80px_130px_40px] gap-3 px-4 py-2.5 text-xs font-bold text-body-gray border-b border-chip-gray items-center';
const DESKTOP_ROW =
  'hidden md:grid grid-cols-[2rem_1fr_80px_70px_80px_130px_40px] gap-3 px-4 py-3 items-center cursor-pointer hover:bg-chip-gray/30 transition-colors';

function StudentRow({ student, rank, expanded, onToggle }: StudentRowProps) {
  return (
    <>
      <div className={`${DESKTOP_ROW} border-b border-chip-gray last:border-b-0`} onClick={onToggle}>
        <span className="text-xs text-muted-gray">{rank}</span>
        <span className="text-sm font-semibold text-near-black truncate">{student.studentName}</span>
        <span className="text-sm font-semibold text-near-black">{student.score}/{student.total}</span>
        <span className="text-sm font-semibold" style={{ color: barColor(student.percentage) }}>{student.percentage}%</span>
        <span>
          <span
            className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: student.passed ? 'rgba(159,232,112,0.18)' : 'rgba(208,50,56,0.10)',
              color: student.passed ? SCORE_COLORS.nearBlack : SCORE_COLORS.weak,
            }}
          >
            {student.passed ? 'Passed' : 'Failed'}
          </span>
        </span>
        <span className="text-xs text-body-gray">{new Date(student.submittedAt).toLocaleDateString()}</span>
        <span className="text-body-gray">{expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</span>
      </div>

      {/* Mobile card */}
      <div className="md:hidden border-b border-chip-gray last:border-b-0">
        <button type="button" onClick={onToggle} className="w-full text-left px-4 py-3 cursor-pointer hover:bg-chip-gray/30 transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-semibold text-near-black">{student.studentName}</span>
            <span
              className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: student.passed ? 'rgba(159,232,112,0.18)' : 'rgba(208,50,56,0.10)',
                color: student.passed ? SCORE_COLORS.nearBlack : SCORE_COLORS.weak,
              }}
            >
              {student.passed ? 'Passed' : 'Failed'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-body-gray">
            <span className="font-semibold" style={{ color: barColor(student.percentage) }}>{student.score}/{student.total} ({student.percentage}%)</span>
            <span>{new Date(student.submittedAt).toLocaleDateString()}</span>
            <span className="text-body-gray ml-auto">{expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</span>
          </div>
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 md:col-span-7">
          <StudentDiagnostic student={student} />
        </div>
      )}
    </>
  );
}

function ScoreDistributionChart({ data }: { data: Array<{ range: string; min: number; max: number; count: number }> }) {
  const chartData = data.map((d) => ({ name: d.range, students: d.count }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e2" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: SCORE_COLORS.body }} axisLine={{ stroke: SCORE_COLORS.muted }} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: SCORE_COLORS.muted }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CountTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        <Bar dataKey="students" radius={[6, 6, 0, 0]} barSize={48}>
          {chartData.map((_entry, idx) => {
            const pct = chartData[idx].name.startsWith('81') ? 90 : chartData[idx].name.startsWith('61') ? 70 : chartData[idx].name.startsWith('41') ? 50 : chartData[idx].name.startsWith('21') ? 30 : 10;
            return <Cell key={idx} fill={barColor(pct)} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function normalizeAnalytics(raw: Record<string, unknown>): CourseAnalytics {
  const a = raw as Partial<CourseAnalytics>;
  return {
    courseId: a.courseId ?? '',
    totalSubmissions: a.totalSubmissions ?? 0,
    uniqueStudents: a.uniqueStudents ?? 0,
    totalQuestions: a.totalQuestions ?? 0,
    averageScore: a.averageScore ?? 0,
    highestScore: a.highestScore ?? 0,
    lowestScore: a.lowestScore ?? 0,
    passRate: a.passRate ?? 0,
    passPercentage: a.passPercentage ?? 70,
    scoreDistribution: a.scoreDistribution ?? [],
    topicPerformance: a.topicPerformance ?? [],
    bloomPerformance: a.bloomPerformance ?? [],
    soloPerformance: a.soloPerformance ?? [],
    crossMatrix: a.crossMatrix ?? [],
    questionAnalytics: a.questionAnalytics ?? [],
    studentAnalytics: a.studentAnalytics ?? [],
  };
}

export function AnalyticsPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseSearch, setCourseSearch] = useState('');
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');
  const [studentSort, setStudentSort] = useState<StudentSort>('date');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingCourses(true);
        const response = await apiService.getCourses();
        setCourses(response.courses);
        if (response.courses.length > 0) setSelectedCourseId(response.courses[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setLoadingCourses(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    const load = async () => {
      try {
        setLoadingAnalytics(true);
        setError('');
        const result = await apiService.getAnalytics(selectedCourseId);
        setAnalytics(normalizeAnalytics(result as unknown as Record<string, unknown>));
        setExpandedStudents(new Set());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoadingAnalytics(false);
      }
    };
    load();
  }, [selectedCourseId]);

  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) return courses;
    const q = courseSearch.toLowerCase();
    return courses.filter((c) => c.title.toLowerCase().includes(q) || c.courseCode.toLowerCase().includes(q));
  }, [courses, courseSearch]);

  const sortedStudents = useMemo(() => {
    if (!analytics) return [];
    const list = [...analytics.studentAnalytics];
    list.sort((a, b) => {
      switch (studentSort) {
        case 'name': return a.studentName.localeCompare(b.studentName);
        case 'score': return b.score - a.score;
        case 'percentage': return b.percentage - a.percentage;
        case 'date': return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        default: return 0;
      }
    });
    return list;
  }, [analytics, studentSort]);

  const toggleStudent = (id: string) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const strongTopicCount = analytics?.topicPerformance.filter((t) => t.percentage >= 70).length ?? 0;
  const totalTopicCount = analytics?.topicPerformance.length ?? 0;

  return (
    <div>
      <Breadcrumbs />
      <div className="mb-6">
        <h2 className="section-title">Analytics</h2>
        <p className="section-subtitle mt-2">
          Understand student performance, identify gaps, and take action.
        </p>
      </div>

      {loadingCourses ? (
        <PageLoading message="Loading courses..." />
      ) : courses.length === 0 ? (
        <PageEmpty message="No courses generated yet." />
      ) : (
        <div className="mb-6 max-w-xl">
          <label className="block text-sm font-semibold text-near-black mb-2">Select course</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-gray pointer-events-none" />
            <input
              className="field pl-10 pr-4"
              placeholder="Search courses..."
              value={courseSearch}
              onChange={(e) => { setCourseSearch(e.target.value); setSelectedCourseId(''); }}
            />
          </div>
          <div className="mt-2 max-h-48 overflow-y-auto space-y-1 border border-chip-gray rounded-lg">
            {filteredCourses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => { setSelectedCourseId(course.id); setCourseSearch(''); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors gap-3 ${
                  selectedCourseId === course.id
                    ? 'bg-light-mint text-dark-green font-semibold'
                    : 'hover:bg-chip-gray text-near-black'
                }`}
              >
                <span className="font-medium truncate min-w-0">{course.title}</span>
                <span className="text-muted-gray shrink-0">({course.courseCode})</span>
                <span className="text-muted-gray shrink-0 text-xs">{timeAgo(course.createdAt)}</span>
              </button>
            ))}
            {filteredCourses.length === 0 && (
              <p className="text-xs text-body-gray px-3 py-2">No courses match your search.</p>
            )}
          </div>
        </div>
      )}

      {error && <PageError error={error} className="mb-4" />}

      {loadingAnalytics ? (
        <PageLoading message="Loading analytics..." />
      ) : analytics ? (
        <div className="space-y-8">
          {/* SECTION: KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard icon={Users} label="Submissions" value={String(analytics.totalSubmissions)} />
            <KpiCard
              icon={Target}
              label="Average Score"
              value={`${analytics.averageScore}%`}
              color={barColor(analytics.averageScore)}
            />
            <KpiCard
              icon={TrendingUp}
              label="Pass Rate"
              value={`${analytics.passRate}%`}
              color={barColor(analytics.passRate)}
            />
            <KpiCard icon={Users} label="Unique Students" value={String(analytics.uniqueStudents)} />
            <KpiCard
              icon={TrendingUp}
              label="Highest Score"
              value={`${analytics.highestScore}%`}
              color={barColor(analytics.highestScore)}
            />
            <KpiCard
              icon={TrendingDown}
              label="Lowest Score"
              value={`${analytics.lowestScore}%`}
              color={barColor(analytics.lowestScore)}
            />
          </div>

          {/* SECTION: Score Distribution */}
          <div className="surface-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-near-black" />
              <h3 className="text-base font-bold text-near-black">Score Distribution</h3>
            </div>
            {analytics.scoreDistribution.every((d) => d.count === 0) ? (
              <p className="text-sm text-body-gray py-4">No score data yet.</p>
            ) : (
              <ScoreDistributionChart data={analytics.scoreDistribution} />
            )}
          </div>

          {/* SECTION: Topic Performance */}
          <div className="surface-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-near-black" />
              <h3 className="text-base font-bold text-near-black">Topic Performance</h3>
              <span className="text-xs text-body-gray ml-auto">
                {strongTopicCount}/{totalTopicCount} topics strong
              </span>
            </div>
            <TopicPerformanceChart data={analytics.topicPerformance} />
          </div>

          {/* SECTION: Bloom + Solo */}
          <BloomSoloSection bloom={analytics.bloomPerformance} solo={analytics.soloPerformance} />

          {/* SECTION: Cross Matrix */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-near-black" />
              <h3 className="text-base font-bold text-near-black">Topic x Bloom Cross Analysis</h3>
            </div>
            <CrossMatrixTable
              data={analytics.crossMatrix}
              topics={analytics.topicPerformance.map((t) => t.topic)}
            />
          </div>

          {/* SECTION: Student Performance */}
          <div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Users className="w-4 h-4 text-near-black" />
              <h3 className="text-base font-bold text-near-black">Student Performance</h3>
              <div className="flex items-center gap-1.5 ml-auto">
                <ArrowUpDown className="w-3.5 h-3.5 text-body-gray" />
                <div className="relative">
                  <select
                    value={studentSort}
                    onChange={(e) => setStudentSort(e.target.value as StudentSort)}
                    className="field !w-auto appearance-none !inline-flex !py-1 pr-7 cursor-pointer text-xs"
                  >
                    <option value="date">Most recent</option>
                    <option value="name">Student name</option>
                    <option value="score">Score</option>
                    <option value="percentage">Percentage</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-body-gray pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {sortedStudents.length === 0 ? (
              <PageEmpty message="No submissions yet for this course." />
            ) : (
              <div className="surface-card overflow-hidden">
                {/* Desktop header */}
                <div className={DESKTOP_HEADER}>
                  <span>#</span><span>Student</span><span>Score</span><span>%</span><span>Status</span><span>Date</span><span />
                </div>

                {sortedStudents.map((student, i) => (
                  <StudentRow
                    key={student.attemptId}
                    student={student}
                    rank={i + 1}
                    expanded={expandedStudents.has(student.attemptId)}
                    onToggle={() => toggleStudent(student.attemptId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
