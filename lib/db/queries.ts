import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
  sql,
  lte,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
  audioContext,
  audioContextMessage,
  type AudioContext,
  type AudioContextMessage,
  generatedAudio,
  generatedAudioMessage,
  type GeneratedAudio,
  type GeneratedAudioMessage,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}

// Audio Context Queries
export async function saveAudioContext({
  chatId,
  audioFileId,
  audioFileName,
  audioFileUrl,
  audioFileType,
  audioFileSize,
  audioDuration,
  audioTranscription,
  audioMetadata,
  contextSummary,
}: {
  chatId: string;
  audioFileId: string;
  audioFileName: string;
  audioFileUrl: string;
  audioFileType: string;
  audioFileSize?: number;
  audioDuration?: number;
  audioTranscription?: string;
  audioMetadata?: any;
  contextSummary?: string;
}) {
  try {
    const now = new Date();
    return await db.insert(audioContext).values({
      chatId,
      audioFileId,
      audioFileName,
      audioFileUrl,
      audioFileType,
      audioFileSize,
      audioDuration,
      audioTranscription,
      audioMetadata,
      contextSummary,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save audio context',
    );
  }
}

export async function getAudioContextsByChatId({ chatId }: { chatId: string }) {
  try {
    return await db
      .select()
      .from(audioContext)
      .where(eq(audioContext.chatId, chatId))
      .orderBy(desc(audioContext.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get audio contexts by chat id',
    );
  }
}

export async function getAudioContextById({ id }: { id: string }) {
  try {
    const [context] = await db
      .select()
      .from(audioContext)
      .where(eq(audioContext.id, id));
    return context;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get audio context by id',
    );
  }
}

export async function updateAudioContext({
  id,
  audioTranscription,
  contextSummary,
  audioMetadata,
}: {
  id: string;
  audioTranscription?: string;
  contextSummary?: string;
  audioMetadata?: any;
}) {
  try {
    return await db
      .update(audioContext)
      .set({
        audioTranscription,
        contextSummary,
        audioMetadata,
        updatedAt: new Date(),
      })
      .where(eq(audioContext.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update audio context',
    );
  }
}

export async function saveAudioContextMessage({
  audioContextId,
  messageId,
  timestamp,
  contextType,
  contextData,
}: {
  audioContextId: string;
  messageId: string;
  timestamp?: number;
  contextType: 'reference' | 'analysis' | 'question' | 'response';
  contextData?: any;
}) {
  try {
    return await db.insert(audioContextMessage).values({
      audioContextId,
      messageId,
      timestamp,
      contextType,
      contextData,
      createdAt: new Date(),
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save audio context message',
    );
  }
}

export async function getAudioContextMessagesByContextId({
  audioContextId,
}: {
  audioContextId: string;
}) {
  try {
    return await db
      .select()
      .from(audioContextMessage)
      .where(eq(audioContextMessage.audioContextId, audioContextId))
      .orderBy(asc(audioContextMessage.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get audio context messages by context id',
    );
  }
}

export async function getAudioContextMessagesByMessageId({
  messageId,
}: {
  messageId: string;
}) {
  try {
    return await db
      .select()
      .from(audioContextMessage)
      .where(eq(audioContextMessage.messageId, messageId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get audio context messages by message id',
    );
  }
}

// Generated Audio Queries
export async function saveGeneratedAudio({
  chatId,
  originalAudioId,
  originalAudioName,
  originalAudioUrl,
  generatedAudioName,
  generatedAudioUrl,
  processingType,
  processingSteps,
  totalProcessingTime,
  qualityMetrics,
  metadata,
}: {
  chatId: string;
  originalAudioId: string;
  originalAudioName: string;
  originalAudioUrl: string;
  generatedAudioName: string;
  generatedAudioUrl: string;
  processingType:
    | 'enhancement'
    | 'transcription'
    | 'translation'
    | 'noise-reduction'
    | 'format-conversion';
  processingSteps: any[];
  totalProcessingTime: number;
  qualityMetrics?: any;
  metadata: any;
}) {
  try {
    const now = new Date();
    return await db.insert(generatedAudio).values({
      chatId,
      originalAudioId,
      originalAudioName,
      originalAudioUrl,
      generatedAudioName,
      generatedAudioUrl,
      processingType,
      processingSteps,
      totalProcessingTime,
      qualityMetrics,
      metadata,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save generated audio',
    );
  }
}

export async function getGeneratedAudiosByChatId({
  chatId,
}: { chatId: string }) {
  try {
    return await db
      .select()
      .from(generatedAudio)
      .where(eq(generatedAudio.chatId, chatId))
      .orderBy(desc(generatedAudio.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get generated audios by chat id',
    );
  }
}

export async function getGeneratedAudioById({ id }: { id: string }) {
  try {
    const result = await db
      .select()
      .from(generatedAudio)
      .where(eq(generatedAudio.id, id));
    return result[0] || null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get generated audio by id',
    );
  }
}

export async function updateGeneratedAudio({
  id,
  processingSteps,
  totalProcessingTime,
  qualityMetrics,
  metadata,
}: {
  id: string;
  processingSteps?: any[];
  totalProcessingTime?: number;
  qualityMetrics?: any;
  metadata?: any;
}) {
  try {
    return await db
      .update(generatedAudio)
      .set({
        processingSteps,
        totalProcessingTime,
        qualityMetrics,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(generatedAudio.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update generated audio',
    );
  }
}

export async function saveGeneratedAudioMessage({
  generatedAudioId,
  messageId,
  messageType,
  metadata,
}: {
  generatedAudioId: string;
  messageId: string;
  messageType:
    | 'generation-request'
    | 'generation-complete'
    | 'download-request';
  metadata?: any;
}) {
  try {
    return await db.insert(generatedAudioMessage).values({
      generatedAudioId,
      messageId,
      messageType,
      metadata,
      createdAt: new Date(),
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save generated audio message',
    );
  }
}

export async function getGeneratedAudioMessagesByAudioId({
  generatedAudioId,
}: {
  generatedAudioId: string;
}) {
  try {
    return await db
      .select()
      .from(generatedAudioMessage)
      .where(eq(generatedAudioMessage.generatedAudioId, generatedAudioId))
      .orderBy(asc(generatedAudioMessage.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get generated audio messages by audio id',
    );
  }
}

export async function getGeneratedAudioMessagesByMessageId({
  messageId,
}: {
  messageId: string;
}) {
  try {
    return await db
      .select()
      .from(generatedAudioMessage)
      .where(eq(generatedAudioMessage.messageId, messageId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get generated audio messages by message id',
    );
  }
}

// Processing Results Management Queries

/**
 * Get processing history for a chat with pagination and filtering
 */
export async function getProcessingHistory({
  chatId,
  limit = 20,
  offset = 0,
  processingType,
  dateRange,
  status,
}: {
  chatId: string;
  limit?: number;
  offset?: number;
  processingType?: string;
  dateRange?: { start: Date; end: Date };
  status?: 'completed' | 'error' | 'processing';
}) {
  try {
    let query = db
      .select()
      .from(generatedAudio)
      .where(eq(generatedAudio.chatId, chatId));

    // Apply filters
    if (processingType) {
      query = query.where(eq(generatedAudio.processingType, processingType));
    }

    if (dateRange) {
      query = query.where(
        and(
          gte(generatedAudio.createdAt, dateRange.start),
          lte(generatedAudio.createdAt, dateRange.end),
        ),
      );
    }

    if (status) {
      // For status filtering, we need to check the processing steps
      // This is a simplified implementation - in practice, you might want to add a status column
      if (status === 'completed') {
        // Filter for completed processing (all steps completed)
        query = query.where(
          sql`${generatedAudio.processingSteps} @> '[{"status": "completed"}]'::jsonb`,
        );
      } else if (status === 'error') {
        // Filter for error status
        query = query.where(
          sql`${generatedAudio.processingSteps} @> '[{"status": "error"}]'::jsonb`,
        );
      }
    }

    const results = await query
      .orderBy(desc(generatedAudio.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(generatedAudio)
      .where(eq(generatedAudio.chatId, chatId));

    const countResult = await countQuery;
    const totalCount = countResult[0]?.count || 0;

    return {
      results,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get processing history',
    );
  }
}

/**
 * Get processing statistics for a chat
 */
export async function getProcessingStats({ chatId }: { chatId: string }) {
  try {
    const stats = await db
      .select({
        totalProcessed: sql<number>`count(*)`,
        totalProcessingTime: sql<number>`sum(${generatedAudio.totalProcessingTime})`,
        averageProcessingTime: sql<number>`avg(${generatedAudio.totalProcessingTime})`,
        processingTypes: sql<string>`json_agg(distinct ${generatedAudio.processingType})`,
        recentActivity: sql<number>`count(*) filter (where ${generatedAudio.createdAt} > now() - interval '7 days')`,
      })
      .from(generatedAudio)
      .where(eq(generatedAudio.chatId, chatId));

    const typeStats = await db
      .select({
        processingType: generatedAudio.processingType,
        count: sql<number>`count(*)`,
        avgTime: sql<number>`avg(${generatedAudio.totalProcessingTime})`,
      })
      .from(generatedAudio)
      .where(eq(generatedAudio.chatId, chatId))
      .groupBy(generatedAudio.processingType);

    return {
      overall: stats[0] || {
        totalProcessed: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 0,
        processingTypes: [],
        recentActivity: 0,
      },
      byType: typeStats,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get processing statistics',
    );
  }
}

/**
 * Clean up old generated audio files
 */
export async function cleanupOldGeneratedAudio({
  chatId,
  olderThanDays = 30,
  keepCount = 10,
}: {
  chatId: string;
  olderThanDays?: number;
  keepCount?: number;
}) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Get files to delete (older than cutoff date, but keep the most recent ones)
    const filesToDelete = await db
      .select({
        id: generatedAudio.id,
        generatedAudioUrl: generatedAudio.generatedAudioUrl,
      })
      .from(generatedAudio)
      .where(
        and(
          eq(generatedAudio.chatId, chatId),
          lt(generatedAudio.createdAt, cutoffDate),
        ),
      )
      .orderBy(asc(generatedAudio.createdAt))
      .limit(1000); // Safety limit

    // Keep the most recent files
    const recentFiles = await db
      .select({ id: generatedAudio.id })
      .from(generatedAudio)
      .where(eq(generatedAudio.chatId, chatId))
      .orderBy(desc(generatedAudio.createdAt))
      .limit(keepCount);

    const recentFileIds = new Set(recentFiles.map((f) => f.id));
    const filesToActuallyDelete = filesToDelete.filter(
      (f) => !recentFileIds.has(f.id),
    );

    if (filesToActuallyDelete.length === 0) {
      return { deletedCount: 0, filesDeleted: [] };
    }

    const fileIds = filesToActuallyDelete.map((f) => f.id);

    // Delete the files
    await db.delete(generatedAudio).where(inArray(generatedAudio.id, fileIds));

    // Delete associated messages
    await db
      .delete(generatedAudioMessage)
      .where(inArray(generatedAudioMessage.generatedAudioId, fileIds));

    return {
      deletedCount: filesToActuallyDelete.length,
      filesDeleted: filesToActuallyDelete,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to cleanup old generated audio',
    );
  }
}

/**
 * Get download history for a generated audio file
 */
export async function getDownloadHistory({
  generatedAudioId,
}: {
  generatedAudioId: string;
}) {
  try {
    return await db
      .select()
      .from(generatedAudioMessage)
      .where(
        and(
          eq(generatedAudioMessage.generatedAudioId, generatedAudioId),
          eq(generatedAudioMessage.messageType, 'download-request'),
        ),
      )
      .orderBy(desc(generatedAudioMessage.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get download history',
    );
  }
}

/**
 * Mark a generated audio file as downloaded
 */
export async function markAsDownloaded({
  generatedAudioId,
  messageId,
  downloadFormat,
  downloadMetadata,
}: {
  generatedAudioId: string;
  messageId: string;
  downloadFormat: string;
  downloadMetadata?: any;
}) {
  try {
    return await db.insert(generatedAudioMessage).values({
      generatedAudioId,
      messageId,
      messageType: 'download-request',
      metadata: {
        downloadFormat,
        downloadTimestamp: new Date(),
        ...downloadMetadata,
      },
      createdAt: new Date(),
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to mark as downloaded',
    );
  }
}

/**
 * Get processing performance metrics
 */
export async function getProcessingPerformance({
  chatId,
  timeRange = '30d',
}: {
  chatId: string;
  timeRange?: '7d' | '30d' | '90d';
}) {
  try {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const performance = await db
      .select({
        date: sql<string>`date(${generatedAudio.createdAt})`,
        count: sql<number>`count(*)`,
        avgProcessingTime: sql<number>`avg(${generatedAudio.totalProcessingTime})`,
        totalProcessingTime: sql<number>`sum(${generatedAudio.totalProcessingTime})`,
      })
      .from(generatedAudio)
      .where(
        and(
          eq(generatedAudio.chatId, chatId),
          gte(generatedAudio.createdAt, startDate),
        ),
      )
      .groupBy(sql`date(${generatedAudio.createdAt})`)
      .orderBy(sql`date(${generatedAudio.createdAt})`);

    return performance;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get processing performance',
    );
  }
}

/**
 * Get storage usage statistics
 */
export async function getStorageUsage({ chatId }: { chatId: string }) {
  try {
    const usage = await db
      .select({
        totalFiles: sql<number>`count(*)`,
        totalSize: sql<number>`sum((${generatedAudio.metadata}->>'fileSize')::bigint)`,
        avgFileSize: sql<number>`avg((${generatedAudio.metadata}->>'fileSize')::bigint)`,
        oldestFile: sql<Date>`min(${generatedAudio.createdAt})`,
        newestFile: sql<Date>`max(${generatedAudio.createdAt})`,
      })
      .from(generatedAudio)
      .where(eq(generatedAudio.chatId, chatId));

    return (
      usage[0] || {
        totalFiles: 0,
        totalSize: 0,
        avgFileSize: 0,
        oldestFile: null,
        newestFile: null,
      }
    );
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get storage usage',
    );
  }
}
