'use client';

import React, { useRef, useEffect } from 'react';
import { DoodleStroke } from '@/types/notes';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

interface DoodleViewerProps {
  data: string;
  onEdit?: () => void;
  title?: string;
}

export default function DoodleViewer({ data, onEdit, title }: DoodleViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    try {
      const strokes: DoodleStroke[] = JSON.parse(data);
      redrawCanvas(strokes);
    } catch {
      console.error('Failed to parse doodle data');
    }
  }, [data]);

  const redrawCanvas = (strokes: DoodleStroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
      {title && (
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      )}
      <Paper 
        sx={{ 
          position: 'relative', 
          borderRadius: 3, 
          border: '1px solid rgba(255, 255, 255, 0.1)', 
          overflow: 'hidden', 
          bgcolor: '#fff' 
        }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        {onEdit && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={onEdit}
            sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              bgcolor: 'rgba(255,255,255,0.9)', 
              color: '#000',
              '&:hover': { bgcolor: '#fff' }
            }}
          >
            Edit
          </Button>
        )}
      </Paper>
    </Box>
  );
}

