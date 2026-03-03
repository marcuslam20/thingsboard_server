/*
 * Copyright © 2016-2025 The Thingsboard Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { Widget } from '@/models/dashboard.model';
import { deviceApi } from '@/api/device.api';

interface RpcButtonWidgetProps {
  widget: Widget;
}

export default function RpcButtonWidget({ widget }: RpcButtonWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settings = widget.config?.settings || {};
  const buttonLabel = (settings.buttonLabel as string) || 'Execute';
  const method = (settings.rpcMethod as string) || 'setValue';
  const params = (settings.rpcParams as Record<string, unknown>) || {};
  const twoWay = (settings.twoWayRpc as boolean) || false;

  const deviceId = widget.config?.datasources?.[0]?.deviceId;

  const handleExecute = async () => {
    if (!deviceId) {
      setError('No device configured');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body = { method, params };
      if (twoWay) {
        const res = await deviceApi.sendTwoWayRpcCommand(deviceId, body);
        setResult(JSON.stringify(res, null, 2));
      } else {
        await deviceApi.sendOneWayRpcCommand(deviceId, body);
        setResult('Command sent successfully');
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'RPC command failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 1,
      p: 1,
    }}>
      {!deviceId && (
        <Typography variant="body2" color="text.secondary">
          Configure a device datasource
        </Typography>
      )}

      <Button
        variant="contained"
        onClick={handleExecute}
        disabled={loading || !deviceId}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        sx={{ minWidth: 120 }}
      >
        {buttonLabel}
      </Button>

      {error && <Alert severity="error" sx={{ width: '100%', fontSize: 12 }}>{error}</Alert>}
      {result && <Alert severity="success" sx={{ width: '100%', fontSize: 12 }}>{result}</Alert>}
    </Box>
  );
}
