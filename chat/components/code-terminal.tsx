'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { CopyIcon, PlayIcon, StopIcon, TerminalIcon } from './icons';
import { cn } from '@/lib/utils';
import { toast } from './toast';

export interface CodeTerminalOutput {
  id: string;
  code: string;
  language: string;
  description: string;
  timestamp: Date;
}

interface CodeTerminalProps {
  outputs: CodeTerminalOutput[];
  onClear: () => void;
  onRunCode?: (code: string, language: string) => void;
}

export function CodeTerminal({ outputs, onClear, onRunCode }: CodeTerminalProps) {
  const [height, setHeight] = useState<number>(300);
  const [isResizing, setIsResizing] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const minHeight = 150;
  const maxHeight = 600;

  const startResizing = () => {
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setHeight(newHeight);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputs]);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        type: 'success',
        description: 'Code copied to clipboard!',
      });
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to copy code',
      });
    }
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      python: 'text-blue-500',
      javascript: 'text-yellow-500',
      typescript: 'text-blue-600',
      bash: 'text-green-500',
      shell: 'text-green-500',
      ffmpeg: 'text-purple-500',
      sox: 'text-orange-500',
      default: 'text-gray-500',
    };
    return colors[language.toLowerCase()] || colors.default;
  };

  if (outputs.length === 0) return null;

  return (
    <>
      <div
        className="h-2 w-full fixed cursor-ns-resize z-50"
        onMouseDown={startResizing}
        style={{ bottom: height - 4 }}
        role="slider"
        aria-valuenow={height}
      />

      <div
        className={cn(
          'fixed flex flex-col bottom-0 dark:bg-zinc-900 bg-zinc-50 w-full border-t z-40 overflow-y-scroll overflow-x-hidden dark:border-zinc-700 border-zinc-200',
          {
            'select-none': isResizing,
          },
        )}
        style={{ height }}
      >
        <div className="flex items-center justify-between p-3 bg-muted border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <div className="text-sm pl-2 dark:text-zinc-50 text-zinc-800 flex flex-row gap-3 items-center">
              <div className="text-muted-foreground">
                <TerminalIcon />
              </div>
              <div>Code Terminal</div>
              <span className="text-xs text-muted-foreground">
                {outputs.length} code snippet{outputs.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="size-fit p-1 hover:dark:bg-zinc-700 hover:bg-zinc-200"
              size="icon"
              onClick={onClear}
            >
              <StopIcon />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {outputs.map((output, index) => (
            <div
              key={output.id}
              className="px-4 py-3 flex flex-col gap-3 border-b dark:border-zinc-700 border-zinc-200 dark:bg-zinc-900 bg-zinc-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={cn('text-sm font-medium', getLanguageColor(output.language))}>
                    {output.language.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {output.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  {onRunCode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => onRunCode(output.code, output.language)}
                    >
                      <PlayIcon size={12} />
                      Run
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => copyToClipboard(output.code)}
                  >
                    <CopyIcon size={12} />
                    Copy
                  </Button>
                </div>
              </div>

              {output.description && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  {output.description}
                </div>
              )}

              <div className="bg-black text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap break-words">
                  {output.code}
                </pre>
              </div>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </>
  );
} 