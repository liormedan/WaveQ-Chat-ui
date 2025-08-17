import type { DocumentHandler } from '@/lib/artifacts/server';
import type { Session } from 'next-auth';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '@/lib/types';

export const textArtifactServer = {
  type: 'text',
  name: 'Text',
  handler: () => ({ success: true }),
};

export const textDocumentHandler: DocumentHandler<'text'> = {
  kind: 'text',
  onCreateDocument: async ({ id, title, dataStream, session }) => {
    // TODO: Implement text document creation
    dataStream.write({
      type: 'data-textDelta',
      data: 'Text document created',
      transient: true,
    });
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    // TODO: Implement text document update
    dataStream.write({
      type: 'data-textDelta',
      data: `Updated: ${description}`,
      transient: true,
    });
  },
};