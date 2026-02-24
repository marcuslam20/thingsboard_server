import { useSnackbar, VariantType } from 'notistack';
import { useCallback } from 'react';

export function useNotification() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const notify = useCallback(
    (message: string, variant: VariantType = 'default') => {
      enqueueSnackbar(message, {
        variant,
        autoHideDuration: variant === 'error' ? 5000 : 3000,
        anchorOrigin: { vertical: 'top', horizontal: 'right' },
      });
    },
    [enqueueSnackbar],
  );

  const success = useCallback((message: string) => notify(message, 'success'), [notify]);
  const error = useCallback((message: string) => notify(message, 'error'), [notify]);
  const warning = useCallback((message: string) => notify(message, 'warning'), [notify]);
  const info = useCallback((message: string) => notify(message, 'info'), [notify]);

  return { notify, success, error, warning, info, closeSnackbar };
}
