import React, { useRef, useState, useEffect } from 'react';
import { Box } from '@mui/material';

interface RobotCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

// Very basic regex-based syntax highlighter for Robot Framework
const highlightRobotCode = (code: string) => {
  if (!code) return '';

  return code.split('\n').map((line, i) => {
    // Escape HTML first
    let highlighted = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // To prevent matching '#' inside our own HTML spans, we'll do comments first, or use a negative lookbehind, or just ensure comments only match if not inside a tag.
    // Simpler approach: match comments first before adding any HTML spans with colors!
    highlighted = highlighted.replace(/(#.*)$/, '<span style="color: __COMMENT_COLOR__; font-style: italic;">$1</span>');

    // Headings (*** Settings ***, etc)
    highlighted = highlighted.replace(/^(\*\*\*\s*.*?\s*\*\*\*)/, '<span style="color: #c678dd; font-weight: bold;">$1</span>');
    
    // Variables (${var})
    highlighted = highlighted.replace(/(\$\{[^}]+\})/g, '<span style="color: #d19a66;">$1</span>');
    
    // Built-in tags (e.g., [Documentation], [Arguments], [Return], [Tags])
    highlighted = highlighted.replace(/(\[Documentation\]|\[Arguments\]|\[Return\]|\[Tags\])/g, '<span style="color: #56b6c2;">$1</span>');

    // Basic heuristic for Robot keywords: starting the line without indentation or having exactly 4 spaces before a capitalized word
    if (/^[A-Z][a-zA-Z0-9 _]+$/.test(line) && !line.startsWith('***')) {
      // Un-indented Keyword definition
      highlighted = `<span style="color: #61afef; font-weight: bold;">${highlighted}</span>`;
    } else if (line.match(/^    [A-Z]/)) {
      // Indented keyword call (rough heuristic)
      highlighted = highlighted.replace(/^(    )([A-Z][a-zA-Z0-9_ ]+)/, '$1<span style="color: #e5c07b;">$2</span>');
    }

    // Now replace the temporary comment color token
    highlighted = highlighted.replace(/__COMMENT_COLOR__/g, '#5c6370');

    return highlighted || ' '; // Return space for empty lines to preserve height
  }).join('\n');
};

export const RobotCodeEditor: React.FC<RobotCodeEditorProps> = ({ value, onChange, readOnly = false }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [highlightedHtml, setHighlightedHtml] = useState('');

  useEffect(() => {
    setHighlightedHtml(highlightRobotCode(value));
  }, [value]);

  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      const highlightLayer = textareaRef.current.previousElementSibling as HTMLElement;
      if (highlightLayer) {
        highlightLayer.scrollTop = scrollTop;
        highlightLayer.scrollLeft = scrollLeft;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // Insert 4 spaces
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      onChange(newValue);

      // Restore cursor
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const sharedStyles: React.CSSProperties = {
    margin: 0,
    padding: '12px 16px',
    border: 'none',
    width: '100%',
    height: '100%',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSize: '12px',
    lineHeight: 1.7,
    tabSize: 4,
    whiteSpace: 'pre',
    overflowWrap: 'normal',
    wordWrap: 'normal',
    overflow: 'auto',
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Highlight Layer */}
      <Box
        aria-hidden="true"
        sx={{
          ...sharedStyles,
          position: 'absolute',
          top: 0,
          left: 0,
          color: '#e2e8f0', // default text color
          pointerEvents: 'none', // pass clicks through to textarea
          zIndex: 1,
          bgcolor: '#0d1117', // Editor background
          // Custom scrollbars for the highlight layer (since textarea is hidden)
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#30363d',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#484f58',
          },
        }}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
      {/* Interactive Textarea */}
      <Box
        component="textarea"
        ref={textareaRef}
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        spellCheck={false}
        sx={{
          ...sharedStyles,
          position: 'absolute',
          top: 0,
          left: 0,
          color: 'transparent', // hide native text
          background: 'transparent',
          caretColor: '#c9d1d9', // make cursor visible
          zIndex: 2,
          resize: 'none',
          outline: 'none',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#30363d',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#484f58',
          },
        }}
      />
    </Box>
  );
};
