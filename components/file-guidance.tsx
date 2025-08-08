'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Info,
  Download,
  Upload,
  RefreshCw,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface FileGuidanceProps {
  issueType?:
    | 'upload'
    | 'download'
    | 'corruption'
    | 'format'
    | 'size'
    | 'network';
  severity?: 'info' | 'warning' | 'error';
  title?: string;
  message?: string;
  suggestions?: string[];
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  }>;
  className?: string;
}

export function FileGuidance({
  issueType = 'upload',
  severity = 'info',
  title,
  message,
  suggestions = [],
  actions = [],
  className,
}: FileGuidanceProps) {
  const getDefaultContent = () => {
    switch (issueType) {
      case 'upload':
        return {
          title: 'File Upload Issues',
          message: 'Common problems and solutions for file uploads',
          suggestions: [
            'Check your internet connection',
            'Ensure the file format is supported',
            'Try uploading a smaller file',
            'Verify the file is not corrupted',
          ],
        };
      case 'download':
        return {
          title: 'File Download Issues',
          message: 'Common problems and solutions for file downloads',
          suggestions: [
            'Check your internet connection',
            'Try downloading again',
            'Clear your browser cache',
            'Check available disk space',
          ],
        };
      case 'corruption':
        return {
          title: 'File Corruption Detected',
          message: 'The file appears to be corrupted or incomplete',
          suggestions: [
            'Try re-uploading from the original source',
            'Check if the file was interrupted during transfer',
            'Verify the file format is correct',
            'Contact support if the issue persists',
          ],
        };
      case 'format':
        return {
          title: 'Unsupported File Format',
          message: 'The file format is not supported by this application',
          suggestions: [
            'Convert the file to a supported format',
            'Use a different file with supported format',
            'Check the file extension and MIME type',
            'Try a different file from the same source',
          ],
        };
      case 'size':
        return {
          title: 'File Size Issue',
          message: 'The file size exceeds the allowed limit',
          suggestions: [
            'Compress the file to reduce size',
            'Use a smaller version of the file',
            'Split large files into smaller parts',
            'Contact support for large file options',
          ],
        };
      case 'network':
        return {
          title: 'Network Connection Issue',
          message: 'Network problems are affecting file operations',
          suggestions: [
            'Check your internet connection',
            'Try again in a few minutes',
            'Switch to a different network if possible',
            'Contact your network administrator',
          ],
        };
      default:
        return {
          title: 'File Operation Issue',
          message: 'An issue occurred with the file operation',
          suggestions: [
            'Try the operation again',
            'Check your connection and settings',
            'Contact support if the issue persists',
          ],
        };
    }
  };

  const defaultContent = getDefaultContent();
  const finalTitle = title || defaultContent.title;
  const finalMessage = message || defaultContent.message;
  const finalSuggestions =
    suggestions.length > 0 ? suggestions : defaultContent.suggestions;

  const getSeverityIcon = () => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card className={`${getSeverityColor()} ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getSeverityIcon()}
          {finalTitle}
        </CardTitle>
        <CardDescription>{finalMessage}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Issue Type Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {issueType} issue
          </Badge>
          <Badge
            variant={
              severity === 'error'
                ? 'destructive'
                : severity === 'warning'
                  ? 'secondary'
                  : 'default'
            }
          >
            {severity}
          </Badge>
        </div>

        <Separator />

        {/* Suggestions */}
        {finalSuggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Suggested Solutions
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {finalSuggestions.map((suggestion, index) => (
                <li
                  key={`suggestion-${index}-${suggestion.substring(0, 10)}`}
                  className="text-gray-700"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Actions */}
        {actions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <Button
                  key={`action-${index}-${action.label.substring(0, 10)}`}
                  onClick={action.action}
                  variant={action.variant || 'outline'}
                  size="sm"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Common Actions */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Common Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>

        {/* Additional Help */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Need More Help?</AlertTitle>
          <AlertDescription>
            If you continue to experience issues, please contact our support
            team with:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Description of the problem</li>
              <li>File type and size</li>
              <li>Steps to reproduce the issue</li>
              <li>Any error messages you see</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// Predefined guidance components for common scenarios
export function UploadGuidance({ className }: { className?: string }) {
  return (
    <FileGuidance issueType="upload" severity="info" className={className} />
  );
}

export function DownloadGuidance({ className }: { className?: string }) {
  return (
    <FileGuidance issueType="download" severity="info" className={className} />
  );
}

export function CorruptionGuidance({ className }: { className?: string }) {
  return (
    <FileGuidance
      issueType="corruption"
      severity="error"
      className={className}
    />
  );
}

export function FormatGuidance({ className }: { className?: string }) {
  return (
    <FileGuidance issueType="format" severity="warning" className={className} />
  );
}

export function SizeGuidance({ className }: { className?: string }) {
  return (
    <FileGuidance issueType="size" severity="warning" className={className} />
  );
}

export function NetworkGuidance({ className }: { className?: string }) {
  return (
    <FileGuidance issueType="network" severity="error" className={className} />
  );
}

