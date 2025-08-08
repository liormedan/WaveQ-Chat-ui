import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  downloadSingleFile,
  downloadBatchFiles,
} from '@/components/download-utils';

// Mock fetch globally
global.fetch = vi.fn();
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    href: '',
    download: '',
    click: vi.fn(),
  })),
});

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn(),
});

describe('Download Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('downloadSingleFile', () => {
    it('should download a single file successfully', async () => {
      const mockResponse = {
        ok: true,
        blob: vi.fn().mockResolvedValue(new Blob(['mock audio data'])),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const chatId = 'test-chat-id';
      const audioId = 'test-audio-id';
      const format = 'mp3';

      await downloadSingleFile(chatId, audioId, format);

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/chat/${chatId}/generated-audios/download?audioId=${audioId}&format=${format}`,
      );
      expect(mockResponse.blob).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should throw error when download fails', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const chatId = 'test-chat-id';
      const audioId = 'test-audio-id';
      const format = 'mp3';

      await expect(downloadSingleFile(chatId, audioId, format)).rejects.toThrow(
        'Download failed',
      );
    });
  });

  describe('downloadBatchFiles', () => {
    it('should download multiple files successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: [
            { id: 'audio1', filename: 'file1.mp3' },
            { id: 'audio2', filename: 'file2.mp3' },
          ],
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const chatId = 'test-chat-id';
      const audioIds = ['audio1', 'audio2'];
      const format = 'mp3';

      await downloadBatchFiles(chatId, audioIds, format);

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/chat/${chatId}/generated-audios/download`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioIds,
            format,
            batch: true,
          }),
        }),
      );
    });

    it('should throw error when batch download fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const chatId = 'test-chat-id';
      const audioIds = ['audio1', 'audio2'];
      const format = 'mp3';

      await expect(
        downloadBatchFiles(chatId, audioIds, format),
      ).rejects.toThrow('Batch download failed');
    });
  });

  describe('File Naming Conventions', () => {
    it('should generate correct filename format', () => {
      const originalName = 'recording';
      const processingType = 'enhancement';
      const timestamp = '2024-01-15';
      const format = 'mp3';

      const filename = `${originalName}_${processingType}_${timestamp}.${format}`;
      const expected = 'recording_enhancement_2024-01-15.mp3';

      expect(filename).toBe(expected);
    });

    it('should handle special characters in filenames', () => {
      const originalName = 'interview with spaces & symbols';
      const processingType = 'noise-reduction';
      const timestamp = '2024-01-15';
      const format = 'wav';

      const filename = `${originalName}_${processingType}_${timestamp}.${format}`;
      const expected =
        'interview with spaces & symbols_noise-reduction_2024-01-15.wav';

      expect(filename).toBe(expected);
    });
  });

  describe('Format Validation', () => {
    it('should support all required audio formats', () => {
      const supportedFormats = ['mp3', 'wav', 'flac', 'm4a', 'ogg'];

      supportedFormats.forEach((format) => {
        expect(supportedFormats).toContain(format);
      });
    });

    it('should reject unsupported formats', () => {
      const unsupportedFormats = ['avi', 'mov', 'txt', 'pdf'];
      const supportedFormats = ['mp3', 'wav', 'flac', 'm4a', 'ogg'];

      unsupportedFormats.forEach((format) => {
        expect(supportedFormats).not.toContain(format);
      });
    });
  });

  describe('Content Type Mapping', () => {
    it('should return correct content types for audio formats', () => {
      const contentTypes = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        flac: 'audio/flac',
        m4a: 'audio/mp4',
        ogg: 'audio/ogg',
      };

      expect(contentTypes.mp3).toBe('audio/mpeg');
      expect(contentTypes.wav).toBe('audio/wav');
      expect(contentTypes.flac).toBe('audio/flac');
      expect(contentTypes.m4a).toBe('audio/mp4');
      expect(contentTypes.ogg).toBe('audio/ogg');
    });
  });
});
