'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeneratedAudioDisplay, type GeneratedAudioFile } from './generated-audio-display';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  AudioIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FilterIcon,
  DownloadIcon,
  GridIcon,
  ListIcon,
} from './icons';
import { cn } from '@/lib/utils';

interface GeneratedAudioGalleryProps {
  generatedAudios: GeneratedAudioFile[];
  chatId: string;
  className?: string;
  onDownloadAll?: () => void;
  onDownloadComplete?: (downloadInfo: any[]) => void;
  onDownloadError?: (error: string) => void;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'enhancement' | 'transcription' | 'translation' | 'noise-reduction' | 'format-conversion';

export const GeneratedAudioGallery: React.FC<GeneratedAudioGalleryProps> = ({
  generatedAudios,
  chatId,
  className,
  onDownloadAll,
  onDownloadComplete,
  onDownloadError,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'type'>('newest');

  const getProcessingTypeLabel = (type: string) => {
    const labels = {
      enhancement: 'Enhancement',
      transcription: 'Transcription',
      translation: 'Translation',
      'noise-reduction': 'Noise Reduction',
      'format-conversion': 'Format Conversion',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const filteredAndSortedAudios = React.useMemo(() => {
    let filtered = generatedAudios;

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(audio => audio.processingDetails.processingType === filter);
    }

    // Apply sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'type':
          return a.processingDetails.processingType.localeCompare(b.processingDetails.processingType);
        default:
          return 0;
      }
    });

    return filtered;
  }, [generatedAudios, filter, sortBy]);

  const processingTypeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    generatedAudios.forEach(audio => {
      const type = audio.processingDetails.processingType;
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [generatedAudios]);

  if (generatedAudios.length === 0) {
    return null;
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AudioIcon size={16} />
            <CardTitle className="text-sm font-medium">
              Generated Audio Files ({generatedAudios.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-6 w-6 p-0 rounded-r-none"
              >
                <ListIcon size={12} />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-6 w-6 p-0 rounded-l-none"
              >
                <GridIcon size={12} />
              </Button>
            </div>
            
            {onDownloadAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadAll}
                className="h-6 px-2 text-xs"
              >
                <DownloadIcon size={12} />
                Download All
              </Button>
            )}
          </div>
        </div>

        {/* Filters and Sort */}
        {isExpanded && (
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <FilterIcon size={12} />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="all">All Types ({generatedAudios.length})</option>
                {Object.entries(processingTypeCounts).map(([type, count]) => (
                  <option key={type} value={type}>
                    {getProcessingTypeLabel(type)} ({count})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'type')}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="type">By Type</option>
              </select>
            </div>
          </div>
        )}
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent className="space-y-4">
              {filteredAndSortedAudios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AudioIcon size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No audio files match the current filter.</p>
                </div>
              ) : (
                <div
                  className={cn({
                    'space-y-4': viewMode === 'list',
                    'grid grid-cols-1 md:grid-cols-2 gap-4': viewMode === 'grid',
                  })}
                >
                  {filteredAndSortedAudios.map((generatedAudio, index) => (
                    <motion.div
                      key={generatedAudio.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <GeneratedAudioDisplay
                        generatedAudio={generatedAudio}
                        chatId={chatId}
                        onDownloadComplete={onDownloadComplete}
                        onDownloadError={onDownloadError}
                        className={cn({
                          'border-0 shadow-none': viewMode === 'list',
                        })}
                      />
                      {viewMode === 'list' && index < filteredAndSortedAudios.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};