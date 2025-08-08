import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FileIntegrityChecker,
  validateFileIntegrity,
  attemptFileRecovery,
  generateFileGuidance,
  FILE_VALIDATION_RULES,
} from '@/lib/file-integrity';

// Mock crypto for testing
const mockCreateHash = vi.fn();
const mockUpdate = vi.fn();
const mockDigest = vi.fn();

vi.mock('node:crypto', () => ({
  createHash: mockCreateHash,
}));

describe('File Integrity System', () => {
  let integrityChecker: FileIntegrityChecker;

  beforeEach(() => {
    integrityChecker = FileIntegrityChecker.getInstance();

    // Reset mocks
    mockCreateHash.mockReturnValue({
      update: mockUpdate.mockReturnThis(),
      digest: mockDigest.mockReturnValue('test-hash-123'),
    });
  });

  describe('FileIntegrityChecker', () => {
    it('should be a singleton', () => {
      const instance1 = FileIntegrityChecker.getInstance();
      const instance2 = FileIntegrityChecker.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should calculate file hash correctly', async () => {
      const file = new Blob(['test content'], { type: 'text/plain' });
      const hash = await integrityChecker.calculateFileHash(file);

      expect(mockCreateHash).toHaveBeenCalledWith('sha256');
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDigest).toHaveBeenCalledWith('hex');
      expect(hash).toBe('test-hash-123');
    });

    it('should validate file format correctly', () => {
      const validAudioFile = new Blob(['audio content'], {
        type: 'audio/mpeg',
      });
      const validImageFile = new Blob(['image content'], {
        type: 'image/jpeg',
      });
      const invalidFile = new Blob(['content'], {
        type: 'application/octet-stream',
      });

      // Test valid audio file
      const audioValidation = integrityChecker['validateFileFormat'](
        validAudioFile,
        'test.mp3',
      );
      expect(audioValidation.isValid).toBe(true);

      // Test valid image file
      const imageValidation = integrityChecker['validateFileFormat'](
        validImageFile,
        'test.jpg',
      );
      expect(imageValidation.isValid).toBe(true);

      // Test invalid file
      const invalidValidation = integrityChecker['validateFileFormat'](
        invalidFile,
        'test.xyz',
      );
      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.errors).toContain('Unsupported file type');
    });

    it('should detect file corruption indicators', () => {
      const normalFile = new Blob(['content'], { type: 'audio/mpeg' });
      const emptyFile = new Blob([], { type: 'audio/mpeg' });
      const smallFile = new Blob(['a'], { type: 'audio/mpeg' });
      const corruptedFile = new Blob(['content'], {
        type: 'application/octet-stream',
      });

      expect(integrityChecker.isLikelyCorrupted(normalFile, 'test.mp3')).toBe(
        false,
      );
      expect(integrityChecker.isLikelyCorrupted(emptyFile, 'test.mp3')).toBe(
        true,
      );
      expect(integrityChecker.isLikelyCorrupted(smallFile, 'test.mp3')).toBe(
        true,
      );
      expect(
        integrityChecker.isLikelyCorrupted(corruptedFile, 'test.mp3'),
      ).toBe(true);
    });

    it('should get file statistics correctly', () => {
      const file = new Blob(['test content'], { type: 'audio/mpeg' });
      const stats = integrityChecker.getFileStats(file, 'test.mp3');

      expect(stats.size).toBe(12); // 'test content' length
      expect(stats.type).toBe('audio/mpeg');
      expect(stats.extension).toBe('.mp3');
      expect(stats.fileType).toBe('audio');
      expect(stats.isValidFormat).toBe(true);
      expect(stats.sizeInMB).toBe(12 / (1024 * 1024));
    });
  });

  describe('File Validation', () => {
    it('should validate a valid file successfully', async () => {
      const file = new Blob(['test content'], { type: 'audio/mpeg' });
      const result = await validateFileIntegrity(file, 'test.mp3');

      expect(result.isValid).toBe(true);
      expect(result.integrityInfo.filename).toBe('test.mp3');
      expect(result.integrityInfo.currentSize).toBe(12);
      expect(result.integrityInfo.isCorrupted).toBe(false);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect size mismatch', async () => {
      const file = new Blob(['test content'], { type: 'audio/mpeg' });
      const result = await validateFileIntegrity(
        file,
        'test.mp3',
        'original-hash',
        100,
      );

      expect(result.isValid).toBe(false);
      expect(result.integrityInfo.corruptionType).toBe('size_mismatch');
      expect(result.errors).toContain(
        'File size mismatch: expected 100 bytes, got 12 bytes',
      );
    });

    it('should detect hash mismatch', async () => {
      const file = new Blob(['test content'], { type: 'audio/mpeg' });
      const result = await validateFileIntegrity(
        file,
        'test.mp3',
        'different-hash',
      );

      expect(result.isValid).toBe(false);
      expect(result.integrityInfo.corruptionType).toBe('hash_mismatch');
      expect(result.errors).toContain('File hash mismatch detected');
    });

    it('should detect format issues', async () => {
      const file = new Blob(['test content'], {
        type: 'application/octet-stream',
      });
      const result = await validateFileIntegrity(file, 'test.xyz');

      expect(result.isValid).toBe(false);
      expect(result.integrityInfo.corruptionType).toBe('format_invalid');
      expect(result.errors).toContain('Unsupported file type');
    });

    it('should detect partial downloads', async () => {
      const file = new Blob(['a'], { type: 'audio/mpeg' });
      const result = await validateFileIntegrity(file, 'test.mp3');

      expect(result.isValid).toBe(true); // Still valid but with warnings
      expect(result.warnings).toContain(
        'File size is very small, may be incomplete',
      );
    });
  });

  describe('File Recovery', () => {
    it('should recover size mismatch files', async () => {
      const file = new Blob(['test content'], { type: 'audio/mpeg' });
      const result = await attemptFileRecovery(file, 'test.mp3');

      expect(result.success).toBe(true);
      expect(result.recoveredFile).toBeDefined();
      expect(result.recoveryMethod).toBe('recovery_attempt_1');
      expect(result.attempts).toBe(1);
    });

    it('should recover hash mismatch files', async () => {
      const file = new Blob(['test content'], { type: 'audio/mpeg' });
      const result = await attemptFileRecovery(file, 'test.mp3');

      expect(result.success).toBe(true);
      expect(result.recoveredFile).toBeDefined();
      expect(result.recoveryMethod).toBe('recovery_attempt_1');
    });

    it('should recover format invalid files', async () => {
      const file = new Blob(['test content'], {
        type: 'application/octet-stream',
      });
      const result = await attemptFileRecovery(file, 'test.mp3');

      expect(result.success).toBe(true);
      expect(result.recoveredFile).toBeDefined();
      expect(result.recoveryMethod).toBe('recovery_attempt_1');
    });

    it('should handle recovery failures', async () => {
      // Mock a scenario where recovery fails
      const file = new Blob(['corrupted content'], { type: 'audio/mpeg' });

      // Mock validation to fail
      vi.spyOn(integrityChecker, 'validateFile').mockResolvedValue({
        isValid: false,
        integrityInfo: {
          filename: 'test.mp3',
          originalSize: 0,
          currentSize: 0,
          originalHash: '',
          currentHash: '',
          isCorrupted: true,
          corruptionType: 'hash_mismatch',
          recoveryAttempts: 0,
          lastChecked: new Date(),
        },
        errors: ['File is corrupted'],
        warnings: [],
        suggestions: [],
      });

      const result = await attemptFileRecovery(file, 'test.mp3', {
        maxRetries: 1,
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('User Guidance', () => {
    it('should generate guidance for valid files', () => {
      const validationResult = {
        isValid: true,
        integrityInfo: {
          filename: 'test.mp3',
          originalSize: 0,
          currentSize: 12,
          originalHash: '',
          currentHash: 'test-hash',
          isCorrupted: false,
          recoveryAttempts: 0,
          lastChecked: new Date(),
        },
        errors: [],
        warnings: [],
        suggestions: [],
      };

      const guidance = generateFileGuidance(validationResult);

      expect(guidance.title).toBe('File Validation Successful');
      expect(guidance.severity).toBe('info');
      expect(guidance.actions).toContain('Proceed with upload/download');
    });

    it('should generate guidance for corrupted files', () => {
      const validationResult = {
        isValid: false,
        integrityInfo: {
          filename: 'test.mp3',
          originalSize: 0,
          currentSize: 12,
          originalHash: '',
          currentHash: 'test-hash',
          isCorrupted: true,
          corruptionType: 'hash_mismatch',
          recoveryAttempts: 0,
          lastChecked: new Date(),
        },
        errors: ['File hash mismatch detected'],
        warnings: [],
        suggestions: ['Try re-uploading from the original source'],
      };

      const guidance = generateFileGuidance(validationResult);

      expect(guidance.title).toBe('File Integrity Issues Detected');
      expect(guidance.severity).toBe('error');
      expect(guidance.actions).toContain(
        'Try re-uploading from the original source',
      );
    });

    it('should generate guidance for files with warnings', () => {
      const validationResult = {
        isValid: true,
        integrityInfo: {
          filename: 'test.mp3',
          originalSize: 0,
          currentSize: 12,
          originalHash: '',
          currentHash: 'test-hash',
          isCorrupted: false,
          recoveryAttempts: 0,
          lastChecked: new Date(),
        },
        errors: [],
        warnings: ['File size is very small, may be incomplete'],
        suggestions: ['Verify the file was downloaded completely'],
      };

      const guidance = generateFileGuidance(validationResult);

      expect(guidance.title).toBe('File Validation Warnings');
      expect(guidance.severity).toBe('warning');
      expect(guidance.actions).toContain(
        'Review the warnings before proceeding',
      );
    });
  });

  describe('File Validation Rules', () => {
    it('should have correct audio file rules', () => {
      const audioRules = FILE_VALIDATION_RULES.audio;

      expect(audioRules.extensions).toContain('.mp3');
      expect(audioRules.extensions).toContain('.wav');
      expect(audioRules.extensions).toContain('.flac');
      expect(audioRules.mimeTypes).toContain('audio/mpeg');
      expect(audioRules.mimeTypes).toContain('audio/wav');
      expect(audioRules.maxSize).toBe(50 * 1024 * 1024);
      expect(audioRules.minSize).toBe(1024);
    });

    it('should have correct image file rules', () => {
      const imageRules = FILE_VALIDATION_RULES.image;

      expect(imageRules.extensions).toContain('.jpg');
      expect(imageRules.extensions).toContain('.png');
      expect(imageRules.mimeTypes).toContain('image/jpeg');
      expect(imageRules.mimeTypes).toContain('image/png');
      expect(imageRules.maxSize).toBe(10 * 1024 * 1024);
      expect(imageRules.minSize).toBe(1024);
    });

    it('should have correct document file rules', () => {
      const documentRules = FILE_VALIDATION_RULES.document;

      expect(documentRules.extensions).toContain('.pdf');
      expect(documentRules.extensions).toContain('.txt');
      expect(documentRules.mimeTypes).toContain('application/pdf');
      expect(documentRules.mimeTypes).toContain('text/plain');
      expect(documentRules.maxSize).toBe(20 * 1024 * 1024);
      expect(documentRules.minSize).toBe(1024);
    });
  });

  describe('Error Handling', () => {
    it('should handle hash calculation errors', async () => {
      mockCreateHash.mockImplementation(() => {
        throw new Error('Hash calculation failed');
      });

      const file = new Blob(['test content'], { type: 'audio/mpeg' });
      const result = await validateFileIntegrity(file, 'test.mp3');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Validation failed: A system error occurred. Please try again later.',
      );
    });

    it('should handle recovery errors gracefully', async () => {
      const file = new Blob(['test content'], { type: 'audio/mpeg' });

      // Mock recovery to throw error
      vi.spyOn(integrityChecker, 'attemptFileRecovery').mockImplementation(
        () => {
          throw new Error('Recovery failed');
        },
      );

      const result = await attemptFileRecovery(file, 'test.mp3');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should handle large files efficiently', async () => {
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB
      const file = new Blob([largeContent], { type: 'audio/mpeg' });

      const startTime = Date.now();
      const result = await validateFileIntegrity(file, 'large.mp3');
      const endTime = Date.now();

      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple recovery attempts', async () => {
      const file = new Blob(['test content'], { type: 'audio/mpeg' });

      const startTime = Date.now();
      const result = await attemptFileRecovery(file, 'test.mp3', {
        maxRetries: 3,
        retryDelay: 100,
      });
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});

