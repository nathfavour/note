'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Notes, Tags } from '@/types/appwrite';
import { getNotesByTag } from '@/lib/appwrite';
import { Box, Typography, IconButton, Stack, Alert, CircularProgress } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { NoteDetailSidebar } from './NoteDetailSidebar';
import NoteCard from '@/components/ui/NoteCard';
import { NoteCardSkeleton } from './NoteCardSkeleton';

interface TagNotesListSidebarProps {
  tag: Tags;
  onBack: () => void;
  onNoteUpdate: (updatedNote: Notes) => void;
  onNoteDelete: (noteId: string) => void;
}

export function TagNotesListSidebar({
  tag,
  onBack,
  onNoteUpdate,
  onNoteDelete,
}: TagNotesListSidebarProps) {
  const [notes, setNotes] = useState<Notes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Notes | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedNotes = await getNotesByTag(tag.$id);
        setNotes(fetchedNotes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notes');
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [tag.$id]);

  const handleHeaderBack = useCallback(() => {
    if (selectedNote) {
      setSelectedNote(null);
      return;
    }
    onBack();
  }, [selectedNote, onBack]);

  const handleNoteUpdate = (updatedNote: Notes) => {
    setNotes((prev) => prev.map((n) => (n.$id === updatedNote.$id ? updatedNote : n)));
    onNoteUpdate(updatedNote);
    if (selectedNote?.$id === updatedNote.$id) {
      setSelectedNote(updatedNote);
    }
  };

  const handleNoteDelete = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.$id !== noteId));
    onNoteDelete(noteId);
    if (selectedNote?.$id === noteId) {
      setSelectedNote(null);
    }
  };

  const renderContent = () => {
    if (selectedNote) {
      return (
        <NoteDetailSidebar
          note={selectedNote}
          onUpdate={handleNoteUpdate}
          onDelete={handleNoteDelete}
          showExpandButton={false}
        />
      );
    }

    return (
      <Box sx={{ py: 2 }}>
        {loading ? (
          <Stack spacing={2}>
            {Array.from({ length: 3 }).map((_, index) => (
              <NoteCardSkeleton key={index} />
            ))}
          </Stack>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: '16px' }}>
            {error}
          </Alert>
        ) : notes.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notes with this tag
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {notes.map((note) => (
              <NoteCard
                key={note.$id}
                note={note}
                onUpdate={handleNoteUpdate}
                onDelete={handleNoteDelete}
                onNoteSelect={setSelectedNote}
              />
            ))}
          </Stack>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', h: '100%', p: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        pb: 2, 
        borderBottom: '1px solid', 
        borderColor: 'divider' 
      }}>
        <IconButton 
          onClick={handleHeaderBack} 
          size="small"
          sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {selectedNote ? 'Back to notes' : 'Back'}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {renderContent()}
      </Box>
    </Box>
  );
}

