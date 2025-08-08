'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AudioIcon, FileIcon, ClockRewind } from './icons';
import { cn } from '@/lib/utils';

interface AudioContextDisplayProps {
  audioContexts: Array<{
    id: string;
    audioFileName: string;
    audioFileUrl: string;
    audioDuration?: number;
    audioTranscription?: string;
    contextSummary?: string;
    audioMetadata?: any;
  }>;
  className?: string;
}

export const AudioContextDisplay = ({
  audioContexts,
  className,
}: AudioContextDisplayProps) => {
  const [expandedContext, setExpandedContext] = useState<string | null>(null);

  if (audioContexts.length === 0) {
    return null;
  }

  return (
    <div
      className={cn('space-y-3', className)}
      data-testid="audio-context-display"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <AudioIcon size={16} />
        <span>
          Audio Context ({audioContexts.length} file
          {audioContexts.length !== 1 ? 's' : ''})
        </span>
      </div>

      {audioContexts.map((context) => (
        <Card
          key={context.id}
          className="border-dashed"
          data-testid="audio-context-card"
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AudioIcon size={16} />
              {context.audioFileName}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {/* Duration */}
              {context.audioDuration && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ClockRewind size={12} />
                  <span>
                    {Math.floor(context.audioDuration / 60)}:
                    {(context.audioDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}

              {/* Topics */}
              {context.audioMetadata?.topics && (
                <div
                  className="flex items-center gap-2 text-xs"
                  data-testid="audio-topics"
                >
                  <span className="text-muted-foreground">📌</span>
                  <div className="flex flex-wrap gap-1">
                    {context.audioMetadata.topics
                      .slice(0, 3)
                      .map((topic: string) => (
                        <span
                          key={`${context.id}-${topic}`}
                          className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs"
                        >
                          {topic}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {context.contextSummary && (
                <div className="text-xs text-muted-foreground">
                  <p className="line-clamp-2">{context.contextSummary}</p>
                </div>
              )}

              {/* Expandable Transcription */}
              {context.audioTranscription && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setExpandedContext(
                        expandedContext === context.id ? null : context.id,
                      )
                    }
                    data-testid="expand-transcription"
                  >
                    {expandedContext === context.id ? 'Hide' : 'Show'}{' '}
                    transcription
                  </Button>

                  {expandedContext === context.id && (
                    <div
                      className="mt-2 p-2 bg-muted/50 rounded text-xs"
                      data-testid="audio-transcription"
                    >
                      <p className="whitespace-pre-wrap">
                        {context.audioTranscription}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Sentiment */}
              {context.audioMetadata?.sentiment && (
                <div
                  className="flex items-center gap-2 text-xs"
                  data-testid="audio-sentiment"
                >
                  <span className="text-muted-foreground">Sentiment:</span>
                  <span
                    className={cn('px-1.5 py-0.5 rounded', {
                      'bg-green-100 text-green-800':
                        context.audioMetadata.sentiment === 'positive',
                      'bg-red-100 text-red-800':
                        context.audioMetadata.sentiment === 'negative',
                      'bg-gray-100 text-gray-800':
                        context.audioMetadata.sentiment === 'neutral',
                    })}
                  >
                    {context.audioMetadata.sentiment}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
