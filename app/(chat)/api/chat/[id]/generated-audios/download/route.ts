import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/(auth)/auth.config';
import { getGeneratedAudio } from '@/lib/services/generated-audio-service';
import {
  validateFileIntegrity,
  fileIntegrityChecker,
} from '@/lib/file-integrity';
import { withErrorHandling } from '@/lib/error-handling';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatId = params.id;
    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { audioIds, format = 'mp3', batch = false } = body;

    if (!audioIds || !Array.isArray(audioIds) || audioIds.length === 0) {
      return NextResponse.json(
        { error: 'Audio IDs are required' },
        { status: 400 },
      );
    }

    // Validate format
    const validFormats = ['mp3', 'wav', 'flac', 'm4a', 'ogg'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format specified' },
        { status: 400 },
      );
    }

    // Get generated audio data
    const audioData = [];
    for (const audioId of audioIds) {
      const audio = await getGeneratedAudio(audioId);
      if (!audio) {
        return NextResponse.json(
          { error: `Audio with ID ${audioId} not found` },
          { status: 404 },
        );
      }
      audioData.push(audio);
    }

    // Generate download URLs and metadata
    const downloadData = audioData.map((audio) => {
      const timestamp = new Date(audio.createdAt).toISOString().split('T')[0];
      const processingType = audio.processingDetails.processingType;
      const originalName = audio.originalAudioName.replace(/\.[^/.]+$/, '');

      // Create filename with metadata
      const filename = `${originalName}_${processingType}_${timestamp}.${format}`;

      return {
        id: audio.id,
        originalName: audio.originalAudioName,
        generatedName: audio.generatedAudioName,
        filename,
        url: audio.generatedAudioUrl,
        metadata: {
          format: audio.metadata.format,
          bitrate: audio.metadata.bitrate,
          sampleRate: audio.metadata.sampleRate,
          channels: audio.metadata.channels,
          duration: audio.metadata.duration,
          fileSize: audio.metadata.fileSize,
          processingType,
          processingTime: audio.processingDetails.totalProcessingTime,
          qualityMetrics: audio.processingDetails.qualityMetrics,
        },
      };
    });

    if (batch && downloadData.length > 1) {
      // For batch downloads, return a ZIP file
      return NextResponse.json({
        success: true,
        type: 'batch',
        data: downloadData,
        message: `Prepared ${downloadData.length} files for download`,
      });
    } else {
      // For single file downloads, return direct download info
      const downloadInfo = downloadData[0];
      return NextResponse.json({
        success: true,
        type: 'single',
        data: downloadInfo,
        message: 'File ready for download',
      });
    }
  } catch (error) {
    console.error('Error processing download request:', error);
    return NextResponse.json(
      { error: 'Failed to process download request' },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withErrorHandling(
    async () => {
      const session = await getServerSession(authConfig);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const chatId = params.id;
      const { searchParams } = new URL(request.url);
      const audioId = searchParams.get('audioId');
      const format = searchParams.get('format') || 'mp3';

      if (!audioId) {
        return NextResponse.json(
          { error: 'Audio ID is required' },
          { status: 400 },
        );
      }

      // Validate format
      const validFormats = ['mp3', 'wav', 'flac', 'm4a', 'ogg'];
      if (!validFormats.includes(format)) {
        return NextResponse.json(
          { error: 'Invalid format specified' },
          { status: 400 },
        );
      }

      // Get generated audio data
      const audio = await getGeneratedAudio(audioId);
      if (!audio) {
        return NextResponse.json({ error: 'Audio not found' }, { status: 404 });
      }

      // Generate filename with metadata
      const timestamp = new Date(audio.createdAt).toISOString().split('T')[0];
      const processingType = audio.processingDetails.processingType;
      const originalName = audio.originalAudioName.replace(/\.[^/.]+$/, '');
      const filename = `${originalName}_${processingType}_${timestamp}.${format}`;

      // Fetch the audio file
      const response = await fetch(audio.generatedAudioUrl);

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch audio file' },
          { status: 500 },
        );
      }

      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], {
        type: getContentType(format),
      });

      // Perform file integrity validation
      const integrityValidation = await validateFileIntegrity(
        audioBlob,
        filename,
      );

      if (!integrityValidation.isValid) {
        return NextResponse.json(
          {
            error: 'Downloaded file integrity check failed',
            details: {
              errors: integrityValidation.errors,
              warnings: integrityValidation.warnings,
              suggestions: integrityValidation.suggestions,
              integrityInfo: integrityValidation.integrityInfo,
            },
          },
          { status: 500 },
        );
      }

      // Check if file is likely corrupted
      if (fileIntegrityChecker.isLikelyCorrupted(audioBlob, filename)) {
        return NextResponse.json(
          {
            error: 'Downloaded file appears to be corrupted or incomplete',
            details: {
              warnings: integrityValidation.warnings,
              suggestions: integrityValidation.suggestions,
            },
          },
          { status: 500 },
        );
      }

      // Return the file with integrity headers
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': getContentType(format),
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': audioBuffer.byteLength.toString(),
          'X-File-Integrity-Hash':
            integrityValidation.integrityInfo.currentHash,
          'X-File-Integrity-Validated': 'true',
          'X-File-Integrity-Warnings':
            integrityValidation.warnings.length.toString(),
        },
      });
    },
    {
      action: 'file_download',
      additionalData: { audioId, format },
    },
  );
}

function getContentType(format: string): string {
  const contentTypes = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
  };
  return contentTypes[format as keyof typeof contentTypes] || 'audio/mpeg';
}
