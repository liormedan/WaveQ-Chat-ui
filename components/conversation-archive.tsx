'use client';

import { useState } from 'react';
import { ArchiveIcon, AudioIcon, FileIcon, DownloadIcon } from './icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ConversationArchiveProps {
  chatId: string;
  hasAudioFiles: boolean;
  hasGeneratedAudio: boolean;
  className?: string;
}

interface ArchiveOptions {
  includeAudio: boolean;
  includeGeneratedAudio: boolean;
  archiveName: string;
}

export function ConversationArchive({
  chatId,
  hasAudioFiles,
  hasGeneratedAudio,
  className,
}: ConversationArchiveProps) {
  const [isArchiving, setIsArchiving] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [archiveStats, setArchiveStats] = useState<any>(null);
  const [archiveOptions, setArchiveOptions] = useState<ArchiveOptions>({
    includeAudio: true,
    includeGeneratedAudio: true,
    archiveName: `archive-${chatId}-${new Date().toISOString().split('T')[0]}`,
  });

  const fetchArchiveStats = async () => {
    try {
      const response = await fetch(`/api/chat/${chatId}/archive`);
      if (response.ok) {
        const stats = await response.json();
        setArchiveStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch archive stats:', error);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);

    try {
      const params = new URLSearchParams({
        include_audio: archiveOptions.includeAudio.toString(),
        include_generated_audio:
          archiveOptions.includeGeneratedAudio.toString(),
        name: archiveOptions.archiveName,
      });

      const response = await fetch(`/api/chat/${chatId}/archive?${params}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Archive failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        response.headers
          .get('Content-Disposition')
          ?.split('filename=')[1]
          ?.replace(/"/g, '') || `${archiveOptions.archiveName}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Conversation archived successfully');
      setShowOptions(false);

      // Refresh stats
      await fetchArchiveStats();
    } catch (error) {
      console.error('Archive error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to archive conversation',
      );
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Archive Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setShowOptions(!showOptions);
            if (!showOptions) {
              fetchArchiveStats();
            }
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ArchiveIcon size={16} />
          Archive Conversation
        </button>
      </div>

      {/* Archive Options */}
      {showOptions && (
        <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
          {/* Archive Name */}
          <div>
            <h3 className="text-sm font-medium mb-2">Archive Name</h3>
            <input
              type="text"
              value={archiveOptions.archiveName}
              onChange={(e) =>
                setArchiveOptions((prev) => ({
                  ...prev,
                  archiveName: e.target.value,
                }))
              }
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              placeholder="Enter archive name"
            />
          </div>

          {/* Audio Options */}
          {hasAudioFiles && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <AudioIcon size={14} />
                Audio Files
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={archiveOptions.includeAudio}
                    onChange={(e) =>
                      setArchiveOptions((prev) => ({
                        ...prev,
                        includeAudio: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm">
                    Include original audio files and transcriptions
                  </span>
                </label>
                <p className="text-xs text-muted-foreground ml-6">
                  Audio files will be preserved with metadata, transcriptions,
                  and summaries
                </p>
              </div>
            </div>
          )}

          {/* Generated Audio Options */}
          {hasGeneratedAudio && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <FileIcon size={14} />
                Generated Audio Files
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={archiveOptions.includeGeneratedAudio}
                    onChange={(e) =>
                      setArchiveOptions((prev) => ({
                        ...prev,
                        includeGeneratedAudio: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm">
                    Include generated audio files and processing metadata
                  </span>
                </label>
                <p className="text-xs text-muted-foreground ml-6">
                  Generated audio files will be preserved with processing steps
                  and quality metrics
                </p>
              </div>
            </div>
          )}

          {/* Archive Statistics */}
          {archiveStats && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">Archive Statistics</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Messages:</span>
                  <span className="ml-2 font-medium">
                    {archiveStats.messageCount}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Audio Files:</span>
                  <span className="ml-2 font-medium">
                    {archiveStats.audioFileCount}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Generated Audio:
                  </span>
                  <span className="ml-2 font-medium">
                    {archiveStats.generatedAudioCount}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Size:</span>
                  <span className="ml-2 font-medium">
                    {Math.round(
                      (archiveStats.totalSize.messages +
                        archiveStats.totalSize.audioContexts +
                        archiveStats.totalSize.generatedAudios) /
                        1024,
                    )}
                    KB
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Archive Action */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleArchive}
              disabled={isArchiving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isArchiving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                  Archiving...
                </>
              ) : (
                <>
                  <DownloadIcon size={16} />
                  Create Archive
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowOptions(false)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
