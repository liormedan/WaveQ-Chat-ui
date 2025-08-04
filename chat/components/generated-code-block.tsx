'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { CopyIcon, PlayIcon, DownloadIcon } from './icons';
import { toast } from './toast';
import { cn } from '@/lib/utils';

interface GeneratedCodeBlockProps {
  code: string;
  language: string;
  description?: string;
  dependencies?: string[];
  requirements?: string;
  usage?: string;
  onRun?: (code: string, language: string) => void;
}

export function GeneratedCodeBlock({
  code,
  language,
  description,
  dependencies,
  requirements,
  usage,
  onRun,
}: GeneratedCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        type: 'success',
        description: 'Code copied to clipboard!',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        type: 'error',
        description: 'Failed to copy code',
      });
    }
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio_processor.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (lang: string) => {
    const extensions: Record<string, string> = {
      python: 'py',
      javascript: 'js',
      typescript: 'ts',
      bash: 'sh',
      shell: 'sh',
      ffmpeg: 'sh',
      sox: 'sh',
    };
    return extensions[lang.toLowerCase()] || 'txt';
  };

  const getLanguageColor = (lang: string) => {
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
    return colors[lang.toLowerCase()] || colors.default;
  };

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-muted border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-medium', getLanguageColor(language))}>
            {language.toUpperCase()}
          </span>
          {description && (
            <span className="text-xs text-muted-foreground">
              {description}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {onRun && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onRun(code, language)}
            >
              <PlayIcon size={12} />
              Run
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={downloadCode}
          >
            <DownloadIcon size={12} />
            Download
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={copyToClipboard}
          >
            <CopyIcon size={12} />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Dependencies */}
      {dependencies && dependencies.length > 0 && (
        <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-zinc-200 dark:border-zinc-700">
          <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
            Dependencies:
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            {dependencies.join(', ')}
          </div>
          {requirements && (
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Install: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{requirements}</code>
            </div>
          )}
        </div>
      )}

      {/* Usage */}
      {usage && (
        <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border-b border-zinc-200 dark:border-zinc-700">
          <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
            Usage:
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            <code className="bg-green-100 dark:bg-green-800 px-1 rounded">{usage}</code>
          </div>
        </div>
      )}

      {/* Code */}
      <div className="bg-black text-green-400 p-4 font-mono text-sm overflow-x-auto">
        <pre className="whitespace-pre-wrap break-words">
          {code}
        </pre>
      </div>
    </div>
  );
} 