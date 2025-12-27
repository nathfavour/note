'use client';

import React from 'react';
import { Box, Skeleton, Grid2 as Grid } from '@mui/material';

export const NoteCardSkeleton: React.FC = () => {
  return (
    <Box 
      sx={{ 
        bgcolor: 'rgba(255, 255, 255, 0.03)', 
        borderRadius: '24px', 
        p: 3, 
        border: '1px solid rgba(255, 255, 255, 0.05)',
        height: '100%'
      }}
    >
      {/* Title skeleton */}
      <Skeleton variant="text" width="75%" height={32} sx={{ mb: 2, borderRadius: '8px' }} />
      
      {/* Content skeleton - 3 lines */}
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="text" width="100%" height={20} sx={{ mb: 0.5, borderRadius: '4px' }} />
        <Skeleton variant="text" width="85%" height={20} sx={{ mb: 0.5, borderRadius: '4px' }} />
        <Skeleton variant="text" width="65%" height={20} sx={{ borderRadius: '4px' }} />
      </Box>
      
      {/* Tags skeleton */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: '12px' }} />
        <Skeleton variant="rectangular" width={45} height={24} sx={{ borderRadius: '12px' }} />
      </Box>
      
      {/* Date skeleton */}
      <Skeleton variant="text" width={100} height={16} sx={{ borderRadius: '4px' }} />
    </Box>
  );
};

interface NoteGridSkeletonProps {
  count?: number;
}

export const NoteGridSkeleton: React.FC<NoteGridSkeletonProps> = ({ count = 12 }) => {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <NoteCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );
};

export default NoteCardSkeleton;
