import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Box, 
  IconButton, 
  Chip, 
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import { useContextMenu } from './ContextMenuContext';
import { useDynamicSidebar } from './DynamicSidebar';
import { NoteDetailSidebar } from './NoteDetailSidebar';
import { ShareNoteModal } from '../ShareNoteModal';
import { toggleNoteVisibility, getShareableUrl, isNotePublic } from '@/lib/appwrite/permissions/notes';
import type { Notes } from '@/types/appwrite';
import { DoodleStroke } from '@/types/notes';
import {
  Delete as TrashIcon,
  Public as GlobeAltIcon,
  Lock as LockClosedIcon,
  ContentCopy as ClipboardDocumentIcon,
  Group as UserGroupIcon,
  MoreVert as EllipsisVerticalIcon,
  Check as CheckIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { sidebarIgnoreProps } from '@/constants/sidebar';

interface NoteCardProps {
  note: Notes;
  onUpdate?: (updatedNote: Notes) => void;
  onDelete?: (noteId: string) => void;
  onNoteSelect?: (note: Notes) => void;
  className?: string;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onUpdate, onDelete, onNoteSelect, className }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const { openMenu, closeMenu } = useContextMenu();
  const { openSidebar } = useDynamicSidebar();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCopySuccess, setIsCopySuccess] = useState(false);
  const theme = useTheme();

  // Render doodle preview on canvas
  useEffect(() => {
    if (note.format !== 'doodle' || !note.content || !canvasRef.current) return;

    try {
      const strokes: DoodleStroke[] = JSON.parse(note.content);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      strokes.forEach((stroke) => {
        if (stroke.points.length < 2) return;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = stroke.opacity ?? 1;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0][0], stroke.points[0][1]);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i][0], stroke.points[i][1]);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    } catch {
      console.error('Failed to render doodle preview');
    }
  }, [note.format, note.content]);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimer.current) {
        clearTimeout(copyFeedbackTimer.current);
      }
    };
  }, []);

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openMenu({
      x: e.clientX,
      y: e.clientY,
      items: contextMenuItems
    });
  };

  const handleClick = () => {
    if (onNoteSelect) {
      onNoteSelect(note);
      return;
    }
    openSidebar(
      <NoteDetailSidebar
        note={note}
        onUpdate={onUpdate || (() => { })}
        onDelete={onDelete || (() => { })}
      />,
      note.$id || null
    );
  };

  const handleDelete = () => {
    if (onDelete && note.$id) {
      onDelete(note.$id);
    }
  };

  const handleToggleVisibility = async () => {
    if (!note.$id) return;

    try {
      const updatedNote = await toggleNoteVisibility(note.$id);
      if (updatedNote && onUpdate) {
        onUpdate(updatedNote);
      }
    } catch (error) {
      console.error('Error toggling note visibility:', error);
    }
  };

  const handleCopyShareLink = () => {
    if (!note.$id) return;

    const shareUrl = getShareableUrl(note.$id);
    navigator.clipboard.writeText(shareUrl);
    setIsCopySuccess(true);
    if (copyFeedbackTimer.current) {
      clearTimeout(copyFeedbackTimer.current);
    }
    copyFeedbackTimer.current = setTimeout(() => {
      setIsCopySuccess(false);
    }, 2000);
  };

  const handleShareWith = () => {
    setShowShareModal(true);
    closeMenu();
  };

  const noteIsPublic = isNotePublic(note);

  const contextMenuItems = [
    {
      label: 'Share With',
      icon: <UserGroupIcon sx={{ fontSize: 18 }} />,
      onClick: handleShareWith
    },
    {
      label: noteIsPublic ? 'Make Private' : 'Make Public',
      icon: noteIsPublic ? <LockClosedIcon sx={{ fontSize: 18 }} /> : <GlobeAltIcon sx={{ fontSize: 18 }} />,
      onClick: handleToggleVisibility
    },
    ...(noteIsPublic ? [{
      label: 'Copy Share Link',
      icon: <ClipboardDocumentIcon sx={{ fontSize: 18 }} />,
      onClick: () => {
        handleCopyShareLink();
        closeMenu();
      }
    }] : []),
    {
      label: 'Delete',
      icon: <TrashIcon sx={{ fontSize: 18 }} />,
      onClick: handleDelete,
      variant: 'destructive' as const
    }
  ];

  return (
    <>
      <Card
        {...sidebarIgnoreProps}
        onClick={handleClick}
        onContextMenu={handleRightClick}
        sx={{
          height: { xs: 192, sm: 208, md: 224, lg: 240 },
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <CardHeader
          sx={{ pb: 1 }}
          title={
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.125rem' }, 
                  fontWeight: 700,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  flex: 1
                }}
              >
                {note.title}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {note.attachments && note.attachments.length > 0 && (
                  <Tooltip title={`${note.attachments.length} attachment${note.attachments.length > 1 ? 's' : ''}`}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5, 
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 2, 
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      color: 'secondary.main',
                      fontSize: '10px',
                      fontWeight: 700,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                    }}>
                      <AttachFileIcon sx={{ fontSize: 12 }} />
                      {note.attachments.length}
                    </Box>
                  </Tooltip>
                )}
                {noteIsPublic && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5, 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: 2, 
                    bgcolor: 'rgba(255, 245, 0, 0.1)',
                    color: '#FFD700',
                    fontSize: '10px',
                    fontWeight: 700,
                    border: '1px solid rgba(255, 245, 0, 0.2)'
                  }}>
                    <GlobeAltIcon sx={{ fontSize: 12 }} />
                    Public
                  </Box>
                )}

                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    const target = e.currentTarget as HTMLElement;
                    const rect = target.getBoundingClientRect();
                    openMenu({
                      x: Math.round(rect.left + rect.width / 2),
                      y: Math.round(rect.top + rect.height + 8),
                      items: contextMenuItems
                    });
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  <EllipsisVerticalIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          }
        />
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0, position: 'relative' }}>
          {note.format === 'doodle' ? (
            <Box sx={{ 
              flex: 1, 
              borderRadius: 3, 
              border: '1px solid rgba(255,255,255,0.1)', 
              overflow: 'hidden', 
              bgcolor: '#fff' 
            }}>
              <canvas
                ref={canvasRef}
                width={300}
                height={200}
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </Box>
          ) : (
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                display: '-webkit-box',
                WebkitLineClamp: { xs: 4, sm: 5, md: 6 },
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap'
              }}
            >
              {note.content}
            </Typography>
          )}
          
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5, overflow: 'hidden' }}>
            {note.tags && note.tags.slice(0, 3).map((tag: string, index: number) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{ 
                  height: 20, 
                  fontSize: '10px', 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            ))}
            {note.tags && note.tags.length > 3 && (
              <Typography variant="caption" sx={{ color: 'text.disabled', alignSelf: 'center', ml: 0.5 }}>
                +{note.tags.length - 3}
              </Typography>
            )}
          </Box>

          {noteIsPublic && (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleCopyShareLink();
              }}
              sx={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                bgcolor: 'primary.main',
                color: 'background.default',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.8) },
                width: 32,
                height: 32
              }}
            >
              {isCopySuccess ? <CheckIcon sx={{ fontSize: 16 }} /> : <ClipboardDocumentIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          )}
        </CardContent>
      </Card>

      {showShareModal && note.$id && (
        <ShareNoteModal
          isOpen={showShareModal}
          onOpenChange={setShowShareModal}
          noteId={note.$id}
          noteTitle={note.title || 'Untitled Note'}
        />
      )}
    </>
  );
};

export default NoteCard;


export default NoteCard;