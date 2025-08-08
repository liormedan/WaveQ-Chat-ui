import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Create SQLite database for development
const sqlite = new Database('dev.db');
export const db = drizzle(sqlite, { schema });

// Initialize tables if they don't exist
export function initializeDatabase() {
  try {
    // Create tables manually for development
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        "email" TEXT NOT NULL,
        "password" TEXT
      );

      CREATE TABLE IF NOT EXISTS "Chat" (
        "id" TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "title" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "visibility" TEXT NOT NULL DEFAULT 'private',
        FOREIGN KEY ("userId") REFERENCES "User"("id")
      );

      CREATE TABLE IF NOT EXISTS "Message_v2" (
        "id" TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        "chatId" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "parts" TEXT NOT NULL,
        "attachments" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("chatId") REFERENCES "Chat"("id")
      );

      CREATE TABLE IF NOT EXISTS "AudioContext" (
        "id" TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
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
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("chatId") REFERENCES "Chat"("id")
      );

      CREATE TABLE IF NOT EXISTS "GeneratedAudio" (
        "id" TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
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
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("chatId") REFERENCES "Chat"("id")
      );
    `);

    console.log('✅ SQLite database initialized');
  } catch (error) {
    console.error('❌ Failed to initialize SQLite database:', error);
  }
}
