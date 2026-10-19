import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { LiveToolCall } from './useRunStream';

/** Ephemeral chips for the agent's in-flight / just-finished tool calls. */
export default function ToolCallChips({ toolCalls }: { toolCalls: LiveToolCall[] }) {
  if (toolCalls.length === 0) return null;

  return (
    <div className="flex flex-row flex-wrap gap-2 py-1">
      {toolCalls.map((tc) => (
        <Badge
          key={tc.id}
          variant={
            tc.ok === undefined
              ? 'outline'
              : tc.ok === false
                ? 'destructive'
                : 'secondary'
          }
        >
          {tc.ok === undefined ? null : tc.ok ? <Check /> : <X />}
          {tc.label}
        </Badge>
      ))}
    </div>
  );
}
