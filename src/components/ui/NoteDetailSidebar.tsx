'use client';


import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Notes } from '@/types/appwrite';
import dynamic from 'next/dynamic';

const DoodleCanvas = dynamic(() => import('@/components/DoodleCanvas'), { ssr: false });
const NoteContentDisplay = dynamic(() => import('@/components/NoteContentDisplay'), { ssr: false });
const NoteContentRenderer = dynamic(() => import('@/components/NoteContentRenderer'), { ssr: false });

import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  Delete as TrashIcon,
  ContentCopy as ClipboardDocumentIcon,
  AttachFile as PaperClipIcon,
  OpenInNew as ArrowTopRightOnSquareIcon,
  PushPin as PinIcon,
  PushPinOutlined as PinOutlinedIcon,
  ArrowBack as BackIcon,
  Link as LinkIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { useSudo } from '@/context/SudoContext';
import { useDynamicSidebar } from '@/components/ui/DynamicSidebar';
import { useNotes } from '@/context/NotesContext';
import { formatNoteCreatedDate, formatNoteUpdatedDate } from '@/lib/date-utils';
import { updateNote, listFlowTasks, listFlowEvents, listKeepCredentials, Query, toggleNoteVisibility, getShareableUrl } from '@/lib/appwrite';
import { formatFileSize } from '@/lib/utils';
import {
  PlaylistAddCheck as TaskIcon,
  OpenInNew as OpenIcon,
  Event as EventIcon,
  VpnKey as KeyIcon,
} from '@mui/icons-material';
import { useAutosave } from '@/hooks/useAutosave';

interface NoteDetailSidebarProps {
  note: Notes;
  onUpdate: (updatedNote: Notes) => void;
  onDelete: (noteId: string) => void;
  onBack?: () => void;
  showExpandButton?: boolean;
  showHeaderDeleteButton?: boolean;
}

