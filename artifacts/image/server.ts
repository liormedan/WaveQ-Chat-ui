import type { DocumentHandler } from '@/lib/artifacts/server';
import type { Session } from 'next-auth';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '@/lib/types';

export const imageArtifactServer = {
  type: 'image',
  name: 'Image',
  handler: () => ({ success: true }),
};

export const imageDocumentHandler: DocumentHandler<'image'> = {
  kind: 'image',
  onCreateDocument: async ({ id, title, dataStream, session }) => {
    // TODO: Implement image document creation
    dataStream.write({
      type: 'data-imageDelta',
      data: 'Image document created',
      transient: true,
    });
  },
  onUpdateDocument: async ({ document, description, dataStream, session }) => {
    // TODO: Implement image document update
    dataStream.write({
      type: 'data-imageDelta',
      data: `Updated: ${description}`,
      transient: true,
    });
  },
};