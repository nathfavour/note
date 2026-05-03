'use client';

import React, { useState, useEffect } from 'react';
import {
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
import type { Notes } from '@/types/appwrite';
import { updateNote } from '@/lib/appwrite';

interface PaywallDialogProps {
  open: boolean;
  onClose: () => void;
  note: Notes;
  onUpdate?: (note: Notes) => void;
}

const PaywallDialog: React.FC<PaywallDialogProps> = ({
  open,
  onClose,
  note,
  onUpdate,
}) => {
  const [hasPaywall, setHasPaywall] = useState(false);
  const [paywallAmount, setPaywallAmount] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  const metadata = typeof note.metadata === 'string' 
    ? JSON.parse(note.metadata || '{}') 
    : note.metadata || {};
  const currentPaywall = metadata?.paywall;

  // Initialize state when dialog opens
  useEffect(() => {
    if (open) {
      setHasPaywall(!!currentPaywall?.enabled);
      setPaywallAmount(currentPaywall?.amount || '');
    }
  }, [open, currentPaywall]);

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
      onClose();
    } catch (error) {
      console.error('Failed to update paywall:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: '#161412',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
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
          onClick={onClose}
          sx={{ color: 'rgba(255,255,255,0.7)' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSavePaywall}
          disabled={isSaving || (hasPaywall && !paywallAmount)}
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
  );
};

export default PaywallDialog;
