import { createHash } from 'node:crypto';
import { errorHandler, handleUnknownError } from '@/lib/error-handling';

// File Integrity Types
export interface FileIntegrityInfo {
  filename: string;
  originalSize: number;
  currentSize: number;
  originalHash: string;
  currentHash: string;
  isCorrupted: boolean;
  corruptionType?:
    | 'size_mismatch'
    | 'hash_mismatch'
    | 'format_invalid'
    | 'partial_download';
  recoveryAttempts: number;
  lastChecked: Date;
  metadata?: Record<string, any>;
}

export interface FileValidationResult {
  isValid: boolean;
  integrityInfo: FileIntegrityInfo;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface RecoveryOptions {
  maxRetries: number;
  retryDelay: number;
  validateAfterRecovery: boolean;
  backupOriginal: boolean;
  notifyUser: boolean;
}

export interface FileRecoveryResult {
  success: boolean;
  recoveredFile?: Blob;
  integrityInfo: FileIntegrityInfo;
  recoveryMethod: string;
  attempts: number;
  errors: string[];
}

// Supported file types and their validation rules
export const FILE_VALIDATION_RULES = {
  audio: {
    extensions: ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac', '.webm'],
    mimeTypes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/flac',
      'audio/mp4',
      'audio/ogg',
      'audio/aac',
      'audio/webm',
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    minSize: 1024, // 1KB
  },
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    minSize: 1024, // 1KB
  },
  document: {
    extensions: ['.pdf', '.txt', '.doc', '.docx'],
    mimeTypes: [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
    minSize: 1024, // 1KB
  },
} as const;

// File Integrity Checker Class
export class FileIntegrityChecker {
  private static instance: FileIntegrityChecker;

  private constructor() {}

  public static getInstance(): FileIntegrityChecker {
    if (!FileIntegrityChecker.instance) {
      FileIntegrityChecker.instance = new FileIntegrityChecker();
    }
    return FileIntegrityChecker.instance;
  }

