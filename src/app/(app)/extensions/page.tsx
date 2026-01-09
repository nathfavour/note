'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Stack, 
  Button, 
  TextField, 
  Tabs, 
  Tab, 
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
  DialogActions
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  Extension as ExtensionIcon,
  Person as PersonIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { Extensions } from '@/types/appwrite';
import { listExtensions, createExtension, updateExtension, getCurrentUser } from '@/lib/appwrite';

interface ExtensionTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  hooks: string[];
  settings: Record<string, unknown>;
  code: string;
}

const extensionTemplates: ExtensionTemplate[] = [
  {
    id: 'note-revisor',
    name: 'AI Note Revisor',
    description: 'Automatically revise and improve notes using AI when they are created',
    icon: '🧠',
    category: 'AI Enhancement',
    hooks: ['onCreate'],
    settings: {
      aiProvider: 'gemini',
      revisionPrompt: 'Improve this note by fixing grammar, enhancing clarity, and organizing content better:',
      autoApply: true
    },
    code: `// AI Note Revisor Extension
export default {
  name: 'AI Note Revisor',
  version: '1.0.0',
  hooks: {
    onCreate: async (note, settings) => {
      if (!settings.autoApply) return note;
      
      const prompt = \`\${settings.revisionPrompt}\\n\\n\${note.content}\`;
      const revisedContent = await callAI(prompt, settings.aiProvider);
      
      return {
        ...note,
        content: revisedContent,
        metadata: JSON.stringify({
          ...JSON.parse(note.metadata || '{}'),
          revisedBy: 'AI Note Revisor',
          originalContent: note.content
        })
      };
    }
  }
};`
  },
  {
    id: 'auto-tagger',
    name: 'Smart Auto-Tagger',
    description: 'Automatically extract and add relevant tags to notes based on content',
    icon: '⚡',
    category: 'Organization',
    hooks: ['onCreate', 'onUpdate'],
    settings: {
      maxTags: 5,
      minConfidence: 0.7,
      customKeywords: []
    },
    code: `// Smart Auto-Tagger Extension
export default {
  name: 'Smart Auto-Tagger',
  version: '1.0.0',
  hooks: {
    onCreate: async (note, settings) => {
      const extractedTags = await extractTags(note.content, settings);
      return {
        ...note,
        tags: [...(note.tags || []), ...extractedTags]
      };
    }
  }
};`
  },
  {
    id: 'security-scanner',
    name: 'Security Scanner',
    description: 'Scan notes for sensitive information and apply additional encryption',
    icon: '🛡️',
    category: 'Security',
    hooks: ['onCreate', 'onUpdate'],
    settings: {
      sensitivePatterns: ['ssn', 'credit-card', 'api-key'],
      autoEncrypt: true,
      alertUser: true
    },
    code: `// Security Scanner Extension
export default {
  name: 'Security Scanner',
  version: '1.0.0',
  hooks: {
    onCreate: async (note, settings) => {
      const sensitiveData = scanForSensitiveData(note.content, settings.sensitivePatterns);
      
      if (sensitiveData.length > 0) {
        if (settings.alertUser) {
          showSecurityAlert(sensitiveData);
        }
        
        if (settings.autoEncrypt) {
          const encryptedContent = await encryptSensitiveData(note.content, sensitiveData);
          return {
            ...note,
            content: encryptedContent
          };
        }
      }
      
      return note;
    }
  }
};`
  }
];

