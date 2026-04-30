import { useLocation } from 'react-router-dom';

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  materials: 'Materials',
  'create-course': 'Create Course',
  'my-courses': 'My Courses',
  analytics: 'Analytics',
  quiz: 'Quiz',
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-xs text-muted-gray">
        {segments.map((segment, i) => {
          const label = LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
          return (
            <li key={segment} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              <span className={i === segments.length - 1 ? 'text-body-gray font-semibold' : ''}>{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
