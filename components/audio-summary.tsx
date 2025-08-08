'use client';

import { useState } from 'react';
import { AudioIcon, ChevronDownIcon, ChevronRightIcon } from './icons';
import { cn } from '@/lib/utils';

interface AudioSummaryProps {
  audioContexts: Array<{
    audioFileName: string;
    audioFileUrl: string;
    audioFileType: string;
    audioDuration: number | null;
    contextSummary: string | null;
    audioTranscription: string | null;
  }>;
  className?: string;
}

export function AudioSummary({ audioContexts, className }: AudioSummaryProps) {
  const [expandedContexts, setExpandedContexts] = useState<Set<number>>(
    new Set(),
  );

  const toggleContext = (index: number) => {
    const newExpanded = new Set(expandedContexts);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedContexts(newExpanded);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (audioContexts.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <AudioIcon size={16} />
        <span>Audio Files ({audioContexts.length})</span>
      </div>

      <div className="flex flex-col gap-2">
        {audioContexts.map((context, index) => (
          <div
            key={`${context.audioFileUrl}-${index}`}
            className="border rounded-lg p-3 bg-muted/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleContext(index)}
                  className="flex items-center justify-center w-5 h-5 rounded hover:bg-muted transition-colors"
                >
                  {expandedContexts.has(index) ? (
                    <ChevronDownIcon size={12} />
                  ) : (
                    <ChevronRightIcon size={12} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {context.audioFileName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {context.audioFileType}
                    {context.audioDuration &&
                      ` • ${formatDuration(context.audioDuration)}`}
                  </div>
                </div>
              </div>
            </div>

            {expandedContexts.has(index) && (
              <div className="mt-3 space-y-2">
                {context.contextSummary && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Summary
                    </div>
                    <div className="text-sm text-foreground">
                      {context.contextSummary}
                    </div>
                  </div>
                )}

                {context.audioTranscription && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Transcription
                    </div>
                    <div className="text-sm text-foreground max-h-32 overflow-y-auto">
                      {context.audioTranscription}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
