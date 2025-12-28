import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

export type InputProps = TextFieldProps;

const Input = React.forwardRef<HTMLDivElement, InputProps>(
  ({ type, sx, ...props }, ref) => {
    return (
      <TextField
        type={type}
        fullWidth
        variant="outlined"
        ref={ref}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00F5FF',
              borderWidth: '1px',
              boxShadow: '0 0 15px rgba(0, 245, 255, 0.2)',
            },
          },
          '& .MuiInputBase-input': {
            color: '#FFFFFF',
            fontFamily: '"Inter", sans-serif',
            '&::placeholder': {
              color: 'rgba(255, 255, 255, 0.3)',
              opacity: 1,
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.5)',
            '&.Mui-focused': {
              color: '#00F5FF',
            },
          },
          ...sx,
        }}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
