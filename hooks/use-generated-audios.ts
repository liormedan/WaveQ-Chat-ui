'use client';

import { useState, useEffect } from 'react';
import type { GeneratedAudioFile } from '@/components/generated-audio-display';

interface UseGeneratedAudiosProps {
  chatId: string;
}

interface UseGeneratedAudiosReturn {
  generatedAudios: GeneratedAudioFile[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGeneratedAudios({
  chatId,
}: UseGeneratedAudiosProps): UseGeneratedAudiosReturn {
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudioFile[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGeneratedAudios = async () => {
    if (!chatId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat/${chatId}/generated-audios`);

      if (!response.ok) {
        throw new Error('Failed to fetch generated audios');
      }

      const data = await response.json();

      if (data.success) {
        // Transform the data to match the GeneratedAudioFile interface
        const transformedAudios: GeneratedAudioFile[] =
          data.generatedAudios.map((audio: any) => ({
            id: audio.id,
            originalAudioId: audio.originalAudioId,
            originalAudioName: audio.originalAudioName,
            originalAudioUrl: audio.originalAudioUrl,
            generatedAudioName: audio.generatedAudioName,
            generatedAudioUrl: audio.generatedAudioUrl,
            processingDetails: {
              processingType: audio.processingDetails.processingType,
              processingSteps: audio.processingDetails.processingSteps,
              totalProcessingTime: audio.processingDetails.totalProcessingTime,
              qualityMetrics: audio.processingDetails.qualityMetrics,
            },
            metadata: audio.metadata,
            createdAt: new Date(audio.createdAt),
          }));

        setGeneratedAudios(transformedAudios);
      } else {
        throw new Error(data.error || 'Failed to fetch generated audios');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGeneratedAudios();
  }, [chatId]);

  const refetch = () => {
    fetchGeneratedAudios();
  };

  return {
    generatedAudios,
    isLoading,
    error,
    refetch,
  };
}
