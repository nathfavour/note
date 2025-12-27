'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Notes } from '@/types/appwrite';
import DoodleCanvas from '@/components/DoodleCanvas';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  TextField, 
  ToggleButtonGroup, 
  ToggleButton, 
  Chip, 
  Divider, 
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
  CircularProgress
} from '@mui/material';
import { 
  Delete as TrashIcon, 
  Person as UserIcon, 
  ContentCopy as ClipboardDocumentIcon, 
  AttachFile as PaperClipIcon, 
  OpenInNew as ArrowTopRightOnSquareIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { useDynamicSidebar } from '@/components/ui/DynamicSidebar';
import { formatNoteCreatedDate, formatNoteUpdatedDate } from '@/lib/date-utils';
import { getNoteWithSharing, updateNote } from '@/lib/appwrite';
import { formatFileSize } from '@/lib/utils';
import NoteContentDisplay from '@/components/NoteContentDisplay';
import { NoteContentRenderer } from '@/components/NoteContentRenderer';
import { useAutosave } from '@/hooks/useAutosave';

interface NoteDetailSidebarProps {
  note: Notes;
  onUpdate: (updatedNote: Notes) => void;
  onDelete: (noteId: string) => void;
  showExpandButton?: boolean;
  showHeaderDeleteButton?: boolean;
}

interface EnhancedNote extends Notes {
  isSharedWithUser?: boolean;
  sharePermission?: string;
  sharedBy?: { name: string; email: string } | null;
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
  showExpandButton = true,
  showHeaderDeleteButton = true,
}: NoteDetailSidebarProps) {
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const isEditing = isEditingTitle || isEditingContent;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDoodleEditor, setShowDoodleEditor] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [format, setFormat] = useState<'text' | 'doodle'>(note.format as 'text' | 'doodle' || 'text');
  const [tags, setTags] = useState(note.tags?.join(', ') || '');
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentErrors, setAttachmentErrors] = useState<string[]>([]);
  const [currentAttachments, setCurrentAttachments] = useState<any[]>([]);
  const [enhancedNote, setEnhancedNote] = useState<EnhancedNote | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const titleIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasEditingRef = useRef(isEditing);
  const prevNoteIdRef = useRef(note.$id);
  const theme = useTheme();

  const { showSuccess, showError } = useToast();
  const router = useRouter();
  const { closeSidebar } = useDynamicSidebar();

  const handleOpenFullPage = () => {
    if (!note.$id) return;
    closeSidebar();
    router.push(`/notes/${note.$id}`);
  };

  useEffect(() => {
    const loadEnhancedNote = async () => {
      try {
        const data = await getNoteWithSharing(note.$id);
        setEnhancedNote(data);
      } catch (err) {
        console.error('Error loading shared note details:', err);
        setEnhancedNote(null);
      }
    };

    if (note.attachments && Array.isArray(note.attachments)) {
      try {
        const parsed = note.attachments.map((a: any) => (typeof a === 'string' ? JSON.parse(a) : a));
        setCurrentAttachments(parsed);
      } catch (err) {
        console.error('Error parsing attachments:', err);
        setCurrentAttachments([]);
      }
    } else {
      setCurrentAttachments([]);
    }

    loadEnhancedNote();
  }, [note.$id]);

  useEffect(() => {
    const noteIdChanged = note.$id !== prevNoteIdRef.current;
    if (!noteIdChanged) return;
    prevNoteIdRef.current = note.$id;
    setTitle(note.title || '');
    setContent(note.content || '');
    setFormat((note.format as 'text' | 'doodle') || 'text');
    setTags((note.tags || []).join(', '));
    setIsEditingTitle(false);
    setIsEditingContent(false);
  }, [note.$id, note.title, note.content, note.format, note.tags]);

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
    title: title.trim(),
    content: content.trim(),
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
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
        {showExpandButton && (
          <Tooltip title="Open full page">
            <IconButton 
              onClick={(event) => {
                event.stopPropagation();
                handleOpenFullPage();
              }}
              sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            >
              <ArrowTopRightOnSquareIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {showHeaderDeleteButton && (
          <Tooltip title="Delete note">
            <IconButton 
              onClick={() => setShowDeleteConfirm(true)}
              sx={{ color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) } }}
            >
              <TrashIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box
        ref={titleContainerRef}
        sx={{
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          bgcolor: 'rgba(255, 255, 255, 0.03)',
          p: 3,
          transition: 'all 0.2s',
          '&:focus-within': {
            borderColor: 'primary.main',
            bgcolor: 'rgba(255, 255, 255, 0.05)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Title
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Tap to edit
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
              sx: { fontSize: '1.5rem', fontWeight: 900, color: 'text.primary' }
            }}
          />
        ) : (
          <Typography
            variant="h4"
            onClick={activateTitleEditing}
            sx={{ fontWeight: 900, cursor: 'text', color: 'text.primary' }}
          >
            {displayTitle}
          </Typography>
        )}
      </Box>

      <Box
        ref={contentContainerRef}
        sx={{
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          bgcolor: 'rgba(255, 255, 255, 0.03)',
          p: 3,
          transition: 'all 0.2s',
          '&:focus-within': {
            borderColor: 'primary.main',
            bgcolor: 'rgba(255, 255, 255, 0.05)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Content
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Click inside to edit
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
                bgcolor: 'rgba(255,255,255,0.05)',
                p: 0.5,
                borderRadius: 2,
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: 1.5,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'background.default',
                    fontWeight: 700,
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.8) }
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
                  sx: { fontSize: '0.875rem', color: 'text.primary', lineHeight: 1.6 }
                }}
              />
            ) : (
              <Box>
                {content ? (
                  <Box sx={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
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
                      height: 128, 
                      borderStyle: 'dashed', 
                      borderRadius: 3,
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: 'text.disabled'
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
              textClassName="text-foreground"
              doodleClassName="rounded-lg border border-border mb-2"
              emptyFallback={<Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>No content</Typography>}
              onEditDoodle={displayFormat === 'doodle' ? activateContentEditing : undefined}
            />

            {displayFormat !== 'doodle' && displayContent && (
              <Box sx={{ pt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ClipboardDocumentIcon />}
                  onClick={async (event) => {
                    event.stopPropagation();
                    try {
                      await navigator.clipboard.writeText(displayContent);
                      showSuccess('Copied', 'Content copied to clipboard');
                    } catch (err) {
                      showError('Copy failed', 'Could not copy content to clipboard');
                    }
                  }}
                  sx={{ 
                    borderRadius: 2, 
                    borderColor: 'rgba(255,255,255,0.1)', 
                    color: 'text.secondary',
                    '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                  }}
                >
                  Copy
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Tags */}
      <Box>
        <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Tags
        </Typography>
        {isEditing ? (
          <TextField
            fullWidth
            size="small"
            placeholder="Separate tags with commas"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.03)',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
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
                  color: 'primary.main',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  fontWeight: 600
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Attachments */}
      <Box>
        <Typography variant="caption" sx={{ display: 'block', mb: 1.5, color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Attachments
        </Typography>
        {isEditing && (
          <Box sx={{ mb: 2 }}>
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
              startIcon={isUploadingAttachment ? <CircularProgress size={16} /> : <PaperClipIcon />}
              onClick={() => document.getElementById('attachment-input')?.click()}
              disabled={isUploadingAttachment}
              sx={{ borderRadius: 3, borderColor: 'rgba(255,255,255,0.1)', color: 'text.primary' }}
            >
              {isUploadingAttachment ? 'Uploading...' : 'Add Attachments'}
            </Button>
            {attachmentErrors.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {attachmentErrors.map((err, i) => (
                  <Typography key={i} variant="caption" sx={{ display: 'block', color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1), p: 1, borderRadius: 1, mt: 0.5 }}>
                    {err}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        )}
        {currentAttachments.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 160, overflow: 'auto' }}>
            {currentAttachments.map((a: any) => (
              <Box key={a.id} sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                gap: 2, 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {formatFileSize(a.size)}{a.mime ? ` • ${a.mime}` : ''}
                  </Typography>
                </Box>
                <Button 
                  size="small" 
                  href={`/notes/${note.$id}/${a.id}`}
                  sx={{ color: 'primary.main', fontWeight: 700 }}
                >
                  Open
                </Button>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>No attachments</Typography>
        )}
      </Box>

      {/* Metadata */}
      <Box sx={{ pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Created: {formatNoteCreatedDate(note)}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Updated: {formatNoteUpdatedDate(note)}
        </Typography>

        {enhancedNote?.isSharedWithUser && enhancedNote?.sharedBy && (
          <Box sx={{ pt: 2, mt: 1, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
              <UserIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption">
                Shared by {enhancedNote.sharedBy.name || enhancedNote.sharedBy.email}
              </Typography>
            </Box>
            {enhancedNote.sharePermission && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.disabled', ml: 3 }}>
                Permission: {enhancedNote.sharePermission}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Edit Actions */}
      {isEditing && (
        <Box sx={{ pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {isAutosaving ? 'Saving changes…' : 'All changes saved'}
            </Typography>
            {isAutosaving && <CircularProgress size={12} color="primary" />}
          </Box>
          <Button 
            fullWidth 
            variant="outlined" 
            onClick={handleCancel}
            sx={{ borderRadius: 3, borderColor: 'rgba(255,255,255,0.1)', color: 'text.primary' }}
          >
            Cancel
          </Button>
        </Box>
      )}

      {/* Doodle Editor Modal */}
      {showDoodleEditor && (
        <DoodleCanvas
          initialData={format === 'doodle' ? content : ''}
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
            borderRadius: 6,
            bgcolor: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(25px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundImage: 'none',
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem' }}>Delete Note</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary' }}>
            Are you sure you want to delete &quot;{note.title || 'this note'}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            variant="contained" 
            color="error"
            fullWidth
            onClick={handleDelete}
            sx={{ borderRadius: 3 }}
          >
            Delete Note
          </Button>
          <Button 
            variant="outlined" 
            fullWidth
            onClick={() => setShowDeleteConfirm(false)}
            sx={{ borderRadius: 3, borderColor: 'rgba(255, 255, 255, 0.1)', color: 'text.primary' }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

