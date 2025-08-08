import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/(auth)/auth.config';
import { getGeneratedAudioById, markAsDownloaded } from '@/lib/db/queries';

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
    const { audioId, format = 'mp3', messageId } = body;

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

    // Get the generated audio file
    const audio = await getGeneratedAudioById({ id: audioId });
    if (!audio) {
      return NextResponse.json(
        { error: 'Audio file not found' },
        { status: 404 },
      );
    }

    // Verify the audio belongs to this chat
    if (audio.chatId !== chatId) {
      return NextResponse.json(
        { error: 'Audio file not found in this chat' },
        { status: 404 },
      );
    }

    // Mark as downloaded if messageId is provided
    if (messageId) {
      await markAsDownloaded({
        generatedAudioId: audioId,
        messageId,
        downloadFormat: format,
        downloadMetadata: {
          redownload: true,
          originalFormat: audio.metadata?.format,
          processingType: audio.processingType,
        },
      });
    }

    // Generate filename with metadata
    const timestamp = new Date(audio.createdAt).toISOString().split('T')[0];
    const processingType = audio.processingType;
    const originalName = audio.originalAudioName.replace(/\.[^/.]+$/, '');
    const filename = `${originalName}_${processingType}_${timestamp}.${format}`;

    // Return download information
    return NextResponse.json({
      success: true,
      downloadInfo: {
        id: audio.id,
        originalName: audio.originalAudioName,
        generatedName: audio.generatedAudioName,
        filename,
        url: audio.generatedAudioUrl,
        format,
        metadata: {
          format: audio.metadata?.format,
          bitrate: audio.metadata?.bitrate,
          sampleRate: audio.metadata?.sampleRate,
          channels: audio.metadata?.channels,
          duration: audio.metadata?.duration,
          fileSize: audio.metadata?.fileSize,
          processingType,
          processingTime: audio.totalProcessingTime,
          qualityMetrics: audio.qualityMetrics,
        },
      },
    });
  } catch (error) {
    console.error('Error processing re-download request:', error);
    return NextResponse.json(
      { error: 'Failed to process re-download request' },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
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

    // Get the generated audio file
    const audio = await getGeneratedAudioById({ id: audioId });
    if (!audio) {
      return NextResponse.json(
        { error: 'Audio file not found' },
        { status: 404 },
      );
    }

    // Verify the audio belongs to this chat
    if (audio.chatId !== chatId) {
      return NextResponse.json(
        { error: 'Audio file not found in this chat' },
        { status: 404 },
      );
    }

    // Generate filename with metadata
    const timestamp = new Date(audio.createdAt).toISOString().split('T')[0];
    const processingType = audio.processingType;
    const originalName = audio.originalAudioName.replace(/\.[^/.]+$/, '');
    const filename = `${originalName}_${processingType}_${timestamp}.${format}`;

    // In a real implementation, you would:
    // 1. Convert the audio to the requested format
    // 2. Generate the actual file
    // 3. Return the file as a download response

    // For now, we'll return the original file with a new filename
    const response = await fetch(audio.generatedAudioUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch audio file' },
        { status: 500 },
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': getContentType(format),
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading audio file:', error);
    return NextResponse.json(
      { error: 'Failed to download audio file' },
      { status: 500 },
    );
  }
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
