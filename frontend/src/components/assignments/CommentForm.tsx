import { useState, useRef, useEffect, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, AtSign } from 'lucide-react';

interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
}

interface CommentFormProps {
  onSubmit: (text: string) => void | Promise<void>;
  isSubmitting?: boolean;
  maxLength?: number;
  placeholder?: string;
  users?: User[];
  onSearchUsers?: (query: string) => void;
}

export const CommentForm = forwardRef<HTMLFormElement, CommentFormProps>(function CommentForm({
  onSubmit,
  isSubmitting = false,
  maxLength = 5000,
  placeholder,
  users = [],
  onSearchUsers,
}, ref) {
  const { t, i18n } = useTranslation('assignments');
  const isRTL = i18n.language === 'ar';
  const [text, setText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = text.length;
  const isOverLimit = charCount > maxLength;
  const canSubmit = text.trim().length > 0 && !isOverLimit && !isSubmitting;

  // Detect @mention trigger
  useEffect(() => {
    const checkForMention = (): void => {
      const cursorPos = textareaRef.current?.selectionStart || 0;
      const textBeforeCursor = text.substring(0, cursorPos);
      const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

      if (lastAtSymbol !== -1 && cursorPos > lastAtSymbol) {
        const potentialMention = textBeforeCursor.substring(lastAtSymbol + 1);
        const hasSpace = potentialMention.includes(' ');

        if (!hasSpace && potentialMention.length <= 20) {
          setMentionQuery(potentialMention);
          setShowMentions(true);
          if (onSearchUsers) {
            onSearchUsers(potentialMention);
          }
        } else {
          setShowMentions(false);
        }
      } else {
        setShowMentions(false);
      }
    };

    checkForMention();
  }, [text, cursorPosition, onSearchUsers]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setText(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleMentionSelect = (username: string): void => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = text.substring(0, cursorPos);
    const textAfterCursor = text.substring(cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const newText =
        textBeforeCursor.substring(0, lastAtSymbol + 1) +
        username +
        ' ' +
        textAfterCursor;
      setText(newText);
      setShowMentions(false);

      // Focus back to textarea
      setTimeout(() => {
        textareaRef.current?.focus();
        const newCursorPos = lastAtSymbol + username.length + 2;
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!canSubmit) return;

    await onSubmit(text.trim());
    setText('');
    setShowMentions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (canSubmit) {
        handleSubmit(e as any);
      }
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('comments.form.placeholder')}
          className={`min-h-[100px] ${isOverLimit ? 'border-destructive' : ''}`}
          disabled={isSubmitting}
        />

        {/* @Mention Autocomplete Popup */}
        {showMentions && filteredUsers.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
            <div className="p-1">
              {filteredUsers.slice(0, 5).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleMentionSelect(user.username)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-accent text-start"
                >
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{user.username}</div>
                    <div className="text-xs text-muted-foreground">{user.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Character Counter and Submit */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${
            isOverLimit ? 'text-destructive' : 'text-muted-foreground'
          }`}
        >
          {charCount} / {maxLength} {t('comments.form.characters')}
        </span>

        <Button
          type="submit"
          disabled={!canSubmit}
          size="sm"
        >
          {isSubmitting ? (
            <span>{t('comments.form.submitting')}</span>
          ) : (
            <>
              <Send className="h-4 w-4 me-2" />
              {t('comments.form.submit')}
            </>
          )}
        </Button>
      </div>

      {/* Keyboard Hint */}
      <p className="text-xs text-muted-foreground">
        {t('comments.form.keyboardHint')}
      </p>
    </form>
  );
});
