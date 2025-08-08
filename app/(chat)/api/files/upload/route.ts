import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import {
  validateFileIntegrity,
  fileIntegrityChecker,
} from '@/lib/file-integrity';
import { withErrorHandling } from '@/lib/error-handling';

// Enhanced file validation schema with integrity checking
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 50 * 1024 * 1024, {
      message: 'File size should be less than 50MB',
    })
    .refine(
      (file) => {
        const allowedTypes = [
          'audio/mpeg',
          'audio/mp3',
          'audio/wav',
          'audio/flac',
          'audio/mp4',
          'audio/ogg',
          'audio/aac',
          'audio/webm',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
        ];
        return allowedTypes.includes(file.type);
      },
      {
        message:
          'Unsupported file type. Please use supported audio, image, or document formats.',
      },
    ),
});

export async function POST(request: Request) {
  return withErrorHandling(
    async () => {
      const session = await auth();

      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (request.body === null) {
        return new Response('Request body is empty', { status: 400 });
      }

      const formData = await request.formData();
      const file = formData.get('file') as Blob;

      if (!file) {
        return NextResponse.json(
          { error: 'No file uploaded' },
          { status: 400 },
        );
      }

      const validatedFile = FileSchema.safeParse({ file });

      if (!validatedFile.success) {
        const errorMessage = validatedFile.error.errors
          .map((error) => error.message)
          .join(', ');

        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      // Get filename from formData since Blob doesn't have name property
      const filename = (formData.get('file') as File).name;

      // Perform file integrity validation
      const integrityValidation = await validateFileIntegrity(file, filename);

      if (!integrityValidation.isValid) {
        return NextResponse.json(
          {
            error: 'File integrity check failed',
            details: {
              errors: integrityValidation.errors,
              warnings: integrityValidation.warnings,
              suggestions: integrityValidation.suggestions,
              integrityInfo: integrityValidation.integrityInfo,
            },
          },
          { status: 400 },
        );
      }

      // Check if file is likely corrupted
      if (fileIntegrityChecker.isLikelyCorrupted(file, filename)) {
        return NextResponse.json(
          {
            error: 'File appears to be corrupted or incomplete',
            details: {
              warnings: integrityValidation.warnings,
              suggestions: integrityValidation.suggestions,
            },
          },
          { status: 400 },
        );
      }

      const fileBuffer = await file.arrayBuffer();

      try {
        const data = await put(`${filename}`, fileBuffer, {
          access: 'public',
        });

        // Return success with integrity information
        return NextResponse.json({
          ...data,
          integrity: {
            hash: integrityValidation.integrityInfo.currentHash,
            size: file.size,
            validated: true,
            warnings: integrityValidation.warnings,
          },
        });
      } catch (error) {
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
      }
    },
    {
      action: 'file_upload',
      additionalData: { filename: (formData?.get('file') as File)?.name },
    },
  );
}
