import { generateUUID } from '@/lib/utils';
import type {
  ProcessingStep,
  ProcessingStepStatus,
} from '@/components/processing-progress';

export interface ProcessingStatus {
  id: string;
  type:
    | 'audio-processing'
    | 'ai-response'
    | 'file-upload'
    | 'transcription'
    | 'analysis';
  status: ProcessingStepStatus;
  steps: ProcessingStep[];
  overallProgress: number;
  estimatedTimeRemaining?: number;
  canCancel: boolean;
  canRetry: boolean;
  canPause: boolean;
  startTime: Date;
  endTime?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ProcessingStatusUpdate {
  id: string;
  status?: ProcessingStepStatus;
  overallProgress?: number;
  estimatedTimeRemaining?: number;
  steps?: ProcessingStep[];
  error?: string;
  endTime?: Date;
}

class ProcessingStatusService {
  private processingStatuses = new Map<string, ProcessingStatus>();
  private listeners = new Map<
    string,
    Set<(status: ProcessingStatus) => void>
  >();

  /**
   * Create a new processing status
   */
  createStatus({
    type,
    steps,
    canCancel = false,
    canRetry = false,
    canPause = false,
    metadata = {},
  }: {
    type: ProcessingStatus['type'];
    steps: ProcessingStep[];
    canCancel?: boolean;
    canRetry?: boolean;
    canPause?: boolean;
    metadata?: Record<string, any>;
  }): string {
    const id = generateUUID();
    const status: ProcessingStatus = {
      id,
      type,
      status: 'pending',
      steps,
      overallProgress: 0,
      canCancel,
      canRetry,
      canPause,
      startTime: new Date(),
      metadata,
    };

    this.processingStatuses.set(id, status);
    this.notifyListeners(id, status);
    return id;
  }

  /**
   * Update processing status
   */
  updateStatus(id: string, update: ProcessingStatusUpdate): void {
    const status = this.processingStatuses.get(id);
    if (!status) {
      console.warn(`Processing status with id ${id} not found`);
      return;
    }

    // Update status fields
    if (update.status !== undefined) status.status = update.status;
    if (update.overallProgress !== undefined)
      status.overallProgress = update.overallProgress;
    if (update.estimatedTimeRemaining !== undefined)
      status.estimatedTimeRemaining = update.estimatedTimeRemaining;
    if (update.steps !== undefined) status.steps = update.steps;
    if (update.error !== undefined) status.error = update.error;
    if (update.endTime !== undefined) status.endTime = update.endTime;

    // Update step timings
    if (
      update.status === 'completed' ||
      update.status === 'error' ||
      update.status === 'cancelled'
    ) {
      status.endTime = new Date();
    }

    this.processingStatuses.set(id, status);
    this.notifyListeners(id, status);
  }

  /**
   * Update a specific step
   */
  updateStep(
    id: string,
    stepId: string,
    stepUpdate: Partial<ProcessingStep>,
  ): void {
    const status = this.processingStatuses.get(id);
    if (!status) {
      console.warn(`Processing status with id ${id} not found`);
      return;
    }

    const stepIndex = status.steps.findIndex((step) => step.id === stepId);
    if (stepIndex === -1) {
      console.warn(
        `Step with id ${stepId} not found in processing status ${id}`,
      );
      return;
    }

    // Update step
    status.steps[stepIndex] = { ...status.steps[stepIndex], ...stepUpdate };

    // Update step timing
    if (stepUpdate.status === 'running' && !status.steps[stepIndex].startTime) {
      status.steps[stepIndex].startTime = new Date();
    } else if (
      (stepUpdate.status === 'completed' || stepUpdate.status === 'error') &&
      !status.steps[stepIndex].endTime
    ) {
      status.steps[stepIndex].endTime = new Date();
      if (status.steps[stepIndex].startTime) {
        status.steps[stepIndex].actualDuration = Math.floor(
          (status.steps[stepIndex].endTime.getTime() -
            status.steps[stepIndex].startTime.getTime()) /
            1000,
        );
      }
    }

    // Recalculate overall progress
    const completedSteps = status.steps.filter(
      (step) => step.status === 'completed',
    ).length;
    const totalSteps = status.steps.length;
    status.overallProgress =
      totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    // Update overall status based on steps
    if (status.steps.some((step) => step.status === 'error')) {
      status.status = 'error';
    } else if (status.steps.every((step) => step.status === 'completed')) {
      status.status = 'completed';
    } else if (status.steps.some((step) => step.status === 'running')) {
      status.status = 'running';
    }

    this.processingStatuses.set(id, status);
    this.notifyListeners(id, status);
  }

  /**
   * Get processing status by ID
   */
  getStatus(id: string): ProcessingStatus | undefined {
    return this.processingStatuses.get(id);
  }

  /**
   * Get all processing statuses
   */
  getAllStatuses(): ProcessingStatus[] {
    return Array.from(this.processingStatuses.values());
  }

  /**
   * Get active processing statuses
   */
  getActiveStatuses(): ProcessingStatus[] {
    return Array.from(this.processingStatuses.values()).filter(
      (status) => status.status === 'pending' || status.status === 'running',
    );
  }

