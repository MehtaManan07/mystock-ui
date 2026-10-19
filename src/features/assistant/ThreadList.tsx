import { useState } from 'react';
import { EllipsisVertical, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from 'cn';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import type { ThreadSummary } from '../../types/assistant';

interface Props {
  threads: ThreadSummary[];
  activeThreadId: number | null;
  loading: boolean;
  onSelect: (id: number) => void;
  onNew: () => void;
  onRename: (id: number, title: string) => void;
  onDelete: (id: number) => void;
}

/**
 * Left pane: the list of chats, a "New chat" button, and a per-row menu for
 * rename / delete. Rename and delete confirmation dialogs live here so the
 * parent only deals with the final intent.
 */
export default function ThreadList({
  threads,
  activeThreadId,
  loading,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: Props) {
  const [renaming, setRenaming] = useState<ThreadSummary | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleting, setDeleting] = useState<ThreadSummary | null>(null);

  const startRename = (thread: ThreadSummary) => {
    setRenaming(thread);
    setRenameValue(thread.title);
  };

  const startDelete = (thread: ThreadSummary) => {
    setDeleting(thread);
  };

  const confirmRename = () => {
    const title = renameValue.trim();
    if (renaming && title) onRename(renaming.id, title);
    setRenaming(null);
  };

  const confirmDelete = () => {
    if (deleting) onDelete(deleting.id);
    setDeleting(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button variant="outline" className="w-full" onClick={onNew}>
          <Plus />
          New chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5.5 animate-spin text-muted-foreground" />
          </div>
        ) : threads.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No chats yet
          </p>
        ) : (
          <ul>
            {threads.map((thread) => (
              <li
                key={thread.id}
                className={cn(
                  'flex items-center gap-1 pr-2 hover:bg-accent',
                  thread.id === activeThreadId && 'bg-accent',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(thread.id)}
                  className="min-w-0 flex-1 truncate px-4 py-2 text-left text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {thread.title || 'Untitled chat'}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Chat actions"
                    >
                      <EllipsisVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => startRename(thread)}>
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => startDelete(thread)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!renaming} onOpenChange={(v) => !v && setRenaming(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirmRename();
              }
            }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button onClick={confirmRename} disabled={!renameValue.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        title="Delete chat?"
        message={`"${deleting?.title || 'Untitled chat'}" and its messages will be permanently removed.`}
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
