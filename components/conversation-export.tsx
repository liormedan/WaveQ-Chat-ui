'use client';

import { useState } from 'react';
import { DownloadIcon, FileIcon, AudioIcon } from './icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ConversationExportProps {
  chatId: string;
  hasAudioFiles: boolean;
  className?: string;
}

type ExportFormat = 'json' | 'txt' | 'markdown';

interface ExportOptions {
  format: ExportFormat;
  includeAudio: boolean;
  includeAttachments: boolean;
}

export function ConversationExport({
  chatId,
  hasAudioFiles,
  className,
}: ConversationExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeAudio: true,
    includeAttachments: true,
  });

  const handleExport = async () => {
    setIsExporting(true);

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
      setIsExporting(false);
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
      {/* Export Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <DownloadIcon size={16} />
          Export Conversation
        </button>
      </div>

      {/* Export Options */}
      {showOptions && (
        <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
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
                    <div className="text-sm font-medium">{option.label}</div>
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
                  Audio files will be referenced with metadata, transcriptions,
                  and summaries
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
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? (
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
