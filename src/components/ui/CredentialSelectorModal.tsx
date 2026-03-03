'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItemButton, 
  ListItemText, 
  CircularProgress, 
  TextField,
  InputAdornment,
  alpha
} from '@mui/material';
import { 
  Search as SearchIcon,
  VpnKey as KeyIcon,
  Language as WorldIcon,
  CreditCard as CardIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { Modal } from './modal';
import { listKeepCredentials } from '@/lib/appwrite';
import { useToast } from './Toast';

interface Credential {
  $id: string;
  name: string;
  itemType: string;
  url?: string;
  username?: string;
}

interface CredentialSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (credentialId: string) => void;
}

const getItemIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'login': return <KeyIcon fontSize="small" />;
    case 'card': return <CardIcon fontSize="small" />;
    case 'identity': return <SecurityIcon fontSize="small" />;
    default: return <WorldIcon fontSize="small" />;
  }
};

export function CredentialSelectorModal({ isOpen, onClose, onSelect }: CredentialSelectorModalProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchCredentials = async () => {
        setLoading(true);
        try {
          const res = await listKeepCredentials();
          setCredentials(res.documents as any[]);
        } catch (_err: unknown) {
          showError(err.message || 'Failed to fetch credentials from Kylrix Vault');
          onClose();
        } finally {
          setLoading(false);
        }
      };
      fetchCredentials();
    }
  }, [isOpen, showError, onClose]);

  const filtered = credentials.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.url || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Attach Secret (Keep)">
      <Box sx={{ minHeight: '300px', maxHeight: '500px', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="caption" sx={{ color: '#00F5FF', fontWeight: 800, mb: 2, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ⚠️ ATTACHING A SECRET WILL AUTOMATICALLY MAKE THIS NOTE PRIVATE
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="Search credentials..."
          value={search}
          onChange={(_e) => setSearch(e.target.value)}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
              '&:hover fieldset': { borderColor: 'rgba(0, 245, 255, 0.3)' },
              '&.Mui-focused fieldset': { borderColor: '#00F5FF' },
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <CircularProgress size={32} sx={{ color: '#00F5FF' }} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, opacity: 0.5 }}>
            <KeyIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="body2">No credentials found</Typography>
          </Box>
        ) : (
          <List sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
            {filtered.map((item) => (
              <ListItemButton
                key={item.$id}
                onClick={() => onSelect(item.$id)}
                sx={{
                  borderRadius: '12px',
                  mb: 1,
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  '&:hover': {
                    bgcolor: 'rgba(0, 245, 255, 0.05)',
                    borderColor: 'rgba(0, 245, 255, 0.2)',
                  }
                }}
              >
                <Box sx={{ mr: 2, display: 'flex', color: '#00F5FF' }}>
                  {getItemIcon(item.itemType)}
                </Box>
                <ListItemText 
                  primary={item.name} 
                  secondary={item.username || item.url}
                  primaryTypographyProps={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.9)'
                  }} 
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.4)'
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Modal>
  );
}
