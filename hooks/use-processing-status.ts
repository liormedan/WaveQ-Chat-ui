'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProcessingStatus } from '@/lib/services/processing-status-service';
import { processingStatusService } from '@/lib/services/processing-status-service';

export interface UseProcessingStatusOptions {
  id?: string;
  autoSubscribe?: boolean;
}

export interface UseProcessingStatusReturn {
  status: ProcessingStatus | undefined;
  isLoading: boolean;
  error: string | null;
  cancel: () => void;
  retry: () => void;
  subscribe: (id: string) => void;
  unsubscribe: () => void;
}

export function useProcessingStatus(
  options: UseProcessingStatusOptions = {},
): UseProcessingStatusReturn {
  const { id, autoSubscribe = true } = options;
  const [status, setStatus] = useState<ProcessingStatus | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | undefined>(id);

  // Subscribe to status updates
  const subscribe = useCallback((statusId: string) => {
    setCurrentId(statusId);
    setError(null);

    // Get initial status
    const initialStatus = processingStatusService.getStatus(statusId);
    setStatus(initialStatus);
    setIsLoading(
      initialStatus?.status === 'pending' ||
        initialStatus?.status === 'running',
    );

    // Subscribe to updates
    const unsubscribe = processingStatusService.subscribe(
      statusId,
      (updatedStatus) => {
        setStatus(updatedStatus);
        setIsLoading(
          updatedStatus.status === 'pending' ||
            updatedStatus.status === 'running',
        );

        if (updatedStatus.error) {
          setError(updatedStatus.error);
        } else {
          setError(null);
        }
      },
    );

    return unsubscribe;
  }, []);

  // Unsubscribe from current status
  const unsubscribe = useCallback(() => {
    setCurrentId(undefined);
    setStatus(undefined);
    setIsLoading(false);
    setError(null);
  }, []);

  // Cancel processing
  const cancel = useCallback(() => {
    if (currentId) {
      processingStatusService.cancelProcessing(currentId);
    }
  }, [currentId]);

  // Retry processing
  const retry = useCallback(() => {
    if (currentId) {
      processingStatusService.retryProcessing(currentId);
    }
  }, [currentId]);

  // Auto-subscribe when id changes
  useEffect(() => {
    if (autoSubscribe && id) {
      const cleanup = subscribe(id);
      return cleanup;
    }
  }, [id, autoSubscribe, subscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    status,
    isLoading,
    error,
    cancel,
    retry,
    subscribe,
    unsubscribe,
  };
}

export function useAllProcessingStatuses() {
  const [statuses, setStatuses] = useState<ProcessingStatus[]>([]);

  useEffect(() => {
    const unsubscribe = processingStatusService.subscribeToAll(
      (updatedStatuses) => {
        setStatuses(updatedStatuses);
      },
    );

    return unsubscribe;
  }, []);

  return statuses;
}

export function useActiveProcessingStatuses() {
  const allStatuses = useAllProcessingStatuses();

  return allStatuses.filter(
    (status) => status.status === 'pending' || status.status === 'running',
  );
}
