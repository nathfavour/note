'use client';

import React from 'react';
import { Box, Skeleton, Grid2 as Grid } from '@mui/material';

export const NoteCardSkeleton: React.FC = () => {
  return (
    <Box 
      sx={{ 
        bgcolor: 'rgba(10, 10, 10, 0.95)', 
        backdropFilter: 'blur(25px) saturate(180%)',
        borderRadius: '24px', 
        p: 3, 
        border: '1px solid rgba(255, 255, 255, 0.1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Title skeleton */}
      <Skeleton 
        variant="text" 
        width="75%" 
        height={32} 
        sx={{ 
          mb: 2, 
          borderRadius: '8px',
          bgcolor: 'rgba(255, 255, 255, 0.05)'
        }} 
      />
      
      {/* Content skeleton - 3 lines */}
      <Box sx={{ mb: 2, flex: 1 }}>
        <Skeleton variant="text" width="100%" height={20} sx={{ mb: 0.5, borderRadius: '4px', bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
        <Skeleton variant="text" width="85%" height={20} sx={{ mb: 0.5, borderRadius: '4px', bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
        <Skeleton variant="text" width="65%" height={20} sx={{ borderRadius: '4px', bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
      </Box>
      
      {/* Tags skeleton */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: '6px', bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
        <Skeleton variant="rectangular" width={45} height={20} sx={{ borderRadius: '6px', bgcolor: 'rgba(255, 255, 255, 0.03)' }} />
      </Box>
      
      {/* Date skeleton */}
      <Skeleton variant="text" width={100} height={16} sx={{ borderRadius: '4px', bgcolor: 'rgba(255, 255, 255, 0.02)' }} />
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
