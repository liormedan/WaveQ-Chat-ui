'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWRInfinite from 'swr/infinite';
import { fetcher } from '@/lib/utils';
import type { Chat, ChatWithAudioContext } from '@/lib/db/schema';

export interface ChatHistory {
  chats: Array<Chat | ChatWithAudioContext>;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory,
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0)
    return `/api/history?limit=${PAGE_SIZE}&include_audio_context=true`;

  const firstChatFromPage = previousPageData.chats.at(-1);

  if (!firstChatFromPage) return null;

  return `/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}&include_audio_context=true`;
}

export function useAudioChatHistory() {
  const [audioContextCache, setAudioContextCache] = useState<Map<string, any>>(
    new Map(),
  );
  const [isLoadingAudio, setIsLoadingAudio] = useState<Set<string>>(new Set());

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // Preload audio contexts for visible chats
  const preloadAudioContexts = useCallback(
    async (chatIds: string[]) => {
      const uncachedChatIds = chatIds.filter(
        (id) => !audioContextCache.has(id),
      );

      if (uncachedChatIds.length === 0) return;

      setIsLoadingAudio((prev) => new Set([...prev, ...uncachedChatIds]));

      try {
        // Fetch audio contexts for uncached chats
        const audioContextPromises = uncachedChatIds.map(async (chatId) => {
          const response = await fetch(`/api/chat/${chatId}/audio-contexts`);
          if (response.ok) {
            const contexts = await response.json();
            return { chatId, contexts };
          }
          return { chatId, contexts: [] };
        });

        const results = await Promise.all(audioContextPromises);

        setAudioContextCache((prev) => {
          const newCache = new Map(prev);
          results.forEach(({ chatId, contexts }) => {
            newCache.set(chatId, contexts);
          });
          return newCache;
        });
      } catch (error) {
        console.error('Error preloading audio contexts:', error);
      } finally {
        setIsLoadingAudio((prev) => {
          const newSet = new Set(prev);
          uncachedChatIds.forEach((id) => newSet.delete(id));
          return newSet;
        });
      }
    },
    [audioContextCache],
  );

  // Get all chats from paginated data
  const allChats = paginatedChatHistories?.flatMap((page) => page.chats) || [];

  // Check if more data can be loaded
  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.hasMore === false)
    : false;

  // Check if there are no chats
  const hasEmptyChatHistory = paginatedChatHistories
    ? paginatedChatHistories.every((page) => page.chats.length === 0)
    : false;

  // Load more chats
  const loadMore = useCallback(() => {
    if (!hasReachedEnd && !isValidating) {
      setSize((prevSize) => prevSize + 1);
    }
  }, [hasReachedEnd, isValidating, setSize]);

  // Preload audio contexts when chats become visible
  useEffect(() => {
    const visibleChatIds = allChats.map((chat) => chat.id);
    preloadAudioContexts(visibleChatIds);
  }, [allChats, preloadAudioContexts]);

  return {
    chats: allChats,
    isLoading,
    isValidating,
    hasReachedEnd,
    hasEmptyChatHistory,
    loadMore,
    mutate,
    audioContextCache,
    isLoadingAudio,
  };
}
