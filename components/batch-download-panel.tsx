'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import {
  DownloadIcon,
  CheckIcon,
  XIcon,
  FileIcon,
  ArchiveIcon,
  InfoIcon,
} from './icons';
import { cn } from '@/lib/utils';
import { DownloadUtils, type DownloadInfo } from './download-utils';
import type { GeneratedAudioFile } from './generated-audio-display';

interface BatchDownloadPanelProps {
  chatId: string;
  generatedAudios: GeneratedAudioFile[];
  isOpen: boolean;
  onClose: () => void;
  onDownloadComplete?: (downloadInfo: DownloadInfo[]) => void;
  onDownloadError?: (error: string) => void;
}

export function BatchDownloadPanel({
  chatId,
  generatedAudios,
  isOpen,
  onClose,
  onDownloadComplete,
  onDownloadError,
}: BatchDownloadPanelProps) {
  const [selectedAudios, setSelectedAudios] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Update select all state when individual selections change
  useEffect(() => {
    if (selectedAudios.size === 0) {
      setSelectAll(false);
    } else if (selectedAudios.size === generatedAudios.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedAudios, generatedAudios.length]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAudios(new Set(generatedAudios.map((audio) => audio.id)));
    } else {
      setSelectedAudios(new Set());
    }
    setSelectAll(checked);
  };

  const handleSelectAudio = (audioId: string, checked: boolean) => {
    const newSelected = new Set(selectedAudios);
    if (checked) {
      newSelected.add(audioId);
    } else {
      newSelected.delete(audioId);
    }
    setSelectedAudios(newSelected);
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProcessingTypeLabel = (type: string) => {
    const labels = {
      enhancement: 'Audio Enhancement',
      transcription: 'Speech Transcription',
      translation: 'Audio Translation',
      'noise-reduction': 'Noise Reduction',
      'format-conversion': 'Format Conversion',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTotalFileSize = () => {
    return selectedAudios.size > 0
      ? generatedAudios
          .filter((audio) => selectedAudios.has(audio.id))
          .reduce((total, audio) => total + audio.metadata.fileSize, 0)
      : 0;
  };

  const getTotalDuration = () => {
    return selectedAudios.size > 0
      ? generatedAudios
          .filter((audio) => selectedAudios.has(audio.id))
          .reduce((total, audio) => total + audio.metadata.duration, 0)
      : 0;
  };

  const selectedAudioIds = Array.from(selectedAudios);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArchiveIcon size={20} />
                  <CardTitle className="text-lg">Batch Download</CardTitle>
                  <Badge variant="secondary">
                    {selectedAudios.size} selected
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <XIcon size={16} />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* File Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select All ({generatedAudios.length} files)
                  </label>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {generatedAudios.map((audio) => (
                    <div
                      key={audio.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border',
                        selectedAudios.has(audio.id)
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-background border-border',
                      )}
                    >
                      <Checkbox
                        id={`audio-${audio.id}`}
                        checked={selectedAudios.has(audio.id)}
                        onCheckedChange={(checked) =>
                          handleSelectAudio(audio.id, checked as boolean)
                        }
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileIcon size={14} />
                          <span className="text-sm font-medium truncate">
                            {audio.generatedAudioName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getProcessingTypeLabel(
                              audio.processingDetails.processingType,
                            )}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{formatDuration(audio.metadata.duration)}</span>
                          <span>•</span>
                          <span>{formatFileSize(audio.metadata.fileSize)}</span>
                          <span>•</span>
                          <span>{audio.metadata.format.toUpperCase()}</span>
                          <span>•</span>
                          <span>{audio.metadata.bitrate} kbps</span>
                        </div>
                      </div>

                      {selectedAudios.has(audio.id) ? (
                        <CheckIcon size={16} />
                      ) : (
                        <div className="w-4 h-4 border-2 border-muted-foreground rounded" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {selectedAudios.size > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <InfoIcon size={14} />
                    <span>Download Summary</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Files:</span>
                      <span className="ml-1 font-medium">
                        {selectedAudios.size}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Size:</span>
                      <span className="ml-1 font-medium">
                        {formatFileSize(getTotalFileSize())}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Total Duration:
                      </span>
                      <span className="ml-1 font-medium">
                        {formatDuration(getTotalDuration())}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Processing Types:
                      </span>
                      <span className="ml-1 font-medium">
                        {
                          Array.from(
                            new Set(
                              generatedAudios
                                .filter((audio) => selectedAudios.has(audio.id))
                                .map(
                                  (audio) =>
                                    audio.processingDetails.processingType,
                                ),
                            ),
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Download Options */}
              {selectedAudios.size > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Download Options</h4>
                  <DownloadUtils
                    chatId={chatId}
                    audioIds={selectedAudioIds}
                    onDownloadComplete={onDownloadComplete}
                    onDownloadError={onDownloadError}
                  />
                </div>
              )}

              {/* No Selection Message */}
              {selectedAudios.size === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileIcon size={32} />
                  <p className="text-sm">Select files to download</p>
                </div>
              )}
            </CardContent>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
