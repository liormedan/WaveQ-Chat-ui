'use client';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon, AudioIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { AudioPlayer } from './audio-player';
import { AudioPlayerWithControls } from './audio-player-with-controls';
import {
  MessageStatusIndicator,
  type MessageStatus,
} from './message-status-indicator';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
import { GeneratedAudioDisplay } from './generated-audio-display';
import { GeneratedAudioGallery } from './generated-audio-gallery';
import { useGeneratedAudios } from '@/hooks/use-generated-audios';
import { useAudioProcessingStatus } from '@/hooks/use-audio-processing-status';

// Type narrowing is handled by TypeScript's control flow analysis
// The AI SDK provides proper discriminated unions for tool calls

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === 'file',
  );

  const audioAttachments = attachmentsFromMessage.filter((attachment) =>
    attachment.mediaType?.startsWith('audio/'),
  );

  const nonAudioAttachments = attachmentsFromMessage.filter(
    (attachment) => !attachment.mediaType?.startsWith('audio/'),
  );

  // Get generated audios for this chat
  const { generatedAudios } = useGeneratedAudios({ chatId });

  // Get audio processing status for this message
  const { hasActiveProcessing, getStatusForAudio } = useAudioProcessingStatus(
    message.id,
  );

  // Determine message status based on content and processing state
  const getMessageStatus = (): MessageStatus => {
    if (isLoading) return 'processing';

    // Check if message has audio attachments being processed
    if (audioAttachments.length > 0) {
      // For user messages with audio, check if any audio is being processed
      if (message.role === 'user' && hasActiveProcessing) {
        return 'processing';
      }

      // Check for any audio processing errors
      const hasErrors = audioAttachments.some((attachment) => {
        const status = getStatusForAudio(attachment.url);
        return status?.status === 'error';
      });

      if (hasErrors) return 'error';

      // If user message with audio and no active processing, it's completed
      if (message.role === 'user') {
        return 'completed';
      }
    }

    // Check if assistant message has reasoning or generated content
    if (
      message.role === 'assistant' &&
      message.parts.some((part) => part.type === 'reasoning')
    ) {
      return 'completed';
    }

    // Check if there are generated audios for this message
    if (message.role === 'assistant' && generatedAudios.length > 0) {
      return 'completed';
    }

    return 'idle';
  };

  useDataStream();

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div
            className={cn('flex flex-col gap-4 w-full', {
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            })}
          >
            {/* Audio Attachments */}
            {audioAttachments.length > 0 && (
              <div
                data-testid={`message-audio-attachments`}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AudioIcon size={12} />
                  <span>
                    {audioAttachments.length === 1
                      ? 'Audio file attached'
                      : `${audioAttachments.length} audio files attached`}
                  </span>
                </div>
                {audioAttachments.map((attachment) => {
                  const processingStatus = getStatusForAudio(attachment.url);
                  return (
                    <div key={attachment.url} className="space-y-2">
                      <AudioPlayerWithControls
                        src={attachment.url}
                        title={attachment.filename ?? 'Audio File'}
                        className="max-w-md"
                        showControls={true}
                        showWaveform={false}
                        metadata={{
                          format:
                            attachment.mediaType?.split('/')[1] || 'audio',
                          // These would be extracted from actual file metadata
                          duration: undefined,
                          fileSize: undefined,
                          bitrate: undefined,
                        }}
                        onDownload={() => {
                          // Handle download functionality
                          console.log('Download audio:', attachment.url);
                        }}
                        onShare={() => {
                          // Handle share functionality
                          console.log('Share audio:', attachment.url);
                        }}
                      />
                      {processingStatus &&
                        processingStatus.status !== 'idle' && (
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {processingStatus.status === 'processing' && (
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                            )}
                            <span>
                              {processingStatus.status === 'uploading' &&
                                'Uploading...'}
                              {processingStatus.status === 'analyzing' &&
                                'Analyzing audio...'}
                              {processingStatus.status === 'processing' &&
                                'Processing...'}
                              {processingStatus.status === 'completed' &&
                                'Processing completed'}
                              {processingStatus.status === 'error' &&
                                `Error: ${processingStatus.error}`}
                            </span>
                            {processingStatus.progress && (
                              <span>
                                ({Math.round(processingStatus.progress)}%)
                              </span>
                            )}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Non-Audio Attachments */}
            {nonAudioAttachments.length > 0 && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row justify-end gap-2"
              >
                {nonAudioAttachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={{
                      name: attachment.filename ?? 'file',
                      contentType: attachment.mediaType,
                      url: attachment.url,
                    }}
                  />
                ))}
              </div>
            )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning' && part.text?.trim().length > 0) {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.text}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4', {
                          'chat-message-user px-4 py-3 rounded-2xl':
                            message.role === 'user',
                        })}
                      >
                        <Markdown>{sanitizeText(part.text)}</Markdown>

                        {/* Audio context info for user messages */}
                        {message.role === 'user' &&
                          audioAttachments.length > 0 && (
                            <div className="text-xs opacity-75 border-t border-primary-foreground/20 pt-2 mt-2">
                              Audio files will be analyzed and processed by the
                              AI assistant.
                            </div>
                          )}

                        {/* Generated Audio Display */}
                        {message.role === 'assistant' &&
                          generatedAudios.length > 0 && (
                            <GeneratedAudioGallery
                              generatedAudios={generatedAudios}
                              chatId={chatId}
                              onDownloadAll={() => {
                                // Handle download all functionality
                                console.log(
                                  'Download all generated audios for chat:',
                                  chatId,
                                );
                              }}
                              onDownloadComplete={(downloadInfo) => {
                                console.log(
                                  'Download completed:',
                                  downloadInfo,
                                );
                              }}
                              onDownloadError={(error) => {
                                console.error('Download error:', error);
                              }}
                            />
                          )}
                      </div>
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />

                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        regenerate={regenerate}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-getWeather') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  return (
                    <div key={toolCallId} className="skeleton">
                      <Weather />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;
                  return (
                    <div key={toolCallId}>
                      <Weather weatherAtLocation={output} />
                    </div>
                  );
                }
              }

              if (type === 'tool-createDocument') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <DocumentPreview isReadonly={isReadonly} args={input} />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentPreview
                        isReadonly={isReadonly}
                        result={output}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-updateDocument') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;

                  return (
                    <div key={toolCallId}>
                      <DocumentToolCall
                        type="update"
                        args={input}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentToolResult
                        type="update"
                        result={output}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-requestSuggestions') {
                const { toolCallId, state } = part;

                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <DocumentToolCall
                        type="request-suggestions"
                        args={input}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }

                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentToolResult
                        type="request-suggestions"
                        result={output}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }
              }
            })}

            {/* Message Status Indicator */}
            <MessageStatusIndicator
              status={getMessageStatus()}
              message={
                audioAttachments.length > 0 && message.role === 'user'
                  ? `Audio file${audioAttachments.length > 1 ? 's' : ''} ready for processing`
                  : generatedAudios.length > 0 && message.role === 'assistant'
                    ? `Generated ${generatedAudios.length} audio file${generatedAudios.length > 1 ? 's' : ''}`
                    : undefined
              }
              className="mt-2"
            />

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return false;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
