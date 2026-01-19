"use client";

import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Paper, 
  Typography, 
  Tooltip,
  alpha 
} from '@mui/material';
import { 
  Send, 
  Plus,
  StickyNote,
  Zap
} from 'lucide-react';
import { MeshProtocol } from '@/lib/ecosystem/mesh';

/**
 * QuickNote Contribution
 * A miniaturized note-creation widget for the ecosystem.
 */
export const QuickNote = () => {
    const [note, setNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!note.trim()) return;
        setIsSaving(true);
        // Simulate saving to WhisperrNote API
        console.log('Saving note to ecosystem:', note);
        setTimeout(() => {
            setNote('');
            setIsSaving(false);
            alert('Note saved to WhisperrNote!');
        }, 800);
    };

    const handleCreateTask = () => {
        if (!note.trim()) return;
        MeshProtocol.broadcast({
            type: 'RPC_REQUEST',
            targetNode: 'flow',
            payload: {
                method: 'CREATE_TASK',
                params: {
                    title: `Task from Note: ${note.substring(0, 30)}...`,
                    description: note,
                    source: 'whisperrnote'
                }
            }
        }, 'note');
        alert('Task request sent to WhisperrFlow mesh node!');
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: '16px',
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(0, 245, 255, 0.2)',
                }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ 
                    p: 1, 
                    borderRadius: '10px', 
                    bgcolor: alpha('#00F5FF', 0.1),
                    color: '#00F5FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <StickyNote size={20} strokeWidth={1.5} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '0.875rem', color: 'white' }}>
                    Quick Note
                </Typography>
            </Box>

            <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Jot something down..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                variant="standard"
                InputProps={{
                    disableUnderline: true,
                    sx: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.875rem',
                        fontFamily: 'inherit',
                    }
                }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 1 }}>
                <Tooltip title="Create Flow Task">
                    <IconButton 
                        onClick={handleCreateTask}
                        disabled={!note.trim()}
                        sx={{ 
                            color: '#4ADE80',
                            bgcolor: alpha('#4ADE80', 0.1),
                            '&:hover': { bgcolor: alpha('#4ADE80', 0.2) },
                            '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.1)' }
                        }}
                    >
                        <Zap size={18} strokeWidth={1.5} />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Save to Note">
                    <IconButton 
                        onClick={handleSave}
                        disabled={!note.trim() || isSaving}
                        sx={{ 
                            color: '#00F5FF',
                            bgcolor: alpha('#00F5FF', 0.1),
                            '&:hover': { bgcolor: alpha('#00F5FF', 0.2) },
                            '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.1)' }
                        }}
                    >
                        <Send size={18} strokeWidth={1.5} />
                    </IconButton>
                </Tooltip>
            </Box>
        </Paper>
    );
};