export default function ExtensionsPage() {
  const [extensions, setExtensions] = useState<Extensions[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ExtensionTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ $id?: string } | null>(null);

  useEffect(() => {
    loadExtensions();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadExtensions = async () => {
    try {
      setLoading(true);
      const result = await listExtensions();
      setExtensions(result.documents as unknown as Extensions[]);
    } catch (error) {
      console.error('Failed to load extensions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExtension = async (extensionData: Partial<Extensions>) => {
    try {
      await createExtension({
        ...extensionData,
        authorId: user?.$id,
        enabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await loadExtensions();
      setIsCreateModalOpen(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to create extension:', error);
    }
  };

  const handleToggleExtension = async (extension: Extensions) => {
    try {
      await updateExtension(extension.$id!, {
        enabled: !extension.enabled
      });
      await loadExtensions();
    } catch (error) {
      console.error('Failed to toggle extension:', error);
    }
  };

  const filteredExtensions = extensions.filter(ext =>
    ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ext.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const installedExtensions = extensions.filter(ext => ext.enabled);

  const tabs = [
    { label: 'Marketplace', count: extensions.length },
    { label: 'Installed', count: installedExtensions.length },
    { label: 'Templates', count: extensionTemplates.length }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a', color: 'white', p: { xs: 2, md: 6 } }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', md: 'center' }} 
          spacing={3} 
          sx={{ mb: 6 }}
        >
          <Box>
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
              Extensions Marketplace
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.6, fontWeight: 400 }}>
              Extend Whisperrnote with powerful plugins and automations
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateModalOpen(true)}
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
            Create Extension
          </Button>
        </Stack>

        {/* Tabs & Search */}
        <Stack spacing={4} sx={{ mb: 6 }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#00F5FF' },
              '& .MuiTab-root': { 
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: 700,
                fontSize: '1rem',
                '&.Mui-selected': { color: '#00F5FF' }
              }
            }}
          >
            {tabs.map((tab, i) => (
              <Tab key={i} label={`${tab.label} (${tab.count})`} />
            ))}
          </Tabs>

          <TextField
            fullWidth
            placeholder="Search extensions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, opacity: 0.5 }} />,
              sx: {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&.Mui-focused fieldset': { borderColor: '#00F5FF' }
              }
            }}
            sx={{ maxWidth: 500 }}
          />
        </Stack>

        {/* Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <CircularProgress sx={{ color: '#00F5FF' }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {activeTab === 0 && filteredExtensions.map((extension) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={extension.$id}>
                <ExtensionCard
                  extension={extension}
                  onToggle={handleToggleExtension}
                  isOwner={extension.authorId === user?.$id}
                />
              </Grid>
            ))}

            {activeTab === 1 && installedExtensions.map((extension) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={extension.$id}>
                <ExtensionCard
                  extension={extension}
                  onToggle={handleToggleExtension}
                  isOwner={extension.authorId === user?.$id}
                />
              </Grid>
            ))}

            {activeTab === 2 && extensionTemplates
              .filter(template =>
                template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                template.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((template) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={template.id}>
                  <TemplateCard
                    template={template}
                    onUse={() => {
                      setSelectedTemplate(template);
                      setIsCreateModalOpen(true);
                    }}
                  />
                </Grid>
              ))}
          </Grid>
        )}

        {/* Empty State */}
        {!loading && (
          (activeTab === 0 && filteredExtensions.length === 0) ||
          (activeTab === 1 && installedExtensions.length === 0) ||
          (activeTab === 2 && extensionTemplates.length === 0)
        ) && (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Typography variant="h1" sx={{ mb: 2 }}>📦</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {activeTab === 0 && 'No extensions found'}
              {activeTab === 1 && 'No extensions installed'}
              {activeTab === 2 && 'No templates available'}
            </Typography>
            <Typography sx={{ opacity: 0.6 }}>
              {activeTab === 0 && 'Try adjusting your search or create a new extension'}
              {activeTab === 1 && 'Browse the marketplace to install extensions'}
              {activeTab === 2 && 'Check back later for new templates'}
            </Typography>
          </Box>
        )}
      </Container>

      {/* Create Extension Modal */}
      <CreateExtensionModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedTemplate(null);
        }}
        onSubmit={handleCreateExtension}
        template={selectedTemplate}
      />
    </Box>
  );
}

