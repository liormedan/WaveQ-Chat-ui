'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DownloadIcon, ArchiveIcon, CheckIcon } from './icons';
import { BatchDownloadPanel } from './batch-download-panel';
import type { GeneratedAudioFile } from './generated-audio-display';
import type { DownloadInfo } from './download-utils';

interface BatchDownloadButtonProps {
  chatId: string;
  generatedAudios: GeneratedAudioFile[];
  onDownloadComplete?: (downloadInfo: DownloadInfo[]) => void;
  onDownloadError?: (error: string) => void;
  className?: string;
}

export function BatchDownloadButton({
  chatId,
  generatedAudios,
  onDownloadComplete,
  onDownloadError,
  className,
}: BatchDownloadButtonProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleOpenPanel = () => {
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  const handleDownloadComplete = (downloadInfo: DownloadInfo[]) => {
    onDownloadComplete?.(downloadInfo);
    // Optionally close the panel after successful download
    setTimeout(() => {
      setIsPanelOpen(false);
    }, 2000);
  };

  const handleDownloadError = (error: string) => {
    onDownloadError?.(error);
  };

  if (generatedAudios.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenPanel}
        className={className}
      >
        <ArchiveIcon size={16} className="mr-2" />
        Batch Download
        <Badge variant="secondary" className="ml-2">
          {generatedAudios.length}
        </Badge>
      </Button>

      <BatchDownloadPanel
        chatId={chatId}
        generatedAudios={generatedAudios}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onDownloadComplete={handleDownloadComplete}
        onDownloadError={handleDownloadError}
      />
    </>
  );
}
