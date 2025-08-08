import type { Chat, ChatWithAudioContext } from '@/lib/db/schema';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  TrashIcon,
} from './icons';
import { memo } from 'react';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { AudioPreview } from './audio-preview';

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat | ChatWithAudioContext;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });

  // Check if this chat has audio contexts
  const hasAudioContexts =
    'audioContexts' in chat && chat.audioContexts.length > 0;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
          <div className="flex flex-col gap-1 w-full">
            <span className="truncate">{chat.title}</span>

            {/* Audio previews */}
            {hasAudioContexts && (
              <div className="flex flex-col gap-1 mt-1">
                {chat.audioContexts.slice(0, 2).map((audioContext, index) => (
                  <AudioPreview
                    key={`${audioContext.audioFileUrl}-${index}`}
                    audioFileName={audioContext.audioFileName}
                    audioFileUrl={audioContext.audioFileUrl}
                    audioFileType={audioContext.audioFileType}
                    audioDuration={audioContext.audioDuration}
                    contextSummary={audioContext.contextSummary}
                    compact={true}
                    className="text-xs"
                  />
                ))}
                {chat.audioContexts.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{chat.audioContexts.length - 2} more audio files
                  </div>
                )}
              </div>
            )}
          </div>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon />
              <span>Share</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('private');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <LockIcon size={12} />
                    <span>Private</span>
                  </div>
                  {visibilityType === 'private' ? (
                    <CheckCircleFillIcon />
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('public');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <GlobeIcon />
                    <span>Public</span>
                  </div>
                  {visibilityType === 'public' ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(chat.id)}
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true;
});