const shallowArrayEqual = (a?: string[] | null, b?: string[] | null) => {

  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export function NoteDetailSidebar({
  note,
  onUpdate,
  onDelete,
  onBack,
  showExpandButton = true,
  showHeaderDeleteButton = true,
}: NoteDetailSidebarProps) {

  const theme = useTheme();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const isEditing = isEditingTitle || isEditingContent;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDoodleEditor, setShowDoodleEditor] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [format, setFormat] = useState<'text' | 'doodle'>(note.format as 'text' | 'doodle' || 'text');
  const [tags, setTags] = useState(note.tags?.join(', ') || '');
  const [isPublic, setIsPublic] = useState(note.isPublic);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentErrors, setAttachmentErrors] = useState<string[]>([]);
  const [currentAttachments, setCurrentAttachments] = useState<any[]>([]);
  const [linkedTasks, setLinkedTasks] = useState<any[]>([]);
  const [linkedEvents, setLinkedEvents] = useState<any[]>([]);
  const [linkedSecrets, setLinkedSecrets] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch linked tasks from Kylrix Flow
  useEffect(() => {
    const fetchLinkedTasks = async () => {
      const taskIds = (note as any).linkedTaskIds || ((note as any).linkedTaskId ? [(note as any).linkedTaskId] : []);
      if (!taskIds || taskIds.length === 0) {
        setLinkedTasks([]);
        return;
      }

      setIsLoadingTasks(true);
      try {
        const res = await listFlowTasks([Query.equal('$id', taskIds)]);
        setLinkedTasks(res.documents);
      } catch (err: any) {
        console.error('Failed to fetch linked tasks:', err);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchLinkedTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.$id, (note as any).linkedTaskIds, (note as any).linkedTaskId]);

  // Fetch linked events from Kylrix Flow
  useEffect(() => {
    const fetchLinkedEvents = async () => {
      const eventIds = (note as any).linkedEventIds || ((note as any).linkedEventId ? [(note as any).linkedEventId] : []);
      if (!eventIds || eventIds.length === 0) {
        setLinkedEvents([]);
        return;
      }

      setIsLoadingEvents(true);
      try {
        const res = await listFlowEvents([Query.equal('$id', eventIds)]);
        setLinkedEvents(res.documents);
      } catch (err: any) {
        console.error('Failed to fetch linked events:', err);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchLinkedEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.$id, (note as any).linkedEventIds, (note as any).linkedEventId]);

  // Fetch linked secrets from Kylrix Vault
  useEffect(() => {
    const fetchLinkedSecrets = async () => {
      const secretIds = (note as any).linkedCredentialIds || ((note as any).linkedCredentialId ? [(note as any).linkedCredentialId] : []);
      if (!secretIds || secretIds.length === 0) {
        setLinkedSecrets([]);
        return;
      }

      setIsLoadingSecrets(true);
      try {
        const res = await listKeepCredentials([Query.equal('$id', secretIds)]);
        setLinkedSecrets(res.documents);
      } catch (err: any) {
        console.error('Failed to fetch linked secrets:', err);
      } finally {
        setIsLoadingSecrets(false);
      }
    };

    fetchLinkedSecrets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.$id, (note as any).linkedCredentialIds, (note as any).linkedCredentialId]);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const titleIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasEditingRef = useRef(isEditing);
  const prevNoteIdRef = useRef(note.$id);

  const { showSuccess, showError } = useToast();
  const { promptSudo } = useSudo();
  const router = useRouter();
  const { closeSidebar } = useDynamicSidebar();
  const { isPinned, pinNote, unpinNote } = useNotes();

  const pinned = isPinned(note.$id);

  const handlePinToggle = async () => {
    try {
      if (pinned) {
        await unpinNote(note.$id);
        showSuccess('Note unpinned');
      } else {
        await pinNote(note.$id);
        showSuccess('Note pinned');
      }
    } catch (err: any) {
      const isLimitError = err.message?.includes('limit reached');
      showError(err.message || 'Failed to update pin status', undefined, isLimitError);
    }
  };

  const handleOpenFullPage = () => {
    if (!note.$id) return;
    closeSidebar();
    router.push(`/notes/${note.$id}`);
  };

  useEffect(() => {
    if (note.attachments && Array.isArray(note.attachments)) {
      try {
        const parsed = note.attachments.map((a: any) => (typeof a === 'string' ? JSON.parse(a) : a));
        setCurrentAttachments(parsed);
      } catch (err: any) {
        console.error('Error parsing attachments:', err);
        setCurrentAttachments([]);
      }
    } else {
      setCurrentAttachments([]);
    }
  }, [note.$id, note.attachments]);


  useEffect(() => {
    const noteIdChanged = note.$id !== prevNoteIdRef.current;
    if (!noteIdChanged) return;
    prevNoteIdRef.current = note.$id;
    setTitle(note.title || '');
    setContent(note.content || '');
    setFormat((note.format as 'text' | 'doodle') || 'text');
    setTags((note.tags || []).join(', '));
    setIsPublic(note.isPublic);
    setIsEditingTitle(false);
    setIsEditingContent(false);
  }, [note.$id, note.title, note.content, note.format, note.tags, note.isPublic]);

  const normalizedTags = useMemo(() => {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }, [tags]);

  const displayTitle = title || note.title || 'Untitled note';
  const displayContent = content || note.content || '';
  const displayFormat = format;
  const displayTags = normalizedTags.length > 0 ? normalizedTags : (note.tags || []);

  const resetTitleIdleTimer = () => {
    if (titleIdleTimer.current) {
      clearTimeout(titleIdleTimer.current);
    }
    titleIdleTimer.current = setTimeout(() => setIsEditingTitle(false), 15000);
  };

  const resetContentIdleTimer = () => {
    if (contentIdleTimer.current) {
      clearTimeout(contentIdleTimer.current);
    }
    contentIdleTimer.current = setTimeout(() => setIsEditingContent(false), 15000);
  };

  useEffect(() => {
    if (!isEditingTitle && titleIdleTimer.current) {
      clearTimeout(titleIdleTimer.current);
      titleIdleTimer.current = null;
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (!isEditingContent && contentIdleTimer.current) {
      clearTimeout(contentIdleTimer.current);
      contentIdleTimer.current = null;
    }
  }, [isEditingContent]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
      resetTitleIdleTimer();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingContent && contentTextareaRef.current) {
      contentTextareaRef.current.focus();
      resetContentIdleTimer();
    }
  }, [isEditingContent]);

  useEffect(() => {
    const handleGlobalFocusOrClick = (event: FocusEvent | MouseEvent) => {
      const target = (event.target || document.activeElement) as Node | null;
      if (isEditingTitle && titleContainerRef.current && target && !titleContainerRef.current.contains(target)) {
        setIsEditingTitle(false);
      }
      if (isEditingContent && contentContainerRef.current && target && !contentContainerRef.current.contains(target)) {
        setIsEditingContent(false);
      }
    };

    document.addEventListener('focusin', handleGlobalFocusOrClick);
    document.addEventListener('mousedown', handleGlobalFocusOrClick);
    return () => {
      document.removeEventListener('focusin', handleGlobalFocusOrClick);
      document.removeEventListener('mousedown', handleGlobalFocusOrClick);
    };
  }, [isEditingTitle, isEditingContent]);

  const autosaveCandidate = useMemo<Notes>(() => ({
    ...note,
    title: (title ?? '').trim(),
    content: (content ?? '').trim(),
    format,
    tags: normalizedTags,
  }), [note, title, content, format, normalizedTags]);

  const saveNote = useCallback(async (candidate: Notes) => {
    if (!candidate.$id) return candidate;
    const payload: Partial<Notes> = {
      title: candidate.title,
      content: candidate.content,
      format: candidate.format,
      tags: candidate.tags,
      isPublic: candidate.isPublic,
      status: candidate.status,
      parentNoteId: candidate.parentNoteId,
      comments: candidate.comments,
      extensions: candidate.extensions,
      collaborators: candidate.collaborators,
      metadata: candidate.metadata,
    };
    const saved = await updateNote(candidate.$id, payload);
    onUpdate(saved);
    return saved;
  }, [onUpdate]);

  const { isSaving: isAutosaving, forceSave } = useAutosave(autosaveCandidate, {
    enabled: !!note.$id,
    debounceMs: 600,
    trigger: 'manual',
    save: saveNote,
    onSave: () => {
      // local state already updated via onUpdate
    },
    onError: (error) => {
      showError('Autosave failed', error?.message || 'Could not sync your note');
    },
  });

  useEffect(() => {
    if (wasEditingRef.current && !isEditing && autosaveCandidate.$id) {
      forceSave(autosaveCandidate);
    }
    wasEditingRef.current = isEditing;
  }, [isEditing, autosaveCandidate, forceSave]);

  useEffect(() => {
    return () => {
      if (autosaveCandidate.$id) {
        forceSave(autosaveCandidate);
      }
    };
  }, [autosaveCandidate, forceSave]);

  useEffect(() => {
    if (!isEditing || !note.$id) return;
    const trimmedTitle = (title ?? '').trim();
    const trimmedContent = (content ?? '').trim();
    const tagsMatch = shallowArrayEqual(note.tags || [], normalizedTags);
    const matchesExisting =
      (note.title || '') === trimmedTitle &&
      (note.content || '') === trimmedContent &&
      (note.format || 'text') === format &&
      tagsMatch;
    if (matchesExisting) return;

    onUpdate({
      ...note,
      title: trimmedTitle,
      content: trimmedContent,
      format,
      tags: normalizedTags,
      updatedAt: new Date().toISOString(),
    });
  }, [isEditing, title, content, format, normalizedTags, note, onUpdate]);

  const handleDoodleSave = (doodleData: string) => {
    setContent(doodleData);
    setShowDoodleEditor(false);
  };

  const activateTitleEditing = () => {
    setIsEditingTitle(true);
  };

  const activateContentEditing = () => {
    setIsEditingContent(true);
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    setIsUploadingAttachment(true);
    setAttachmentErrors([]);
    const newErrors: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch(`/api/notes/${note.$id}/attachments`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          if (!res.ok) {
            let errorPayload: any = null;
            try {
              errorPayload = await res.json();
            } catch {
              try {
                errorPayload = { raw: await res.text() };
              } catch {
                errorPayload = { error: `HTTP ${res.status}: ${res.statusText}` };
              }
            }
            const msg = errorPayload?.error || errorPayload?.raw || `Upload failed (${res.status})`;
            newErrors.push(`${file.name}: ${msg}`);
          } else {
            const data = await res.json();
            if (data.attachment) {
              setCurrentAttachments((prev) => [...prev, data.attachment]);
              showSuccess('Attachment added', `${file.name} uploaded successfully`);
            }
          }
        } catch (err: any) {
          newErrors.push(`${file.name}: ${err?.message || 'Upload failed'}`);
        }
      }

      if (newErrors.length > 0) {
        setAttachmentErrors(newErrors);
      }
    } finally {
      setIsUploadingAttachment(false);
      if (e.currentTarget) {
        e.currentTarget.value = '';
      }
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/shared/${note.$id}`;
    navigator.clipboard.writeText(shareUrl);
    showSuccess('Share link copied to clipboard');
  };

  const handleCancel = () => {
    setTitle(note.title || '');
    setContent(note.content || '');
    setFormat((note.format as 'text' | 'doodle') || 'text');
    setTags((note.tags || []).join(', '));
    setIsEditingTitle(false);
    setIsEditingContent(false);
  };

  const handleDelete = () => {
    onDelete(note.$id || '');
    setShowDeleteConfirm(false);
  };

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
        <IconButton
          onClick={onBack || closeSidebar}
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': { color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.1) }
          }}
        >
          <BackIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {showExpandButton && (
            <Tooltip title="Open full page">
              <IconButton
                onClick={(event) => {
                event.stopPropagation();
                  handleOpenFullPage();
                }}
                sx={{
                  display: { xs: 'none', md: 'inline-flex' },
                  color: theme.palette.text.secondary,
                  '&:hover': { color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.1) }
                }}
              >
                <ArrowTopRightOnSquareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={isPublic ? "Make private" : "Make public"}>
            <IconButton
              onClick={async () => {
                const handleToggle = async () => {
                  try {
                    const updated = await toggleNoteVisibility(note.$id);
                    if (updated) {
                      setIsPublic(updated.isPublic);
                      onUpdate(updated);
                      showSuccess(updated.isPublic ? 'Note is now Public' : 'Note is now Private');
                      if (updated.isPublic && updated.decryptionKey) {
                        const shareUrl = getShareableUrl(note.$id, updated.decryptionKey);
                        navigator.clipboard.writeText(shareUrl);
                        showSuccess('Link Copied', 'Encrypted public link is on your clipboard.');
                      }
                    }
                  } catch (err: any) {
                    if (err.message === 'VAULT_LOCKED') {
                      showError('Vault Locked', 'You must unlock your vault to encrypt this note.');
                      const unlocked = await promptSudo();
                      if (unlocked) handleToggle();
                    } else {
                      showError('Toggle Failed', err.message || 'Failed to update visibility.');
                    }
                  }
                };
                handleToggle();
              }}
              sx={{
                color: isPublic ? theme.palette.primary.main : theme.palette.text.secondary,
                '&:hover': { color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.1) }
              }}
            >
              {isPublic ? <LinkIcon fontSize="small" /> : <LockIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {isPublic && (
            <Tooltip title="Copy share link">
              <IconButton
                onClick={handleCopyShareLink}
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': { color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.1) }
                }}
              >
                <ClipboardDocumentIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={pinned ? "Unpin note" : "Pin note"}>
            <IconButton
              onClick={handlePinToggle}
              sx={{
                color: pinned ? theme.palette.secondary.main : theme.palette.text.secondary,
                '&:hover': { color: theme.palette.secondary.main, bgcolor: alpha(theme.palette.secondary.main, 0.1) }
              }}
            >
              {pinned ? <PinIcon fontSize="small" /> : <PinOutlinedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {showHeaderDeleteButton && (
            <Tooltip title="Delete note">
              <IconButton
                onClick={() => setShowDeleteConfirm(true)}
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.1) }
                }}
              >
                <TrashIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box
        ref={titleContainerRef}
        sx={{
          borderRadius: '32px',
          border: '1px solid #1C1A18',
          bgcolor: '#161412',
          p: 4,
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -1px 0 rgba(0, 0, 0, 0.4)',
          '&:focus-within': {
            borderColor: '#EC4899',
            bgcolor: alpha('#EC4899', 0.05),
            transform: 'translateZ(20px) translateY(-4px)',
            boxShadow: `0 32px 64px ${alpha('#EC4899', 0.2)}, inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -1px 0 rgba(0, 0, 0, 0.4)`,
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.secondary.main,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontFamily: 'var(--font-clash-display)'
            }}
          >
            Title
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, fontFamily: 'var(--font-satoshi)', opacity: 0.6 }}>
            Click to Edit
          </Typography>
        </Box>
        {isEditingTitle ? (
          <TextField
            fullWidth
            variant="standard"
            value={title || ''}
            onChange={(e) => {
              setTitle(e.target.value);
              resetTitleIdleTimer();
            }}
            inputRef={titleInputRef}
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: '2rem',
                fontWeight: 900,
                color: theme.palette.text.primary,
                fontFamily: 'var(--font-clash-display)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }
            }}
          />
        ) : (
          <Typography
            variant="h4"
            onClick={activateTitleEditing}
            sx={{
              fontWeight: 900,
              cursor: 'text',
              color: theme.palette.text.primary,
              fontFamily: 'var(--font-clash-display)',
              fontSize: '2rem',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              transition: 'color 0.2s ease',
              '&:hover': {
                color: theme.palette.secondary.main
              }
            }}
          >
            {displayTitle}
          </Typography>
        )}
      </Box>

      <Box
        ref={contentContainerRef}
        sx={{
          borderRadius: '32px',
          border: '1px solid #1C1A18',
          bgcolor: '#161412',
          p: 4,
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -1px 0 rgba(0, 0, 0, 0.4)',
          '&:focus-within': {
            borderColor: '#EC4899',
            bgcolor: alpha('#EC4899', 0.05),
            transform: 'translateZ(20px) translateY(-4px)',
            boxShadow: `0 32px 64px ${alpha('#EC4899', 0.2)}, inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -1px 0 rgba(0, 0, 0, 0.4)`,
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontFamily: 'var(--font-clash-display)'
            }}
          >
            Content
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, fontFamily: 'var(--font-satoshi)', opacity: 0.6 }}>
            Rich Content Environment
          </Typography>
        </Box>

        {isEditingContent ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ToggleButtonGroup
              value={format}
              exclusive
              onChange={(_, newFormat) => newFormat && setFormat(newFormat)}
              fullWidth
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.text.primary, 0.05),
                p: 0.5,
                borderRadius: '12px',
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: '8px',
                  color: theme.palette.text.secondary,
                  fontFamily: 'var(--font-clash)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  '&.Mui-selected': {
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    '&:hover': { bgcolor: theme.palette.primary.dark }
                  }
                }
              }}
            >
              <ToggleButton value="text">Text</ToggleButton>
              <ToggleButton value="doodle">Doodle</ToggleButton>
            </ToggleButtonGroup>

            {format === 'text' ? (
              <TextField
                fullWidth
                multiline
                rows={12}
                variant="standard"
                value={content || ''}
                onChange={(e) => {
                  setContent(e.target.value);
                  resetContentIdleTimer();
                }}
                inputRef={contentTextareaRef}
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    fontSize: '0.95rem',
                    color: theme.palette.text.primary,
                    lineHeight: 1.7,
                    fontFamily: 'var(--font-satoshi)'
                  }
                }}
              />
            ) : (
              <Box>
                {content ? (
                  <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '16px', overflow: 'hidden' }}>
                    <NoteContentDisplay
                      content={content}
                      format="doodle"
                      onEditDoodle={() => setShowDoodleEditor(true)}
                    />
                  </Box>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setShowDoodleEditor(true)}
                    sx={{
                      height: 160,
                      borderStyle: 'dashed',
                      borderRadius: '16px',
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.secondary,
                      fontFamily: 'var(--font-clash)',
                      fontWeight: 700,
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        color: theme.palette.primary.main
                      }
                    }}
                  >
                    Click to draw
                  </Button>
                )}
              </Box>
            )}
          </Box>
        ) : (
          <Box onClick={activateContentEditing} sx={{ cursor: 'text' }}>
            <NoteContentRenderer
              content={displayContent}
              format={displayFormat}
              emptyFallback={<Typography variant="body2" sx={{ fontStyle: 'italic', color: theme.palette.text.secondary }}>No content</Typography>}
              onEditDoodle={displayFormat === 'doodle' ? activateContentEditing : undefined}
            />

            {displayFormat !== 'doodle' && displayContent && (
              <Box sx={{ pt: 3 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ClipboardDocumentIcon />}
                  onClick={async (event) => {
                    event.stopPropagation();
                    try {
                      await navigator.clipboard.writeText(displayContent);
                      showSuccess('Copied', 'Content copied to clipboard');
                    } catch {
                      showError('Copy failed', 'Could not copy content to clipboard');
                    }
                  }}
                  sx={{
                    borderRadius: '10px',
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.secondary,
                    fontFamily: 'var(--font-clash)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  Copy Content
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Tags */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mb: 2,
            color: theme.palette.primary.main,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-clash)'
          }}
        >
          Tags
        </Typography>
        {isEditing ? (
          <TextField
            fullWidth
            size="small"
            placeholder="Separate tags with commas"
            value={tags}
            onChange={ (e) => setTags(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: alpha(theme.palette.text.primary, 0.03),
                fontFamily: 'var(--font-satoshi)',
                '& fieldset': { borderColor: theme.palette.divider },
                '&:hover fieldset': { borderColor: alpha(theme.palette.text.primary, 0.2) },
                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
              }
            }}
          />
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {displayTags.map((tag: string, index: number) => (
              <Chip
                key={`${tag}-${index}`}
                label={tag}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  fontWeight: 700,
                  fontFamily: 'var(--font-clash)',
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  borderRadius: '6px'
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Attachments */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mb: 2,
            color: theme.palette.primary.main,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-clash)'
          }}
        >
          Attachments
        </Typography>
        {isEditing && (
          <Box sx={{ mb: 2.5 }}>
            <input
              type="file"
              id="attachment-input"
              multiple
              onChange={handleAttachmentUpload}
              disabled={isUploadingAttachment}
              style={{ display: 'none' }}
            />
            <Button
              fullWidth
              variant="outlined"
              startIcon={isUploadingAttachment ? <CircularProgress size={16} sx={{ color: theme.palette.primary.main }} /> : <PaperClipIcon />}
              onClick={() => document.getElementById('attachment-input')?.click()}
              disabled={isUploadingAttachment}
              sx={{
                borderRadius: '12px',
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                fontFamily: 'var(--font-clash)',
                fontWeight: 700,
                textTransform: 'uppercase',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            >
              {isUploadingAttachment ? 'Uploading...' : 'Add Attachments'}
            </Button>
            {attachmentErrors.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                {attachmentErrors.map((err, i) => (
                  <Typography key={i} variant="caption" sx={{ display: 'block', color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.1), p: 1.5, borderRadius: '8px', mt: 1, fontFamily: 'var(--font-satoshi)' }}>
                    {err}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        )}
        {currentAttachments.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 240, overflow: 'auto' }}>
            {currentAttachments.map((a: any) => (
              <Box key={a.id} sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                p: 2,
                borderRadius: '16px',
                bgcolor: alpha(theme.palette.text.primary, 0.03),
                border: `1px solid ${theme.palette.divider}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.text.primary, 0.05),
                  borderColor: alpha(theme.palette.text.primary, 0.1)
                }
              }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-clash)' }}>
                    {a.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: 'var(--font-satoshi)' }}>
                    {formatFileSize(a.size)}{a.mime ? ` • ${a.mime}` : ''}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  href={`/notes/${note.$id}/${a.id}`}
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 800,
                    fontFamily: 'var(--font-clash)',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                  }}
                >
                  OPEN
                </Button>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: theme.palette.text.secondary, fontFamily: 'var(--font-satoshi)' }}>No attachments</Typography>
        )}
      </Box>

      {/* Linked Tasks */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mb: 2,
            color: theme.palette.primary.main,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-clash)'
          }}
        >
          Linked Tasks (Flow)
        </Typography>
        {isLoadingTasks ? (
          <CircularProgress size={20} sx={{ color: theme.palette.primary.main, ml: 1 }} />
        ) : linkedTasks.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {linkedTasks.map((task) => (
              <Box key={task.$id} sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                p: 2,
                borderRadius: '16px',
                bgcolor: alpha(theme.palette.primary.main, 0.03),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  borderColor: alpha(theme.palette.primary.main, 0.3)
                }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                  <TaskIcon sx={{ color: task.status === 'done' ? '#4CAF50' : theme.palette.primary.main, fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-clash)' }}>
                    {task.title}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => window.open(`https://flow.kylrix.space/tasks?taskId=${task.$id}`, '_blank')}
                  sx={{ color: theme.palette.primary.main }}
                >
                  <OpenIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: theme.palette.text.secondary, fontFamily: 'var(--font-satoshi)' }}>No linked tasks</Typography>
        )}
      </Box>

      {/* Linked Events */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mb: 2,
            color: theme.palette.primary.main,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-clash)'
          }}
        >
          Linked Events (Flow)
        </Typography>
        {isLoadingEvents ? (
          <CircularProgress size={20} sx={{ color: theme.palette.primary.main, ml: 1 }} />
        ) : linkedEvents.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {linkedEvents.map((event) => (
              <Box key={event.$id} sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                p: 2,
                borderRadius: '16px',
                bgcolor: alpha(theme.palette.primary.main, 0.03),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  borderColor: alpha(theme.palette.primary.main, 0.3)
                }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                  <EventIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-clash)' }}>
                    {event.title}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => window.open(`https://flow.kylrix.space/events?eventId=${event.$id}`, '_blank')}
                  sx={{ color: theme.palette.primary.main }}
                >
                  <OpenIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: theme.palette.text.secondary, fontFamily: 'var(--font-satoshi)' }}>No linked events</Typography>
        )}
      </Box>

      {/* Linked Secrets */}
      <Box>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mb: 2,
            color: theme.palette.primary.main,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-clash)'
          }}
        >
          Linked Secrets (Keep)
        </Typography>
        {isLoadingSecrets ? (
          <CircularProgress size={20} sx={{ color: theme.palette.primary.main, ml: 1 }} />
        ) : linkedSecrets.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {linkedSecrets.map((secret) => (
              <Box key={secret.$id} sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                p: 2,
                borderRadius: '16px',
                bgcolor: alpha(theme.palette.primary.main, 0.03),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  borderColor: alpha(theme.palette.primary.main, 0.3)
                }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                  <KeyIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-clash)' }}>
                    {secret.name}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => window.open(`https://vault.kylrix.space/vault?id=${secret.$id}`, '_blank')}
                  sx={{ color: theme.palette.primary.main }}
                >
                  <OpenIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: theme.palette.text.secondary, fontFamily: 'var(--font-satoshi)' }}>No linked secrets</Typography>
        )}
      </Box>

      {/* Metadata */}
      <Box sx={{ pt: 4, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: 'var(--font-satoshi)' }}>
          Created: {formatNoteCreatedDate(note)}
        </Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: 'var(--font-satoshi)' }}>
          Updated: {formatNoteUpdatedDate(note)}
        </Typography>
      </Box>


      {/* Edit Actions */}
      {isEditing && (
        <Box sx={{ pt: 4, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: 'var(--font-satoshi)', fontWeight: 600 }}>
              {isAutosaving ? 'Syncing changes…' : 'All changes synced'}
            </Typography>
            {isAutosaving && <CircularProgress size={14} sx={{ color: theme.palette.primary.main }} />}
          </Box>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleCancel}
            sx={{
              borderRadius: '12px',
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              fontFamily: 'var(--font-clash)',
              fontWeight: 700,
              textTransform: 'uppercase',
              '&:hover': {
                borderColor: alpha(theme.palette.text.primary, 0.3),
                bgcolor: alpha(theme.palette.text.primary, 0.05)
              }
            }}
          >
            Cancel Edits
          </Button>
        </Box>
      )}

      {/* Doodle Editor Modal */}
      {showDoodleEditor && (
        <DoodleCanvas
          initialData={(format === 'doodle' ? content : '') || ''}
          onSave={handleDoodleSave}
          onClose={() => setShowDoodleEditor(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
          PaperProps={{
          sx: {
            borderRadius: '32px',
            bgcolor: '#161412',
            border: '1px solid #1C1A18',
            backgroundImage: 'none',
            p: 2,
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }
        }}
      >
        <DialogTitle sx={{
          fontWeight: 900,
          fontSize: '1.75rem',
          fontFamily: '"Space Grotesk", sans-serif',
          color: '#FF453A',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Delete Note
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'var(--font-satoshi), sans-serif', lineHeight: 1.6 }}>
            Are you sure you want to delete &quot;{note.title || 'this note'}&quot;? This action is permanent and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2, flexDirection: 'column' }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleDelete}
            sx={{
              borderRadius: '12px',
              bgcolor: '#FF453A',
              color: '#FFFFFF',
              fontWeight: 800,
              fontFamily: '"Space Grotesk", sans-serif',
              textTransform: 'uppercase',
              '&:hover': { bgcolor: '#D32F2F' }
            }}
          >
            Delete Permanently
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setShowDeleteConfirm(false)}
            sx={{
              borderRadius: '12px',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontFamily: '"Space Grotesk", sans-serif',
              textTransform: 'uppercase',
              '&:hover': { borderColor: 'rgba(255, 255, 255, 0.3)', bgcolor: 'rgba(255, 255, 255, 0.05)' }
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

