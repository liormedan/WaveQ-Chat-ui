'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileCheck,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  CheckCircle,
  Info,
} from 'lucide-react';
import {
  validateFileIntegrity,
  attemptFileRecovery,
  generateFileGuidance,
  type FileValidationResult,
  type FileRecoveryResult,
  type RecoveryOptions,
} from '@/lib/file-integrity';

interface FileIntegrityCheckerProps {
  file: File | Blob;
  filename: string;
  originalHash?: string;
  originalSize?: number;
  onValidationComplete?: (result: FileValidationResult) => void;
  onRecoveryComplete?: (result: FileRecoveryResult) => void;
  onFileRecovered?: (recoveredFile: Blob) => void;
  className?: string;
  showRecoveryOptions?: boolean;
  autoValidate?: boolean;
}

export function FileIntegrityChecker({
  file,
  filename,
  originalHash,
  originalSize,
  onValidationComplete,
  onRecoveryComplete,
  onFileRecovered,
  className,
  showRecoveryOptions = true,
  autoValidate = true,
}: FileIntegrityCheckerProps) {
  const [validationResult, setValidationResult] =
    useState<FileValidationResult | null>(null);
  const [recoveryResult, setRecoveryResult] =
    useState<FileRecoveryResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryOptions, setRecoveryOptions] = useState<RecoveryOptions>({
    maxRetries: 3,
    retryDelay: 1000,
    validateAfterRecovery: true,
    backupOriginal: true,
    notifyUser: true,
  });

  // Auto-validate on mount if enabled
  React.useEffect(() => {
    if (autoValidate && file) {
      handleValidate();
    }
  }, [file, autoValidate]);

  const handleValidate = useCallback(async () => {
    if (!file) return;

    setIsValidating(true);
    try {
      const result = await validateFileIntegrity(
        file,
        filename,
        originalHash,
        originalSize,
      );
      setValidationResult(result);
      onValidationComplete?.(result);
    } catch (error) {
      console.error('File validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  }, [file, filename, originalHash, originalSize, onValidationComplete]);

  const handleRecover = useCallback(async () => {
    if (!file || !validationResult?.integrityInfo.isCorrupted) return;

    setIsRecovering(true);
    try {
      const result = await attemptFileRecovery(file, filename, recoveryOptions);
      setRecoveryResult(result);
      onRecoveryComplete?.(result);

      if (result.success && result.recoveredFile) {
        onFileRecovered?.(result.recoveredFile);
      }
    } catch (error) {
      console.error('File recovery failed:', error);
    } finally {
      setIsRecovering(false);
    }
  }, [
    file,
    filename,
    validationResult,
    recoveryOptions,
    onRecoveryComplete,
    onFileRecovered,
  ]);

  const handleRetryValidation = useCallback(() => {
    setValidationResult(null);
    setRecoveryResult(null);
    handleValidate();
  }, [handleValidate]);

  if (!file) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            File Integrity Checker
          </CardTitle>
          <CardDescription>No file provided for validation</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const guidance = validationResult
    ? generateFileGuidance(validationResult)
    : null;
  const fileStats = {
    size: file.size,
    sizeInMB: file.size / (1024 * 1024),
    type: file.type,
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          File Integrity Checker
        </CardTitle>
        <CardDescription>
          Validating file integrity and providing recovery options
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* File Information */}
        <div className="space-y-2">
          <h4 className="font-medium">File Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Name: {filename}</div>
            <div>Size: {fileStats.sizeInMB.toFixed(2)} MB</div>
            <div>Type: {fileStats.type || 'Unknown'}</div>
            <div>
              Status:{' '}
              {validationResult
                ? validationResult.isValid
                  ? 'Valid'
                  : 'Issues Found'
                : 'Pending'}
            </div>
          </div>
        </div>

        <Separator />

        {/* Validation Progress */}
        {isValidating && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Validating file integrity...</span>
            </div>
            <Progress value={50} className="w-full" />
          </div>
        )}

        {/* Recovery Progress */}
        {isRecovering && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Attempting file recovery...</span>
            </div>
            <Progress value={75} className="w-full" />
          </div>
        )}

        {/* Validation Results */}
        {validationResult && !isValidating && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {validationResult.isValid
                  ? 'Validation Passed'
                  : 'Validation Failed'}
              </span>
            </div>

            {/* Integrity Information */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Integrity Details</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  Original Size:{' '}
                  {validationResult.integrityInfo.originalSize || 'Unknown'}
                </div>
                <div>
                  Current Size: {validationResult.integrityInfo.currentSize}
                </div>
                <div>
                  Hash Match:{' '}
                  {validationResult.integrityInfo.originalHash
                    ? validationResult.integrityInfo.currentHash ===
                      validationResult.integrityInfo.originalHash
                      ? 'Yes'
                      : 'No'
                    : 'N/A'}
                </div>
                <div>
                  Corrupted:{' '}
                  {validationResult.integrityInfo.isCorrupted ? 'Yes' : 'No'}
                </div>
              </div>
            </div>

            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Validation Errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {validationResult.errors.map((error, index) => (
                      <li
                        key={`error-${index}-${error.substring(0, 10)}`}
                        className="text-sm"
                      >
                        {error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Validation Warnings</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {validationResult.warnings.map((warning, index) => (
                      <li
                        key={`warning-${index}-${warning.substring(0, 10)}`}
                        className="text-sm"
                      >
                        {warning}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* User Guidance */}
            {guidance && (
              <Alert
                variant={
                  guidance.severity === 'error'
                    ? 'destructive'
                    : guidance.severity === 'warning'
                      ? 'default'
                      : 'default'
                }
              >
                <Info className="h-4 w-4" />
                <AlertTitle>{guidance.title}</AlertTitle>
                <AlertDescription>
                  <p className="mt-2">{guidance.message}</p>
                  {guidance.actions.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {guidance.actions.map((action, index) => (
                        <li
                          key={`action-${index}-${action.substring(0, 10)}`}
                          className="text-sm"
                        >
                          {action}
                        </li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Recovery Results */}
        {recoveryResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {recoveryResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {recoveryResult.success
                  ? 'Recovery Successful'
                  : 'Recovery Failed'}
              </span>
            </div>

            <div className="text-sm space-y-1">
              <div>Method: {recoveryResult.recoveryMethod}</div>
              <div>Attempts: {recoveryResult.attempts}</div>
              {recoveryResult.errors.length > 0 && (
                <div>
                  <span className="font-medium">Errors:</span>
                  <ul className="list-disc list-inside ml-2">
                    {recoveryResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleValidate}
            disabled={isValidating}
            variant="outline"
            size="sm"
          >
            {isValidating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Validating...
              </>
            ) : (
              <>
                <FileCheck className="h-4 w-4 mr-2" />
                Validate
              </>
            )}
          </Button>

          {validationResult &&
            !validationResult.isValid &&
            showRecoveryOptions && (
              <Button
                onClick={handleRecover}
                disabled={isRecovering}
                variant="outline"
                size="sm"
              >
                {isRecovering ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Recovering...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Attempt Recovery
                  </>
                )}
              </Button>
            )}

          {validationResult && (
            <Button
              onClick={handleRetryValidation}
              disabled={isValidating}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>

        {/* Recovery Options */}
        {showRecoveryOptions &&
          validationResult &&
          !validationResult.isValid && (
            <div className="space-y-2 pt-2">
              <h5 className="font-medium text-sm">Recovery Options</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-xs font-medium">
                    Max Retries
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={recoveryOptions.maxRetries}
                    onChange={(e) =>
                      setRecoveryOptions((prev) => ({
                        ...prev,
                        maxRetries: parseInt(e.target.value) || 3,
                      }))
                    }
                    className="w-full px-2 py-1 border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">
                    Retry Delay (ms)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    step="100"
                    value={recoveryOptions.retryDelay}
                    onChange={(e) =>
                      setRecoveryOptions((prev) => ({
                        ...prev,
                        retryDelay: parseInt(e.target.value) || 1000,
                      }))
                    }
                    className="w-full px-2 py-1 border rounded text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={recoveryOptions.validateAfterRecovery}
                    onChange={(e) =>
                      setRecoveryOptions((prev) => ({
                        ...prev,
                        validateAfterRecovery: e.target.checked,
                      }))
                    }
                  />
                  Validate after recovery
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={recoveryOptions.backupOriginal}
                    onChange={(e) =>
                      setRecoveryOptions((prev) => ({
                        ...prev,
                        backupOriginal: e.target.checked,
                      }))
                    }
                  />
                  Backup original
                </label>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
