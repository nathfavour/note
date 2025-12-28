import React from 'react';
import { Card as MuiCard, CardHeader as MuiCardHeader, CardContent as MuiCardContent, CardActions as MuiCardActions, Typography, Box } from '@mui/material';

const Card = React.forwardRef<
  HTMLDivElement,
  any
>(({ className, children, sx, ...props }, ref) => (
  <MuiCard
    ref={ref}
    sx={{
      bgcolor: 'rgba(10, 10, 10, 0.95)',
      backdropFilter: 'blur(25px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      overflow: 'hidden',
      ...sx
    }}
    {...props}
  >
    {children}
  </MuiCard>
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  any
>(({ className, children, sx, ...props }, ref) => (
  <Box
    ref={ref}
    sx={{ 
      p: 3, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 1,
      ...sx 
    }}
    {...props}
  >
    {children}
  </Box>
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  any
>(({ className, children, sx, ...props }, ref) => (
  <Typography
    ref={ref}
    variant="h6"
    sx={{
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 900,
      color: '#00F5FF',
      letterSpacing: '-0.02em',
      ...sx
    }}
    {...props}
  >
    {children}
  </Typography>
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  any
>(({ className, children, sx, ...props }, ref) => (
  <Typography
    ref={ref}
    variant="body2"
    sx={{
      color: 'rgba(255, 255, 255, 0.5)',
      fontFamily: '"Inter", sans-serif',
      ...sx
    }}
    {...props}
  >
    {children}
  </Typography>
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  any
>(({ className, children, sx, ...props }, ref) => (
  <MuiCardContent 
    ref={ref} 
    sx={{ 
      p: 3, 
      pt: 0,
      ...sx 
    }} 
    {...props}
  >
    {children}
  </MuiCardContent>
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  any
>(({ className, children, sx, ...props }, ref) => (
  <MuiCardActions
    ref={ref}
    sx={{ 
      p: 3, 
      pt: 0, 
      display: 'flex', 
      alignItems: 'center',
      gap: 2,
      ...sx 
    }}
    {...props}
  >
    {children}
  </MuiCardActions>
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

