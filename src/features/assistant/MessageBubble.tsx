import { cn } from 'cn';
import Markdown from './Markdown';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  /** Show a blinking caret while this bubble is still receiving tokens. */
  streaming?: boolean;
}

/**
 * One chat bubble. User text is rendered verbatim (pre-wrapped); assistant text
 * is Markdown. The caret only shows while streaming.
 */
export default function MessageBubble({ role, content, streaming }: Props) {
  const isUser = role === 'user';

  return (
    <div className={cn('mb-3 flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[82%] rounded-lg px-4 py-2.5 break-words',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground',
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{content}</div>
        ) : (
          <Markdown>{content}</Markdown>
        )}
        {streaming && (
          <span className="ml-0.5 inline-block animate-pulse">▍</span>
        )}
      </div>
    </div>
  );
}
