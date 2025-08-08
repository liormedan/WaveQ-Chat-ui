import { test, expect } from '@playwright/test';

test.describe('Audio Context Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat/new');
  });

  test('should process audio files and create audio context', async ({
    page,
  }) => {
    // Mock file upload for audio file
    await page.setInputFiles('input[type="file"]', {
      name: 'test-podcast.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('fake audio content'),
    });

    // Wait for upload to complete
    await page.waitForSelector('[data-testid="input-attachment-preview"]');

    // Send message with audio attachment
    await page.fill(
      '[data-testid="input"]',
      'This is a podcast about technology',
    );
    await page.click('[data-testid="submit-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="message-assistant"]');

    // Check that audio context is displayed
    const audioContextDisplay = page.locator(
      '[data-testid="audio-context-display"]',
    );
    await expect(audioContextDisplay).toBeVisible();
  });

  test('should display audio context information', async ({ page }) => {
    // Navigate to a chat with audio context
    await page.goto('/chat/new');

    // Mock audio context data
    await page.addInitScript(() => {
      window.mockAudioContexts = [
        {
          id: 'test-context-1',
          audioFileName: 'podcast-episode.mp3',
          audioFileUrl: 'https://example.com/audio.mp3',
          audioDuration: 1800, // 30 minutes
          audioTranscription:
            'This is a podcast episode about artificial intelligence and machine learning.',
          contextSummary:
            'A comprehensive discussion about AI trends and developments.',
          audioMetadata: {
            topics: [
              'artificial intelligence',
              'machine learning',
              'technology',
            ],
            sentiment: 'positive',
            keywords: ['AI', 'ML', 'technology', 'future'],
          },
        },
      ];
    });

    // Check that audio context information is displayed
    const audioContextCard = page.locator('[data-testid="audio-context-card"]');
    await expect(audioContextCard).toBeVisible();

    // Check that topics are displayed
    const topics = page.locator('[data-testid="audio-topics"]');
    await expect(topics).toBeVisible();

    // Check that sentiment is displayed
    const sentiment = page.locator('[data-testid="audio-sentiment"]');
    await expect(sentiment).toBeVisible();
  });

  test('should generate intelligent responses based on audio context', async ({
    page,
  }) => {
    // Mock audio context and send a question
    await page.addInitScript(() => {
      window.mockAudioContexts = [
        {
          id: 'test-context-1',
          audioFileName: 'interview.mp3',
          audioFileUrl: 'https://example.com/interview.mp3',
          audioTranscription:
            'The interviewee discussed their experience with machine learning projects.',
          contextSummary:
            'An interview about machine learning experience and projects.',
          audioMetadata: {
            topics: ['machine learning', 'experience', 'projects'],
            sentiment: 'positive',
          },
        },
      ];
    });

    // Send a question about the audio content
    await page.fill(
      '[data-testid="input"]',
      'What did they say about machine learning?',
    );
    await page.click('[data-testid="submit-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="message-assistant"]');

    // Check that the response references the audio content
    const response = page.locator(
      '[data-testid="message-assistant"] [data-testid="message-content"]',
    );
    const responseText = await response.textContent();

    // The response should mention machine learning or the audio content
    expect(responseText).toMatch(/machine learning|audio|interview/i);
  });

  test('should maintain audio context across multiple messages', async ({
    page,
  }) => {
    // Upload audio file
    await page.setInputFiles('input[type="file"]', {
      name: 'lecture.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('fake lecture content'),
    });

    await page.waitForSelector('[data-testid="input-attachment-preview"]');

    // Send first message
    await page.fill('[data-testid="input"]', 'What is this lecture about?');
    await page.click('[data-testid="submit-button"]');

    await page.waitForSelector('[data-testid="message-assistant"]');

    // Send follow-up question
    await page.fill(
      '[data-testid="input"]',
      'Can you elaborate on that point?',
    );
    await page.click('[data-testid="submit-button"]');

    await page.waitForSelector(
      '[data-testid="message-assistant"]:nth-child(2)',
    );

    // Check that both responses reference the audio context
    const responses = page.locator(
      '[data-testid="message-assistant"] [data-testid="message-content"]',
    );
    const responseTexts = await responses.allTextContents();

    // Both responses should reference the audio content
    responseTexts.forEach((text) => {
      expect(text).toMatch(/lecture|audio|content/i);
    });
  });

  test('should handle multiple audio files in conversation', async ({
    page,
  }) => {
    // Upload first audio file
    await page.setInputFiles('input[type="file"]', {
      name: 'podcast-1.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('first podcast content'),
    });

    await page.waitForSelector('[data-testid="input-attachment-preview"]');
    await page.fill(
      '[data-testid="input"]',
      'What is the first podcast about?',
    );
    await page.click('[data-testid="submit-button"]');

    await page.waitForSelector('[data-testid="message-assistant"]');

    // Upload second audio file
    await page.setInputFiles('input[type="file"]', {
      name: 'podcast-2.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('second podcast content'),
    });

    await page.waitForSelector('[data-testid="input-attachment-preview"]');
    await page.fill(
      '[data-testid="input"]',
      'How do these two podcasts relate?',
    );
    await page.click('[data-testid="submit-button"]');

    await page.waitForSelector(
      '[data-testid="message-assistant"]:nth-child(2)',
    );

    // Check that audio context display shows multiple files
    const audioContextDisplay = page.locator(
      '[data-testid="audio-context-display"]',
    );
    await expect(audioContextDisplay).toBeVisible();

    // Should show both audio files
    const audioContextCards = page.locator(
      '[data-testid="audio-context-card"]',
    );
    await expect(audioContextCards).toHaveCount(2);
  });

  test('should show audio context information in expandable format', async ({
    page,
  }) => {
    // Mock audio context with transcription
    await page.addInitScript(() => {
      window.mockAudioContexts = [
        {
          id: 'test-context-1',
          audioFileName: 'meeting.mp3',
          audioFileUrl: 'https://example.com/meeting.mp3',
          audioTranscription:
            'This is a detailed transcription of the meeting discussing various topics including project updates, team collaboration, and future planning.',
          contextSummary:
            'A team meeting covering project updates and future planning.',
          audioMetadata: {
            topics: ['project updates', 'team collaboration', 'planning'],
            sentiment: 'neutral',
          },
        },
      ];
    });

    // Check that transcription is initially hidden
    const transcription = page.locator('[data-testid="audio-transcription"]');
    await expect(transcription).not.toBeVisible();

    // Click to expand transcription
    const expandButton = page.locator('[data-testid="expand-transcription"]');
    await expandButton.click();

    // Check that transcription is now visible
    await expect(transcription).toBeVisible();
    await expect(transcription).toContainText('detailed transcription');
  });
});
