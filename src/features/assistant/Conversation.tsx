import { useEffect, useRef } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyState } from '../../components/common/EmptyState';
import type { MessageResponse, Widget } from '../../types/assistant';
import type { LiveMessage, LiveToolCall } from './useRunStream';
import MessageBubble from './MessageBubble';
import ConfirmActionWidget from './ConfirmActionWidget';
import RunStatusLine from './RunStatusLine';
import ToolCallChips from './ToolCallChips';
import Composer from './Composer';

interface Props {
  /** Persisted history for the active thread. */
  messages: MessageResponse[];
  /** The just-sent user message, echoed before it persists. */
  pendingMessage: string | null;
  /** Assistant text currently streaming (cleared once persisted). */
  liveMessages: LiveMessage[];
  statusLabel: string | null;
  toolCalls: LiveToolCall[];
  /** Widget raised by the in-flight run. */
  liveWidget: Widget | null;
  errorMessage: string | null;
  isRunning: boolean;
  threadLoading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
}

function renderWidget(widget: Widget, key: string) {
  switch (widget.type) {
    case 'confirm_action':
      return <ConfirmActionWidget key={key} widget={widget} />;
    default:
      // Unknown widget from a newer server: ignore, never throw.
      return null;
  }
}

/** Right pane: scrolling transcript + live run indicators + composer. */
export default function Conversation({
  messages,
  pendingMessage,
  liveMessages,
  statusLabel,
  toolCalls,
  liveWidget,
  errorMessage,
  isRunning,
  threadLoading,
  input,
  onInputChange,
  onSend,
  onCancel,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, pendingMessage, liveMessages, statusLabel, toolCalls, liveWidget, errorMessage]);

  const isEmpty =
    messages.length === 0 &&
    liveMessages.length === 0 &&
    !pendingMessage &&
    !isRunning;

  // Once the thread refetches, the pending message is already in `messages` as
  // the trailing user turn. Drop the echo then so it isn't shown twice.
  const lastMessage = messages[messages.length - 1];
  const showPending =
    pendingMessage != null &&
    !(lastMessage?.role === 'user' && lastMessage.content === pendingMessage);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {threadLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isEmpty ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              compact
              icon={<Sparkles />}
              title="KC Assistant"
              message="Ask about stock, expenses, or bills to get started."
            />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id}>
                <MessageBubble role={msg.role} content={msg.content} />
                {msg.widget && renderWidget(msg.widget, `w-${msg.id}`)}
              </div>
            ))}

            {showPending && (
              <MessageBubble role="user" content={pendingMessage} />
            )}

            {liveMessages.map((lm) => (
              <MessageBubble
                key={lm.messageId}
                role="assistant"
                content={lm.text}
                streaming={!lm.done && isRunning}
              />
            ))}

            <ToolCallChips toolCalls={toolCalls} />
            {statusLabel && <RunStatusLine label={statusLabel} />}
            {liveWidget && renderWidget(liveWidget, 'w-live')}
            {errorMessage && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <Composer
        value={input}
        onChange={onInputChange}
        onSend={onSend}
        onCancel={onCancel}
        isRunning={isRunning}
      />
    </div>
  );
}
