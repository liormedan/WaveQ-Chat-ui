import type { DocumentHandler } from '@/lib/artifacts/server';
import type { Session } from 'next-auth';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '@/lib/types';

export const codeArtifactServer = {
  type: 'code',
  name: 'Code',
  handler: () => ({ success: true }),
};

export const codeDocumentHandler: DocumentHandler<'code'> = {
  kind: 'code',
  onCreateDocument: async ({ id, title, dataStream, session }) => {
    // TODO: Implement code document creation
    dataStream.write({
      type: 'data-codeDelta',
      data: 'Code document created',
      transient: true,
    });
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    // TODO: Implement code document update
    dataStream.write({
      type: 'data-codeDelta',
      data: `Updated: ${description}`,
      transient: true,
    });
  },
};