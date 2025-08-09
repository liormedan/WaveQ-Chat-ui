'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  SettingsIcon,
  ExportIcon,
  DownloadIcon,
  ArchiveIcon,
  AudioIcon,
} from './icons';
import { ConversationExport } from './conversation-export';
import { ConversationExportArchive } from './conversation-export-archive';
import { BatchDownloadButton } from './batch-download-button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { cn } from '@/lib/utils';

interface AudioSettingsMenuProps {
  chatId: string;
  hasAudioFiles?: boolean;
  hasGeneratedAudio?: boolean;
  generatedAudios?: any[];
  className?: string;
}

export function AudioSettingsMenu({
  chatId,
  hasAudioFiles = false,
  hasGeneratedAudio = false,
  generatedAudios = [],
  className,
}: AudioSettingsMenuProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showBatchDownload, setShowBatchDownload] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 px-3 text-xs font-medium export-button',
              className,
            )}
          >
            <ExportIcon size={14} />
            <span className="ml-1 hidden sm:inline">Export</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => setShowExportDialog(true)}
            className="cursor-pointer"
          >
            <ExportIcon size={16} />
            Export Conversation
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setShowArchiveDialog(true)}
            className="cursor-pointer"
          >
            <ArchiveIcon size={16} />
            Create Archive
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {generatedAudios.length > 0 && (
            <DropdownMenuItem
              onClick={() => setShowBatchDownload(true)}
              className="cursor-pointer"
            >
              <DownloadIcon size={16} />
              Batch Download ({generatedAudios.length})
            </DropdownMenuItem>
          )}

          <DropdownMenuItem className="cursor-pointer">
            <AudioIcon size={16} />
            Audio Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export Dialog */}
      <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Export Conversation</AlertDialogTitle>
          </AlertDialogHeader>
          <ConversationExport
            chatId={chatId}
            hasAudioFiles={hasAudioFiles}
            className="border-0 shadow-none"
          />
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Create Archive</AlertDialogTitle>
          </AlertDialogHeader>
          <ConversationExportArchive
            chatId={chatId}
            hasAudioFiles={hasAudioFiles}
            hasGeneratedAudio={hasGeneratedAudio}
            className="border-0 shadow-none"
          />
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Download Panel */}
      {showBatchDownload && (
        <BatchDownloadButton
          chatId={chatId}
          generatedAudios={generatedAudios}
          onDownloadComplete={() => setShowBatchDownload(false)}
          onDownloadError={(error) => {
            console.error('Batch download error:', error);
            setShowBatchDownload(false);
          }}
        />
      )}
    </>
  );
}
