import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema-sqlite';

// Create SQLite database for development
const sqlite = new Database('dev.db');
export const db = drizzle(sqlite, { schema });

// Initialize tables if they don't exist
export function initializeDatabase() {
  try {
    // Create tables manually for development
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT NOT NULL,
        "password" TEXT
      );

      CREATE TABLE IF NOT EXISTS "Chat" (
        "id" TEXT PRIMARY KEY,
        "createdAt" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "visibility" TEXT NOT NULL DEFAULT 'private'
      );

      CREATE TABLE IF NOT EXISTS "Message_v2" (
        "id" TEXT PRIMARY KEY,
        "chatId" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "parts" TEXT NOT NULL,
        "attachments" TEXT NOT NULL,
        "createdAt" TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Vote_v2" (
        "chatId" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "isUpvoted" INTEGER NOT NULL,
        PRIMARY KEY ("chatId", "messageId")
      );

      CREATE TABLE IF NOT EXISTS "Document" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "kind" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "createdAt" TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Suggestion" (
        "id" TEXT PRIMARY KEY,
        "documentId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "Stream" (
        "id" TEXT PRIMARY KEY,
        "chatId" TEXT NOT NULL,
        "createdAt" TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "AudioContext" (
        "id" TEXT PRIMARY KEY,
        "chatId" TEXT NOT NULL,
        "audioFileId" TEXT NOT NULL,
        "audioFileName" TEXT NOT NULL,
        "audioFileUrl" TEXT NOT NULL,
        "audioFileType" TEXT NOT NULL,
        "audioFileSize" INTEGER,
        "audioDuration" INTEGER,
        "audioTranscription" TEXT,
        "audioMetadata" TEXT,
        "contextSummary" TEXT,
        "createdAt" TEXT NOT NULL,
        "updatedAt" TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "AudioContextMessage" (
        "id" TEXT PRIMARY KEY,
        "audioContextId" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "timestamp" INTEGER,
        "contextType" TEXT NOT NULL,
        "contextData" TEXT,
        "createdAt" TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "GeneratedAudio" (
        "id" TEXT PRIMARY KEY,
        "chatId" TEXT NOT NULL,
        "originalAudioId" TEXT NOT NULL,
        "originalAudioName" TEXT NOT NULL,
        "originalAudioUrl" TEXT NOT NULL,
        "generatedAudioName" TEXT NOT NULL,
        "generatedAudioUrl" TEXT NOT NULL,
        "processingType" TEXT NOT NULL,
        "processingSteps" TEXT NOT NULL,
        "totalProcessingTime" INTEGER NOT NULL,
        "qualityMetrics" TEXT,
        "metadata" TEXT NOT NULL,
        "createdAt" TEXT NOT NULL,
        "updatedAt" TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "GeneratedAudioMessage" (
        "id" TEXT PRIMARY KEY,
        "generatedAudioId" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "messageType" TEXT NOT NULL,
        "metadata" TEXT,
        "createdAt" TEXT NOT NULL
      );
    `);

    console.log('✅ SQLite database initialized');
  } catch (error) {
    console.error('❌ Failed to initialize SQLite database:', error);
  }
}
