import { test, expect } from '@playwright/test';

test.describe('Processing Status Indicators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat/new');
  });

  test('should display processing status panel when audio processing starts', async ({
    page,
  }) => {
    // Mock audio file upload
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="file-upload-button"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/sample-audio.mp3');

    // Wait for processing status panel to appear
    await expect(
      page.locator('[data-testid="processing-progress"]'),
    ).toBeVisible();
    await expect(page.locator('text=Processing Tasks')).toBeVisible();
    await expect(page.locator('text=Audio Processing')).toBeVisible();
  });

  test('should show progress steps for audio processing', async ({ page }) => {
    // Mock audio processing status
    await page.addInitScript(() => {
      window.mockProcessingStatus = {
        id: 'test-status',
        type: 'audio-processing',
        status: 'running',
        steps: [
          {
            id: 'step-1',
            name: 'Upload audio file',
            status: 'completed',
            progress: 100,
          },
          {
            id: 'step-2',
            name: 'Validate audio format',
            status: 'completed',
            progress: 100,
          },
          {
            id: 'step-3',
            name: 'Transcribe audio content',
            status: 'running',
            progress: 65,
          },
          { id: 'step-4', name: 'Analyze audio features', status: 'pending' },
          { id: 'step-5', name: 'Generate context summary', status: 'pending' },
        ],
        overallProgress: 45,
        canCancel: true,
        canRetry: false,
        canPause: false,
        startTime: new Date(),
        metadata: { audioFileName: 'test-audio.mp3' },
      };
    });

    // Trigger audio processing
    await page.evaluate(() => {
      // Simulate audio processing start
      window.dispatchEvent(
        new CustomEvent('audio-processing-start', {
          detail: window.mockProcessingStatus,
        }),
      );
    });

    // Check that processing steps are displayed
    await expect(page.locator('text=Upload audio file')).toBeVisible();
    await expect(page.locator('text=Validate audio format')).toBeVisible();
    await expect(page.locator('text=Transcribe audio content')).toBeVisible();
    await expect(page.locator('text=Analyze audio features')).toBeVisible();
    await expect(page.locator('text=Generate context summary')).toBeVisible();

    // Check progress indicators
    await expect(page.locator('text=45% (2/5 steps)')).toBeVisible();
    await expect(page.locator('text=65%')).toBeVisible(); // Step progress
  });

  test('should display estimated completion time', async ({ page }) => {
    // Mock processing status with estimated time
    await page.addInitScript(() => {
      window.mockProcessingStatus = {
        id: 'test-status',
        type: 'audio-processing',
        status: 'running',
        steps: [
          { id: 'step-1', name: 'Upload audio file', status: 'completed' },
          { id: 'step-2', name: 'Transcribe audio content', status: 'running' },
        ],
        overallProgress: 50,
        estimatedTimeRemaining: 120, // 2 minutes
        canCancel: true,
        canRetry: false,
        canPause: false,
        startTime: new Date(),
      };
    });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('audio-processing-start', {
          detail: window.mockProcessingStatus,
        }),
      );
    });

    // Check estimated time display
    await expect(page.locator('text=Remaining: ~2m 0s')).toBeVisible();
  });

  test('should allow cancellation of processing', async ({ page }) => {
    // Mock processing status
    await page.addInitScript(() => {
      window.mockProcessingStatus = {
        id: 'test-status',
        type: 'audio-processing',
        status: 'running',
        steps: [
          { id: 'step-1', name: 'Upload audio file', status: 'completed' },
          { id: 'step-2', name: 'Transcribe audio content', status: 'running' },
        ],
        overallProgress: 50,
        canCancel: true,
        canRetry: false,
        canPause: false,
        startTime: new Date(),
      };
    });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('audio-processing-start', {
          detail: window.mockProcessingStatus,
        }),
      );
    });

    // Click cancel button
    await page.click('text=Cancel');

    // Check that processing is cancelled
    await expect(page.locator('text=Cancelled')).toBeVisible();
  });

  test('should allow retry of failed processing', async ({ page }) => {
    // Mock failed processing status
    await page.addInitScript(() => {
      window.mockProcessingStatus = {
        id: 'test-status',
        type: 'audio-processing',
        status: 'error',
        steps: [
          { id: 'step-1', name: 'Upload audio file', status: 'completed' },
          {
            id: 'step-2',
            name: 'Transcribe audio content',
            status: 'error',
            error: 'Network error',
          },
        ],
        overallProgress: 25,
        canCancel: false,
        canRetry: true,
        canPause: false,
        startTime: new Date(),
        error: 'Processing failed due to network error',
      };
    });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('audio-processing-start', {
          detail: window.mockProcessingStatus,
        }),
      );
    });

    // Check error state
    await expect(page.locator('text=Error')).toBeVisible();
    await expect(page.locator('text=Processing failed')).toBeVisible();
    await expect(page.locator('text=Error: Network error')).toBeVisible();

    // Click retry button
    await page.click('text=Retry');

    // Check that processing is reset
    await expect(page.locator('text=Pending')).toBeVisible();
  });

  test('should show elapsed time for running operations', async ({ page }) => {
    // Mock processing status with start time
    const startTime = new Date(Date.now() - 30000); // 30 seconds ago
    await page.addInitScript(() => {
      window.mockProcessingStatus = {
        id: 'test-status',
        type: 'audio-processing',
        status: 'running',
        steps: [
          { id: 'step-1', name: 'Upload audio file', status: 'completed' },
          { id: 'step-2', name: 'Transcribe audio content', status: 'running' },
        ],
        overallProgress: 50,
        canCancel: true,
        canRetry: false,
        canPause: false,
        startTime: new Date(Date.now() - 30000),
      };
    });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('audio-processing-start', {
          detail: window.mockProcessingStatus,
        }),
      );
    });

    // Check elapsed time display
    await expect(page.locator('text=Elapsed: 30s')).toBeVisible();
  });

  test('should handle multiple concurrent processing tasks', async ({
    page,
  }) => {
    // Mock multiple processing statuses
    await page.addInitScript(() => {
      window.mockProcessingStatuses = [
        {
          id: 'status-1',
          type: 'audio-processing',
          status: 'running',
          steps: [
            { id: 'step-1', name: 'Upload audio file', status: 'completed' },
          ],
          overallProgress: 50,
          canCancel: true,
          canRetry: false,
          canPause: false,
          startTime: new Date(),
          metadata: { audioFileName: 'audio1.mp3' },
        },
        {
          id: 'status-2',
          type: 'ai-response',
          status: 'running',
          steps: [
            { id: 'step-1', name: 'Generate AI response', status: 'running' },
          ],
          overallProgress: 75,
          canCancel: true,
          canRetry: false,
          canPause: true,
          startTime: new Date(),
          metadata: { messageType: 'text' },
        },
      ];
    });

    await page.evaluate(() => {
      window.mockProcessingStatuses.forEach((status) => {
        window.dispatchEvent(
          new CustomEvent('processing-start', { detail: status }),
        );
      });
    });

    // Check that both tasks are displayed
    await expect(page.locator('text=Audio Processing')).toBeVisible();
    await expect(page.locator('text=AI Response')).toBeVisible();
    await expect(page.locator('text=2 active')).toBeVisible();
  });

  test('should auto-hide completed processing tasks', async ({ page }) => {
    // Mock completed processing status
    await page.addInitScript(() => {
      window.mockProcessingStatus = {
        id: 'test-status',
        type: 'audio-processing',
        status: 'completed',
        steps: [
          { id: 'step-1', name: 'Upload audio file', status: 'completed' },
          {
            id: 'step-2',
            name: 'Transcribe audio content',
            status: 'completed',
          },
        ],
        overallProgress: 100,
        canCancel: false,
        canRetry: false,
        canPause: false,
        startTime: new Date(Date.now() - 60000),
        endTime: new Date(),
      };
    });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('audio-processing-start', {
          detail: window.mockProcessingStatus,
        }),
      );
    });

    // Check that completed status is shown briefly
    await expect(page.locator('text=Completed')).toBeVisible();

    // Wait for auto-hide (should hide after 10 seconds)
    await page.waitForTimeout(11000);

    // Check that panel is hidden
    await expect(
      page.locator('[data-testid="processing-progress"]'),
    ).not.toBeVisible();
  });

  test('should show step duration for completed steps', async ({ page }) => {
    // Mock processing status with step durations
    await page.addInitScript(() => {
      window.mockProcessingStatus = {
        id: 'test-status',
        type: 'audio-processing',
        status: 'running',
        steps: [
          {
            id: 'step-1',
            name: 'Upload audio file',
            status: 'completed',
            startTime: new Date(Date.now() - 5000),
            endTime: new Date(),
            actualDuration: 5,
          },
          {
            id: 'step-2',
            name: 'Transcribe audio content',
            status: 'running',
            startTime: new Date(Date.now() - 3000),
          },
        ],
        overallProgress: 50,
        canCancel: true,
        canRetry: false,
        canPause: false,
        startTime: new Date(),
      };
    });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('audio-processing-start', {
          detail: window.mockProcessingStatus,
        }),
      );
    });

    // Check step duration display
    await expect(page.locator('text=Duration: 5s')).toBeVisible();
  });

  test('should handle pause/resume functionality for AI responses', async ({
    page,
  }) => {
    // Mock AI response processing with pause capability
    await page.addInitScript(() => {
      window.mockProcessingStatus = {
        id: 'test-status',
        type: 'ai-response',
        status: 'running',
        steps: [
          { id: 'step-1', name: 'Generate AI response', status: 'running' },
        ],
        overallProgress: 50,
        canCancel: true,
        canRetry: false,
        canPause: true,
        startTime: new Date(),
      };
    });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('ai-processing-start', {
          detail: window.mockProcessingStatus,
        }),
      );
    });

    // Check pause button is available
    await expect(page.locator('[data-testid="pause-button"]')).toBeVisible();

    // Click pause button
    await page.click('[data-testid="pause-button"]');

    // Check that processing is paused
    await expect(page.locator('[data-testid="resume-button"]')).toBeVisible();
  });

  test('should display error messages for failed steps', async ({ page }) => {
    // Mock processing status with error
    await page.addInitScript(() => {
      window.mockProcessingStatus = {
        id: 'test-status',
        type: 'audio-processing',
        status: 'error',
        steps: [
          { id: 'step-1', name: 'Upload audio file', status: 'completed' },
          {
            id: 'step-2',
            name: 'Transcribe audio content',
            status: 'error',
            error: 'Failed to connect to transcription service',
            startTime: new Date(Date.now() - 10000),
            endTime: new Date(),
            actualDuration: 10,
          },
        ],
        overallProgress: 25,
        canCancel: false,
        canRetry: true,
        canPause: false,
        startTime: new Date(),
        error: 'Audio processing failed',
      };
    });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('audio-processing-start', {
          detail: window.mockProcessingStatus,
        }),
      );
    });

    // Check error display
    await expect(
      page.locator('text=Error: Failed to connect to transcription service'),
    ).toBeVisible();
    await expect(page.locator('text=Processing failed')).toBeVisible();
  });

  test('should format long durations correctly', async ({ page }) => {
    // Mock processing status with long duration
    await page.addInitScript(() => {
      window.mockProcessingStatus = {
        id: 'test-status',
        type: 'audio-processing',
        status: 'completed',
        steps: [
          {
            id: 'step-1',
            name: 'Upload audio file',
            status: 'completed',
            startTime: new Date(Date.now() - 5400000), // 1h 30m ago
            endTime: new Date(),
            actualDuration: 5400, // 1h 30m in seconds
          },
        ],
        overallProgress: 100,
        canCancel: false,
        canRetry: false,
        canPause: false,
        startTime: new Date(),
        endTime: new Date(),
      };
    });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('audio-processing-start', {
          detail: window.mockProcessingStatus,
        }),
      );
    });

    // Check long duration formatting
    await expect(page.locator('text=Duration: 1h 30m')).toBeVisible();
  });
});
