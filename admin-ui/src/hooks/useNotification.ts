///
/// Copyright © 2016-2025 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

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
