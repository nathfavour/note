import { Link, alpha } from '@mui/material';

/**
 * Custom link component for ReactMarkdown that styles links in Electric Teal
 * Used for post-render formatting of markdown links
 */
export function LinkComponent({ href, children }: { href?: string; children?: React.ReactNode }) {
  if (!href) return <span>{children}</span>;
  
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        color: '#00F5FF',
        textDecoration: 'none',
        fontWeight: 700,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderBottom: '1px solid transparent',
        '&:hover': {
          color: alpha('#00F5FF', 0.8),
          borderBottomColor: alpha('#00F5FF', 0.4),
          bgcolor: alpha('#00F5FF', 0.05),
          borderRadius: '4px',
          px: 0.5,
          mx: -0.5
        }
      }}
    >
      {children}
    </Link>
  );
}


