interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="surface-card p-6 text-sm text-body-gray">{message}</div>
  );
}

// ────────────────────────────────────────────────

interface PageEmptyProps {
  message?: string;
  action?: React.ReactNode;
}

export function PageEmpty({ message, action }: PageEmptyProps) {
  return (
    <div className="surface-card p-6 text-sm text-body-gray">
      <p>{message}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

// ────────────────────────────────────────────────

interface ApiErrorBody {
  message?: string;
  details?: string;
  hint?: string;
}

interface PageErrorProps {
  error: string | ApiErrorBody | null;
  className?: string;
}

export function PageError({ error, className = '' }: PageErrorProps) {
  if (!error) return null;

  const body: ApiErrorBody = typeof error === 'string'
    ? { message: error }
    : error;

  return (
    <div className={`p-3 rounded-lg bg-error-surface text-danger text-sm ${className}`}>
      <p className="font-semibold">{body.message || 'An error occurred'}</p>
      {body.details && <p className="mt-1 opacity-90">{body.details}</p>}
      {body.hint && <p className="mt-1 text-xs opacity-80">{body.hint}</p>}
    </div>
  );
}
