'use client';

import React from 'react';
import { 
  Box, 
  Typography, 
  LinearProgress, 
  TextField, 
  IconButton, 
  InputAdornment,
  Stack
} from '@mui/material';
import { 
  Visibility as VisibilityIcon, 
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { validatePasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor, type PasswordStrength } from '@/lib/passwordUtils';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
}) => {
  const strength = validatePasswordStrength(password);

  if (!password) return null;

  const getProgressColor = (score: number) => {
    switch (score) {
      case 0: return '#FF453A';
      case 1: return '#FF9F0A';
      case 2: return '#FFD60A';
      case 3: return '#30D158';
      case 4: return '#00F5FF';
      default: return '#FF453A';
    }
  };

  const getProgressValue = (score: number) => {
    return ((score + 1) / 5) * 100;
  };

  return (
    <Box sx={{ mt: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <LinearProgress 
          variant="determinate" 
          value={getProgressValue(strength.score)} 
          sx={{ 
            flex: 1, 
            height: 6, 
            borderRadius: 3,
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            '& .MuiLinearProgress-bar': {
              bgcolor: getProgressColor(strength.score),
              borderRadius: 3,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }
          }}
        />
        <Typography 
          variant="caption" 
          sx={{ 
            fontWeight: 900, 
            color: getProgressColor(strength.score),
            minWidth: 70,
            textAlign: 'right',
            fontFamily: '"Space Grotesk", sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.65rem'
          }}
        >
          {getPasswordStrengthLabel(strength.score)}
        </Typography>
      </Stack>

      {showRequirements && strength.feedback.length > 0 && (
        <Stack spacing={0.75} sx={{ mt: 1 }}>
          {strength.feedback.map((requirement, index) => {
            const isError = requirement.includes('must') && !strength.isValid;
            return (
              <Stack key={index} direction="row" alignItems="center" spacing={1}>
                {isError ? (
                  <ErrorIcon sx={{ fontSize: 14, color: '#FF453A' }} />
                ) : (
                  <CheckCircleIcon sx={{ fontSize: 14, color: '#00F5FF' }} />
                )}
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: isError ? 'rgba(255, 69, 58, 0.8)' : 'rgba(0, 245, 255, 0.8)',
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '0.75rem'
                  }}
                >
                  {requirement}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      )}

      {strength.isValid && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
          <CheckCircleIcon sx={{ fontSize: 14, color: '#00F5FF' }} />
          <Typography variant="caption" sx={{ color: '#00F5FF', fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>
            Password meets all requirements
          </Typography>
        </Stack>
      )}
    </Box>
  );
};

interface PasswordInputWithStrengthProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStrengthChange?: (strength: PasswordStrength) => void;
  label?: string;
  placeholder?: string;
  showStrengthIndicator?: boolean;
  fullWidth?: boolean;
  required?: boolean;
  name?: string;
}

export const PasswordInputWithStrength: React.FC<PasswordInputWithStrengthProps> = ({
  value,
  onChange,
  onStrengthChange,
  label = "Password",
  placeholder = "Enter your password",
  showStrengthIndicator = true,
  fullWidth = true,
  required = false,
  name = "password"
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const strength = React.useMemo(() => validatePasswordStrength(value), [value]);

  const lastNotifiedRef = React.useRef<{ score: number; isValid: boolean } | null>(null);
  React.useEffect(() => {
    if (!onStrengthChange) return;
    const payload = { score: strength.score, isValid: strength.isValid };
    const prev = lastNotifiedRef.current;
    if (!prev || prev.score !== payload.score || prev.isValid !== payload.isValid) {
      lastNotifiedRef.current = payload;
      onStrengthChange(strength);
    }
  }, [strength.score, strength.isValid, onStrengthChange]);

  return (
    <Box>
      <TextField
        fullWidth={fullWidth}
        label={label}
        placeholder={placeholder}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        required={required}
        name={name}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
            '&.Mui-focused fieldset': { borderColor: '#00F5FF' },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.5)',
            '&.Mui-focused': { color: '#00F5FF' }
          }
        }}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  size="small"
                  sx={{ color: 'rgba(255, 255, 255, 0.4)' }}
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }
        }}
      />

      {showStrengthIndicator && value && (
        <PasswordStrengthIndicator password={value} />
      )}
    </Box>
  );
};
