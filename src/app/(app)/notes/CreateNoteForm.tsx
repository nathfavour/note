"use client";

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  IconButton, 
  TextField, 
  Chip, 
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { 
  Close as CloseIcon,
  Description as DescriptionIcon,
  LocalOffer as TagIcon,
  Add as PlusIcon,
  Brush as PencilIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
} from '@mui/icons-material';
import { Button } from '@/components/ui/Button';
import { buildAutoTitleFromContent } from '@/constants/noteTitle';
import { useOverlay } from '@/components/ui/OverlayContext';
import { useToast } from '@/components/ui/Toast';
import { createNote as appwriteCreateNote } from '@/lib/appwrite';
import type { Notes } from '@/types/appwrite';
import DoodleCanvas from '@/components/DoodleCanvas';

interface CreateNoteFormProps {
  onNoteCreated: (note: Notes) => void;
  initialContent?: {
    title?: string;
    content?: string;
    tags?: string[];
  };
  initialFormat?: 'text' | 'doodle';
}

export default function CreateNoteForm({ onNoteCreated, initialContent, initialFormat = 'text' }: CreateNoteFormProps) {
  const [title, setTitle] = useState(initialContent?.title || '');
  const [content, setContent] = useState(initialContent?.content || '');
  const [format, setFormat] = useState<'text' | 'doodle'>(initialFormat);
  const [tags, setTags] = useState<string[]>(initialContent?.tags || []);
  const [isPublic, setIsPublic] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDoodleEditor, setShowDoodleEditor] = useState(initialFormat === 'doodle');
  const { closeOverlay } = useOverlay();
  const { showSuccess, showError } = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(Boolean(initialContent?.title));
  const [showTitleInput, setShowTitleInput] = useState(Boolean(initialContent?.title));

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleTitleChange = (value: string) => {
    setIsTitleManuallyEdited(true);
    setTitle(value);
  };

  const handleDoodleSave = (doodleData: string) => {
    setContent(doodleData);
    setFormat('doodle');
    setShowDoodleEditor(false);
  };

  const handleDoodleClose = () => {
    setShowDoodleEditor(false);
    // If it was opened as a pure doodle and hasn't been saved/modified, close the whole overlay
    if (initialFormat === 'doodle' && !content) {
      closeOverlay();
    }
  };

  useEffect(() => {
    if (format !== 'text') return;
    if (isTitleManuallyEdited) return;

    const generatedTitle = buildAutoTitleFromContent(content);
    if (generatedTitle !== title) {
      setTitle(generatedTitle);
    }
  }, [content, format, isTitleManuallyEdited, title]);

  const handleCreateNote = async () => {
    let finalTitle = title.trim();
    
    // Auto-generate title if missing
    if (!finalTitle) {
      if (format === 'doodle') {
        finalTitle = `Sketch ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (content.trim()) {
        finalTitle = buildAutoTitleFromContent(content) || 'Untitled Thought';
      }
    }
    
    if (!finalTitle || isLoading) return;

    setIsLoading(true);
    const newNoteData = {
      title: finalTitle,
      content: content.trim(),
      format,
      tags,
      isPublic,
    };

    try {
      const newNote = await appwriteCreateNote(newNoteData);
      if (newNote) {
        showSuccess('Spark of Genius Capture', 'Your new note has been crystallized in the cloud.');
        onNoteCreated(newNote);
      }
      closeOverlay();
    } catch (error: any) {
      console.error('Failed to create note:', error);
      showError('Manifestation Failure', error.message || 'The cloud was unable to crystallize your thought. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showDoodleEditor && (
        <DoodleCanvas
          initialData={format === 'doodle' ? content : ''}
          onSave={handleDoodleSave}
          onClose={handleDoodleClose}
        />
      )}
      
      <Box
        sx={{
          width: '100%',
          maxWidth: '672px',
          mx: 'auto',
          bgcolor: 'rgba(255, 255, 255, 0.01)',
          backdropFilter: 'blur(25px) saturate(180%)',
          borderRadius: { xs: '24px', sm: '32px' },
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
          overflow: 'hidden',
          maxHeight: { xs: 'calc(100dvh - 1rem)', sm: 'calc(100vh - 4rem)' },
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: { xs: 2.5, sm: 3 },
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.01)'
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', // Ecosystem Primary
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)'
              }}
            >
              {format === 'doodle' ? (
                <PencilIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: 'black' }} />
              ) : (
                <DescriptionIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: 'black' }} />
              )}
            </Box>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 800, 
                  fontFamily: 'var(--font-clash-display)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.15em', 
                  fontSize: '0.75rem', 
                  color: 'secondary.main',
                }}
              >
                {format === 'doodle' ? 'Create Doodle' : 'New Thought'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontWeight: 500,
                  fontFamily: 'var(--font-satoshi)',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                {isPublic ? 'Visible to anyone with the link' : 'Only visible to you'}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              value={isPublic}
              exclusive
              onChange={(_, val) => val !== null && setIsPublic(val)}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '12px',
                p: 0.5,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: '8px',
                  px: 2,
                  py: 0.5,
                  color: 'rgba(255, 255, 255, 0.5)',
                  '&.Mui-selected': {
                    bgcolor: isPublic ? 'secondary.main' : 'rgba(255, 255, 255, 0.1)',
                    color: isPublic ? 'white' : 'white',
                    '&:hover': { bgcolor: isPublic ? 'secondary.dark' : 'rgba(255, 255, 255, 0.15)' }
                  }
                }
              }}
            >
              <ToggleButton value={false}>
                <PrivateIcon sx={{ fontSize: 18 }} />
              </ToggleButton>
              <ToggleButton value={true}>
                <PublicIcon sx={{ fontSize: 18 }} />
              </ToggleButton>
            </ToggleButtonGroup>
            
            <IconButton
              onClick={closeOverlay}
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  color: 'white'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

      {/* Form Content - Scrollable */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        p: { xs: 2.5, sm: 3 },
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '10px' }
      }}>
        <Stack sx={{ gap: { xs: 3, sm: 4 } }}>
          {/* Title Input (Animated) */}
          <Box sx={{ 
            opacity: showTitleInput ? 1 : 0, 
            maxHeight: showTitleInput ? '200px' : '0px',
            transform: showTitleInput ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
            visibility: showTitleInput ? 'visible' : 'hidden',
            pointerEvents: showTitleInput ? 'all' : 'none',
            mb: showTitleInput ? 0 : -4
          }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: 'secondary.main',
                mb: 1.5,
                fontSize: '0.7rem',
                fontFamily: 'var(--font-jetbrains-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em'
              }}
            >
              Title
            </Typography>
            <TextField
              fullWidth
              placeholder="Give your note a title..."
              value={title}
              onChange={ (e) => handleTitleChange(e.target.value)}
              variant="outlined"
              inputProps={{ maxLength: 255 }}
              autoComplete="off"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '16px',
                  color: 'white',
                  fontFamily: 'var(--font-satoshi)',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  '& fieldset': {
                    borderColor: 'rgba(236, 72, 153, 0.1)',
                    borderWidth: '1.5px'
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(236, 72, 153, 0.3)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'secondary.main',
                    borderWidth: '2px',
                    boxShadow: '0 0 20px rgba(236, 72, 153, 0.15)'
                  }
                }
              }}
            />
          </Box>

          {/* Content Input */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: 'rgba(255, 255, 255, 0.5)',
                mb: 1.5,
                fontSize: '0.75rem',
                fontFamily: 'var(--font-jetbrains-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}
            >
              Content
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={isMobile ? 5 : 8}
              placeholder="What's on your mind?..."
              value={content}
              onChange={ (e) => {
                setContent(e.target.value);
                if (e.target.value.length > 5 && !showTitleInput) {
                  setShowTitleInput(true);
                } else if (e.target.value.length <= 5 && showTitleInput && !isTitleManuallyEdited) {
                  setShowTitleInput(false);
                }
              }}
              variant="outlined"
              inputProps={{ maxLength: 65000 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '20px',
                  color: 'white',
                  fontFamily: 'var(--font-satoshi)',
                  lineHeight: 1.6,
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    borderWidth: '1.5px'
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.15)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: '2px',
                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)'
                  }
                }
              }}
            />
            <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'right',
                  mt: 0.5,
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontWeight: 600
                }}
              >
                {content.length.toLocaleString()} / 65,000
              </Typography>
            </Box>

          {/* Tags Section */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.9)',
                mb: 1.5,
                fontFamily: 'var(--font-space-grotesk)',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <TagIcon sx={{ fontSize: 18 }} />
              Tags
            </Typography>
            
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add a tag..."
                value={currentTag}
                onChange={ (e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderWidth: '2px'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#EC4899'
                    }
                  }
                }}
              />
              <IconButton
                onClick={handleAddTag}
                disabled={!currentTag.trim()}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'black',
                  borderRadius: '12px',
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(99, 102, 241, 0.3)',
                    color: 'rgba(0, 0, 0, 0.3)'
                  }
                }}
              >
                <PlusIcon />
              </IconButton>
            </Stack>

            {tags.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    deleteIcon={<CloseIcon sx={{ fontSize: '12px !important' }} />}
                    sx={{
                      bgcolor: 'rgba(236, 72, 153, 0.1)',
                      color: '#EC4899',
                      border: '1px solid rgba(236, 72, 153, 0.2)',
                      borderRadius: '10px',
                      fontWeight: 600,
                      '& .MuiChip-deleteIcon': {
                        color: '#EC4899',
                        '&:hover': { color: 'white' }
                      }
                    }}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Box>

      {/* Footer Actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'end',
          gap: 2,
          p: { xs: 2.5, sm: 3 },
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          bgcolor: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(10px)',
          mt: 'auto'
        }}
      >
        <Button 
          variant="outlined" 
          onClick={closeOverlay}
          disabled={isLoading}
          sx={{ 
            px: { xs: 2.5, sm: 4 }, 
            borderRadius: '14px',
            borderColor: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--font-jetbrains-mono)',
            fontSize: '0.8rem',
            fontWeight: 700,
            '&:hover': {
              borderColor: 'rgba(255,255,255,0.2)',
              bgcolor: 'rgba(255,255,255,0.03)',
              color: 'white'
            }
          }}
        >
          Discard
        </Button>
        <Button 
          onClick={ (e) => {
            e.preventDefault();
            handleCreateNote();
          }}
          disabled={!content.trim() || isLoading}
          sx={{ 
            px: { xs: 4, sm: 6 }, 
            py: { xs: 1.5, sm: 2 },
            borderRadius: '16px',
            bgcolor: 'secondary.main', // App Secondary
            color: 'white',
            fontWeight: 900,
            fontFamily: 'var(--font-satoshi)',
            fontSize: { xs: '0.9rem', sm: '1rem' },
            boxShadow: '0 8px 32px rgba(236, 72, 153, 0.25)',
            transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
            '&:hover': { 
              bgcolor: 'secondary.dark',
              boxShadow: '0 12px 40px rgba(236, 72, 153, 0.4)',
              transform: 'translateY(-2px)'
            },
            '&:active': {
              transform: 'translateY(0)',
              filter: 'brightness(0.9)'
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(236, 72, 153, 0.1)',
              color: 'rgba(255, 255, 255, 0.3)',
              boxShadow: 'none'
            }
          }}
        >
          {isLoading ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              />
              <Typography variant="button" sx={{ fontWeight: 900 }}>
                Synthesizing
              </Typography>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              {format === 'doodle' ? (
                <PencilIcon sx={{ fontSize: 20 }} />
              ) : (
                <DescriptionIcon sx={{ fontSize: 20 }} />
              )}
              <Typography variant="button" sx={{ fontWeight: 900 }}>
                {`Publish ${format === 'doodle' ? 'Doodle' : 'Note'}`}
              </Typography>
            </Stack>
          )}
        </Button>
      </Box>
    </Box>
    </>
  );
}

