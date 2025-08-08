CREATE TABLE IF NOT EXISTS "AudioContext" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"audioFileId" uuid NOT NULL,
	"audioFileName" text NOT NULL,
	"audioFileUrl" text NOT NULL,
	"audioFileType" varchar(50) NOT NULL,
	"audioFileSize" integer,
	"audioDuration" integer,
	"audioTranscription" text,
	"audioMetadata" json,
	"contextSummary" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "AudioContextMessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audioContextId" uuid NOT NULL,
	"messageId" uuid NOT NULL,
	"timestamp" integer,
	"contextType" varchar NOT NULL,
	"contextData" json,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AudioContext" ADD CONSTRAINT "AudioContext_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AudioContextMessage" ADD CONSTRAINT "AudioContextMessage_audioContextId_AudioContext_id_fk" FOREIGN KEY ("audioContextId") REFERENCES "public"."AudioContext"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AudioContextMessage" ADD CONSTRAINT "AudioContextMessage_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
