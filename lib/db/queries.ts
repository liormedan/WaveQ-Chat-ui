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

// Import both PostgreSQL and SQLite schemas
import {
  user as pgUser,
  chat as pgChat,
  type User as PGUser,
  document as pgDocument,
  type Suggestion as PGSuggestion,
  suggestion as pgSuggestion,
  message as pgMessage,
  vote as pgVote,
  type DBMessage as PGDBMessage,
  type Chat as PGChat,
  type ChatWithAudioContext as PGChatWithAudioContext,
  stream as pgStream,
  audioContext as pgAudioContext,
  audioContextMessage as pgAudioContextMessage,
  type AudioContext as PGAudioContext,
  type AudioContextMessage as PGAudioContextMessage,
  generatedAudio as pgGeneratedAudio,
  generatedAudioMessage as pgGeneratedAudioMessage,
  type GeneratedAudio as PGGeneratedAudio,
  type GeneratedAudioMessage as PGGeneratedAudioMessage,
} from './schema';

import {
  user as sqliteUser,
  chat as sqliteChat,
  type User as SQLiteUser,
  document as sqliteDocument,
  type Suggestion as SQLiteSuggestion,
  suggestion as sqliteSuggestion,
  message as sqliteMessage,
  vote as sqliteVote,
  type DBMessage as SQLiteDBMessage,
  type Chat as SQLiteChat,
  type ChatWithAudioContext as SQLiteChatWithAudioContext,
  stream as sqliteStream,
  audioContext as sqliteAudioContext,
  audioContextMessage as sqliteAudioContextMessage,
  type AudioContext as SQLiteAudioContext,
  type AudioContextMessage as SQLiteAudioContextMessage,
  generatedAudio as sqliteGeneratedAudio,
  generatedAudioMessage as sqliteGeneratedAudioMessage,
  type GeneratedAudio as SQLiteGeneratedAudio,
  type GeneratedAudioMessage as SQLiteGeneratedAudioMessage,
} from './schema-sqlite';

import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';

// Database connection with fallback for development
let client: any;
let db: any;
let isUsingSQLite = false;

try {
  if (
    process.env.POSTGRES_URL &&
    process.env.POSTGRES_URL !== 'your-postgres-url-here' &&
    process.env.POSTGRES_URL !== 'postgresql://user:password@host:port/database'
  ) {
    client = postgres(process.env.POSTGRES_URL);
    db = drizzle(client);
    isUsingSQLite = false;
  } else {
    // Fallback for development - use SQLite
    console.warn(
      '⚠️  No valid POSTGRES_URL found. Using SQLite database for development.',
    );
    const { db: sqliteDb, initializeDatabase } = await import('./sqlite');
    initializeDatabase();
    db = sqliteDb;
    isUsingSQLite = true;
  }
} catch (error) {
  console.error('❌ Database connection failed:', error);
  // Final fallback - use SQLite
  const { db: sqliteDb, initializeDatabase } = await import('./sqlite');
  initializeDatabase();
  db = sqliteDb;
  isUsingSQLite = true;
}

// Helper function to get the correct schema based on database type
function getSchema() {
  if (isUsingSQLite) {
    return {
      user: sqliteUser,
      chat: sqliteChat,
      message: sqliteMessage,
      vote: sqliteVote,
      document: sqliteDocument,
      suggestion: sqliteSuggestion,
      stream: sqliteStream,
      audioContext: sqliteAudioContext,
      audioContextMessage: sqliteAudioContextMessage,
      generatedAudio: sqliteGeneratedAudio,
      generatedAudioMessage: sqliteGeneratedAudioMessage,
    };
  } else {
    return {
      user: pgUser,
      chat: pgChat,
      message: pgMessage,
      vote: pgVote,
      document: pgDocument,
      suggestion: pgSuggestion,
      stream: pgStream,
      audioContext: pgAudioContext,
      audioContextMessage: pgAudioContextMessage,
      generatedAudio: pgGeneratedAudio,
      generatedAudioMessage: pgGeneratedAudioMessage,
    };
  }
}

