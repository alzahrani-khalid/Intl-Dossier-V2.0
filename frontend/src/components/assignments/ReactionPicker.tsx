import { useTranslation } from 'react-i18next';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Smile } from 'lucide-react';

const ALLOWED_EMOJIS = ['👍', '✅', '❓', '❤️', '🎯', '💡'] as const;
type EmojiType = typeof ALLOWED_EMOJIS[number];

interface ReactionCount {
  emoji: EmojiType;
  count: number;
  users: string[];
  userReacted: boolean;
}

interface ReactionPickerProps {
  reactions?: ReactionCount[];
  onReactionToggle: (emoji: EmojiType) => void;
  disabled?: boolean;
}

export function ReactionPicker({
  reactions = [],
  onReactionToggle,
  disabled = false,
}: ReactionPickerProps): JSX.Element {
  const { t, i18n } = useTranslation('assignments');
  const isRTL = i18n.language === 'ar';

  const handleEmojiClick = (emoji: EmojiType): void => {
    if (!disabled) {
      onReactionToggle(emoji);
    }
  };

  const getReactionCount = (emoji: EmojiType): ReactionCount | undefined => {
    return reactions.find((r) => r.emoji === emoji);
  };

  return (
    <div className="flex items-center gap-1" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Existing Reactions */}
      {reactions.map((reaction) => (
        <TooltipProvider key={reaction.emoji}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleEmojiClick(reaction.emoji)}
                disabled={disabled}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border transition-colors ${
                  reaction.userReacted
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-muted hover:bg-muted/80 border-border'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="text-base">{reaction.emoji}</span>
                <span className="text-xs font-medium">{reaction.count}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                {reaction.users.length > 0 ? (
                  <div>
                    {reaction.users.slice(0, 5).map((user, idx) => (
                      <div key={idx}>{user}</div>
                    ))}
                    {reaction.users.length > 5 && (
                      <div className="text-muted-foreground">
                        {t('reactions.andMore', { count: reaction.users.length - 5 })}
                      </div>
                    )}
                  </div>
                ) : (
                  t('reactions.noOne')
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}

      {/* Add Reaction Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-7 px-2"
          >
            <Smile className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex items-center gap-1">
            {ALLOWED_EMOJIS.map((emoji) => {
              const existing = getReactionCount(emoji);
              return (
                <TooltipProvider key={emoji}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleEmojiClick(emoji)}
                        className={`p-2 rounded hover:bg-accent transition-colors ${
                          existing?.userReacted ? 'bg-primary/10' : ''
                        }`}
                      >
                        <span className="text-xl">{emoji}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span className="text-xs">
                        {t(`reactions.emoji_${emoji}`)}
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
