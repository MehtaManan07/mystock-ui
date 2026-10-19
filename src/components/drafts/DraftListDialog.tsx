import React from 'react';
import { FileStack, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { EmptyState } from '../common/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Draft } from '../../api/drafts.api';

interface DraftListDialogProps {
  open: boolean;
  drafts: Draft[];
  onClose: () => void;
  onLoadDraft: (draft: Draft) => void;
  onDeleteDraft: (draftId: number) => void;
}

export const DraftListDialog: React.FC<DraftListDialogProps> = ({
  open,
  drafts,
  onClose,
  onLoadDraft,
  onDeleteDraft,
}) => {
  const handleDeleteDraft = (e: React.MouseEvent, draftId: number) => {
    e.stopPropagation();
    onDeleteDraft(draftId);
  };

  const handleLoadDraft = (draft: Draft) => {
    onLoadDraft(draft);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Load Draft</DialogTitle>
        </DialogHeader>
        {drafts.length === 0 ? (
          <EmptyState
            compact
            icon={<FileStack />}
            title="No saved drafts"
            message="Turn on auto-save while building a sale or purchase and it will show up here."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {drafts.map((draft) => (
              <li
                key={draft.id}
                className="flex items-center gap-2 rounded-lg border border-border/70 pr-2 transition-colors hover:bg-accent/40"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 rounded-lg px-3 py-2.5 text-left"
                  onClick={() => handleLoadDraft(draft)}
                >
                  <span className="block truncate text-sm font-medium">
                    {draft.name}
                  </span>
                  <span className="block truncate text-xs tabular-nums text-muted-foreground">
                    {draft.data.items.length}{' '}
                    {draft.data.items.length === 1 ? 'item' : 'items'} •
                    Last edited{' '}
                    {formatDistanceToNow(new Date(draft.updated_at), {
                      addSuffix: true,
                    })}
                  </span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="delete draft"
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => handleDeleteDraft(e, draft.id)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};
