import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import { Datasource, DataKey } from '@/models/dashboard.model';
import { deviceApi } from '@/api/device.api';
import { dashboardApi } from '@/api/dashboard.api';
import { DeviceInfo } from '@/models/device.model';

interface DatasourceEditorProps {
  datasource: Datasource;
  onChange: (ds: Datasource) => void;
}

export default function DatasourceEditor({ datasource, onChange }: DatasourceEditorProps) {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);

  // Load device list
  useEffect(() => {
    deviceApi.getTenantDeviceInfos({ page: 0, pageSize: 100, sortProperty: 'name', sortOrder: 'ASC' })
      .then((res) => setDevices(res.data))
      .catch(console.error);
  }, []);

  // Load available keys when device changes
  useEffect(() => {
    const deviceId = datasource.deviceId;
    if (!deviceId) {
      setAvailableKeys([]);
      return;
    }

    setLoadingKeys(true);
    Promise.all([
      dashboardApi.getDeviceKeys(deviceId, 'timeseries').catch(() => []),
      dashboardApi.getDeviceKeys(deviceId, 'attributes').catch(() => []),
    ]).then(([tsKeys, attrKeys]) => {
      setAvailableKeys([...new Set([...tsKeys, ...attrKeys])].sort());
    }).finally(() => setLoadingKeys(false));
  }, [datasource.deviceId]);

  const handleDeviceChange = (deviceId: string) => {
    onChange({
      ...datasource,
      type: 'device',
      deviceId,
      dataKeys: [],
    });
  };

  const handleKeysChange = (_: unknown, keys: string[]) => {
    const dataKeys: DataKey[] = keys.map((name) => ({
      name,
      type: 'timeseries',
      label: name,
    }));
    onChange({ ...datasource, dataKeys });
  };

  const handleKeyTypeChange = (keyName: string, type: DataKey['type']) => {
    const dataKeys = (datasource.dataKeys || []).map((dk) =>
      dk.name === keyName ? { ...dk, type } : dk,
    );
    onChange({ ...datasource, dataKeys });
  };

  const selectedKeys = (datasource.dataKeys || []).map((dk) => dk.name);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Datasource
      </Typography>

      <FormControl fullWidth size="small">
        <InputLabel>Device</InputLabel>
        <Select
          value={datasource.deviceId || ''}
          label="Device"
          onChange={(e) => handleDeviceChange(e.target.value)}
        >
          {devices.map((d) => (
            <MenuItem key={d.id.id} value={d.id.id}>
              {d.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {datasource.deviceId && (
        <Autocomplete
          multiple
          size="small"
          options={availableKeys}
          value={selectedKeys}
          onChange={handleKeysChange}
          loading={loadingKeys}
          renderInput={(params) => (
            <TextField {...params} label="Data Keys" placeholder="Select keys..." />
          )}
          renderTags={(value, getTagProps) =>
            value.map((key, idx) => (
              <Chip {...getTagProps({ index: idx })} key={key} label={key} size="small" />
            ))
          }
        />
      )}

      {(datasource.dataKeys || []).length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Key Types
          </Typography>
          {(datasource.dataKeys || []).map((dk) => (
            <Box key={dk.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ flex: 1, fontSize: 13 }}>
                {dk.name}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={dk.type}
                  onChange={(e) => handleKeyTypeChange(dk.name, e.target.value as DataKey['type'])}
                  sx={{ fontSize: 12 }}
                >
                  <MenuItem value="timeseries">Timeseries</MenuItem>
                  <MenuItem value="attribute">Attribute</MenuItem>
                </Select>
              </FormControl>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
