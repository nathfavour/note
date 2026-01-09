'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  TextField, 
  Grid, 
  CircularProgress, 
  Container,
  Card,
  CardContent,
  IconButton,
  Chip,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  ArrowBack as ArrowBackIcon,
  Label as LabelIcon,
  AccessTime as AccessTimeIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { Tags } from '@/types/appwrite';
import { listTags, createTag, updateTag, deleteTag, updateNote } from '@/lib/appwrite';
import { useAuth } from '@/components/ui/AuthContext';
import { formatDateWithFallback } from '@/lib/date-utils';
import { TagNotesListSidebar } from '@/components/ui/TagNotesListSidebar';
import { ID } from 'appwrite';

export default function TagsPage() {
  const { user, isAuthenticated, openIDMWindow } = useAuth();
  const hasFetched = useRef(false);
  const [tags, setTags] = useState<Tags[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTag, setEditingTag] = useState<Tags | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tags | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#00F5FF', // Default to accent color
  });

  const predefinedColors = [
    '#00F5FF', // Electric Teal
    '#A855F7', // Purple
    '#EC4899', // Pink
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#F43F5E', // Rose
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ];

  const fetchTags = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      const response = await listTags();
      setTags(response.documents as unknown as Tags[]);
    } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      openIDMWindow();
      return;
    }
    
    if (user && !hasFetched.current) {
      hasFetched.current = true;
      fetchTags();
    }
  }, [isAuthenticated, user, fetchTags, openIDMWindow]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    if (!user) {
      setError('User not authenticated');
      setIsCreating(false);
      return;
    }

    try {
      if (editingTag) {
        await updateTag(editingTag.$id, {
          name: formData.name,
          description: formData.description,
          color: formData.color,
        });
      } else {
        await createTag({
          id: ID.unique(),
          userId: user.$id,
          name: formData.name,
          description: formData.description,
          color: formData.color,
          notes: [],
          usageCount: 0,
          createdAt: new Date().toISOString(),
        });
      }
      
      setFormData({ name: '', description: '', color: '#00F5FF' });
      setShowCreateForm(false);
      setEditingTag(null);
      await fetchTags();
    } catch (err) {
       setError((err as Error)?.message || 'Failed to save tag');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (tag: Tags) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name || '',
      description: tag.description || '',
      color: tag.color || '#00F5FF',
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (tag: Tags) => {
    if (!confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
      return;
    }

    try {
      await deleteTag(tag.$id);
      await fetchTags();
    } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to delete tag');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#00F5FF' });
    setShowCreateForm(false);
    setEditingTag(null);
    setError(null);
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress sx={{ color: '#00F5FF' }} />
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Please log in to manage your tags</Typography>
        </Stack>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress sx={{ color: '#00F5FF' }} />
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading tags...</Typography>
        </Stack>
      </Box>
    );
  }

  if (selectedTag) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a' }}>
        <Grid container sx={{ height: '100vh' }}>
          <Grid size={{ xs: 12, lg: 6 }} sx={{ display: { xs: 'none', lg: 'block' }, borderRight: '1px solid rgba(255, 255, 255, 0.1)', p: 4, overflowY: 'auto' }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h3" sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)', color: 'white', mb: 1 }}>
                Tags Management
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>Organize your notes with custom tags and colors</Typography>
            </Box>

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>
                {tags.length} tag{tags.length !== 1 ? 's' : ''} total
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateForm(true)}
                sx={{
                  bgcolor: '#00F5FF',
                  color: 'black',
                  fontWeight: 900,
                  borderRadius: '12px',
                  '&:hover': { bgcolor: alpha('#00F5FF', 0.8) }
                }}
              >
                Create New Tag
              </Button>
            </Stack>

            <Stack spacing={2}>
              {tags.map((tag) => (
                <Card
                  key={tag.$id}
                  onClick={() => setSelectedTag(tag)}
                  sx={{
                    bgcolor: selectedTag?.$id === tag.$id ? alpha('#00F5FF', 0.05) : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid',
                    borderColor: selectedTag?.$id === tag.$id ? '#00F5FF' : 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: '#00F5FF', bgcolor: alpha('#00F5FF', 0.05) }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: tag.color || '#00F5FF' }} />
                        <Typography sx={{ fontWeight: 800, color: 'white' }}>{tag.name}</Typography>
                      </Stack>
                      <Chip 
                        label={`${tag.usageCount || 0} notes`} 
                        size="small" 
                        sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 700, fontSize: '0.7rem' }} 
                      />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }} sx={{ height: '100vh', overflow: 'hidden' }}>
            <TagNotesListSidebar
              tag={selectedTag}
              onBack={() => setSelectedTag(null)}
              onNoteUpdate={async (updatedNote) => {
                try {
                  await updateNote(updatedNote.$id || '', updatedNote);
                } catch (err) {
                  console.error('Failed to update note:', err);
                }
              }}
              onNoteDelete={(noteId) => {
                console.log('Note deleted:', noteId);
              }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', color: 'white', p: { xs: 2, md: 6 } }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 900, 
              fontFamily: 'var(--font-space-grotesk)',
              background: 'linear-gradient(90deg, #fff, #00F5FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            Tags Management
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.6, fontWeight: 400 }}>
            Organize your notes with custom tags and colors
          </Typography>
        </Box>

        {error && (
          <Box sx={{ mb: 4, p: 2, bgcolor: alpha('#ff4444', 0.1), border: '1px solid #ff4444', borderRadius: '12px' }}>
            <Typography color="#ff4444">{error}</Typography>
          </Box>
        )}

        {/* Action Bar */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 6 }}>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}>
            {tags.length} tag{tags.length !== 1 ? 's' : ''} total
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateForm(true)}
            sx={{
              bgcolor: '#00F5FF',
              color: 'black',
              fontWeight: 900,
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              '&:hover': { bgcolor: alpha('#00F5FF', 0.8) }
            }}
          >
            Create New Tag
          </Button>
        </Stack>

        {/* Tags Grid */}
        {tags.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Box 
              sx={{ 
                width: 120, 
                height: 120, 
                bgcolor: alpha('#00F5FF', 0.05), 
                borderRadius: '40px', 
                mx: 'auto', 
                mb: 4, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '4rem'
              }}
            >
              🏷️
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, fontFamily: 'var(--font-space-grotesk)' }}>No tags yet</Typography>
            <Typography sx={{ opacity: 0.6, mb: 4 }}>Create your first tag to start organizing your notes</Typography>
            <Button
              variant="contained"
              onClick={() => setShowCreateForm(true)}
              sx={{
                bgcolor: '#00F5FF',
                color: 'black',
                fontWeight: 900,
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                '&:hover': { bgcolor: alpha('#00F5FF', 0.8) }
              }}
            >
              Create First Tag
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {tags.map((tag) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={tag.$id}>
                <Card
                  onClick={() => setSelectedTag(tag)}
                  sx={{
                    bgcolor: 'rgba(10, 10, 10, 0.95)',
                    backdropFilter: 'blur(25px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                      transform: 'translateY(-4px)', 
                      borderColor: alpha(tag.color || '#00F5FF', 0.5),
                      boxShadow: `0 8px 32px ${alpha(tag.color || '#00F5FF', 0.1)}`
                    }
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '12px', 
                            bgcolor: alpha(tag.color || '#00F5FF', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: tag.color || '#00F5FF'
                          }}
                        >
                          <LabelIcon />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)' }}>
                            {tag.name}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.5, fontWeight: 700 }}>
                            {tag.usageCount || 0} notes
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>

                    {tag.description && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          opacity: 0.7, 
                          mb: 3, 
                          minHeight: 40,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {tag.description}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 4, opacity: 0.5 }}>
                      <AccessTimeIcon sx={{ fontSize: 14 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Created {formatDateWithFallback(tag.createdAt, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                      <Button
                        fullWidth
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(tag);
                        }}
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          color: 'white',
                          fontWeight: 800,
                          borderRadius: '10px',
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        fullWidth
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(tag);
                        }}
                        sx={{
                          bgcolor: alpha('#ff4444', 0.1),
                          color: '#ff4444',
                          fontWeight: 800,
                          borderRadius: '10px',
                          '&:hover': { bgcolor: alpha('#ff4444', 0.2) }
                        }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create/Edit Dialog */}
        <Dialog 
          open={showCreateForm} 
          onClose={resetForm}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              bgcolor: 'rgba(10, 10, 10, 0.95)',
              backdropFilter: 'blur(25px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              color: 'white'
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)', fontSize: '1.5rem' }}>
            {editingTag ? 'Edit Tag' : 'Create New Tag'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={4} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.5, mb: 1, display: 'block', textTransform: 'uppercase' }}>
                  Tag Name *
                </Typography>
                <TextField
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter tag name..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&.Mui-focused fieldset': { borderColor: '#00F5FF' }
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.5, mb: 1, display: 'block', textTransform: 'uppercase' }}>
                  Description
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this tag..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                      '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                      '&.Mui-focused fieldset': { borderColor: '#00F5FF' }
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.5, mb: 2, display: 'block', textTransform: 'uppercase' }}>
                  Tag Color
                </Typography>
                <Grid container spacing={1.5} sx={{ mb: 3 }}>
                  {predefinedColors.map((color) => (
                    <Grid size="auto" key={color}>
                      <Tooltip title={color} arrow>
                        <Box
                          onClick={() => setFormData({ ...formData, color })}
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            bgcolor: color,
                            cursor: 'pointer',
                            border: '2px solid',
                            borderColor: formData.color === color ? 'white' : 'transparent',
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: 'scale(1.1)' }
                          }}
                        />
                      </Tooltip>
                    </Grid>
                  ))}
                </Grid>
                <TextField
                  type="color"
                  fullWidth
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: 48,
                      p: 0.5,
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      '& input': { p: 0, height: '100%', cursor: 'pointer' },
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' }
                    }
                  }}
                />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button 
              onClick={resetForm} 
              sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              variant="contained"
              disabled={isCreating || !formData.name.trim()}
              sx={{
                bgcolor: '#00F5FF',
                color: 'black',
                fontWeight: 900,
                px: 3,
                borderRadius: '10px',
                '&:hover': { bgcolor: alpha('#00F5FF', 0.8) },
                '&.Mui-disabled': { bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.3)' }
              }}
            >
              {isCreating ? 'Saving...' : editingTag ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
