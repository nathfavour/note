"use client";

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  IconButton, 
  TextField, 
  Chip, 
  LinearProgress, 
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import { 
  Close as CloseIcon,
  Description as DescriptionIcon,
  LocalOffer as TagIcon,
  Public as GlobeAltIcon,
  Lock as LockClosedIcon,
  Add as PlusIcon,
  Brush as PencilIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { Button } from '@/components/ui/Button';
import { AUTO_TITLE_CONFIG } from '@/constants/noteTitle';
import { Notes, Status } from '@/types/appwrite';
import { createNote } from '@/lib/appwrite';
import { useOverlay } from '@/components/ui/OverlayContext';
import dynamic from 'next/dynamic';

const DoodleCanvas = dynamic(() => import('@/components/DoodleCanvas'), { ssr: false });

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
  const [currentTag, setCurrentTag] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [status, setStatus] = useState<Status>(Status.DRAFT);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ uploaded: number; total: number }>({ uploaded: 0, total: 0 });
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [showDoodleEditor, setShowDoodleEditor] = useState(false);
  const { closeOverlay } = useOverlay();
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(Boolean(initialContent?.title));

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

  useEffect(() => {
    if (format !== 'text') return;
    if (isTitleManuallyEdited) return;

    const generatedTitle = buildAutoTitleFromContent(content);
    if (generatedTitle !== title) {
      setTitle(generatedTitle);
    }
  }, [content, format, isTitleManuallyEdited, title]);

  const handleCreateNote = async () => {
    if (!title.trim() || isLoading || uploading) return;

    setIsLoading(true);
    const newNoteData = {
      title: title.trim(),
      content: content.trim(),
      format,
      tags,
      isPublic,
      status,
      parentNoteId: null, // For hierarchical notes
      attachments: [], // For file attachments
      comments: [], // For collaboration
      extensions: [], // For plugin data
      collaborators: [], // For sharing
      metadata: JSON.stringify({
        createdFrom: 'overlay',
        deviceType: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
      })
    };

    try {
      const newNote = await createNote(newNoteData);
      if (newNote) {
        onNoteCreated(newNote);
        // Upload pending files sequentially using client SDK
        if (pendingFiles.length) {
          setUploading(true);
          setUploadProgress({ uploaded: 0, total: pendingFiles.length });
          let hadErrors = false;
          for (let i = 0; i < pendingFiles.length; i++) {
            const file = pendingFiles[i];
            try {
              const { addAttachmentToNote } = await import('@/lib/appwrite');
              const noteId = newNote.$id || (newNote as any).id;
              await addAttachmentToNote(noteId, file);
            } catch (e: any) {
              hadErrors = true;
              setUploadErrors(prev => [...prev, `${file.name}: ${e?.message || 'Upload error'}`].slice(-8));
              console.error('Attachment upload error', e);
            } finally {
              setUploadProgress(prev => ({ uploaded: prev.uploaded + 1, total: prev.total }));
            }
          }
          if (hadErrors) {
            // Do not close overlay; allow user to see errors
            return;
          }
        }
      }
      closeOverlay();
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setIsLoading(false);
      setUploading(false);
      setPendingFiles([]);
    }
  };

  return (
    <>
      {showDoodleEditor && (
        <DoodleCanvas
          initialData={format === 'doodle' ? content : ''}
          onSave={handleDoodleSave}
          onClose={() => setShowDoodleEditor(false)}
        />
      )}
      
      <Box
        sx={{
          width: '100%',
          maxWidth: '672px',
          mx: 'auto',
          bgcolor: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(25px) saturate(180%)',
          borderRadius: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          maxHeight: 'calc(100vh - 4rem)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 3,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(90deg, rgba(0, 245, 255, 0.05) 0%, rgba(0, 245, 255, 0.1) 100%)'
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #00F5FF 0%, #00D1FF 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0, 245, 255, 0.2)'
              }}
            >
              {format === 'doodle' ? (
                <PencilIcon sx={{ fontSize: 24, color: 'black' }} />
              ) : (
                <DescriptionIcon sx={{ fontSize: 24, color: 'black' }} />
              )}
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  fontFamily: 'var(--font-space-grotesk)',
                  color: 'white'
                }}
              >
                {format === 'doodle' ? 'Create Doodle' : 'Create Note'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: 500
                }}
              >
                {format === 'doodle' ? 'Draw and sketch your ideas' : 'Capture your thoughts and ideas'}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Format Toggle */}
            <ToggleButtonGroup
              value={format}
              exclusive
              onChange={(_, newFormat) => newFormat && setFormat(newFormat)}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                p: 0.5,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: '8px',
                  px: 2,
                  py: 0.75,
                  color: 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  '&.Mui-selected': {
                    bgcolor: '#00F5FF',
                    color: 'black',
                    '&:hover': {
                      bgcolor: '#00E5EE'
                    }
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  }
                }
              }}
            >
              <ToggleButton value="text">
                <Stack direction="row" spacing={1} alignItems="center">
                  <DescriptionIcon sx={{ fontSize: 18 }} />
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Text</Box>
                </Stack>
              </ToggleButton>
              <ToggleButton value="doodle">
                <Stack direction="row" spacing={1} alignItems="center">
                  <PencilIcon sx={{ fontSize: 18 }} />
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Doodle</Box>
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>
            
            <IconButton
              onClick={closeOverlay}
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

      {/* Form Content - Scrollable */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        <Stack spacing={4}>
          {/* Title Input */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.9)',
                mb: 1,
                fontFamily: 'var(--font-space-grotesk)'
              }}
            >
              Title
            </Typography>
            <TextField
              fullWidth
              placeholder="Give your note a memorable title..."
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              variant="outlined"
              inputProps={{ maxLength: 255 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '16px',
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: '2px'
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00F5FF'
                  }
                }
              }}
            />
          </Box>

          {/* Content - Text or Doodle */}
          {format === 'text' ? (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.9)',
                  mb: 1,
                  fontFamily: 'var(--font-space-grotesk)'
                }}
              >
                Content
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={6}
                placeholder="Start writing your beautiful notes here... You can always edit and enhance them later."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                variant="outlined"
                inputProps={{ maxLength: 65000 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '16px',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderWidth: '2px'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00F5FF'
                    }
                  }
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'right',
                  mt: 1,
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontWeight: 500
                }}
              >
                {content.length}/65000 characters
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.9)',
                  mb: 1,
                  fontFamily: 'var(--font-space-grotesk)'
                }}
              >
                Doodle
              </Typography>
              {content ? (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 200,
                    borderRadius: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    overflow: 'hidden'
                  }}
                >
                  <canvas 
                    style={{ width: '100%', height: '100%' }}
                    ref={(canvas) => {
                      if (!canvas || !content) return;
                      try {
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;
                        const strokes = JSON.parse(content);
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        strokes.forEach((stroke: any) => {
                          if (stroke.points.length < 2) return;
                          ctx.strokeStyle = stroke.color;
                          ctx.lineWidth = stroke.size;
                          ctx.lineCap = 'round';
                          ctx.lineJoin = 'round';
                          ctx.beginPath();
                          ctx.moveTo(stroke.points[0][0], stroke.points[0][1]);
                          for (let i = 1; i < stroke.points.length; i++) {
                            ctx.lineTo(stroke.points[i][0], stroke.points[i][1]);
                          }
                          ctx.stroke();
                        });
                      } catch {
                        // Invalid doodle data
                      }
                    }}
                    width={800}
                    height={600}
                  />
                  <Box
                    component="button"
                    type="button"
                    onClick={() => setShowDoodleEditor(true)}
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(0, 0, 0, 0)',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.2)' },
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: '#00F5FF',
                        color: 'black',
                        px: 2,
                        py: 1,
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                      }}
                    >
                      Edit
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box
                  component="button"
                  type="button"
                  onClick={() => setShowDoodleEditor(true)}
                  sx={{
                    width: '100%',
                    height: 200,
                    border: '2px dashed rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: '#00F5FF'
                    },
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    cursor: 'pointer'
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: 'rgba(0, 245, 255, 0.1)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <PencilIcon sx={{ fontSize: 24, color: '#00F5FF' }} />
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'white' }}>
                      Start Drawing
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Click to open doodle editor
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}

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
                onChange={(e) => setCurrentTag(e.target.value)}
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
                      borderColor: '#00F5FF'
                    }
                  }
                }}
              />
              <IconButton
                onClick={handleAddTag}
                disabled={!currentTag.trim()}
                sx={{
                  bgcolor: '#00F5FF',
                  color: 'black',
                  borderRadius: '12px',
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: '#00E5EE' },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(0, 245, 255, 0.3)',
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
                      bgcolor: 'rgba(0, 245, 255, 0.1)',
                      color: '#00F5FF',
                      border: '1px solid rgba(0, 245, 255, 0.2)',
                      borderRadius: '10px',
                      fontWeight: 600,
                      '& .MuiChip-deleteIcon': {
                        color: '#00F5FF',
                        '&:hover': { color: 'white' }
                      }
                    }}
                  />
                ))}
              </Stack>
            )}
          </Box>

          {/* File Upload Section */}
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
              <DescriptionIcon sx={{ fontSize: 18 }} />
              Attach Files (optional)
            </Typography>
            
            <Stack spacing={2}>
              <Box
                component="label"
                htmlFor="pending-files-input" 
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: 120,
                  border: '2px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: '#00F5FF'
                  },
                  transition: 'all 0.2s'
                }}
              >
                <PlusIcon sx={{ fontSize: 32, color: 'rgba(255, 255, 255, 0.3)', mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'white' }}>
                  Click to select files
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  Images, PDFs, Text • Max 10 files • 20MB each
                </Typography>
                <input
                  id="pending-files-input"
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.md,.txt"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const newFiles = Array.from(e.target.files);
                      setPendingFiles(prev => [...prev, ...newFiles].slice(0, 10));
                      e.target.value = '';
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </Box>
              
              {pendingFiles.length > 0 && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600 }}>
                      {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} selected
                    </Typography>
                    <Typography 
                      variant="caption" 
                      onClick={() => setPendingFiles([])}
                      sx={{ 
                        color: '#ff5252', 
                        cursor: 'pointer', 
                        fontWeight: 700,
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      Clear all
                    </Typography>
                  </Stack>
                  <Box 
                    sx={{ 
                      maxHeight: 120, 
                      overflowY: 'auto', 
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      bgcolor: 'rgba(255, 255, 255, 0.02)'
                    }}
                  >
                    {pendingFiles.map((file) => (
                      <Stack 
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                        direction="row" 
                        alignItems="center" 
                        justifyContent="space-between" 
                        spacing={2}
                        sx={{ 
                          p: 1.5, 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          '&:last-child': { borderBottom: 'none' },
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' }
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                          <Box sx={{ p: 1, bgcolor: 'rgba(0, 245, 255, 0.1)', borderRadius: '8px' }}>
                            <DescriptionIcon sx={{ fontSize: 16, color: '#00F5FF' }} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap sx={{ color: 'white', fontWeight: 600 }}>
                              {file.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                              {(file.size / 1024).toFixed(1)} KB
                            </Typography>
                          </Box>
                        </Stack>
                        <IconButton
                          size="small"
                          onClick={() => setPendingFiles(pendingFiles.filter(f => f !== file))}
                          sx={{ color: 'rgba(255, 255, 255, 0.3)', '&:hover': { color: '#ff5252' } }}
                        >
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    ))}
                  </Box>
                </Box>
              )}
              
              {uploading && uploadProgress.total > 0 && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#00F5FF', fontWeight: 700 }}>
                      Uploading files...
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>
                      {uploadProgress.uploaded}/{uploadProgress.total}
                    </Typography>
                  </Stack>
                  <LinearProgress 
                    variant="determinate" 
                    value={(uploadProgress.uploaded / uploadProgress.total) * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#00F5FF',
                        borderRadius: 3
                      }
                    }}
                  />
                </Box>
              )}
              
              {uploadErrors.length > 0 && (
                <Stack spacing={1}>
                  <Typography variant="caption" sx={{ color: '#ff5252', fontWeight: 700 }}>
                    Upload Errors:
                  </Typography>
                  {uploadErrors.map((err, i) => (
                    <Alert 
                      key={i} 
                      severity="error" 
                      sx={{ 
                        py: 0, 
                        px: 1.5, 
                        borderRadius: '10px',
                        bgcolor: 'rgba(255, 82, 82, 0.1)',
                        color: '#ff5252',
                        border: '1px solid rgba(255, 82, 82, 0.2)',
                        '& .MuiAlert-icon': { color: '#ff5252', fontSize: '1rem' },
                        '& .MuiAlert-message': { fontSize: '0.75rem', fontWeight: 600 }
                      }}
                    >
                      {err}
                    </Alert>
                  ))}
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Settings Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {/* Visibility Setting */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.9)',
                  mb: 1.5,
                  fontFamily: 'var(--font-space-grotesk)'
                }}
              >
                Visibility
              </Typography>
              <ToggleButtonGroup
                value={isPublic}
                exclusive
                onChange={(_, newValue) => newValue !== null && setIsPublic(newValue)}
                fullWidth
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '16px',
                  p: 0.5,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: '12px',
                    py: 1.5,
                    color: 'rgba(255, 255, 255, 0.6)',
                    textTransform: 'none',
                    fontWeight: 700,
                    '&.Mui-selected': {
                      bgcolor: '#00F5FF',
                      color: 'black',
                      boxShadow: '0 4px 12px rgba(0, 245, 255, 0.2)',
                      '&:hover': { bgcolor: '#00E5EE' }
                    },
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
                  }
                }}
              >
                <ToggleButton value={false}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LockClosedIcon sx={{ fontSize: 18 }} />
                    <Box component="span">Private</Box>
                  </Stack>
                </ToggleButton>
                <ToggleButton value={true}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <GlobeAltIcon sx={{ fontSize: 18 }} />
                    <Box component="span">Public</Box>
                  </Stack>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Status Setting */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.9)',
                  mb: 1.5,
                  fontFamily: 'var(--font-space-grotesk)'
                }}
              >
                Status
              </Typography>
              <ToggleButtonGroup
                value={status}
                exclusive
                onChange={(_, newValue) => newValue !== null && setStatus(newValue)}
                fullWidth
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '16px',
                  p: 0.5,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: '12px',
                    py: 1.5,
                    color: 'rgba(255, 255, 255, 0.6)',
                    textTransform: 'none',
                    fontWeight: 700,
                    '&.Mui-selected': {
                      bgcolor: '#00F5FF',
                      color: 'black',
                      boxShadow: '0 4px 12px rgba(0, 245, 255, 0.2)',
                      '&:hover': { bgcolor: '#00E5EE' }
                    },
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
                  }
                }}
              >
                <ToggleButton value={Status.DRAFT}>
                  Draft
                </ToggleButton>
                <ToggleButton value={Status.PUBLISHED}>
                  Published
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* Footer Actions */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'end',
          gap: 2,
          p: 3,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          bgcolor: 'rgba(255, 255, 255, 0.02)'
        }}
      >
        <Button 
          variant="outlined" 
          onClick={closeOverlay}
          disabled={isLoading}
          sx={{ px: 4, borderRadius: '14px' }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleCreateNote}
          disabled={!title.trim() || !content.trim() || isLoading || uploading}
          sx={{ 
            px: 4, 
            borderRadius: '14px',
            bgcolor: '#00F5FF',
            color: 'black',
            fontWeight: 800,
            '&:hover': { bgcolor: '#00E5EE' },
            '&.Mui-disabled': {
              bgcolor: 'rgba(0, 245, 255, 0.3)',
              color: 'rgba(0, 0, 0, 0.3)'
            }
          }}
        >
          {(isLoading || uploading) ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  border: '2px solid rgba(0, 0, 0, 0.1)',
                  borderTopColor: 'black',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }}
              />
              <Typography variant="button" sx={{ fontWeight: 800 }}>
                {uploading && uploadProgress.total > 0 ? `Uploading ${uploadProgress.uploaded}/${uploadProgress.total}` : 'Creating...'}
              </Typography>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              {format === 'doodle' ? (
                <PencilIcon sx={{ fontSize: 18 }} />
              ) : (
                <DescriptionIcon sx={{ fontSize: 18 }} />
              )}
              <Typography variant="button" sx={{ fontWeight: 800 }}>
                {pendingFiles.length ? `Create & Upload (${pendingFiles.length})` : `Create ${format === 'doodle' ? 'Doodle' : 'Note'}`}
              </Typography>
            </Stack>
          )}
        </Button>
      </Box>
    </Box>
    </>
  );
}

