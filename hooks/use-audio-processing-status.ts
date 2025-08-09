'use client';

import { useState, useEffect } from 'react';

export interface AudioProcessingStatus {
  messageId: string;
  audioUrl: string;
  status:
    | 'idle'
    | 'uploading'
    | 'analyzing'
    | 'processing'
    | 'completed'
    | 'error';
  progress?: number;
  error?: string;
  result?: {
    analysis?: string;
    generatedAudioUrl?: string;
    processingDetails?: any;
  };
}

export const useAudioProcessingStatus = (messageId: string) => {
  const [statuses, setStatuses] = useState<AudioProcessingStatus[]>([]);

  // Mock implementation - in a real app this would connect to actual processing service
  useEffect(() => {
    // This would typically subscribe to processing status updates
    // For now, we'll just return empty statuses
  }, [messageId]);

  const updateStatus = (
    audioUrl: string,
    status: Partial<AudioProcessingStatus>,
  ) => {
    setStatuses((prev) => {
      const existing = prev.find((s) => s.audioUrl === audioUrl);
      if (existing) {
        return prev.map((s) =>
          s.audioUrl === audioUrl ? { ...s, ...status } : s,
        );
      } else {
        return [
          ...prev,
          {
            messageId,
            audioUrl,
            status: 'idle',
            ...status,
          } as AudioProcessingStatus,
        ];
      }
    });
  };

  const getStatusForAudio = (audioUrl: string) => {
    return statuses.find((s) => s.audioUrl === audioUrl);
  };

  const hasActiveProcessing = statuses.some((s) =>
    ['uploading', 'analyzing', 'processing'].includes(s.status),
  );

  return {
    statuses,
    updateStatus,
    getStatusForAudio,
    hasActiveProcessing,
  };
};
