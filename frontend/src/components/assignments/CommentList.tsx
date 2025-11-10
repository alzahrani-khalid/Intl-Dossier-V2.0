import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { Database } from '@/types/database';

type Comment = Database['public']['Tables']['assignment_comments']['Row'];

interface CommentReaction {
 emoji: string;
 count: number;
 userReacted: boolean;
}

interface CommentWithReactions extends Comment {
 user_name?: string;
 user_avatar?: string;
 reactions?: CommentReaction[];
}

interface CommentListProps {
 comments: CommentWithReactions[];
 hasNextPage?: boolean;
 isFetchingNextPage?: boolean;
 onLoadMore?: () => void;
 onReactionToggle?: (commentId: string, emoji: string) => void;
}

export function CommentList({
 comments,
 hasNextPage = false,
 isFetchingNextPage = false,
 onLoadMore,
 onReactionToggle,
}: CommentListProps): JSX.Element {
 const { t, i18n } = useTranslation('assignments');
 const isRTL = i18n.language === 'ar';
 const scrollRef = useRef<HTMLDivElement>(null);
 const observerRef = useRef<IntersectionObserver | null>(null);
 const loadMoreRef = useRef<HTMLDivElement>(null);

 // Infinite scroll setup
 useEffect(() => {
 if (!onLoadMore || !hasNextPage || isFetchingNextPage) return;

 observerRef.current = new IntersectionObserver(
 (entries) => {
 if (entries[0]?.isIntersecting) {
 onLoadMore();
 }
 },
 { threshold: 0.1 }
 );

 if (loadMoreRef.current) {
 observerRef.current.observe(loadMoreRef.current);
 }

 return () => {
 if (observerRef.current) {
 observerRef.current.disconnect();
 }
 };
 }, [hasNextPage, isFetchingNextPage, onLoadMore]);

 const formatTimestamp = (timestamp: string): string => {
 return new Intl.DateTimeFormat(i18n.language, {
 year: 'numeric',
 month: 'short',
 day: 'numeric',
 hour: '2-digit',
 minute: '2-digit',
 }).format(new Date(timestamp));
 };

 const renderCommentText = (text: string): JSX.Element => {
 // Parse @mentions and render as links
 const mentionRegex = /@(\w+)/g;
 const parts: JSX.Element[] = [];
 let lastIndex = 0;
 let match;

 while ((match = mentionRegex.exec(text)) !== null) {
 // Add text before mention
 if (match.index > lastIndex) {
 parts.push(
 <span key={`text-${lastIndex}`}>
 {text.substring(lastIndex, match.index)}
 </span>
 );
 }

 // Add mention (as span since user profile route not yet implemented)
 const username = match[1];
 parts.push(
 <span
 key={`mention-${match.index}`}
 className="text-primary font-medium"
 >
 @{username}
 </span>
 );

 lastIndex = match.index + match[0].length;
 }

 // Add remaining text
 if (lastIndex < text.length) {
 parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
 }

 return <>{parts}</>;
 };

 const handleReactionClick = (commentId: string, emoji: string): void => {
 if (onReactionToggle) {
 onReactionToggle(commentId, emoji);
 }
 };

 if (comments.length === 0) {
 return (
 <div
 dir={isRTL ? 'rtl' : 'ltr'}
 className="text-center py-8 text-muted-foreground"
 >
 {t('comments.empty')}
 </div>
 );
 }

 return (
 <ScrollArea
 ref={scrollRef}
 className="h-[500px] pe-4"
 dir={isRTL ? 'rtl' : 'ltr'}
 >
 <div className="space-y-4">
 {comments.map((comment) => (
 <div
 key={comment.id}
 className="flex gap-3 p-3 rounded-lg border bg-card"
 >
 <Avatar className="h-8 w-8">
 <AvatarImage
 src={comment.user_avatar}
 alt={comment.user_name || 'User'}
 />
 <AvatarFallback>
 {comment.user_name
 ?.split(' ')
 .map((n) => n[0])
 .join('')
 .toUpperCase() || '?'}
 </AvatarFallback>
 </Avatar>

 <div className="flex-1 space-y-2">
 {/* User and Timestamp */}
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium">
 {comment.user_name || t('comments.unknown_user')}
 </span>
 <span className="text-xs text-muted-foreground">
 {formatTimestamp(comment.created_at)}
 </span>
 </div>

 {/* Comment Text with @mentions */}
 <p className="text-sm leading-relaxed whitespace-pre-wrap">
 {renderCommentText(comment.text)}
 </p>

 {/* Reactions */}
 {comment.reactions && comment.reactions.length > 0 && (
 <div className="flex flex-wrap gap-1 pt-1">
 {comment.reactions.map((reaction, index) => (
 <button
 key={index}
 onClick={() => handleReactionClick(comment.id, reaction.emoji)}
 className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors ${
 reaction.userReacted
 ? 'bg-primary/10 border-primary text-primary'
 : 'bg-muted hover:bg-muted/80 border-border'
 }`}
 >
 <span>{reaction.emoji}</span>
 <span>{reaction.count}</span>
 </button>
 ))}
 </div>
 )}
 </div>
 </div>
 ))}

 {/* Loading More Indicator */}
 {hasNextPage && (
 <div ref={loadMoreRef} className="flex justify-center py-4">
 {isFetchingNextPage ? (
 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
 ) : (
 <span className="text-sm text-muted-foreground">
 {t('comments.loadMore')}
 </span>
 )}
 </div>
 )}
 </div>
 </ScrollArea>
 );
}
