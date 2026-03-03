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
import DOMPurify from 'dompurify';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Widget } from '@/models/dashboard.model';

interface LabelWidgetProps {
  widget: Widget;
}

export default function LabelWidget({ widget }: LabelWidgetProps) {
  const settings = widget.config?.settings || {};
  const text = (settings.labelText as string) || widget.title || 'Label';
  const useHtml = (settings.useHtml as boolean) || false;
  const fontSize = (settings.fontSize as number) || 16;
  const textAlign = (settings.textAlign as string) || 'center';

  if (useHtml) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: textAlign,
          overflow: 'auto',
        }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }}
      />
    );
  }

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
    }}>
      <Typography
        sx={{
          fontSize,
          color: widget.config?.color || 'text.primary',
          fontWeight: (settings.fontWeight as number) || 400,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}
