export function timeAgo(dateStr: string): string {
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

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural ?? `${singular}s`}`;
}

export function parseTitleParts(fullTitle: string): { courseName: string; entries: string[] } {
  const idx = fullTitle.indexOf(' — ');
  if (idx === -1) return { courseName: fullTitle, entries: [] };
  const courseName = fullTitle.slice(0, idx).trim();
  const entries = fullTitle
    .slice(idx + 3)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return { courseName, entries };
}
