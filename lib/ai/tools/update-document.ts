import { z } from 'zod';
import { tool, type UIMessageStreamWriter } from 'ai';
import { getDocumentById, saveDocument } from '@/lib/db/queries';
import type { Session } from 'next-auth';
import type { ChatMessage } from '@/lib/types';

interface UpdateDocumentProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const updateDocumentTool = ({ session, dataStream }: UpdateDocumentProps) =>
  tool({
    description: 'Update a document with the given description.',
    inputSchema: z.object({
      id: z.string().describe('The ID of the document to update'),
      description: z
        .string()
        .describe('The description of changes that need to be made'),
    }),
    execute: async ({ id, description }) => {
      const document = await getDocumentById({ id });

      if (!document) {
        return {
          error: 'Document not found',
        };
      }

      dataStream.write({
        type: 'data-clear',
        data: null,
        transient: true,
      });

      // TODO: Implement proper document update logic
      // For now, just save the document with updated content
      await saveDocument({
        id,
        content: description,
        title: document.title,
        kind: document.kind,
        userId: session.user.id,
      });

      return {
        id,
        title: document.title,
        kind: document.kind,
        content: 'Document update requested. This feature is not yet fully implemented.',
      };
    },
  });