function ExtensionCard({ extension, onToggle, isOwner }: {
  extension: Extensions;
  onToggle: (extension: Extensions) => void;
  isOwner: boolean;
}) {
  return (
    <Card 
      sx={{ 
        bgcolor: 'rgba(10, 10, 10, 0.95)', 
        backdropFilter: 'blur(25px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': { 
          transform: 'translateY(-4px)', 
          borderColor: alpha('#00F5FF', 0.3),
          boxShadow: `0 8px 32px ${alpha('#00F5FF', 0.1)}`
        }
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box 
              sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: '12px', 
                bgcolor: alpha('#00F5FF', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00F5FF'
              }}
            >
              <ExtensionIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)' }}>
                {extension.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.5, fontWeight: 700 }}>
                v{extension.version}
              </Typography>
            </Box>
          </Stack>
          {isOwner && (
            <Chip 
              label="Owner" 
              size="small" 
              sx={{ 
                bgcolor: alpha('#00F5FF', 0.1), 
                color: '#00F5FF', 
                fontWeight: 800,
                fontSize: '0.65rem'
              }} 
            />
          )}
        </Stack>

        <Typography 
          variant="body2" 
          sx={{ 
            opacity: 0.7, 
            mb: 4, 
            minHeight: 60,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {extension.description}
        </Typography>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: 0.5 }}>
            <PersonIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>Author</Typography>
          </Stack>
          <Button
            onClick={() => onToggle(extension)}
            variant="contained"
            size="small"
            sx={{
              bgcolor: extension.enabled ? alpha('#ff4444', 0.1) : alpha('#00F5FF', 0.1),
              color: extension.enabled ? '#ff4444' : '#00F5FF',
              fontWeight: 900,
              borderRadius: '8px',
              '&:hover': { 
                bgcolor: extension.enabled ? alpha('#ff4444', 0.2) : alpha('#00F5FF', 0.2) 
              }
            }}
          >
            {extension.enabled ? 'Disable' : 'Enable'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function TemplateCard({ template, onUse }: {
  template: ExtensionTemplate;
  onUse: () => void;
}) {
  return (
    <Card 
      sx={{ 
        bgcolor: 'rgba(10, 10, 10, 0.95)', 
        backdropFilter: 'blur(25px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': { 
          transform: 'translateY(-4px)', 
          borderColor: alpha('#A855F7', 0.3),
          boxShadow: `0 8px 32px ${alpha('#A855F7', 0.1)}`
        }
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box 
              sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: '12px', 
                bgcolor: alpha('#A855F7', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}
            >
              {template.icon}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'var(--font-space-grotesk)' }}>
                {template.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.5, fontWeight: 700 }}>
                {template.category}
              </Typography>
            </Box>
          </Stack>
          <Chip 
            label="Template" 
            size="small" 
            sx={{ 
              bgcolor: alpha('#4ade80', 0.1), 
              color: '#4ade80', 
              fontWeight: 800,
              fontSize: '0.65rem'
            }} 
          />
        </Stack>

        <Typography 
          variant="body2" 
          sx={{ 
            opacity: 0.7, 
            mb: 3, 
            minHeight: 60,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {template.description}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 4 }}>
          {template.hooks.map((hook) => (
            <Chip 
              key={hook} 
              label={hook} 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.05)', 
                color: 'white', 
                fontSize: '0.65rem',
                fontWeight: 600
              }} 
            />
          ))}
        </Stack>

        <Button 
          fullWidth 
          onClick={onUse} 
          variant="outlined"
          startIcon={<DownloadIcon />}
          sx={{
            borderColor: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontWeight: 800,
            borderRadius: '12px',
            '&:hover': { 
              borderColor: '#00F5FF',
              bgcolor: alpha('#00F5FF', 0.05)
            }
          }}
        >
          Use Template
        </Button>
      </CardContent>
    </Card>
  );
}

function CreateExtensionModal({ isOpen, onClose, onSubmit, template }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Extensions>) => void;
  template?: ExtensionTemplate | null;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    settings: '{}',
    enabled: false
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        version: '1.0.0',
        settings: JSON.stringify(template.settings, null, 2),
        enabled: false
      });
    } else {
      setFormData({
        name: '',
        description: '',
        version: '1.0.0',
        settings: '{}',
        enabled: false
      });
    }
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
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
        Create Extension
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.5, mb: 1, display: 'block', textTransform: 'uppercase' }}>
              Extension Name
            </Typography>
            <TextField
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Awesome Extension"
              variant="outlined"
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
              required
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what your extension does..."
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
              Version
            </Typography>
            <TextField
              fullWidth
              required
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="1.0.0"
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
              Settings (JSON)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={formData.settings}
              onChange={(e) => setFormData({ ...formData, settings: e.target.value })}
              placeholder='{"setting1": "value1"}'
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  color: 'white',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#00F5FF' }
                }
              }}
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose} 
          sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700 }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          sx={{
            bgcolor: '#00F5FF',
            color: 'black',
            fontWeight: 900,
            px: 3,
            borderRadius: '10px',
            '&:hover': { bgcolor: alpha('#00F5FF', 0.8) }
          }}
        >
          Create Extension
        </Button>
      </DialogActions>
    </Dialog>
  );
}