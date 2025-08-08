import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { ChatModel } from '@/lib/ai/models';
import type { VisibilityType } from '@/components/visibility-selector';
import {
  createAudioContext,
  processAudioContext,
  linkMessageToAudioContext,
  getChatAudioContexts,
  generateAudioAwareResponse,
} from '@/lib/services/audio-context-service';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel['id'];
      selectedVisibilityType: VisibilityType;
    } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    // Process audio files in the message
    const audioFiles = message.parts
      .filter(
        (part) => part.type === 'file' && part.mediaType?.startsWith('audio/'),
      )
      .map((part) => ({
        id: generateUUID(),
        name: (part as any).name || 'Audio File',
        url: (part as any).url,
        type: (part as any).mediaType || 'audio/mpeg',
      }));

    // Create audio contexts for new audio files
    const audioContexts = [];
    for (const audioFile of audioFiles) {
      try {
        const audioContext = await createAudioContext({
          chatId: id,
          audioFile,
        });

        // Process the audio context (transcription, analysis, etc.)
        await processAudioContext({
          audioContextId: audioContext.id,
          audioFileUrl: audioFile.url,
        });

        audioContexts.push(audioContext);
      } catch (error) {
        console.error('Error processing audio context:', error);
      }
    }

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    // Link message to audio contexts
    for (const audioContext of audioContexts) {
      await linkMessageToAudioContext({
        audioContextId: audioContext.id,
        messageId: message.id,
        contextType: 'reference',
      });
    }

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    // Get all audio contexts for this chat
    const allAudioContexts = await getChatAudioContexts({ chatId: id });

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        // Check if we should use audio-aware response generation
        const hasAudioContext = allAudioContexts.length > 0;
        const userMessageText = message.parts
          .filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join(' ');

        if (hasAudioContext && userMessageText.trim()) {
          // Generate audio-aware response
          generateAudioAwareResponse({
            userMessage: userMessageText,
            audioContexts: allAudioContexts,
            chatHistory: uiMessages.map((msg) => ({
              role: msg.role,
              content: msg.parts
                .filter((p) => p.type === 'text')
                .map((p) => p.text)
                .join(' '),
            })),
          })
            .then(async (audioAwareResponse) => {
              // Create a response message with audio context
              const responseMessage = {
                id: generateUUID(),
                role: 'assistant' as const,
                parts: [{ type: 'text' as const, text: audioAwareResponse }],
              };

              // Save the response message
              await saveMessages({
                messages: [
                  {
                    chatId: id,
                    id: responseMessage.id,
                    role: 'assistant',
                    parts: responseMessage.parts,
                    attachments: [],
                    createdAt: new Date(),
                  },
                ],
              });

              // Link response to audio contexts
              for (const audioContext of allAudioContexts) {
                await linkMessageToAudioContext({
                  audioContextId: audioContext.id,
                  messageId: responseMessage.id,
                  contextType: 'response',
                });
              }

              // Send the response through the data stream
              dataStream.write({
                type: 'text-delta',
                delta: audioAwareResponse,
                id: responseMessage.id,
              });
              dataStream.write({ type: 'finish' });
            })
            .catch((error) => {
              console.error('Error generating audio-aware response:', error);
              // Fall back to regular response generation
              generateRegularResponse();
            });
        } else {
          // Use regular response generation
          generateRegularResponse();
        }

        function generateRegularResponse() {
          if (!session) {
            console.error('No session available for tools');
            return;
          }

          const result = streamText({
            model: myProvider.languageModel(selectedChatModel),
            system: systemPrompt({ selectedChatModel, requestHints }),
            messages: convertToModelMessages(uiMessages),
            stopWhen: stepCountIs(5),
            experimental_activeTools:
              selectedChatModel === 'chat-model-reasoning'
                ? []
                : [
                    'getWeather',
                    'createDocument',
                    'updateDocument',
                    'requestSuggestions',
                  ],
            experimental_transform: smoothStream({ chunking: 'word' }),
            tools: {
              getWeather,
              createDocument: createDocument({ session, dataStream }),
              updateDocument: updateDocument({ session, dataStream }),
              requestSuggestions: requestSuggestions({
                session,
                dataStream,
              }),
            },
            experimental_telemetry: {
              isEnabled: isProductionEnvironment,
              functionId: 'stream-text',
            },
          });

          result.consumeStream();

          dataStream.merge(
            result.toUIMessageStream({
              sendReasoning: true,
            }),
          );
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        await saveMessages({
          messages: messages.map((message) => ({
            id: message.id,
            role: message.role,
            parts: message.parts,
            createdAt: new Date(),
            attachments: [],
            chatId: id,
          })),
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream()),
        ),
      );
    } else {
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