  /**
   * Cancel processing
   */
  cancelProcessing(id: string): void {
    const status = this.processingStatuses.get(id);
    if (!status) {
      console.warn(`Processing status with id ${id} not found`);
      return;
    }

    if (!status.canCancel) {
      console.warn(`Processing status ${id} cannot be cancelled`);
      return;
    }

    status.status = 'cancelled';
    status.endTime = new Date();

    // Cancel all running steps
    status.steps.forEach((step) => {
      if (step.status === 'running') {
        step.status = 'cancelled';
        step.endTime = new Date();
        if (step.startTime) {
          step.actualDuration = Math.floor(
            (step.endTime.getTime() - step.startTime.getTime()) / 1000,
          );
        }
      }
    });

    this.processingStatuses.set(id, status);
    this.notifyListeners(id, status);
  }

  /**
   * Retry processing
   */
  retryProcessing(id: string): void {
    const status = this.processingStatuses.get(id);
    if (!status) {
      console.warn(`Processing status with id ${id} not found`);
      return;
    }

    if (!status.canRetry) {
      console.warn(`Processing status ${id} cannot be retried`);
      return;
    }

    // Reset status
    status.status = 'pending';
    status.overallProgress = 0;
    status.error = undefined;
    status.endTime = undefined;

    // Reset steps
    status.steps.forEach((step) => {
      step.status = 'pending';
      step.progress = undefined;
      step.startTime = undefined;
      step.endTime = undefined;
      step.actualDuration = undefined;
      step.error = undefined;
    });

    this.processingStatuses.set(id, status);
    this.notifyListeners(id, status);
  }

  /**
   * Subscribe to status updates
   */
  subscribe(
    id: string,
    listener: (status: ProcessingStatus) => void,
  ): () => void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    const listeners = this.listeners.get(id);
    if (listeners) {
      listeners.add(listener);
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(id);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(id);
        }
      }
    };
  }

  /**
   * Subscribe to all status updates
   */
  subscribeToAll(listener: (statuses: ProcessingStatus[]) => void) {
    const allListener = () => {
      listener(Array.from(this.processingStatuses.values()));
    };

    // Call immediately with current statuses
    allListener();

    // Store listener for cleanup
    const unsubscribe = this.subscribe('__all__', () => allListener());
    return unsubscribe;
  }

  /**
   * Clean up completed statuses older than specified time
   */
  cleanup(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const idsToRemove: string[] = [];

    this.processingStatuses.forEach((status, id) => {
      if (status.endTime && status.endTime < cutoffTime) {
        idsToRemove.push(id);
      }
    });

    idsToRemove.forEach((id) => {
      this.processingStatuses.delete(id);
      this.listeners.delete(id);
    });
  }

  private notifyListeners(id: string, status: ProcessingStatus): void {
    // Notify specific listeners
    const listeners = this.listeners.get(id);
    if (listeners) {
      listeners.forEach((listener) => listener(status));
    }

    // Notify all listeners
    const allListeners = this.listeners.get('__all__');
    if (allListeners) {
      allListeners.forEach((listener) => listener(status));
    }
  }
}

// Export singleton instance
export const processingStatusService = new ProcessingStatusService();

// Helper functions for common processing scenarios
export const createAudioProcessingStatus = (audioFileName: string) => {
  const steps: ProcessingStep[] = [
    {
      id: generateUUID(),
      name: 'Upload audio file',
      status: 'pending',
      estimatedDuration: 5,
    },
    {
      id: generateUUID(),
      name: 'Validate audio format',
      status: 'pending',
      estimatedDuration: 2,
    },
    {
      id: generateUUID(),
      name: 'Transcribe audio content',
      status: 'pending',
      estimatedDuration: 30,
    },
    {
      id: generateUUID(),
      name: 'Analyze audio features',
      status: 'pending',
      estimatedDuration: 15,
    },
    {
      id: generateUUID(),
      name: 'Generate context summary',
      status: 'pending',
      estimatedDuration: 10,
    },
  ];

  return processingStatusService.createStatus({
    type: 'audio-processing',
    steps,
    canCancel: true,
    canRetry: true,
    canPause: false,
    metadata: { audioFileName },
  });
};

export const createAIResponseStatus = (messageType: string) => {
  const steps: ProcessingStep[] = [
    {
      id: generateUUID(),
      name: 'Analyze user message',
      status: 'pending',
      estimatedDuration: 3,
    },
    {
      id: generateUUID(),
      name: 'Process audio context',
      status: 'pending',
      estimatedDuration: 5,
    },
    {
      id: generateUUID(),
      name: 'Generate AI response',
      status: 'pending',
      estimatedDuration: 20,
    },
    {
      id: generateUUID(),
      name: 'Stream response',
      status: 'pending',
      estimatedDuration: 10,
    },
  ];

  return processingStatusService.createStatus({
    type: 'ai-response',
    steps,
    canCancel: true,
    canRetry: true,
    canPause: true,
    metadata: { messageType },
  });
};
