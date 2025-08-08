'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  WifiIcon,
  WifiOffIcon,
  AlertTriangleIcon,
  RefreshIcon,
  ClockIcon,
  CheckCircleIcon,
  XIcon,
  InfoIcon,
} from './icons';
import { cn } from '@/lib/utils';
import { useNetworkRecovery } from '@/lib/network-recovery/use-network-recovery';
import type { NetworkStatus } from '@/lib/network-recovery';

// Network status indicator props
interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  showQueue?: boolean;
  className?: string;
  variant?: 'compact' | 'detailed' | 'banner';
}

// Network status colors and icons
const networkStatusConfig = {
  online: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: WifiIcon,
    label: 'Online',
  },
  offline: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: WifiOffIcon,
    label: 'Offline',
  },
  degraded: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: AlertTriangleIcon,
    label: 'Degraded',
  },
  unknown: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: InfoIcon,
    label: 'Unknown',
  },
};

export function NetworkStatusIndicator({
  showDetails = false,
  showQueue = true,
  className,
  variant = 'compact',
}: NetworkStatusIndicatorProps) {
  const {
    networkStatus,
    isOnline,
    isOffline,
    isDegraded,
    queueStats,
    clearQueue,
  } = useNetworkRecovery();
  const [showQueueDetails, setShowQueueDetails] = useState(false);

  const config = networkStatusConfig[networkStatus];
  const IconComponent = config.icon;

  const handleClearQueue = () => {
    clearQueue();
  };

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <IconComponent
          size={16}
          className={cn('flex-shrink-0', config.color)}
        />
        <span className={cn('text-sm font-medium', config.color)}>
          {config.label}
        </span>
        {showQueue && queueStats.queueSize > 0 && (
          <Badge variant="secondary" className="text-xs">
            {queueStats.queueSize}
          </Badge>
        )}
      </div>
    );
  }

  if (variant === 'banner') {
    if (isOnline) return null; // Don't show banner when online

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={cn(
            'fixed top-0 left-0 right-0 z-50 p-3 border-b',
            config.bgColor,
            config.borderColor,
          )}
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <IconComponent size={20} className={config.color} />
              <div>
                <p className={cn('font-medium', config.color)}>
                  {isOffline ? 'You are offline' : 'Network connection is slow'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isOffline
                    ? 'Some features may be unavailable'
                    : 'Requests may take longer than usual'}
                </p>
              </div>
            </div>
            {queueStats.queueSize > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {queueStats.queueSize} pending
                </Badge>
                <Button size="sm" variant="outline" onClick={handleClearQueue}>
                  Clear Queue
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Detailed variant
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconComponent size={18} className={config.color} />
          Network Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant={isOnline ? 'default' : 'destructive'}
              className={cn(
                isOnline
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800',
              )}
            >
              {config.label}
            </Badge>
            {isDegraded && (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800"
              >
                Slow Connection
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.location.reload()}
          >
            <RefreshIcon size={14} className="mr-1" />
            Refresh
          </Button>
        </div>

        {/* Queue Information */}
        {showQueue && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockIcon size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium">Request Queue</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowQueueDetails(!showQueueDetails)}
              >
                {showQueueDetails ? 'Hide' : 'Show'} Details
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Queued Requests</span>
                <span className="font-medium">{queueStats.queueSize}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Processing</span>
                <span className="font-medium">
                  {queueStats.processingCount}
                </span>
              </div>

              {queueStats.queueSize > 0 && (
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearQueue}
                  >
                    <XIcon size={14} className="mr-1" />
                    Clear Queue
                  </Button>
                  <Button size="sm" variant="outline">
                    <RefreshIcon size={14} className="mr-1" />
                    Retry All
                  </Button>
                </div>
              )}
            </div>

            {/* Queue Details */}
            <AnimatePresence>
              {showQueueDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-2 border-t"
                >
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      • Requests are automatically retried when connection is
                      restored
                    </p>
                    <p>• Failed requests are queued for later retry</p>
                    <p>• Queue is limited to prevent memory issues</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Additional Details */}
        {showDetails && (
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Connection Type</span>
              <span className="font-medium">
                {navigator.connection?.effectiveType || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Last Check</span>
              <span className="font-medium">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Network status badge component
interface NetworkStatusBadgeProps {
  status?: NetworkStatus;
  showIcon?: boolean;
  className?: string;
}

export function NetworkStatusBadge({
  status,
  showIcon = true,
  className,
}: NetworkStatusBadgeProps) {
  const { networkStatus } = useNetworkRecovery();
  const currentStatus = status || networkStatus;
  const config = networkStatusConfig[currentStatus];
  const IconComponent = config.icon;

  return (
    <Badge
      variant={currentStatus === 'online' ? 'default' : 'secondary'}
      className={cn(
        'flex items-center gap-1',
        currentStatus === 'online' && 'bg-green-100 text-green-800',
        currentStatus === 'offline' && 'bg-red-100 text-red-800',
        currentStatus === 'degraded' && 'bg-yellow-100 text-yellow-800',
        className,
      )}
    >
      {showIcon && <IconComponent size={12} />}
      {config.label}
    </Badge>
  );
}

// Network recovery controls component
interface NetworkRecoveryControlsProps {
  className?: string;
}

export function NetworkRecoveryControls({
  className,
}: NetworkRecoveryControlsProps) {
  const { isOnline, queueStats, clearQueue, retryRequest } =
    useNetworkRecovery();

  const handleRetryAll = async () => {
    // This would need to be implemented to retry all queued requests
    console.info('Retrying all queued requests');
  };

  if (isOnline && queueStats.queueSize === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {!isOnline && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          <RefreshIcon size={14} className="mr-1" />
          Retry Connection
        </Button>
      )}

      {queueStats.queueSize > 0 && (
        <>
          <Button size="sm" variant="outline" onClick={handleRetryAll}>
            <RefreshIcon size={14} className="mr-1" />
            Retry All ({queueStats.queueSize})
          </Button>
          <Button size="sm" variant="outline" onClick={clearQueue}>
            <XIcon size={14} className="mr-1" />
            Clear Queue
          </Button>
        </>
      )}
    </div>
  );
}

// Network-aware loading component
interface NetworkAwareLoadingProps {
  isLoading: boolean;
  isOnline: boolean;
  children: React.ReactNode;
  offlineMessage?: string;
  className?: string;
}

export function NetworkAwareLoading({
  isLoading,
  isOnline,
  children,
  offlineMessage = 'Network is offline. Please check your connection.',
  className,
}: NetworkAwareLoadingProps) {
  if (!isOnline) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center space-y-2">
          <WifiOffIcon size={24} className="mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{offlineMessage}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
