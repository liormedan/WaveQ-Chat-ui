'use client';

import { LoaderIcon, CheckCircleFillIcon, WarningIcon } from './icons';
import { cn } from '@/lib/utils';

export type MessageStatus = 'processing' | 'completed' | 'error' | 'idle';

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  message?: string;
  className?: string;
}

export const MessageStatusIndicator = ({
  status,
  message,
  className,
}: MessageStatusIndicatorProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return {
          icon: <LoaderIcon size={14} />,
          text: message || 'Processing...',
          className: 'text-blue-600 dark:text-blue-400',
        };
      case 'completed':
        return {
          icon: <CheckCircleFillIcon size={14} />,
          text: message || 'Completed',
          className: 'text-green-600 dark:text-green-400',
        };
      case 'error':
        return {
          icon: <WarningIcon size={14} />,
          text: message || 'Error occurred',
          className: 'text-red-600 dark:text-red-400',
        };
      case 'idle':
      default:
        return {
          icon: null,
          text: message || '',
          className: 'text-muted-foreground',
        };
    }
  };

  const config = getStatusConfig();

  if (status === 'idle' && !message) {
    return null;
  }

  return (
    <div
      data-testid="message-status-indicator"
      className={cn(
        'flex items-center gap-2 text-xs',
        config.className,
        className,
      )}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
};
