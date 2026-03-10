"use client";

import React from 'react';
import { Grid, Box, Typography, alpha, IconButton } from '@mui/material';
import { QuickNote } from '../contributions/QuickNote';
import { Maximize2, MessageSquare, Shield, Zap, FileText } from 'lucide-react';
import { useKernel } from '../kernel/EcosystemKernel';
import { getEcosystemUrl } from '@/constants/ecosystem';

// In a real monorepo, these would be imported from @kylrix/[app]
// For this environment, we'll implement them as "Integrated Contributions"

/* --- Integrated Components from other apps --- */

/**
 * Integrated MiniChat (from Kylrix Connect)
 */
import { MiniChat } from './MiniChat';

/**
 * Integrated VaultStatus (from Kylrix Vault)
 */
import { VaultStatus } from './VaultStatus';

/**
 * Integrated FocusStatus (from Kylrix Flow)
 */
import { FocusStatus } from './FocusStatus';

const WidgetWrapper = ({ 
    _title, 
    children, 
    onExpand,
    appColor = '#00F0FF'
}: { 
    title: string, 
    children: React.ReactNode, 
    onExpand?: () => void,
    appColor?: string 
}) => (
    <Box sx={{ 
        position: 'relative',
        '&:hover .expand-btn': { opacity: 1 }
    }}>
        {children}
        {onExpand && (
            <IconButton 
                className="expand-btn"
                onClick={onExpand}
                size="small"
                sx={{ 
                    position: 'absolute', 
                    top: 12, 
                    right: 12, 
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    color: 'rgba(255,255,255,0.4)',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '&:hover': { bgcolor: alpha(appColor, 0.2), color: appColor }
                }}
            >
                <Maximize2 size={14} />
            </IconButton>
        )}
    </Box>
);

export const EcosystemWidgets = () => {
    const { launchWindow } = useKernel();

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="overline" sx={{ 
                color: 'rgba(255, 255, 255, 0.3)', 
                fontWeight: 900, 
                letterSpacing: '0.2em',
                mb: 2,
                display: 'block'
            }}>
                Ecosystem Command Center
            </Typography>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <WidgetWrapper 
                        title="QuickNote" 
                        onExpand={() => launchWindow({
                            title: 'QuickNote',
                            url: `${getEcosystemUrl('note')}?is_embedded=true`,
                            mode: 'remote',
                            appId: 'note',
                            icon: <FileText size={14} />,
                            dimensions: { width: 480, height: 600 }
                        })}
                    >
                        <QuickNote />
                    </WidgetWrapper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <WidgetWrapper 
                        title="MiniChat" 
                        appColor="#FF00F5" 
                        onExpand={() => launchWindow({
                            title: 'Kylrix Connect',
                            url: `${getEcosystemUrl('connect')}?is_embedded=true`,
                            mode: 'remote',
                            appId: 'connect',
                            icon: <MessageSquare size={14} />,
                            dimensions: { width: 400, height: 700 }
                        })}
                    >
                        <MiniChat />
                    </WidgetWrapper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <WidgetWrapper 
                        title="VaultStatus" 
                        appColor="#FACC15" 
                        onExpand={() => launchWindow({
                            title: 'Kylrix Vault',
                            url: `${getEcosystemUrl('keep')}?is_embedded=true`,
                            mode: 'remote',
                            appId: 'keep',
                            icon: <Shield size={14} />,
                            dimensions: { width: 500, height: 600 }
                        })}
                    >
                        <VaultStatus />
                    </WidgetWrapper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <WidgetWrapper 
                        title="FocusStatus" 
                        appColor="#4ADE80" 
                        onExpand={() => launchWindow({
                            title: 'Kylrix Flow',
                            url: `${getEcosystemUrl('flow')}?is_embedded=true`,
                            mode: 'remote',
                            appId: 'flow',
                            icon: <Zap size={14} />,
                            dimensions: { width: 450, height: 500 }
                        })}
                    >
                        <FocusStatus />
                    </WidgetWrapper>
                </Grid>
            </Grid>
        </Box>
    );
};
