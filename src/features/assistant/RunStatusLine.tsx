import { Loader2 } from 'lucide-react';

/** Ephemeral "Thinking…/Writing…" line shown while the agent works. */
export default function RunStatusLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1 text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