  // Calculate file hash for integrity checking
  public async calculateFileHash(file: Blob): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const hash = createHash('sha256');
      hash.update(new Uint8Array(buffer));
      return hash.digest('hex');
    } catch (error) {
      throw new Error(`Failed to calculate file hash: ${error}`);
    }
  }

  // Validate file integrity
  public async validateFile(
    file: Blob,
    filename: string,
    originalHash?: string,
    originalSize?: number,
  ): Promise<FileValidationResult> {
    const integrityInfo: FileIntegrityInfo = {
      filename,
      originalSize: originalSize || 0,
      currentSize: file.size,
      originalHash: originalHash || '',
      currentHash: '',
      isCorrupted: false,
      recoveryAttempts: 0,
      lastChecked: new Date(),
    };

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    try {
      // Calculate current hash
      integrityInfo.currentHash = await this.calculateFileHash(file);

      // Check file size
      if (originalSize && file.size !== originalSize) {
        integrityInfo.isCorrupted = true;
        integrityInfo.corruptionType = 'size_mismatch';
        errors.push(
          `File size mismatch: expected ${originalSize} bytes, got ${file.size} bytes`,
        );
        suggestions.push(
          'The file may have been corrupted during transfer. Try re-uploading.',
        );
      }

      // Check file hash
      if (originalHash && integrityInfo.currentHash !== originalHash) {
        integrityInfo.isCorrupted = true;
        integrityInfo.corruptionType = 'hash_mismatch';
        errors.push('File hash mismatch detected');
        suggestions.push(
          'The file content has been modified. Try re-uploading from the original source.',
        );
      }

      // Validate file format
      const formatValidation = this.validateFileFormat(file, filename);
      if (!formatValidation.isValid) {
        integrityInfo.isCorrupted = true;
        integrityInfo.corruptionType = 'format_invalid';
        errors.push(...formatValidation.errors);
        suggestions.push(
          'Check if the file format is supported and not corrupted.',
        );
      }

      // Check for partial downloads
      if (file.size < 1024) {
        warnings.push('File size is very small, may be incomplete');
        suggestions.push('Verify the file was downloaded completely.');
      }

      // Add format-specific warnings
      const fileType = this.getFileType(filename);
      if (fileType && file.size > FILE_VALIDATION_RULES[fileType].maxSize) {
        warnings.push(
          `File size exceeds recommended limit for ${fileType} files`,
        );
        suggestions.push(
          'Consider compressing the file or using a smaller version.',
        );
      }
    } catch (error) {
      const errorInfo = handleUnknownError(error, {
        action: 'file_validation',
        additionalData: { filename, fileSize: file.size },
      });
      errors.push(`Validation failed: ${errorInfo.userMessage}`);
    }

    return {
      isValid: !integrityInfo.isCorrupted && errors.length === 0,
      integrityInfo,
      errors,
      warnings,
      suggestions,
    };
  }

  // Validate file format
  private validateFileFormat(
    file: Blob,
    filename: string,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const fileType = this.getFileType(filename);
    const extension = this.getFileExtension(filename);

    if (!fileType) {
      errors.push('Unsupported file type');
      return { isValid: false, errors };
    }

    const rules = FILE_VALIDATION_RULES[fileType];

    // Check file extension
    if (!rules.extensions.includes(extension.toLowerCase())) {
      errors.push(`Invalid file extension: ${extension}`);
    }

    // Check MIME type
    if (!rules.mimeTypes.includes(file.type)) {
      errors.push(`Invalid MIME type: ${file.type}`);
    }

    // Check file size
    if (file.size > rules.maxSize) {
      errors.push(
        `File size exceeds maximum allowed size: ${rules.maxSize} bytes`,
      );
    }

    if (file.size < rules.minSize) {
      errors.push(`File size is too small: ${file.size} bytes`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Get file type based on extension
  private getFileType(
    filename: string,
  ): keyof typeof FILE_VALIDATION_RULES | null {
    const extension = this.getFileExtension(filename).toLowerCase();

    for (const [type, rules] of Object.entries(FILE_VALIDATION_RULES)) {
      if (rules.extensions.includes(extension)) {
        return type as keyof typeof FILE_VALIDATION_RULES;
      }
    }

    return null;
  }

  // Get file extension
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  }

  // Attempt file recovery
  public async attemptFileRecovery(
    file: Blob,
    filename: string,
    options: Partial<RecoveryOptions> = {},
  ): Promise<FileRecoveryResult> {
    const defaultOptions: RecoveryOptions = {
      maxRetries: 3,
      retryDelay: 1000,
      validateAfterRecovery: true,
      backupOriginal: true,
      notifyUser: true,
    };

    const recoveryOptions = { ...defaultOptions, ...options };
    const errors: string[] = [];
    let attempts = 0;
    let recoveredFile: Blob | undefined;

    // Initial validation
    const initialValidation = await this.validateFile(file, filename);
    const integrityInfo = initialValidation.integrityInfo;

    if (initialValidation.isValid) {
      return {
        success: true,
        recoveredFile: file,
        integrityInfo,
        recoveryMethod: 'no_recovery_needed',
        attempts: 0,
        errors: [],
      };
    }

    // Recovery attempts
    while (attempts < recoveryOptions.maxRetries) {
      attempts++;
      integrityInfo.recoveryAttempts = attempts;

      try {
        // Try different recovery methods based on corruption type
        switch (integrityInfo.corruptionType) {
          case 'size_mismatch':
            recoveredFile = await this.recoverSizeMismatch(file, filename);
            break;
          case 'hash_mismatch':
            recoveredFile = await this.recoverHashMismatch(file, filename);
            break;
          case 'format_invalid':
            recoveredFile = await this.recoverFormatInvalid(file, filename);
            break;
          case 'partial_download':
            recoveredFile = await this.recoverPartialDownload(file, filename);
            break;
          default:
            recoveredFile = await this.recoverGeneric(file, filename);
        }

        if (recoveredFile) {
          // Validate recovered file
          if (recoveryOptions.validateAfterRecovery) {
            const validation = await this.validateFile(recoveredFile, filename);
            if (validation.isValid) {
              return {
                success: true,
                recoveredFile,
                integrityInfo: validation.integrityInfo,
                recoveryMethod: `recovery_attempt_${attempts}`,
                attempts,
                errors: [],
              };
            }
          } else {
            return {
              success: true,
              recoveredFile,
              integrityInfo,
              recoveryMethod: `recovery_attempt_${attempts}`,
              attempts,
              errors: [],
            };
          }
        }

        // Wait before next attempt
        if (attempts < recoveryOptions.maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, recoveryOptions.retryDelay),
          );
        }
      } catch (error) {
        const errorInfo = handleUnknownError(error, {
          action: 'file_recovery',
          additionalData: { filename, attempt: attempts },
        });
        errors.push(
          `Recovery attempt ${attempts} failed: ${errorInfo.userMessage}`,
        );
      }
    }

    return {
      success: false,
      integrityInfo,
      recoveryMethod: 'failed',
      attempts,
      errors,
    };
  }

  // Recovery methods for different corruption types
  private async recoverSizeMismatch(
    file: Blob,
    filename: string,
  ): Promise<Blob | undefined> {
    // For size mismatch, try to validate if the current file is actually valid
    const validation = await this.validateFile(file, filename);
    if (validation.isValid) {
      return file; // File might be valid despite size mismatch
    }
    return undefined;
  }

  private async recoverHashMismatch(
    file: Blob,
    filename: string,
  ): Promise<Blob | undefined> {
    // For hash mismatch, try to repair common issues
    try {
      // Try to create a new blob with the same content
      const arrayBuffer = await file.arrayBuffer();
      return new Blob([arrayBuffer], { type: file.type });
    } catch (error) {
      return undefined;
    }
  }

  private async recoverFormatInvalid(
    file: Blob,
    filename: string,
  ): Promise<Blob | undefined> {
    // For format issues, try to fix MIME type
    const fileType = this.getFileType(filename);
    if (fileType) {
      const rules = FILE_VALIDATION_RULES[fileType];
      const correctMimeType = rules.mimeTypes[0];
      return new Blob([file], { type: correctMimeType });
    }
    return undefined;
  }

  private async recoverPartialDownload(
    file: Blob,
    filename: string,
  ): Promise<Blob | undefined> {
    // For partial downloads, check if the file is still usable
    if (file.size > 1024) {
      const validation = await this.validateFile(file, filename);
      if (validation.isValid) {
        return file;
      }
    }
    return undefined;
  }

  private async recoverGeneric(
    file: Blob,
    filename: string,
  ): Promise<Blob | undefined> {
    // Generic recovery: try to create a new blob
    try {
      const arrayBuffer = await file.arrayBuffer();
      return new Blob([arrayBuffer], { type: file.type });
    } catch (error) {
      return undefined;
    }
  }

  // Generate user guidance for file issues
  public generateUserGuidance(validationResult: FileValidationResult): {
    title: string;
    message: string;
    actions: string[];
    severity: 'info' | 'warning' | 'error';
  } {
    const { errors, warnings, suggestions, integrityInfo } = validationResult;

    if (errors.length === 0 && warnings.length === 0) {
      return {
        title: 'File Validation Successful',
        message: 'Your file has passed all integrity checks.',
        actions: ['Proceed with upload/download'],
        severity: 'info',
      };
    }

    if (errors.length > 0) {
      return {
        title: 'File Integrity Issues Detected',
        message: `Found ${errors.length} issue(s) with your file that may prevent successful processing.`,
        actions: [
          'Try re-uploading the file from the original source',
          'Check if the file is corrupted or incomplete',
          'Verify the file format is supported',
          'Contact support if the issue persists',
        ],
        severity: 'error',
      };
    }

    if (warnings.length > 0) {
      return {
        title: 'File Validation Warnings',
        message: `Found ${warnings.length} warning(s) with your file. The file may still work but could have issues.`,
        actions: [
          'Review the warnings before proceeding',
          'Consider using a different file if available',
          'Monitor for any processing errors',
        ],
        severity: 'warning',
      };
    }

    return {
      title: 'File Validation Complete',
      message:
        'File validation completed with some suggestions for improvement.',
      actions: suggestions,
      severity: 'info',
    };
  }

  // Check if file is likely corrupted based on common indicators
  public isLikelyCorrupted(file: Blob, filename: string): boolean {
    // Check for common corruption indicators
    const indicators = [
      file.size === 0,
      file.size < 1024, // Very small files are suspicious
      !file.type || file.type === 'application/octet-stream',
      filename.includes('corrupted') || filename.includes('error'),
    ];

    return indicators.some((indicator) => indicator);
  }

  // Get file statistics for monitoring
  public getFileStats(
    file: Blob,
    filename: string,
  ): {
    size: number;
    type: string;
    extension: string;
    fileType: string | null;
    isValidFormat: boolean;
    sizeInMB: number;
  } {
    const extension = this.getFileExtension(filename);
    const fileType = this.getFileType(filename);
    const isValidFormat = fileType !== null;

    return {
      size: file.size,
      type: file.type,
      extension,
      fileType,
      isValidFormat,
      sizeInMB: file.size / (1024 * 1024),
    };
  }
}

// Convenience functions
export const fileIntegrityChecker = FileIntegrityChecker.getInstance();

// Async wrapper for file validation
export async function validateFileIntegrity(
  file: Blob,
  filename: string,
  originalHash?: string,
  originalSize?: number,
): Promise<FileValidationResult> {
  return fileIntegrityChecker.validateFile(
    file,
    filename,
    originalHash,
    originalSize,
  );
}

// Async wrapper for file recovery
export async function attemptFileRecovery(
  file: Blob,
  filename: string,
  options?: Partial<RecoveryOptions>,
): Promise<FileRecoveryResult> {
  return fileIntegrityChecker.attemptFileRecovery(file, filename, options);
}

// Generate user guidance
export function generateFileGuidance(validationResult: FileValidationResult) {
  return fileIntegrityChecker.generateUserGuidance(validationResult);
}
