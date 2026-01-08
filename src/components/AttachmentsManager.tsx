'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  LinearProgress,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  Delete as DeleteIcon, 
  OpenInNew as OpenIcon,
  Refresh as RefreshIcon,
  AttachFile as FileIcon
} from '@mui/icons-material';
import { formatFileSize } from '@/lib/utils';

interface AttachmentMeta {
  id: string;
  name: string;
  size: number;
  mime: string | null;
  createdAt: string;
}

interface AttachmentsManagerProps {
  noteId: string;
}

interface UploadingFile {
  tempId: string;
  file: File;
  progress: number;
  status: 'uploading' | 'error' | 'done';
  error?: string;
}

export const AttachmentsManager: React.FC<AttachmentsManagerProps> = ({ noteId }) => {
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const theme = useTheme();

  const fetchAttachments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { listNoteAttachments } = await import('@/lib/appwrite');
      const attachments = await listNoteAttachments(noteId);
      setAttachments(Array.isArray(attachments) ? attachments : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load attachments');
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    if (noteId) {
      fetchAttachments();
      setUploading([]);
      setError(null);
    }
  }, [noteId, fetchAttachments]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || !files.length) return;
    const batch: UploadingFile[] = Array.from(files).map(f => ({
      tempId: `${Date.now()}-${Math.random()}`,
      file: f,
      progress: 0,
      status: 'uploading'
    }));
    setUploading(prev => [...prev, ...batch]);

    for (const temp of batch) {
      setUploading(cur => cur.map(u => u.tempId === temp.tempId ? { ...u, progress: 10 } : u));
      try {
        const { addAttachmentToNote } = await import('@/lib/appwrite');
        await addAttachmentToNote(noteId, temp.file);
        setUploading(cur => cur.map(u => u.tempId === temp.tempId ? { ...u, progress: 100, status: 'done' } : u));
        await fetchAttachments();
      } catch (e: any) {
        setUploading(cur => cur.map(u => u.tempId === temp.tempId ? { ...u, progress: 100, status: 'error', error: e.message || 'Upload failed' } : u));
      }
    }
    setTimeout(() => {
      setUploading(cur => cur.filter(u => u.status === 'error'));
    }, 1200);
    setTimeout(() => {
      setUploading(cur => cur.filter(u => u.status !== 'error'));
    }, 8000);
  }, [noteId, fetchAttachments]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (e.target) e.target.value = '';
  };

  const triggerSelect = () => inputRef.current?.click();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };

  const deleteAttachment = async (id: string) => {
    if (!confirm('Delete this attachment?')) return;
    try {
      const { removeAttachmentFromNote } = await import('@/lib/appwrite');
      await removeAttachmentFromNote(noteId, id);
      await fetchAttachments();
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    }
  };

  return (
    <Stack spacing={3}>
      <Paper
        variant="outlined"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={triggerSelect}
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: dragActive ? '#00F5FF' : 'rgba(255, 255, 255, 0.1)',
          bgcolor: dragActive ? alpha('#00F5FF', 0.05) : 'rgba(255, 255, 255, 0.02)',
          borderRadius: '24px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            borderColor: '#00F5FF',
            bgcolor: alpha('#00F5FF', 0.05),
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 24px ${alpha('#00F5FF', 0.1)}`
          }
        }}
      >
        <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={onInputChange} multiple />
        <UploadIcon sx={{ fontSize: 48, color: '#00F5FF', mb: 2, opacity: 0.8 }} />
        <Typography variant="body1" sx={{ fontWeight: 800, color: 'white', mb: 0.5 }}>
          Drag & drop or click to upload
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 500 }}>
          Per-file size limited by your plan.
        </Typography>
      </Paper>

      {uploading.length > 0 && (
        <Stack spacing={1.5}>
          <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', color: '#00F5FF', letterSpacing: '0.1em' }}>
            Uploading
          </Typography>
          {uploading.map(u => (
            <Paper 
              key={u.tempId} 
              sx={{ 
                p: 2, 
                bgcolor: 'rgba(255, 255, 255, 0.03)', 
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.file.name}
                </Typography>
                <Box sx={{ width: 120 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={u.progress} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: u.status === 'error' ? '#FF3B30' : '#00F5FF',
                        borderRadius: 3
                      }
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right', fontWeight: 700, color: u.status === 'error' ? '#FF3B30' : '#00F5FF' }}>
                  {u.status === 'error' ? 'Error' : `${u.progress}%`}
                </Typography>
                {u.status === 'error' && (
                  <Button 
                    size="small" 
                    variant="text"
                    sx={{ color: '#00F5FF', fontWeight: 800, minWidth: 'auto', p: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const fileList = { 0: u.file, length: 1, item: (i: number) => (i === 0 ? u.file : null) } as any as FileList;
                      setUploading(cur => cur.filter(x => x.tempId !== u.tempId));
                      handleFiles(fileList);
                    }}
                  >
                    Retry
                  </Button>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', color: '#00F5FF', letterSpacing: '0.1em' }}>
            Attachments
          </Typography>
          <IconButton 
            size="small" 
            onClick={fetchAttachments} 
            disabled={loading}
            sx={{ color: 'rgba(255, 255, 255, 0.4)', '&:hover': { color: '#00F5FF' } }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Stack>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: '#00F5FF' }} />
          </Box>
        )}

        {!loading && attachments.length === 0 && (
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center', 
            bgcolor: 'rgba(255, 255, 255, 0.02)', 
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.3)', fontWeight: 500 }}>
              No attachments yet.
            </Typography>
          </Paper>
        )}

        <List sx={{ 
          bgcolor: 'rgba(10, 10, 10, 0.4)', 
          borderRadius: '24px', 
          border: '1px solid rgba(255, 255, 255, 0.05)', 
          overflow: 'hidden', 
          p: 0,
          backdropFilter: 'blur(10px)'
        }}>
          {attachments.map((a, index) => (
            <ListItem
              key={a.id}
              divider={index < attachments.length - 1}
              sx={{
                px: 3,
                py: 2,
                borderColor: 'rgba(255, 255, 255, 0.05)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' }
              }}
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <IconButton 
                    size="small" 
                    sx={{ color: 'rgba(255, 255, 255, 0.4)', '&:hover': { color: '#00F5FF' } }}
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/notes/${noteId}/attachments/${a.id}`, { credentials: 'include' });
                        if (!res.ok) throw new Error('Failed to get attachment URL');
                        const data = await res.json();
                        const url = data?.url;
                        if (url) {
                          window.open(url, '_blank', 'noopener,noreferrer');
                        } else {
                          window.open(`/api/notes/${noteId}/attachments/${a.id}?raw=1`, '_blank', 'noopener,noreferrer');
                        }
                      } catch (err) {
                        setError((err as any)?.message || 'Failed to open attachment');
                      }
                    }}
                  >
                    <OpenIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    sx={{ color: 'rgba(255, 255, 255, 0.4)', '&:hover': { color: '#FF3B30' } }}
                    onClick={() => deleteAttachment(a.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              }
            >
              <ListItemIcon sx={{ minWidth: 48 }}>
                <Box sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: '10px', 
                  bgcolor: alpha('#00F5FF', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FileIcon sx={{ color: '#00F5FF', fontSize: 20 }} />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={a.name}
                secondary={`${formatFileSize(a.size)} • ${a.mime || 'unknown'}`}
                slotProps={{
                  primary: { sx: { fontWeight: 700, color: 'white', fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                  secondary: { sx: { fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 500, mt: 0.25 } }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: '16px',
            bgcolor: alpha('#FF3B30', 0.1),
            color: '#FF3B30',
            border: '1px solid',
            borderColor: alpha('#FF3B30', 0.2),
            '& .MuiAlert-icon': { color: '#FF3B30' }
          }}
        >
          {error}
        </Alert>
      )}
    </Stack>
  );
};

export default AttachmentsManager;