function buildAutoTitleFromContent(rawContent: string): string {
  const normalized = rawContent.trim().replace(/\s+/g, ' ');
  if (!normalized) return '';

  const words = normalized.split(' ').filter(Boolean);
  if (!words.length) return '';

  const selectedWords: string[] = [];
  for (let i = 0; i < words.length && selectedWords.length < AUTO_TITLE_CONFIG.maxWords; i++) {
    const candidateWords = [...selectedWords, words[i]];
    const candidateText = candidateWords.join(' ');
    const limit = computeTitleCharacterLimit(candidateWords);

    if (selectedWords.length === 0 || candidateText.length <= limit) {
      selectedWords.push(words[i]);
      continue;
    }
    break;
  }

  let titleCandidate = selectedWords.join(' ');
  if (
    titleCandidate.length < AUTO_TITLE_CONFIG.minCharLength &&
    selectedWords.length < Math.min(words.length, AUTO_TITLE_CONFIG.maxWords)
  ) {
    let cursor = selectedWords.length;
    while (
      titleCandidate.length < AUTO_TITLE_CONFIG.minCharLength &&
      cursor < words.length &&
      selectedWords.length < AUTO_TITLE_CONFIG.maxWords
    ) {
      selectedWords.push(words[cursor]);
      cursor += 1;
      titleCandidate = selectedWords.join(' ');
    }
  }

  return titleCandidate;
}

function computeTitleCharacterLimit(words: string[]): number {
  if (!words.length) {
    return AUTO_TITLE_CONFIG.baseCharLimit;
  }

  const averageLen = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const extra = Math.max(0, Math.round(averageLen - AUTO_TITLE_CONFIG.avgWordThreshold)) * AUTO_TITLE_CONFIG.extraPerLongWord;
  return AUTO_TITLE_CONFIG.baseCharLimit + Math.min(AUTO_TITLE_CONFIG.maxExtraCharLimit, extra);
}
