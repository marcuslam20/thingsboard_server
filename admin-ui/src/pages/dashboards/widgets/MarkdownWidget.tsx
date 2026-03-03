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
import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import Box from '@mui/material/Box';
import { Widget } from '@/models/dashboard.model';

interface MarkdownWidgetProps {
  widget: Widget;
}

function simpleMarkdownToHtml(md: string): string {
  let html = md;
  // Headers (process longest match first)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Bold + italic combo
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  // Links
  html = html.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  // Unordered lists
  html = html.replace(/^\- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  // Paragraphs (double newline)
  html = html.replace(/\n\n/g, '</p><p>');
  // Line breaks (single newline)
  html = html.replace(/\n/g, '<br/>');
  html = `<p>${html}</p>`;
  return html;
}

export default function MarkdownWidget({ widget }: MarkdownWidgetProps) {
  const settings = widget.config?.settings || {};
  const markdownText =
    (settings.markdownText as string) || (settings.labelText as string) || '';
  const useRawHtml = (settings.useRawHtml as boolean) || false;

  const sanitizedHtml = useMemo(() => {
    const raw = useRawHtml ? markdownText : simpleMarkdownToHtml(markdownText);
    return DOMPurify.sanitize(raw);
  }, [markdownText, useRawHtml]);

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'auto',
        p: 1.5,
        '& h1, & h2, & h3': { mt: 0, mb: 1 },
        '& p': { mt: 0, mb: 1 },
        '& ul': { mt: 0, mb: 1, pl: 2 },
        '& code': {
          bgcolor: '#f5f5f5',
          px: 0.5,
          borderRadius: 0.5,
          fontSize: '0.875em',
        },
        '& a': { color: 'primary.main' },
      }}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
