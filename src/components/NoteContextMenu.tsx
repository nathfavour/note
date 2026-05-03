'use client';

import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  AttachMoney as MoneyIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { Notes } from '@/types/appwrite';
import { updateNote } from '@/lib/appwrite';

interface NoteContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  note: Notes;
  onUpdate?: (note: Notes) => void;
}

const NoteContextMenu: React.FC<NoteContextMenuProps> = ({
  anchorEl,
  open,
  onClose,
  note,
  onUpdate,
}) => {
  const [showPaywallDialog, setShowPaywallDialog] = useState(false);
  const [hasPaywall, setHasPaywall] = useState(false);
  const [paywallAmount, setPaywallAmount] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  const metadata = typeof note.metadata === 'string' 
    ? JSON.parse(note.metadata || '{}') 
    : note.metadata || {};
  const currentPaywall = metadata?.paywall;

  const handleOpenPaywall = () => {
    setHasPaywall(!!currentPaywall?.enabled);
    setPaywallAmount(currentPaywall?.amount || '');
    setShowPaywallDialog(true);
    onClose();
  };

  const handleSavePaywall = async () => {
    setIsSaving(true);
    try {
      const updatedNote = await updateNote(note.$id, {
        metadata: JSON.stringify({
          ...metadata,
          paywall: hasPaywall && paywallAmount ? {
            enabled: true,
            amount: typeof paywallAmount === 'number' ? paywallAmount : parseFloat(paywallAmount),
            currency: 'USD',
          } : {
            enabled: false,
            amount: 0,
            currency: 'USD',
          },
        }),
      });
      onUpdate?.(updatedNote as Notes);
      setShowPaywallDialog(false);
    } catch (error) {
      console.error('Failed to update paywall:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePaywall = async () => {
    setIsSaving(true);
    try {
      const updatedNote = await updateNote(note.$id, {
        metadata: JSON.stringify({
          ...metadata,
          paywall: {
            enabled: false,
            amount: 0,
            currency: 'USD',
          },
        }),
      });
      onUpdate?.(updatedNote as Notes);
      onClose();
    } catch (error) {
      console.error('Failed to remove paywall:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            bgcolor: '#161412',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.45)',
          }
        }}
      >
        <MenuItem onClick={handleOpenPaywall}>
          <ListItemIcon>
            <MoneyIcon fontSize="small" sx={{ color: '#EC4899' }} />
          </ListItemIcon>
          <ListItemText sx={{ color: 'white' }}>
            {currentPaywall?.enabled ? 'Edit paywall' : 'Add paywall'}
          </ListItemText>
        </MenuItem>

        {currentPaywall?.enabled && (
          <MenuItem onClick={handleRemovePaywall}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.5)' }} />
            </ListItemIcon>
            <ListItemText sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Remove paywall
            </ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Dialog
        open={showPaywallDialog}
        onClose={() => setShowPaywallDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: '#161412',
            border: '1px solid rgba(255,255,255,0.06)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
          {currentPaywall?.enabled ? 'Edit Paywall' : 'Add Paywall'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Switch checked={hasPaywall} onChange={(e) => setHasPaywall(e.target.checked)} />}
              label={<span style={{ color: 'white' }}>Lock this note behind paywall</span>}
            />
            {hasPaywall && (
              <TextField
                fullWidth
                size="small"
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                value={paywallAmount}
                onChange={(e) => setPaywallAmount(e.target.value ? parseFloat(e.target.value) : '')}
                placeholder="Price in USD"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    color: 'white',
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: 'rgba(255,255,255,0.3)',
                    opacity: 1,
                  },
                }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setShowPaywallDialog(false)}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSavePaywall}
            disabled={isSaving}
            variant="contained"
            sx={{
              bgcolor: '#6366F1',
              color: 'white',
              '&:hover': {
                bgcolor: '#4F46E5',
              },
            }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NoteContextMenu;
