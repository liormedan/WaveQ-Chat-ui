import type { DocumentHandler } from '@/lib/artifacts/server';
import type { Session } from 'next-auth';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '@/lib/types';

export const sheetArtifactServer = {
  type: 'sheet',
  name: 'Sheet',
  handler: () => ({ success: true }),
};

export const sheetDocumentHandler: DocumentHandler<'sheet'> = {
  kind: 'sheet',
  onCreateDocument: async ({ id, title, dataStream, session }) => {
    // TODO: Implement sheet document creation
    dataStream.write({
      type: 'data-sheetDelta',
      data: 'Sheet document created',
      transient: true,
    });
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    // TODO: Implement sheet document update
    dataStream.write({
      type: 'data-sheetDelta',
      data: `Updated: ${description}`,
      transient: true,
    });
  },
};