import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatDistanceToNow } from 'date-fns';
import { useDraftStore } from '../../stores/draftStore';
import type { Draft } from '../../stores/draftStore';

interface DraftListDialogProps {
  open: boolean;
  type: 'sale' | 'purchase';
  onClose: () => void;
  onLoadDraft: (draft: Draft) => void;
}

export const DraftListDialog: React.FC<DraftListDialogProps> = ({
  open,
  type,
  onClose,
  onLoadDraft,
}) => {
  const { listDrafts, deleteDraft } = useDraftStore();
  const drafts = listDrafts(type);

  const handleDeleteDraft = (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation();
    deleteDraft(draftId);
  };

  const handleLoadDraft = (draft: Draft) => {
    onLoadDraft(draft);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Load Draft {type === 'sale' ? 'Sale' : 'Purchase'}
      </DialogTitle>
      <DialogContent>
        {drafts.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No saved drafts
            </Typography>
          </Box>
        ) : (
          <List>
            {drafts.map((draft) => (
              <ListItem
                key={draft.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={(e) => handleDeleteDraft(e, draft.id)}
                    aria-label="delete draft"
                  >
                    <DeleteIcon />
                  </IconButton>
                }
                disablePadding
              >
                <ListItemButton onClick={() => handleLoadDraft(draft)}>
                  <ListItemText
                    primary={draft.name}
                    secondary={
                      <>
                        {draft.data.items.length}{' '}
                        {draft.data.items.length === 1 ? 'item' : 'items'} •
                        Last edited{' '}
                        {formatDistanceToNow(new Date(draft.updatedAt), {
                          addSuffix: true,
                        })}
                      </>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};
