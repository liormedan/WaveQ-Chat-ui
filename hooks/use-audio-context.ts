'use client';

import { useState, useEffect } from 'react';

interface AudioContext {
  id: string;
  audioFileName: string;
  audioFileUrl: string;
  audioDuration?: number;
  audioTranscription?: string;
  contextSummary?: string;
  audioMetadata?: any;
}

export function useAudioContext(chatId: string) {
  const [audioContexts, setAudioContexts] = useState<AudioContext[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) return;

    const fetchAudioContexts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/chat/${chatId}/audio-contexts`);
        if (!response.ok) {
          throw new Error('Failed to fetch audio contexts');
        }

        const data = await response.json();
        setAudioContexts(data.audioContexts || []);
      } catch (err) {
        console.error('Error fetching audio contexts:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch audio contexts',
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAudioContexts();
  }, [chatId]);

  return {
    audioContexts,
    isLoading,
    error,
    refetch: () => {
      // Trigger a refetch by updating the dependency
      setAudioContexts([]);
    },
  };
}
