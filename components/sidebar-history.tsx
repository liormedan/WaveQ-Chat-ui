'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import type { Chat, ChatWithAudioContext } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { ChatItem } from './sidebar-history-item';
import { LoaderIcon } from './icons';
import { useAudioChatHistory } from '@/hooks/use-audio-chat-history';
import { AudioSummary } from './audio-summary';

type GroupedChats = {
  today: Array<Chat | ChatWithAudioContext>;
  yesterday: Array<Chat | ChatWithAudioContext>;
  lastWeek: Array<Chat | ChatWithAudioContext>;
  lastMonth: Array<Chat | ChatWithAudioContext>;
  older: Array<Chat | ChatWithAudioContext>;
};

const groupChatsByDate = (
  chats: Array<Chat | ChatWithAudioContext>,
): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats,
  );
};

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();

  const {
    chats,
    isLoading,
    isValidating,
    hasReachedEnd,
    hasEmptyChatHistory,
    loadMore,
    mutate,
    isLoadingAudio,
  } = useAudioChatHistory();

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        mutate((chatHistories) => {
          if (chatHistories) {
            return chatHistories.map((chatHistory) => ({
              ...chatHistory,
              chats: chatHistory.chats.filter((chat) => chat.id !== deleteId),
            }));
          }
        });

        return 'Chat deleted successfully';
      },
      error: 'Failed to delete chat',
    });

    setShowDeleteDialog(false);

    if (deleteId === id) {
      router.push('/');
    }
  };

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const groupedChats = groupChatsByDate(chats);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <LoaderIcon />
              </div>
            ) : hasEmptyChatHistory ? (
              <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
                No chats yet. Start a conversation!
              </div>
            ) : (
              <>
                {groupedChats.today.length > 0 && (
                  <div className="px-2 py-1">
                    <div className="text-xs font-medium text-zinc-500">
                      Today
                    </div>
                  </div>
                )}
                {groupedChats.today.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={id === chat.id}
                    onDelete={setDeleteId}
                    setOpenMobile={setOpenMobile}
                  />
                ))}

                {groupedChats.yesterday.length > 0 && (
                  <div className="px-2 py-1">
                    <div className="text-xs font-medium text-zinc-500">
                      Yesterday
                    </div>
                  </div>
                )}
                {groupedChats.yesterday.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={id === chat.id}
                    onDelete={setDeleteId}
                    setOpenMobile={setOpenMobile}
                  />
                ))}

                {groupedChats.lastWeek.length > 0 && (
                  <div className="px-2 py-1">
                    <div className="text-xs font-medium text-zinc-500">
                      Last 7 days
                    </div>
                  </div>
                )}
                {groupedChats.lastWeek.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={id === chat.id}
                    onDelete={setDeleteId}
                    setOpenMobile={setOpenMobile}
                  />
                ))}

                {groupedChats.lastMonth.length > 0 && (
                  <div className="px-2 py-1">
                    <div className="text-xs font-medium text-zinc-500">
                      Last 30 days
                    </div>
                  </div>
                )}
                {groupedChats.lastMonth.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={id === chat.id}
                    onDelete={setDeleteId}
                    setOpenMobile={setOpenMobile}
                  />
                ))}

                {groupedChats.older.length > 0 && (
                  <div className="px-2 py-1">
                    <div className="text-xs font-medium text-zinc-500">
                      Older
                    </div>
                  </div>
                )}
                {groupedChats.older.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={id === chat.id}
                    onDelete={setDeleteId}
                    setOpenMobile={setOpenMobile}
                  />
                ))}

                {!hasReachedEnd && (
                  <div className="px-2 py-1">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={isValidating}
                      className="w-full text-xs text-zinc-500 hover:text-zinc-700 disabled:opacity-50"
                    >
                      {isValidating ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin">
                            <LoaderIcon size={12} />
                          </div>
                          Loading...
                        </div>
                      ) : (
                        'Load more'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              chat and all of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