export async function getUser(
  email: string,
): Promise<Array<SQLiteUser | PGUser>> {
  const schema = getSchema();
  try {
    return await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, email));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser(email: string, password: string) {
  const schema = getSchema();
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db
      .insert(schema.user)
      .values({ email, password: hashedPassword });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  const schema = getSchema();
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db
      .insert(schema.user)
      .values({
        id: generateUUID(),
        email,
        password,
      })
      .returning({
        id: schema.user.id,
        email: schema.user.email,
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
  const schema = getSchema();
  try {
    return await db.insert(schema.chat).values({
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
  const schema = getSchema();
  try {
    await db.delete(schema.vote).where(eq(schema.vote.chatId, id));
    await db.delete(schema.message).where(eq(schema.message.chatId, id));
    await db.delete(schema.stream).where(eq(schema.stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(schema.chat)
      .where(eq(schema.chat.id, id))
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
  const schema = getSchema();
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(schema.chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(schema.chat.userId, id))
            : eq(schema.chat.userId, id),
        )
        .orderBy(desc(schema.chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<PGChat | SQLiteChat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(schema.chat)
        .where(eq(schema.chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(
        gt(schema.chat.createdAt, selectedChat.createdAt),
      );
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(schema.chat)
        .where(eq(schema.chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(
        lt(schema.chat.createdAt, selectedChat.createdAt),
      );
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

export async function getChatsByUserIdWithAudioContext({
  id,
  limit,
  startingAfter,
  endingBefore,
  includeAudioContext = true,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
  includeAudioContext?: boolean;
}): Promise<{
  chats: Array<
    PGChat | SQLiteChat | PGChatWithAudioContext | SQLiteChatWithAudioContext
  >;
  hasMore: boolean;
}> {
  const schema = getSchema();
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(schema.chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(schema.chat.userId, id))
            : eq(schema.chat.userId, id),
        )
        .orderBy(desc(schema.chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<PGChat | SQLiteChat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(schema.chat)
        .where(eq(schema.chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(
        gt(schema.chat.createdAt, selectedChat.createdAt),
      );
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(schema.chat)
        .where(eq(schema.chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(
        lt(schema.chat.createdAt, selectedChat.createdAt),
      );
    } else {
      filteredChats = await query();
    }

    // If audio context is requested, fetch it for each chat
    if (includeAudioContext && filteredChats.length > 0) {
      try {
        const chatIds = filteredChats.map((chat) => chat.id);

        // Get audio contexts for all chats in one query
        const audioContexts = await db
          .select({
            chatId: schema.audioContext.chatId,
            audioFileName: schema.audioContext.audioFileName,
            audioFileUrl: schema.audioContext.audioFileUrl,
            audioFileType: schema.audioContext.audioFileType,
            audioDuration: schema.audioContext.audioDuration,
            contextSummary: schema.audioContext.contextSummary,
            audioTranscription: schema.audioContext.audioTranscription,
          })
          .from(schema.audioContext)
          .where(inArray(schema.audioContext.chatId, chatIds));

        // Group audio contexts by chat ID
        const audioContextsByChat = audioContexts.reduce(
          (acc: any, context: any) => {
            if (!acc[context.chatId]) {
              acc[context.chatId] = [];
            }
            acc[context.chatId].push(context);
            return acc;
          },
          {},
        );

        // Attach audio context information to chats
        filteredChats = filteredChats.map((chat) => ({
          ...chat,
          audioContexts: audioContextsByChat[chat.id] || [],
        }));
      } catch (audioError) {
        console.warn('Audio context table not found, skipping audio context data');
        // Continue without audio context data
        filteredChats = filteredChats.map((chat) => ({
          ...chat,
          audioContexts: [],
        }));
      }
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id with audio context',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  const schema = getSchema();
  try {
    const [selectedChat] = await db
      .select()
      .from(schema.chat)
      .where(eq(schema.chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<PGDBMessage | SQLiteDBMessage>;
}) {
  const schema = getSchema();
  try {
    return await db.insert(schema.message).values(messages);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  const schema = getSchema();
  try {
    return await db
      .select()
      .from(schema.message)
      .where(eq(schema.message.chatId, id))
      .orderBy(asc(schema.message.createdAt));
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
  const schema = getSchema();
  try {
    const [existingVote] = await db
      .select()
      .from(schema.vote)
      .where(and(eq(schema.vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(schema.vote)
        .set({ isUpvoted: type === 'up' })
        .where(
          and(
            eq(schema.vote.messageId, messageId),
            eq(schema.vote.chatId, chatId),
          ),
        );
    }
    return await db.insert(schema.vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  const schema = getSchema();
  try {
    return await db
      .select()
      .from(schema.vote)
      .where(eq(schema.vote.chatId, id));
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
  const schema = getSchema();
  try {
    return await db
      .insert(schema.document)
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
  const schema = getSchema();
  try {
    const documents = await db
      .select()
      .from(schema.document)
      .where(eq(schema.document.id, id))
      .orderBy(asc(schema.document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  const schema = getSchema();
  try {
    const [selectedDocument] = await db
      .select()
      .from(schema.document)
      .where(eq(schema.document.id, id))
      .orderBy(desc(schema.document.createdAt));

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
  const schema = getSchema();
  try {
    await db
      .delete(schema.suggestion)
      .where(
        and(
          eq(schema.suggestion.documentId, id),
          gt(schema.document.createdAt, timestamp),
        ),
      );

    return await db
      .delete(schema.document)
      .where(
        and(
          eq(schema.document.id, id),
          gt(schema.document.createdAt, timestamp),
        ),
      )
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
  suggestions: Array<PGSuggestion | SQLiteSuggestion>;
}) {
  const schema = getSchema();
  try {
    return await db.insert(schema.suggestion).values(suggestions);
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
  const schema = getSchema();
  try {
    return await db
      .select()
      .from(schema.suggestion)
      .where(and(eq(schema.suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  const schema = getSchema();
  try {
    return await db
      .select()
      .from(schema.message)
      .where(eq(schema.message.id, id));
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
  const schema = getSchema();
  try {
    const messagesToDelete = await db
      .select({ id: schema.message.id })
      .from(schema.message)
      .where(
        and(
          eq(schema.message.chatId, chatId),
          gte(schema.message.createdAt, timestamp),
        ),
      );

    const messageIds = messagesToDelete.map((message: any) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(schema.vote)
        .where(
          and(
            eq(schema.vote.chatId, chatId),
            inArray(schema.vote.messageId, messageIds),
          ),
        );

      return await db
        .delete(schema.message)
        .where(
          and(
            eq(schema.message.chatId, chatId),
            inArray(schema.message.id, messageIds),
          ),
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
  const schema = getSchema();
  try {
    return await db
      .update(schema.chat)
      .set({ visibility })
      .where(eq(schema.chat.id, chatId));
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
  const schema = getSchema();
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(schema.message.id) })
      .from(schema.message)
      .innerJoin(schema.chat, eq(schema.message.chatId, schema.chat.id))
      .where(
        and(
          eq(schema.chat.userId, id),
          gte(schema.message.createdAt, twentyFourHoursAgo),
          eq(schema.message.role, 'user'),
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
  const schema = getSchema();
  try {
    await db
      .insert(schema.stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  const schema = getSchema();
  try {
    const streamIds = await db
      .select({ id: schema.stream.id })
      .from(schema.stream)
      .where(eq(schema.stream.chatId, chatId))
      .orderBy(asc(schema.stream.createdAt))
      .execute();

    return streamIds.map(({ id }: { id: string }) => id);
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
  const schema = getSchema();
  try {
    const now = new Date();
    return await db.insert(schema.audioContext).values({
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
  const schema = getSchema();
  try {
    return await db
      .select()
      .from(schema.audioContext)
      .where(eq(schema.audioContext.chatId, chatId))
      .orderBy(desc(schema.audioContext.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get audio contexts by chat id',
    );
  }
}

export async function getAudioContextById({ id }: { id: string }) {
  const schema = getSchema();
  try {
    const [context] = await db
      .select()
      .from(schema.audioContext)
      .where(eq(schema.audioContext.id, id));
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
  const schema = getSchema();
  try {
    return await db
      .update(schema.audioContext)
      .set({
        audioTranscription,
        contextSummary,
        audioMetadata,
        updatedAt: new Date(),
      })
      .where(eq(schema.audioContext.id, id));
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
  const schema = getSchema();
  try {
    return await db.insert(schema.audioContextMessage).values({
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
  const schema = getSchema();
  try {
    return await db
      .select()
      .from(schema.audioContextMessage)
      .where(eq(schema.audioContextMessage.audioContextId, audioContextId))
      .orderBy(asc(schema.audioContextMessage.createdAt));
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
  const schema = getSchema();
  try {
    return await db
      .select()
      .from(schema.audioContextMessage)
      .where(eq(schema.audioContextMessage.messageId, messageId));
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
  const schema = getSchema();
  try {
    const now = new Date();
    return await db.insert(schema.generatedAudio).values({
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
  const schema = getSchema();
  try {
    return await db
      .select()
      .from(schema.generatedAudio)
      .where(eq(schema.generatedAudio.chatId, chatId))
      .orderBy(desc(schema.generatedAudio.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get generated audios by chat id',
    );
  }
}

export async function getGeneratedAudioById({ id }: { id: string }) {
  const schema = getSchema();
  try {
    const result = await db
      .select()
      .from(schema.generatedAudio)
      .where(eq(schema.generatedAudio.id, id));
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
  const schema = getSchema();
  try {
    return await db
      .update(schema.generatedAudio)
      .set({
        processingSteps,
        totalProcessingTime,
        qualityMetrics,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(schema.generatedAudio.id, id));
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
  const schema = getSchema();
  try {
    return await db.insert(schema.generatedAudioMessage).values({
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
  const schema = getSchema();
  try {
    return await db
      .select()
      .from(schema.generatedAudioMessage)
      .where(
        eq(schema.generatedAudioMessage.generatedAudioId, generatedAudioId),
      )
      .orderBy(asc(schema.generatedAudioMessage.createdAt));
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
  const schema = getSchema();
  try {
    return await db
      .select()
      .from(schema.generatedAudioMessage)
      .where(eq(schema.generatedAudioMessage.messageId, messageId));
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
  const schema = getSchema();
  try {
    let query = db
      .select()
      .from(schema.generatedAudio)
      .where(eq(schema.generatedAudio.chatId, chatId));

    // Apply filters
    if (processingType) {
      query = query.where(
        eq(schema.generatedAudio.processingType, processingType),
      );
    }

    if (dateRange) {
      query = query.where(
        and(
          gte(schema.generatedAudio.createdAt, dateRange.start),
          lte(schema.generatedAudio.createdAt, dateRange.end),
        ),
      );
    }

    if (status) {
      // For status filtering, we need to check the processing steps
      // This is a simplified implementation - in practice, you might want to add a status column
      if (status === 'completed') {
        // Filter for completed processing (all steps completed)
        query = query.where(
          sql`${schema.generatedAudio.processingSteps} @> '[{"status": "completed"}]'::jsonb`,
        );
      } else if (status === 'error') {
        // Filter for error status
        query = query.where(
          sql`${schema.generatedAudio.processingSteps} @> '[{"status": "error"}]'::jsonb`,
        );
      }
    }

    const results = await query
      .orderBy(desc(schema.generatedAudio.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.generatedAudio)
      .where(eq(schema.generatedAudio.chatId, chatId));

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
  const schema = getSchema();
  try {
    const stats = await db
      .select({
        totalProcessed: sql<number>`count(*)`,
        totalProcessingTime: sql<number>`sum(${schema.generatedAudio.totalProcessingTime})`,
        averageProcessingTime: sql<number>`avg(${schema.generatedAudio.totalProcessingTime})`,
        processingTypes: sql<string>`json_agg(distinct ${schema.generatedAudio.processingType})`,
        recentActivity: sql<number>`count(*) filter (where ${schema.generatedAudio.createdAt} > now() - interval '7 days')`,
      })
      .from(schema.generatedAudio)
      .where(eq(schema.generatedAudio.chatId, chatId));

    const typeStats = await db
      .select({
        processingType: schema.generatedAudio.processingType,
        count: sql<number>`count(*)`,
        avgTime: sql<number>`avg(${schema.generatedAudio.totalProcessingTime})`,
      })
      .from(schema.generatedAudio)
      .where(eq(schema.generatedAudio.chatId, chatId))
      .groupBy(schema.generatedAudio.processingType);

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
  const schema = getSchema();
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Get files to delete (older than cutoff date, but keep the most recent ones)
    const filesToDelete = await db
      .select({
        id: schema.generatedAudio.id,
        generatedAudioUrl: schema.generatedAudio.generatedAudioUrl,
      })
      .from(schema.generatedAudio)
      .where(
        and(
          eq(schema.generatedAudio.chatId, chatId),
          lt(schema.generatedAudio.createdAt, cutoffDate),
        ),
      )
      .orderBy(asc(schema.generatedAudio.createdAt))
      .limit(1000); // Safety limit

    // Keep the most recent files
    const recentFiles = await db
      .select({ id: schema.generatedAudio.id })
      .from(schema.generatedAudio)
      .where(eq(schema.generatedAudio.chatId, chatId))
      .orderBy(desc(schema.generatedAudio.createdAt))
      .limit(keepCount);

    const recentFileIds = recentFiles.map((f: any) => f.id);
    const filesToKeep = filesToDelete.filter((f: any) =>
      recentFileIds.includes(f.id),
    );
    const fileIds = filesToDelete
      .filter((f: any) => !recentFileIds.includes(f.id))
      .map((f: any) => f.id);

    if (fileIds.length === 0) {
      return { deletedCount: 0, filesDeleted: [] };
    }

    // Delete the files
    await db
      .delete(schema.generatedAudio)
      .where(inArray(schema.generatedAudio.id, fileIds));

    // Delete associated messages
    await db
      .delete(schema.generatedAudioMessage)
      .where(inArray(schema.generatedAudioMessage.generatedAudioId, fileIds));

    return {
      deletedCount: fileIds.length,
      filesDeleted: filesToDelete,
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
  const schema = getSchema();
  try {
    return await db
      .select()
      .from(schema.generatedAudioMessage)
      .where(
        and(
          eq(schema.generatedAudioMessage.generatedAudioId, generatedAudioId),
          eq(schema.generatedAudioMessage.messageType, 'download-request'),
        ),
      )
      .orderBy(desc(schema.generatedAudioMessage.createdAt));
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
  const schema = getSchema();
  try {
    return await db.insert(schema.generatedAudioMessage).values({
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
  const schema = getSchema();
  try {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const performance = await db
      .select({
        date: sql<string>`date(${schema.generatedAudio.createdAt})`,
        count: sql<number>`count(*)`,
        avgProcessingTime: sql<number>`avg(${schema.generatedAudio.totalProcessingTime})`,
        totalProcessingTime: sql<number>`sum(${schema.generatedAudio.totalProcessingTime})`,
      })
      .from(schema.generatedAudio)
      .where(
        and(
          eq(schema.generatedAudio.chatId, chatId),
          gte(schema.generatedAudio.createdAt, startDate),
        ),
      )
      .groupBy(sql`date(${schema.generatedAudio.createdAt})`)
      .orderBy(sql`date(${schema.generatedAudio.createdAt})`);

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
  const schema = getSchema();
  try {
    const usage = await db
      .select({
        totalFiles: sql<number>`count(*)`,
        totalSize: sql<number>`sum((${schema.generatedAudio.metadata}->>'fileSize')::bigint)`,
        avgFileSize: sql<number>`avg((${schema.generatedAudio.metadata}->>'fileSize')::bigint)`,
        oldestFile: sql<Date>`min(${schema.generatedAudio.createdAt})`,
        newestFile: sql<Date>`max(${schema.generatedAudio.createdAt})`,
      })
      .from(schema.generatedAudio)
      .where(eq(schema.generatedAudio.chatId, chatId));

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
