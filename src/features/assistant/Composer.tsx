import { Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
  /** A run is streaming: swap Send for Stop, lock the field. */
  isRunning: boolean;
  disabled?: boolean;
}

/**
 * The input row. Enter sends, Shift+Enter inserts a newline. While a run is
 * streaming the send button becomes a stop button and the field is locked.
 */
export default function Composer({
  value,
  onChange,
  onSend,
  onCancel,
  isRunning,
  disabled,
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isRunning && !disabled && value.trim()) onSend();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t p-4">
      <Textarea
        rows={1}
        placeholder="Ask the assistant…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isRunning}
        className="max-h-36 min-h-9 w-full resize-none py-2"
      />
      {isRunning ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Stop"
              className="text-destructive hover:text-destructive"
              onClick={onCancel}
            >
              <Square />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Stop</TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          {/* Span wrapper keeps the tooltip reachable while the button is disabled. */}
          <TooltipTrigger asChild>
            <span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Send"
                className="text-primary hover:text-primary"
                onClick={onSend}
                disabled={disabled || !value.trim()}
              >
                <Send />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Send</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
