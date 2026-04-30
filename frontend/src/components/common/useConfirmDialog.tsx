import { useState, useCallback } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    message: string;
    title?: string;
    confirmLabel?: string;
    destructive?: boolean;
    resolve: (v: boolean) => void;
  } | null>(null);

  const ask = useCallback(
    (message: string, opts?: { title?: string; confirmLabel?: string; destructive?: boolean }) =>
      new Promise<boolean>((resolve) => {
        setState({ open: true, message, ...opts, resolve });
      }),
    [],
  );

  const handleConfirm = useCallback(() => {
    state?.resolve(true);
    setState(null);
  }, [state]);

  const handleCancel = useCallback(() => {
    state?.resolve(false);
    setState(null);
  }, [state]);

  const dialog = state ? (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      destructive={state.destructive}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { ask, dialog };
}
