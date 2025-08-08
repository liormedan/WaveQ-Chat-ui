import type { InferSelectModel } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  real,
  blob,
} from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('User', {
  id: text('id').primaryKey().notNull(),
  email: text('email').notNull(),
  password: text('password'),
});

export type User = InferSelectModel<typeof user>;

export const chat = sqliteTable('Chat', {
  id: text('id').primaryKey().notNull(),
  createdAt: text('createdAt').notNull(),
  title: text('title').notNull(),
  userId: text('userId').notNull(),
  visibility: text('visibility').notNull().default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

// Extended Chat type with audio context information
export type ChatWithAudioContext = Chat & {
  audioContexts: Array<{
    chatId: string;
    audioFileName: string;
    audioFileUrl: string;
    audioFileType: string;
    audioDuration: number | null;
    contextSummary: string | null;
    audioTranscription: string | null;
  }>;
};

export const message = sqliteTable('Message_v2', {
  id: text('id').primaryKey().notNull(),
  chatId: text('chatId').notNull(),
  role: text('role').notNull(),
  parts: text('parts').notNull(), // JSON stored as text
  attachments: text('attachments').notNull(), // JSON stored as text
  createdAt: text('createdAt').notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const vote = sqliteTable('Vote_v2', {
  chatId: text('chatId').notNull(),
  messageId: text('messageId').notNull(),
  isUpvoted: integer('isUpvoted', { mode: 'boolean' }).notNull(),
});

export type Vote = InferSelectModel<typeof vote>;

export const document = sqliteTable('Document', {
  id: text('id').primaryKey().notNull(),
  title: text('title').notNull(),
  kind: text('kind').notNull(),
  content: text('content').notNull(),
  userId: text('userId').notNull(),
  createdAt: text('createdAt').notNull(),
});

export type Document = InferSelectModel<typeof document>;

export const suggestion = sqliteTable('Suggestion', {
  id: text('id').primaryKey().notNull(),
  documentId: text('documentId').notNull(),
  content: text('content').notNull(),
  createdAt: text('createdAt').notNull(),
});

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = sqliteTable('Stream', {
  id: text('id').primaryKey().notNull(),
  chatId: text('chatId').notNull(),
  createdAt: text('createdAt').notNull(),
});

export type Stream = InferSelectModel<typeof stream>;

export const audioContext = sqliteTable('AudioContext', {
  id: text('id').primaryKey().notNull(),
  chatId: text('chatId').notNull(),
  audioFileId: text('audioFileId').notNull(),
  audioFileName: text('audioFileName').notNull(),
  audioFileUrl: text('audioFileUrl').notNull(),
  audioFileType: text('audioFileType').notNull(),
  audioFileSize: integer('audioFileSize'),
  audioDuration: integer('audioDuration'),
  audioTranscription: text('audioTranscription'),
  audioMetadata: text('audioMetadata'), // JSON stored as text
  contextSummary: text('contextSummary'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export type AudioContext = InferSelectModel<typeof audioContext>;

export const audioContextMessage = sqliteTable('AudioContextMessage', {
  id: text('id').primaryKey().notNull(),
  audioContextId: text('audioContextId').notNull(),
  messageId: text('messageId').notNull(),
  timestamp: integer('timestamp'),
  contextType: text('contextType').notNull(),
  contextData: text('contextData'), // JSON stored as text
  createdAt: text('createdAt').notNull(),
});

export type AudioContextMessage = InferSelectModel<typeof audioContextMessage>;

export const generatedAudio = sqliteTable('GeneratedAudio', {
  id: text('id').primaryKey().notNull(),
  chatId: text('chatId').notNull(),
  originalAudioId: text('originalAudioId').notNull(),
  originalAudioName: text('originalAudioName').notNull(),
  originalAudioUrl: text('originalAudioUrl').notNull(),
  generatedAudioName: text('generatedAudioName').notNull(),
  generatedAudioUrl: text('generatedAudioUrl').notNull(),
  processingType: text('processingType').notNull(),
  processingSteps: text('processingSteps').notNull(), // JSON stored as text
  totalProcessingTime: integer('totalProcessingTime').notNull(),
  qualityMetrics: text('qualityMetrics'), // JSON stored as text
  metadata: text('metadata').notNull(), // JSON stored as text
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export type GeneratedAudio = InferSelectModel<typeof generatedAudio>;

export const generatedAudioMessage = sqliteTable('GeneratedAudioMessage', {
  id: text('id').primaryKey().notNull(),
  generatedAudioId: text('generatedAudioId').notNull(),
  messageId: text('messageId').notNull(),
  messageType: text('messageType').notNull(),
  metadata: text('metadata'), // JSON stored as text
  createdAt: text('createdAt').notNull(),
});

export type GeneratedAudioMessage = InferSelectModel<
  typeof generatedAudioMessage
>;
