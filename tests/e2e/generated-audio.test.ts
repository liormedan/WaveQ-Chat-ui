import { test, expect } from '@playwright/test';

test.describe('Generated Audio Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat/new');
  });

  test('should display generated audio component when audio generation is requested', async ({
    page,
  }) => {
    // Mock the generated audio API response
    await page.addInitScript(() => {
      window.addEventListener('fetch', (event) => {
        if (
          event.request.url.includes('/api/chat/') &&
          event.request.url.includes('/generated-audios')
        ) {
          event.preventDefault();
          const response = new Response(
            JSON.stringify({
              success: true,
              generatedAudios: [
                {
                  id: 'test-generated-audio-1',
                  originalAudioId: 'test-original-audio-1',
                  originalAudioName: 'original_audio.mp3',
                  originalAudioUrl: 'https://example.com/original.mp3',
                  generatedAudioName:
                    'original_audio_enhancement_1234567890.mp3',
                  generatedAudioUrl: 'https://example.com/generated.mp3',
                  processingDetails: {
                    processingType: 'enhancement',
                    processingSteps: [
                      {
                        id: 'step1',
                        name: 'Analyze original audio',
                        status: 'completed',
                        duration: 10,
                      },
                      {
                        id: 'step2',
                        name: 'Apply processing algorithm',
                        status: 'completed',
                        duration: 45,
                      },
                      {
                        id: 'step3',
                        name: 'Generate output file',
                        status: 'completed',
                        duration: 15,
                      },
                      {
                        id: 'step4',
                        name: 'Quality validation',
                        status: 'completed',
                        duration: 10,
                      },
                    ],
                    totalProcessingTime: 80,
                    qualityMetrics: {
                      signalToNoiseRatio: 42.5,
                      clarityScore: 8.7,
                      fidelityScore: 9.1,
                    },
                  },
                  metadata: {
                    format: 'mp3',
                    bitrate: 128,
                    sampleRate: 44100,
                    channels: 2,
                    duration: 180,
                    fileSize: 2500000,
                  },
                  createdAt: new Date().toISOString(),
                },
              ],
            }),
            {
              headers: { 'Content-Type': 'application/json' },
            },
          );
          event.respondWith(Promise.resolve(response));
        }
      });
    });

    // Wait for the generated audio component to appear
    await page.waitForSelector('[data-testid="generated-audio-display"]', {
      timeout: 10000,
    });

    // Check that the generated audio display is shown
    const generatedAudioDisplay = await page.locator(
      '[data-testid="generated-audio-display"]',
    );
    await expect(generatedAudioDisplay).toBeVisible();
  });

  test('should show processing details when expanded', async ({ page }) => {
    // Mock the generated audio API response
    await page.addInitScript(() => {
      window.addEventListener('fetch', (event) => {
        if (
          event.request.url.includes('/api/chat/') &&
          event.request.url.includes('/generated-audios')
        ) {
          event.preventDefault();
          const response = new Response(
            JSON.stringify({
              success: true,
              generatedAudios: [
                {
                  id: 'test-generated-audio-1',
                  originalAudioId: 'test-original-audio-1',
                  originalAudioName: 'original_audio.mp3',
                  originalAudioUrl: 'https://example.com/original.mp3',
                  generatedAudioName:
                    'original_audio_enhancement_1234567890.mp3',
                  generatedAudioUrl: 'https://example.com/generated.mp3',
                  processingDetails: {
                    processingType: 'enhancement',
                    processingSteps: [
                      {
                        id: 'step1',
                        name: 'Analyze original audio',
                        status: 'completed',
                        duration: 10,
                      },
                      {
                        id: 'step2',
                        name: 'Apply processing algorithm',
                        status: 'completed',
                        duration: 45,
                      },
                      {
                        id: 'step3',
                        name: 'Generate output file',
                        status: 'completed',
                        duration: 15,
                      },
                      {
                        id: 'step4',
                        name: 'Quality validation',
                        status: 'completed',
                        duration: 10,
                      },
                    ],
                    totalProcessingTime: 80,
                    qualityMetrics: {
                      signalToNoiseRatio: 42.5,
                      clarityScore: 8.7,
                      fidelityScore: 9.1,
                    },
                  },
                  metadata: {
                    format: 'mp3',
                    bitrate: 128,
                    sampleRate: 44100,
                    channels: 2,
                    duration: 180,
                    fileSize: 2500000,
                  },
                  createdAt: new Date().toISOString(),
                },
              ],
            }),
            {
              headers: { 'Content-Type': 'application/json' },
            },
          );
          event.respondWith(Promise.resolve(response));
        }
      });
    });

    // Wait for the generated audio component to appear
    await page.waitForSelector('[data-testid="generated-audio-display"]', {
      timeout: 10000,
    });

    // Click the info button to expand processing details
    const infoButton = await page
      .locator('[data-testid="generated-audio-display"] button')
      .first();
    await infoButton.click();

    // Check that processing details are shown
    await expect(page.locator('text=Processing Details')).toBeVisible();
    await expect(page.locator('text=Analyze original audio')).toBeVisible();
    await expect(page.locator('text=Apply processing algorithm')).toBeVisible();
    await expect(page.locator('text=Generate output file')).toBeVisible();
    await expect(page.locator('text=Quality validation')).toBeVisible();
  });

  test('should show quality metrics when expanded', async ({ page }) => {
    // Mock the generated audio API response
    await page.addInitScript(() => {
      window.addEventListener('fetch', (event) => {
        if (
          event.request.url.includes('/api/chat/') &&
          event.request.url.includes('/generated-audios')
        ) {
          event.preventDefault();
          const response = new Response(
            JSON.stringify({
              success: true,
              generatedAudios: [
                {
                  id: 'test-generated-audio-1',
                  originalAudioId: 'test-original-audio-1',
                  originalAudioName: 'original_audio.mp3',
                  originalAudioUrl: 'https://example.com/original.mp3',
                  generatedAudioName:
                    'original_audio_enhancement_1234567890.mp3',
                  generatedAudioUrl: 'https://example.com/generated.mp3',
                  processingDetails: {
                    processingType: 'enhancement',
                    processingSteps: [
                      {
                        id: 'step1',
                        name: 'Analyze original audio',
                        status: 'completed',
                        duration: 10,
                      },
                      {
                        id: 'step2',
                        name: 'Apply processing algorithm',
                        status: 'completed',
                        duration: 45,
                      },
                      {
                        id: 'step3',
                        name: 'Generate output file',
                        status: 'completed',
                        duration: 15,
                      },
                      {
                        id: 'step4',
                        name: 'Quality validation',
                        status: 'completed',
                        duration: 10,
                      },
                    ],
                    totalProcessingTime: 80,
                    qualityMetrics: {
                      signalToNoiseRatio: 42.5,
                      clarityScore: 8.7,
                      fidelityScore: 9.1,
                    },
                  },
                  metadata: {
                    format: 'mp3',
                    bitrate: 128,
                    sampleRate: 44100,
                    channels: 2,
                    duration: 180,
                    fileSize: 2500000,
                  },
                  createdAt: new Date().toISOString(),
                },
              ],
            }),
            {
              headers: { 'Content-Type': 'application/json' },
            },
          );
          event.respondWith(Promise.resolve(response));
        }
      });
    });

    // Wait for the generated audio component to appear
    await page.waitForSelector('[data-testid="generated-audio-display"]', {
      timeout: 10000,
    });

    // Click the info button to expand processing details
    const infoButton = await page
      .locator('[data-testid="generated-audio-display"] button')
      .first();
    await infoButton.click();

    // Check that quality metrics are shown
    await expect(page.locator('text=Quality Metrics')).toBeVisible();
    await expect(page.locator('text=SNR')).toBeVisible();
    await expect(page.locator('text=Clarity')).toBeVisible();
    await expect(page.locator('text=Fidelity')).toBeVisible();
    await expect(page.locator('text=42.5 dB')).toBeVisible();
    await expect(page.locator('text=8.7/10')).toBeVisible();
    await expect(page.locator('text=9.1/10')).toBeVisible();
  });

  test('should show comparison view when compare button is clicked', async ({
    page,
  }) => {
    // Mock the generated audio API response
    await page.addInitScript(() => {
      window.addEventListener('fetch', (event) => {
        if (
          event.request.url.includes('/api/chat/') &&
          event.request.url.includes('/generated-audios')
        ) {
          event.preventDefault();
          const response = new Response(
            JSON.stringify({
              success: true,
              generatedAudios: [
                {
                  id: 'test-generated-audio-1',
                  originalAudioId: 'test-original-audio-1',
                  originalAudioName: 'original_audio.mp3',
                  originalAudioUrl: 'https://example.com/original.mp3',
                  generatedAudioName:
                    'original_audio_enhancement_1234567890.mp3',
                  generatedAudioUrl: 'https://example.com/generated.mp3',
                  processingDetails: {
                    processingType: 'enhancement',
                    processingSteps: [
                      {
                        id: 'step1',
                        name: 'Analyze original audio',
                        status: 'completed',
                        duration: 10,
                      },
                      {
                        id: 'step2',
                        name: 'Apply processing algorithm',
                        status: 'completed',
                        duration: 45,
                      },
                      {
                        id: 'step3',
                        name: 'Generate output file',
                        status: 'completed',
                        duration: 15,
                      },
                      {
                        id: 'step4',
                        name: 'Quality validation',
                        status: 'completed',
                        duration: 10,
                      },
                    ],
                    totalProcessingTime: 80,
                    qualityMetrics: {
                      signalToNoiseRatio: 42.5,
                      clarityScore: 8.7,
                      fidelityScore: 9.1,
                    },
                  },
                  metadata: {
                    format: 'mp3',
                    bitrate: 128,
                    sampleRate: 44100,
                    channels: 2,
                    duration: 180,
                    fileSize: 2500000,
                  },
                  createdAt: new Date().toISOString(),
                },
              ],
            }),
            {
              headers: { 'Content-Type': 'application/json' },
            },
          );
          event.respondWith(Promise.resolve(response));
        }
      });
    });

    // Wait for the generated audio component to appear
    await page.waitForSelector('[data-testid="generated-audio-display"]', {
      timeout: 10000,
    });

    // Click the compare button to show comparison view
    const compareButton = await page
      .locator('[data-testid="generated-audio-display"] button')
      .nth(1);
    await compareButton.click();

    // Check that comparison view is shown
    await expect(page.locator('text=Original Audio')).toBeVisible();
    await expect(page.locator('text=original_audio.mp3')).toBeVisible();
  });

  test('should show download options when expanded', async ({ page }) => {
    // Mock the generated audio API response
    await page.addInitScript(() => {
      window.addEventListener('fetch', (event) => {
        if (
          event.request.url.includes('/api/chat/') &&
          event.request.url.includes('/generated-audios')
        ) {
          event.preventDefault();
          const response = new Response(
            JSON.stringify({
              success: true,
              generatedAudios: [
                {
                  id: 'test-generated-audio-1',
                  originalAudioId: 'test-original-audio-1',
                  originalAudioName: 'original_audio.mp3',
                  originalAudioUrl: 'https://example.com/original.mp3',
                  generatedAudioName:
                    'original_audio_enhancement_1234567890.mp3',
                  generatedAudioUrl: 'https://example.com/generated.mp3',
                  processingDetails: {
                    processingType: 'enhancement',
                    processingSteps: [
                      {
                        id: 'step1',
                        name: 'Analyze original audio',
                        status: 'completed',
                        duration: 10,
                      },
                      {
                        id: 'step2',
                        name: 'Apply processing algorithm',
                        status: 'completed',
                        duration: 45,
                      },
                      {
                        id: 'step3',
                        name: 'Generate output file',
                        status: 'completed',
                        duration: 15,
                      },
                      {
                        id: 'step4',
                        name: 'Quality validation',
                        status: 'completed',
                        duration: 10,
                      },
                    ],
                    totalProcessingTime: 80,
                    qualityMetrics: {
                      signalToNoiseRatio: 42.5,
                      clarityScore: 8.7,
                      fidelityScore: 9.1,
                    },
                  },
                  metadata: {
                    format: 'mp3',
                    bitrate: 128,
                    sampleRate: 44100,
                    channels: 2,
                    duration: 180,
                    fileSize: 2500000,
                  },
                  createdAt: new Date().toISOString(),
                },
              ],
            }),
            {
              headers: { 'Content-Type': 'application/json' },
            },
          );
          event.respondWith(Promise.resolve(response));
        }
      });
    });

    // Wait for the generated audio component to appear
    await page.waitForSelector('[data-testid="generated-audio-display"]', {
      timeout: 10000,
    });

    // Click the info button to expand processing details
    const infoButton = await page
      .locator('[data-testid="generated-audio-display"] button')
      .first();
    await infoButton.click();

    // Check that download options are shown
    await expect(page.locator('text=Download Options')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
    await expect(page.locator('text=Download')).toBeVisible();
  });

  test('should display technical metadata when expanded', async ({ page }) => {
    // Mock the generated audio API response
    await page.addInitScript(() => {
      window.addEventListener('fetch', (event) => {
        if (
          event.request.url.includes('/api/chat/') &&
          event.request.url.includes('/generated-audios')
        ) {
          event.preventDefault();
          const response = new Response(
            JSON.stringify({
              success: true,
              generatedAudios: [
                {
                  id: 'test-generated-audio-1',
                  originalAudioId: 'test-original-audio-1',
                  originalAudioName: 'original_audio.mp3',
                  originalAudioUrl: 'https://example.com/original.mp3',
                  generatedAudioName:
                    'original_audio_enhancement_1234567890.mp3',
                  generatedAudioUrl: 'https://example.com/generated.mp3',
                  processingDetails: {
                    processingType: 'enhancement',
                    processingSteps: [
                      {
                        id: 'step1',
                        name: 'Analyze original audio',
                        status: 'completed',
                        duration: 10,
                      },
                      {
                        id: 'step2',
                        name: 'Apply processing algorithm',
                        status: 'completed',
                        duration: 45,
                      },
                      {
                        id: 'step3',
                        name: 'Generate output file',
                        status: 'completed',
                        duration: 15,
                      },
                      {
                        id: 'step4',
                        name: 'Quality validation',
                        status: 'completed',
                        duration: 10,
                      },
                    ],
                    totalProcessingTime: 80,
                    qualityMetrics: {
                      signalToNoiseRatio: 42.5,
                      clarityScore: 8.7,
                      fidelityScore: 9.1,
                    },
                  },
                  metadata: {
                    format: 'mp3',
                    bitrate: 128,
                    sampleRate: 44100,
                    channels: 2,
                    duration: 180,
                    fileSize: 2500000,
                  },
                  createdAt: new Date().toISOString(),
                },
              ],
            }),
            {
              headers: { 'Content-Type': 'application/json' },
            },
          );
          event.respondWith(Promise.resolve(response));
        }
      });
    });

    // Wait for the generated audio component to appear
    await page.waitForSelector('[data-testid="generated-audio-display"]', {
      timeout: 10000,
    });

    // Click the info button to expand processing details
    const infoButton = await page
      .locator('[data-testid="generated-audio-display"] button')
      .first();
    await infoButton.click();

    // Check that technical details are shown
    await expect(page.locator('text=Technical Details')).toBeVisible();
    await expect(page.locator('text=Format:')).toBeVisible();
    await expect(page.locator('text=MP3')).toBeVisible();
    await expect(page.locator('text=Bitrate:')).toBeVisible();
    await expect(page.locator('text=128 kbps')).toBeVisible();
    await expect(page.locator('text=Sample Rate:')).toBeVisible();
    await expect(page.locator('text=44100 Hz')).toBeVisible();
    await expect(page.locator('text=Channels:')).toBeVisible();
    await expect(page.locator('text=2')).toBeVisible();
  });

  test('should handle multiple generated audios in a chat', async ({
    page,
  }) => {
    // Mock the generated audio API response with multiple audios
    await page.addInitScript(() => {
      window.addEventListener('fetch', (event) => {
        if (
          event.request.url.includes('/api/chat/') &&
          event.request.url.includes('/generated-audios')
        ) {
          event.preventDefault();
          const response = new Response(
            JSON.stringify({
              success: true,
              generatedAudios: [
                {
                  id: 'test-generated-audio-1',
                  originalAudioId: 'test-original-audio-1',
                  originalAudioName: 'original_audio.mp3',
                  originalAudioUrl: 'https://example.com/original.mp3',
                  generatedAudioName:
                    'original_audio_enhancement_1234567890.mp3',
                  generatedAudioUrl: 'https://example.com/generated.mp3',
                  processingDetails: {
                    processingType: 'enhancement',
                    processingSteps: [
                      {
                        id: 'step1',
                        name: 'Analyze original audio',
                        status: 'completed',
                        duration: 10,
                      },
                      {
                        id: 'step2',
                        name: 'Apply processing algorithm',
                        status: 'completed',
                        duration: 45,
                      },
                      {
                        id: 'step3',
                        name: 'Generate output file',
                        status: 'completed',
                        duration: 15,
                      },
                      {
                        id: 'step4',
                        name: 'Quality validation',
                        status: 'completed',
                        duration: 10,
                      },
                    ],
                    totalProcessingTime: 80,
                    qualityMetrics: {
                      signalToNoiseRatio: 42.5,
                      clarityScore: 8.7,
                      fidelityScore: 9.1,
                    },
                  },
                  metadata: {
                    format: 'mp3',
                    bitrate: 128,
                    sampleRate: 44100,
                    channels: 2,
                    duration: 180,
                    fileSize: 2500000,
                  },
                  createdAt: new Date().toISOString(),
                },
                {
                  id: 'test-generated-audio-2',
                  originalAudioId: 'test-original-audio-2',
                  originalAudioName: 'podcast_episode.wav',
                  originalAudioUrl: 'https://example.com/podcast.wav',
                  generatedAudioName:
                    'podcast_episode_noise-reduction_1234567890.mp3',
                  generatedAudioUrl:
                    'https://example.com/podcast_processed.mp3',
                  processingDetails: {
                    processingType: 'noise-reduction',
                    processingSteps: [
                      {
                        id: 'step1',
                        name: 'Analyze original audio',
                        status: 'completed',
                        duration: 15,
                      },
                      {
                        id: 'step2',
                        name: 'Apply processing algorithm',
                        status: 'completed',
                        duration: 60,
                      },
                      {
                        id: 'step3',
                        name: 'Generate output file',
                        status: 'completed',
                        duration: 20,
                      },
                      {
                        id: 'step4',
                        name: 'Quality validation',
                        status: 'completed',
                        duration: 15,
                      },
                    ],
                    totalProcessingTime: 110,
                    qualityMetrics: {
                      signalToNoiseRatio: 48.2,
                      clarityScore: 9.3,
                      fidelityScore: 8.9,
                    },
                  },
                  metadata: {
                    format: 'mp3',
                    bitrate: 192,
                    sampleRate: 48000,
                    channels: 2,
                    duration: 3600,
                    fileSize: 5000000,
                  },
                  createdAt: new Date().toISOString(),
                },
              ],
            }),
            {
              headers: { 'Content-Type': 'application/json' },
            },
          );
          event.respondWith(Promise.resolve(response));
        }
      });
    });

    // Wait for the generated audio components to appear
    await page.waitForSelector('[data-testid="generated-audio-display"]', {
      timeout: 10000,
    });

    // Check that both generated audios are displayed
    const generatedAudioDisplays = await page.locator(
      '[data-testid="generated-audio-display"]',
    );
    await expect(generatedAudioDisplays).toHaveCount(2);

    // Check that the first audio shows enhancement processing
    await expect(page.locator('text=Audio Enhancement')).toBeVisible();

    // Check that the second audio shows noise reduction processing
    await expect(page.locator('text=Noise Reduction')).toBeVisible();
  });
});
