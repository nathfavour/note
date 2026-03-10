'use client';

import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Paper, 
    Stack, 
    Switch, 
    Divider,
    CircularProgress,
    alpha
} from '@mui/material';
import { User } from 'lucide-react';
import { useAuth } from '@/components/ui/AuthContext';
import { databases } from '@/lib/appwrite';
import toast from 'react-hot-toast';

// Constants match connect/lib/appwrite/config.ts
const CONNECT_DB_ID = 'chat';
const CONNECT_USERS_TABLE = 'users';

export const DiscoverabilitySettings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    const loadProfile = React.useCallback(async () => {
        if (!user?.$id) return;
        try {
            // Document ID in the users table is mapped to the Appwrite Account ID
            const p = await databases.getDocument(CONNECT_DB_ID, CONNECT_USERS_TABLE, user.$id);
            setProfile(p);
        } catch (e) {
            console.error("Failed to load profile from Connect", e);
            // If profile doesn't exist, we might want to suggest setting it up in Connect
            // but for now we just handle it gracefully
        } finally {
            setLoading(false);
        }
    }, [user?.$id]);

    useEffect(() => {
        if (user?.$id) {
            loadProfile();
        }
    }, [user?.$id, loadProfile]);

    const handleToggleDiscoverability = async (checked: boolean) => {
        if (!user?.$id || !profile) return;
        
        setSaving(true);
        try {
            const appsActive = checked ? ['connect', 'note'] : [];
            await databases.updateDocument(CONNECT_DB_ID, CONNECT_USERS_TABLE, user.$id, { 
                appsActive,
                updatedAt: new Date().toISOString()
            });
            setProfile({ ...profile, appsActive });
            toast.success(checked ? "Discovery enabled across Kylrix" : "Discovery disabled");
        } catch (_e) {
            toast.error("Failed to update discovery preference");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <CircularProgress size={24} />;
    if (!profile) return null; // Or show a "Create Profile" CTA

    const isDiscoverable = profile?.appsActive?.includes('connect') || profile?.appsActive?.includes('note');

    return (
        <Box>
            <Typography variant="overline" sx={{ fontWeight: 900, color: 'primary.main', mb: 2, display: 'block', letterSpacing: '0.1em' }}>
                ECOSYSTEM DISCOVERABILITY
            </Typography>
            <Paper sx={{ 
                p: 4, 
                borderRadius: '32px', 
                bgcolor: 'rgba(255, 255, 255, 0.01)', 
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(25px)',
                backgroundImage: 'none',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
                <Stack spacing={4}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: 'var(--font-clash)', letterSpacing: '-0.02em' }}>Global Discovery</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.5, fontFamily: 'var(--font-satoshi)' }}>Allow others to find you by your universal handle</Typography>
                        </Box>
                        <Switch 
                            checked={!!isDiscoverable} 
                            onChange={(e) => handleToggleDiscoverability(e.target.checked)}
                            disabled={saving}
                            color="primary" 
                        />
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />

                    <Box sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.02)', 
                        p: 3, 
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                    }}>
                        <Box sx={{ 
                            p: 1.5, 
                            borderRadius: '12px', 
                            bgcolor: isDiscoverable ? alpha('#6366F1', 0.1) : 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid',
                            borderColor: isDiscoverable ? alpha('#6366F1', 0.2) : 'rgba(255, 255, 255, 0.05)',
                            display: 'flex'
                        }}>
                            <User size={24} color={isDiscoverable ? "#6366F1" : "rgba(255, 255, 255, 0.2)"} />
                        </Box>
                        <Box>
                            <Typography sx={{ 
                                fontFamily: 'var(--font-mono)', 
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                opacity: isDiscoverable ? 1 : 0.4
                            }}>
                                @{profile.username}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.4, display: 'block', mt: 0.5 }}>
                                Universal Identity • {isDiscoverable ? 'Public' : 'Private'}
                            </Typography>
                        </Box>
                        {isDiscoverable && (
                            <Box sx={{ 
                                ml: 'auto', 
                                px: 1.5, 
                                py: 0.5, 
                                borderRadius: '8px', 
                                bgcolor: alpha('#00D1DA', 0.1),
                                border: '1px solid',
                                borderColor: alpha('#00D1DA', 0.2)
                            }}>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 900, color: '#00D1DA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Live
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Stack>
            </Paper>
        </Box>
    );
};
