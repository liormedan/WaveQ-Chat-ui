'use client';

import { useState } from 'react';
import {
  DownloadIcon,
  ArchiveIcon,
  AudioIcon,
  FileIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from './icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ConversationExportArchiveProps {
  chatId: string;
  hasAudioFiles: boolean;
  hasGeneratedAudio: boolean;
  className?: string;
}

type ExportFormat = 'json' | 'txt' | 'markdown';

interface ExportOptions {
  format: ExportFormat;
  includeAudio: boolean;
  includeAttachments: boolean;
}

interface ArchiveOptions {
  includeAudio: boolean;
  includeGeneratedAudio: boolean;
  archiveName: string;
}

export function ConversationExportArchive({
  chatId,
  hasAudioFiles,
  hasGeneratedAudio,
  className,
}: ConversationExportArchiveProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'archive'>('export');
  const [showOptions, setShowOptions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [archiveStats, setArchiveStats] = useState<any>(null);

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeAudio: true,
    includeAttachments: true,
  });

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

  const handleExport = async () => {
    setIsProcessing(true);

    try {
      const params = new URLSearchParams({
        format: exportOptions.format,
        include_audio: exportOptions.includeAudio.toString(),
        include_attachments: exportOptions.includeAttachments.toString(),
      });

      const response = await fetch(`/api/chat/${chatId}/export?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
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
          ?.replace(/"/g, '') || `chat-${chatId}.${exportOptions.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Conversation exported successfully');
      setShowOptions(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to export conversation',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async () => {
    setIsProcessing(true);

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
      setIsProcessing(false);
    }
  };

  const formatOptions: {
    value: ExportFormat;
    label: string;
    description: string;
  }[] = [
    {
      value: 'json',
      label: 'JSON',
      description: 'Structured data with all metadata',
    },
    {
      value: 'txt',
      label: 'Text',
      description: 'Plain text format for easy reading',
    },
    {
      value: 'markdown',
      label: 'Markdown',
      description: 'Formatted text with headers and styling',
    },
  ];

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Main Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setShowOptions(!showOptions);
            if (!showOptions && activeTab === 'archive') {
              fetchArchiveStats();
            }
          }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {showOptions ? (
            <ChevronDownIcon size={16} />
          ) : (
            <ChevronRightIcon size={16} />
          )}
          Export & Archive
        </button>
      </div>

      {/* Options Panel */}
      {showOptions && (
        <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
          {/* Tab Navigation */}
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'export'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <DownloadIcon size={14} />
              Export
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('archive');
                fetchArchiveStats();
              }}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'archive'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <ArchiveIcon size={14} />
              Archive
            </button>
          </div>

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Export Format</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {formatOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent transition-colors"
                    >
                      <input
                        type="radio"
                        name="format"
                        value={option.value}
                        checked={exportOptions.format === option.value}
                        onChange={(e) =>
                          setExportOptions((prev) => ({
                            ...prev,
                            format: e.target.value as ExportFormat,
                          }))
                        }
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {option.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
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
                        checked={exportOptions.includeAudio}
                        onChange={(e) =>
                          setExportOptions((prev) => ({
                            ...prev,
                            includeAudio: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <span className="text-sm">
                        Include audio file information and transcriptions
                      </span>
                    </label>
                    <p className="text-xs text-muted-foreground ml-6">
                      Audio files will be referenced with metadata,
                      transcriptions, and summaries
                    </p>
                  </div>
                </div>
              )}

              {/* Attachment Options */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileIcon size={14} />
                  Attachments
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeAttachments}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          includeAttachments: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm">
                      Include file attachments and media references
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground ml-6">
                    File attachments will be referenced with metadata and URLs
                  </p>
                </div>
              </div>

              {/* Export Action */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <DownloadIcon size={16} />
                      Export Now
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Archive Tab */}
          {activeTab === 'archive' && (
            <div className="space-y-4">
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
                      Audio files will be preserved with metadata,
                      transcriptions, and summaries
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
                      Generated audio files will be preserved with processing
                      steps and quality metrics
                    </p>
                  </div>
                </div>
              )}

              {/* Archive Statistics */}
              {archiveStats && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">
                    Archive Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Messages:</span>
                      <span className="ml-2 font-medium">
                        {archiveStats.messageCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Audio Files:
                      </span>
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
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
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
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowOptions(false)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
